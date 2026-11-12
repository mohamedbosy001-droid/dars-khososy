import { useEffect, useRef } from "react";

import {
  doc,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

/*
  تسجيل مدة المشاهدة الفعلية لأي فيديو (محاضرة / واجب / حل واجب).

  - بيحسب الثواني اللي الطالب اتفرجها فعلًا (التقديم والسرعات مش بتتحسب كمشاهدة زيادة).
  - بيحفظ في ملف الطالب في الحقل: videoWatchLog
  - بيحفظ كل 15 ثانية تقريبًا + عند إيقاف الفيديو أو إغلاقه.

  الاستخدام:
    useVideoWatchTracking({
      player,        // YouTube player object
      isPlaying,     // هل الفيديو شغال دلوقتي
      studentUid,    // uid الطالب
      track,         // { key, title, courseId, courseName, lessonId, kind } أو null
    });
*/

const SAVE_EVERY_MS = 15000;
const TICK_EVERY_MS = 1000;

function safeKey(value) {
  return String(value || "").replace(
    /[^A-Za-z0-9_-]/g,
    "_"
  );
}

export function getWatchLogKey(key) {
  return safeKey(key);
}

function useVideoWatchTracking({
  player,
  isPlaying,
  studentUid,
  track,
}) {
  const trackRef = useRef(track);

  trackRef.current = track;

  const trackKey = track?.key || "";

  useEffect(() => {
    if (
      !player ||
      !isPlaying ||
      !studentUid ||
      !trackKey
    ) {
      return undefined;
    }

    let pendingSeconds = 0;
    let lastPosition = null;
    let lastTickTime = Date.now();
    let durationSeconds = 0;

    async function tick() {
      try {
        const position =
          await player.getCurrentTime();

        const now = Date.now();

        const wallSeconds =
          (now - lastTickTime) / 1000;

        lastTickTime = now;

        if (
          lastPosition !== null &&
          Number.isFinite(position)
        ) {
          const delta =
            position - lastPosition;

          // نحسب التقدم الطبيعي فقط، وأي قفزة (تقديم/رجوع) لا تُحسب.
          if (
            delta > 0 &&
            delta <=
              Math.max(
                3,
                wallSeconds * 2.5
              )
          ) {
            pendingSeconds += delta;
          }
        }

        if (Number.isFinite(position)) {
          lastPosition = position;
        }

        const duration =
          await player.getDuration();

        if (
          Number.isFinite(duration) &&
          duration > 0
        ) {
          durationSeconds = duration;
        }
      } catch {
        // الـ player اتقفل أو لسه مش جاهز
      }
    }

    async function flush() {
      const seconds =
        Math.floor(pendingSeconds);

      if (seconds < 1) {
        return;
      }

      const info = trackRef.current;

      if (!info?.key) {
        return;
      }

      pendingSeconds -= seconds;

      const base = `videoWatchLog.${safeKey(
        info.key
      )}`;

      const data = {
        [`${base}.watchedSeconds`]:
          increment(seconds),
        [`${base}.title`]:
          info.title || "",
        [`${base}.courseId`]:
          info.courseId || "",
        [`${base}.courseName`]:
          info.courseName || "",
        [`${base}.lessonId`]:
          info.lessonId || "",
        [`${base}.kind`]:
          info.kind || "lecture",
        [`${base}.lastWatch`]:
          Timestamp.now(),
      };

      if (durationSeconds > 0) {
        data[
          `${base}.videoDurationSeconds`
        ] = Math.floor(durationSeconds);
      }

      try {
        await updateDoc(
          doc(db, "students", studentUid),
          data
        );
      } catch (error) {
        pendingSeconds += seconds;

        console.error(
          "Watch tracking save error:",
          error
        );
      }
    }

    const tickId = window.setInterval(
      tick,
      TICK_EVERY_MS
    );

    const saveId = window.setInterval(
      flush,
      SAVE_EVERY_MS
    );

    function handlePageHide() {
      flush();
    }

    window.addEventListener(
      "pagehide",
      handlePageHide
    );

    return () => {
      window.clearInterval(tickId);
      window.clearInterval(saveId);

      window.removeEventListener(
        "pagehide",
        handlePageHide
      );

      flush();
    };
  }, [player, isPlaying, studentUid, trackKey]);
}

export default useVideoWatchTracking;
