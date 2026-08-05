
import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaVideo,
  FaPlay,
  FaClipboardCheck,
  FaUpload,
  FaLock,
  FaCheckCircle,
  FaBookOpen,
} from "react-icons/fa";

import "./MyLessons.css";

function MyLessons({ currentStudent }) {
  const [lessons, setLessons] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [lessonsError, setLessonsError] =
    useState("");

  const [
    activeVideoLesson,
    setActiveVideoLesson,
  ] = useState(null);

  const [watchSaved, setWatchSaved] =
    useState(false);

  const [isSavingWatch, setIsSavingWatch] =
    useState(false);

  useEffect(() => {
    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      setLessons([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setLessonsError("");

    const studentReference = doc(
      db,
      "students",
      studentUid
    );

    const unsubscribe = onSnapshot(
      studentReference,
      (studentSnapshot) => {
        if (!studentSnapshot.exists()) {
          setLessons([]);
          setLessonsError(
            "تعذر العثور على بيانات الطالب."
          );
          setIsLoading(false);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const activatedLessons =
          Array.isArray(
            studentData.activatedLessons
          )
            ? studentData.activatedLessons
            : [];

        const normalizedLessons =
          activatedLessons.map(
            (lesson, index) => {
              if (
                typeof lesson === "string"
              ) {
                return {
                  id: lesson,
                  title: `المحاضرة ${
                    index + 1
                  }`,
                  courseTitle:
                    "كورس اللغة العربية",
                  description:
                    "تفاصيل المحاضرة ستظهر بعد إضافتها من لوحة الإدارة.",
                  videoUrl: "",
                  homeworkVideoUrl: "",
                  videoWatched: false,
                  examCompleted: false,
                  homeworkSubmitted: false,
                };
              }

              return {
                ...lesson,

                id:
                  lesson.id ||
                  `lesson-${index}`,

                title:
                  lesson.title ||
                  lesson.lessonName ||
                  `المحاضرة ${index + 1}`,

                courseTitle:
                  lesson.courseTitle ||
                  lesson.courseName ||
                  "كورس اللغة العربية",

                description:
                  lesson.description ||
                  "شرح وتدريبات خاصة بالمحاضرة.",

                videoUrl:
                  lesson.videoUrl || "",

                homeworkVideoUrl:
                  lesson.homeworkVideoUrl ||
                  "",

                videoWatched:
                  lesson.videoWatched === true,

                examCompleted:
                  lesson.examCompleted === true,

                homeworkSubmitted:
                  lesson.homeworkSubmitted ===
                  true,
              };
            }
          );

        setLessons(normalizedLessons);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading activated lessons:",
          error
        );

        setLessonsError(
          "تعذر تحميل الدروس حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent]);

  function openLessonVideo(lesson) {
    if (!lesson.videoUrl) {
      window.alert(
        "لم تتم إضافة فيديو شرح المحاضرة بعد."
      );
      return;
    }

    setActiveVideoLesson(lesson);
    setWatchSaved(false);
    setIsSavingWatch(false);
  }

  function closeLessonVideo() {
    setActiveVideoLesson(null);
    setWatchSaved(false);
    setIsSavingWatch(false);
  }

  function openHomeworkVideo(videoUrl) {
    if (!videoUrl) {
      window.alert(
        "لم تتم إضافة فيديو حل الواجب بعد."
      );
      return;
    }

    window.open(
      videoUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function formatDuration(totalSeconds) {
    const safeSeconds = Math.max(
      0,
      Math.floor(Number(totalSeconds) || 0)
    );

    const hours = Math.floor(
      safeSeconds / 3600
    );

    const minutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const seconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours} ساعة و${minutes} دقيقة`;
    }

    if (minutes > 0) {
      return `${minutes} دقيقة و${seconds} ثانية`;
    }

    return `${seconds} ثانية`;
  }

  async function saveWatchHistory(video) {
    if (
      !activeVideoLesson ||
      watchSaved ||
      isSavingWatch
    ) {
      return;
    }

    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      return;
    }

    setIsSavingWatch(true);

    try {
      const studentReference = doc(
        db,
        "students",
        studentUid
      );

      await runTransaction(
        db,
        async (transaction) => {
          const studentSnapshot =
            await transaction.get(
              studentReference
            );

          if (!studentSnapshot.exists()) {
            throw new Error(
              "Student document does not exist."
            );
          }

          const studentData =
            studentSnapshot.data();

          const currentWatchHistory =
            Array.isArray(
              studentData.watchHistory
            )
              ? [
                  ...studentData.watchHistory,
                ]
              : [];

          const currentActivatedLessons =
            Array.isArray(
              studentData.activatedLessons
            )
              ? [
                  ...studentData
                    .activatedLessons,
                ]
              : [];

          const lessonId =
            activeVideoLesson.id;

          const now = Timestamp.now();

          const existingWatchIndex =
            currentWatchHistory.findIndex(
              (watchItem) =>
                watchItem?.lessonId ===
                  lessonId ||
                watchItem?.id === lessonId
            );

          if (existingWatchIndex >= 0) {
            const existingWatch =
              currentWatchHistory[
                existingWatchIndex
              ];

            currentWatchHistory[
              existingWatchIndex
            ] = {
              ...existingWatch,

              id:
                existingWatch.id ||
                lessonId,

              lessonId,

              lessonName:
                activeVideoLesson.title,

              courseName:
                activeVideoLesson
                  .courseTitle,

              watchDuration:
                formatDuration(
                  video.currentTime
                ),

              watchedSeconds: Math.floor(
                video.currentTime
              ),

              videoDurationSeconds:
                Math.floor(video.duration),

              watchCount:
                Number(
                  existingWatch.watchCount ||
                    0
                ) + 1,

              firstWatch:
                existingWatch.firstWatch ||
                existingWatch
                  .firstWatchedAt ||
                now,

              lastWatch: now,
            };
          } else {
            currentWatchHistory.push({
              id: lessonId,
              lessonId,

              lessonName:
                activeVideoLesson.title,

              courseName:
                activeVideoLesson
                  .courseTitle,

              watchDuration:
                formatDuration(
                  video.currentTime
                ),

              watchedSeconds: Math.floor(
                video.currentTime
              ),

              videoDurationSeconds:
                Math.floor(video.duration),

              watchCount: 1,
              firstWatch: now,
              lastWatch: now,
            });
          }

          const updatedActivatedLessons =
            currentActivatedLessons.map(
              (lesson, index) => {
                if (
                  typeof lesson === "string"
                ) {
                  if (lesson !== lessonId) {
                    return lesson;
                  }

                  return {
                    ...activeVideoLesson,
                    id: lessonId,
                    videoWatched: true,
                  };
                }

                const currentLessonId =
                  lesson?.id ||
                  `lesson-${index}`;

                if (
                  currentLessonId !== lessonId
                ) {
                  return lesson;
                }

                return {
                  ...lesson,
                  videoWatched: true,
                };
              }
            );

          transaction.update(
            studentReference,
            {
              watchHistory:
                currentWatchHistory,

              activatedLessons:
                updatedActivatedLessons,

              watchedVideos:
                Number(
                  studentData.watchedVideos ||
                    0
                ) + 1,

              updatedAt: now,
            }
          );
        }
      );

      setWatchSaved(true);

      setLessons((previousLessons) =>
        previousLessons.map((lesson) =>
          lesson.id ===
          activeVideoLesson.id
            ? {
                ...lesson,
                videoWatched: true,
              }
            : lesson
        )
      );

      setActiveVideoLesson(
        (previousLesson) =>
          previousLesson
            ? {
                ...previousLesson,
                videoWatched: true,
              }
            : null
      );
    } catch (error) {
      console.error(
        "Error saving watch history:",
        error
      );

      window.alert(
        "حدث خطأ أثناء تسجيل المشاهدة. حاول مرة أخرى."
      );
    } finally {
      setIsSavingWatch(false);
    }
  }

  async function handleVideoProgress(event) {
    const video = event.currentTarget;

    if (
      !video.duration ||
      !Number.isFinite(video.duration) ||
      watchSaved ||
      isSavingWatch
    ) {
      return;
    }

    const watchedPercentage =
      (video.currentTime /
        video.duration) *
      100;

    if (watchedPercentage < 30) {
      return;
    }

    await saveWatchHistory(video);
  }

  return (
    <section className="my-lessons-page">
      <div className="my-lessons-title">
        <FaVideo />

        <div>
          <h1>دروسي</h1>

          <p>
            المحاضرات التي تم تفعيلها على
            حسابك
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="my-lessons-empty">
          <div className="my-lessons-empty-icon">
            <FaBookOpen />
          </div>

          <h2>جاري تحميل الدروس...</h2>

          <p>
            انتظر لحظات حتى يتم تحميل
            المحاضرات المفعّلة.
          </p>
        </div>
      ) : lessonsError ? (
        <div className="my-lessons-empty">
          <div className="my-lessons-empty-icon">
            <FaLock />
          </div>

          <h2>حدث خطأ</h2>

          <p>{lessonsError}</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="my-lessons-empty">
          <div className="my-lessons-empty-icon">
            <FaBookOpen />
          </div>

          <h2>
            مافيش دروس مفعّلة حاليًا
          </h2>

          <p>
            أول ما تشترك في كورس أو تفعّل
            محاضرة، هتظهر هنا تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="my-lessons-list">
          {lessons.map(
            (lesson, index) => {
              const canOpenExam =
                lesson.videoWatched === true;

              const canSubmitHomework =
                lesson.examCompleted === true;

              const canOpenHomeworkVideo =
                lesson.homeworkSubmitted ===
                true;

              return (
                <article
                  className="my-lesson-card"
                  key={lesson.id}
                >
                  <div className="my-lesson-heading">
                    <div className="my-lesson-number">
                      {index + 1}
                    </div>

                    <div>
                      <span>
                        {lesson.courseTitle}
                      </span>

                      <h2>
                        {lesson.title}
                      </h2>

                      <p>
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <div className="lesson-steps-grid">
                    <button
                      type="button"
                      className="lesson-step-card available"
                      onClick={() =>
                        openLessonVideo(
                          lesson
                        )
                      }
                    >
                      <div className="lesson-step-icon">
                        <FaPlay />
                      </div>

                      <h3>
                        مشاهدة فيديو الشرح
                      </h3>

                      <span>
                        {lesson.videoWatched
                          ? "تمت المشاهدة"
                          : "متاح الآن"}
                      </span>

                      {lesson.videoWatched && (
                        <FaCheckCircle className="lesson-completed-icon" />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`lesson-step-card ${
                        canOpenExam
                          ? "available"
                          : "locked"
                      }`}
                      disabled={!canOpenExam}
                      onClick={() => {
                        window.alert(
                          "سيتم فتح امتحان الحصة بعد ربط صفحة الامتحانات."
                        );
                      }}
                    >
                      <div className="lesson-step-icon">
                        {canOpenExam ? (
                          <FaClipboardCheck />
                        ) : (
                          <FaLock />
                        )}
                      </div>

                      <h3>امتحان الحصة</h3>

                      <span>
                        {lesson.examCompleted
                          ? "تم إنهاء الامتحان"
                          : canOpenExam
                            ? "متاح الآن"
                            : "شاهد الفيديو أولًا"}
                      </span>

                      {lesson.examCompleted && (
                        <FaCheckCircle className="lesson-completed-icon" />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`lesson-step-card ${
                        canSubmitHomework
                          ? "available"
                          : "locked"
                      }`}
                      disabled={
                        !canSubmitHomework
                      }
                      onClick={() => {
                        window.alert(
                          "سيتم فتح تسليم الواجب بعد ربط نظام الواجبات."
                        );
                      }}
                    >
                      <div className="lesson-step-icon">
                        {canSubmitHomework ? (
                          <FaUpload />
                        ) : (
                          <FaLock />
                        )}
                      </div>

                      <h3>تسليم الواجب</h3>

                      <span>
                        {lesson.homeworkSubmitted
                          ? "تم تسليم الواجب"
                          : canSubmitHomework
                            ? "متاح الآن"
                            : "أنهِ الامتحان أولًا"}
                      </span>

                      {lesson.homeworkSubmitted && (
                        <FaCheckCircle className="lesson-completed-icon" />
                      )}
                    </button>

                    <button
                      type="button"
                      className={`lesson-step-card ${
                        canOpenHomeworkVideo
                          ? "available"
                          : "locked"
                      }`}
                      disabled={
                        !canOpenHomeworkVideo
                      }
                      onClick={() =>
                        openHomeworkVideo(
                          lesson.homeworkVideoUrl
                        )
                      }
                    >
                      <div className="lesson-step-icon">
                        {canOpenHomeworkVideo ? (
                          <FaVideo />
                        ) : (
                          <FaLock />
                        )}
                      </div>

                      <h3>
                        فيديو حل الواجب
                      </h3>

                      <span>
                        {canOpenHomeworkVideo
                          ? "متاح الآن"
                          : "سلّم الواجب أولًا"}
                      </span>
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {activeVideoLesson && (
        <div className="lesson-video-overlay">
          <div className="lesson-video-modal">
            <button
              type="button"
              className="lesson-video-close"
              onClick={closeLessonVideo}
              aria-label="إغلاق الفيديو"
            >
              ×
            </button>

            <h2>
              {activeVideoLesson.title}
            </h2>

            <p className="lesson-video-course-name">
              {
                activeVideoLesson.courseTitle
              }
            </p>

            <video
              key={activeVideoLesson.id}
              src={
                activeVideoLesson.videoUrl
              }
              controls
              autoPlay
              playsInline
              preload="metadata"
              onTimeUpdate={
                handleVideoProgress
              }
              className="lesson-video-player"
            >
              متصفحك لا يدعم تشغيل الفيديو.
            </video>

            <p className="lesson-video-message">
              {isSavingWatch
                ? "جاري تسجيل المشاهدة..."
                : watchSaved
                  ? "✅ تم تسجيل المشاهدة وفتح امتحان الحصة."
                  : "يتم تسجيل المشاهدة بعد إكمال 30% من الفيديو."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyLessons;