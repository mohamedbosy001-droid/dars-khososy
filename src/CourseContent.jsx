import { useState } from "react";

import {
  FaArrowRight,
  FaBookOpen,
  FaPlay,
  FaClock,
  FaFilePdf,
  FaClipboardCheck,
  FaLock,
  FaCheckCircle,
  FaKey,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import "./CourseContent.css";

function CourseContent({
  course,
  onBack,

  isLessonUnlocked,
  getLessonWatched,
  getHomeworkSubmitted,

  /*
    هل امتحان المحاضرة الأولى
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture1ExamCompleted = false,

  /*
    هل امتحان المحاضرة الثانية
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture2ExamCompleted = false,

  /*
    هل امتحان المحاضرة الثالثة
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture3ExamCompleted = false,

  /*
    هل امتحان المحاضرة الرابعة
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture4ExamCompleted = false,

  /*
    هل امتحان المحاضرة الأولى
    في أولى ثانوي تم تسليمه؟
  */
  isFirstLecture1ExamCompleted = false,

  /*
    هل امتحان المحاضرة الثانية
    في أولى ثانوي تم تسليمه؟
  */
  isFirstLecture2ExamCompleted = false,

  /*
    هل امتحان المحاضرة الرابعة
    في أولى ثانوي تم تسليمه؟
  */
  isFirstLecture4ExamCompleted = false,
  isFirstLecture5ExamCompleted = false,
  isFirstLecture6ExamCompleted = false,

  /*
    هل امتحان المحاضرة الأولى
    في تانية ثانوي تم تسليمه؟
  */
  isSecondLecture1ExamCompleted = false,

  /*
    هل امتحان المحاضرة الثانية
    في تانية ثانوي تم تسليمه؟
  */
  isSecondLecture2ExamCompleted = false,

  /*
    هل امتحان المحاضرة الثالثة
    في تانية ثانوي تم تسليمه؟
  */
  isSecondLecture3ExamCompleted = false,
  isSecondLecture4ExamCompleted = false,
  isSecondComprehensiveExamCompleted = false,

  /*
    هل امتحان المحاضرة الخامسة
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture5ExamCompleted = false,
  isThirdComprehensiveExamCompleted = false,
  isCenterStudent = false,

  lessonActivationCodes,
  onLessonCodeChange,
  onActivateLessonCode,
  activatingLessonId,
  comprehensiveExamCode,
  onComprehensiveExamCodeChange,
  onActivateComprehensiveExamCode,
  activatingComprehensiveExam,
  hasComprehensiveExamCodeAccess = false,
  hasComprehensiveCourseSubscription = false,

  onOpenVideo,
  onOpenPdf,
  onOpenExam,
  onOpenHomework,
  onOpenHomeworkSolution,
}) {
  const [openedLessons, setOpenedLessons] =
    useState({});
  const [comprehensiveExamExpanded, setComprehensiveExamExpanded] =
    useState(false);

  if (!course) {
    return (
      <section className="course-content-page">
        <div className="course-content-empty">
          <h2>
            تعذر تحميل محتوى الكورس
          </h2>

          <button
            type="button"
            onClick={onBack}
          >
            رجوع
          </button>
        </div>
      </section>
    );
  }

  const rawLessons = Array.isArray(course.lessons)
    ? course.lessons
    : [];

  // ضمان وجود المحاضرة السابعة في الكورسين المطلوبين حتى لو بيانات Firebase القديمة لا تحتويها.
  const isThirdLectureSevenCourse = [
    "third-month-2-course",
    "third-term-course",
  ].includes(course.id);

  const hasThirdLectureSeven = rawLessons.some(
    (lesson) =>
      lesson?.id === "lesson-7" ||
      lesson?.courseLectureKey === "third-lecture-7"
  );

  const thirdLectureSeven = {
    id: "lesson-7",
    title: "المحاضرة السابعة - إن وأخواتها، لا النافية للجنس، الضمائر، المحل الإعرابي للجمل",
    description: "",
    youtubeUrl: "https://youtu.be/cXajWWttliI?si=mmN02o2-obGJHBIv",
    videoUrl: "https://youtu.be/cXajWWttliI?si=mmN02o2-obGJHBIv",
    videoTitle: "المحاضرة السابعة - إن وأخواتها، لا النافية للجنس، الضمائر، المحل الإعرابي للجمل",
    exam1: false,
    exam1Key: "",
    exam1Title: "",
    exam2: false,
    exam2Key: "",
    exam2Title: "",
    homeworkEnabled: false,
    homeworkKey: "",
    homeworkTitle: "",
    homeworkSolutionUrl: "",
    solutionVideoUrl: "",
    homeworkSolutionTitle: "",
    requiresPreviousExam: false,
    requiredExamId: "",
    entryExamKey: "",
    entryExamTitle: "",
    courseLectureKey: "third-lecture-7",
  };

  const isSecondLectureFiveSixCourse = [
    "second-month-2-course",
    "second-term-course",
  ].includes(course.id);

  const secondSecondaryFifthLesson = {
    id: "lesson-5",
    title: "المحاضرة الخامسة - شرح نص العلم نور والفقرة القصيرة وحل تدريبات",
    description: "تُفتح لطلاب الأونلاين بعد تسليم الامتحان الشامل. طلاب السنتر يمكنهم فتحها بالتفعيل المعتاد.",
    youtubeUrl: "https://youtu.be/1rK4t7ufdHM?si=Ojk6k_AJvUfPEOoM",
    videoUrl: "https://youtu.be/1rK4t7ufdHM?si=Ojk6k_AJvUfPEOoM",
    videoTitle: "المحاضرة الخامسة - شرح نص العلم نور والفقرة القصيرة وحل تدريبات",
    exam1: true,
    exam1Key: "secondLecture4Exam",
    exam1Title: "امتحان قبل المحاضرة الخامسة",
    exam2: false,
    exam2Key: "",
    exam2Title: "",
    homeworkEnabled: false,
    homeworkKey: "",
    homeworkTitle: "",
    homeworkVideoOnly: false,
    homeworkVideoUrl: "",
    homeworkSolutionUrl: "",
    pdfUrl: "",
    requiresPreviousExam: true,
    requiredExamId: "secondMonthComprehensiveExam",
    courseLectureKey: "second-secondary-lecture-5",
  };

  const secondSecondarySixthLesson = {
    id: "lesson-6",
    title: "المحاضرة السادسة - شرح همزة القطع وألف الوصل والتاء المربوطة والهاء المربوطة وقصة عودة الروح وحل تدريبات",
    description: "تُفتح لطلاب الأونلاين بعد تسليم الامتحان الشامل. طلاب السنتر يمكنهم فتحها بالتفعيل المعتاد.",
    youtubeUrl: "https://youtu.be/FDGOYdAZNqo?si=vwxZcZ_q1SjlY5Jo",
    videoUrl: "https://youtu.be/FDGOYdAZNqo?si=vwxZcZ_q1SjlY5Jo",
    videoTitle: "المحاضرة السادسة - شرح همزة القطع وألف الوصل والتاء المربوطة والهاء المربوطة وقصة عودة الروح وحل تدريبات",
    exam1: false,
    exam1Key: "",
    exam1Title: "",
    exam2: false,
    exam2Key: "",
    exam2Title: "",
    homeworkEnabled: false,
    homeworkKey: "",
    requiresPreviousExam: true,
    requiredExamId: "secondMonthComprehensiveExam",
    courseLectureKey: "second-secondary-lecture-6",
  };

  // أضف المحاضرتين احتياطيًا من داخل صفحة المحتوى حتى تظهرا أيضًا
  // إذا كانت بيانات الكورس المحفوظة في Firebase قديمة أو ناقصة.
  const lessonsWithSecondSecondaryVideos = (() => {
    if (!isSecondLectureFiveSixCourse) return rawLessons;
    // إزالة النسخ المكررة القديمة للمحاضرتين حتى تظهر كل واحدة مرة واحدة فقط.
    const result = rawLessons.filter((lesson, index, list) => {
      const isTargetLesson =
        lesson?.id === "lesson-5" ||
        lesson?.id === "lesson-6" ||
        lesson?.courseLectureKey === "second-secondary-lecture-5" ||
        lesson?.courseLectureKey === "second-secondary-lecture-6";
      if (!isTargetLesson) return true;
      const key = lesson?.id === "lesson-5" || lesson?.courseLectureKey === "second-secondary-lecture-5"
        ? "second-secondary-lecture-5"
        : "second-secondary-lecture-6";
      return list.findIndex((item) =>
        (item?.id === (key.endsWith("-5") ? "lesson-5" : "lesson-6")) ||
        item?.courseLectureKey === key
      ) === index;
    });
    const fifthIndex = result.findIndex((lesson) => lesson?.id === "lesson-5" || lesson?.courseLectureKey === "second-secondary-lecture-5");
    if (fifthIndex >= 0) result[fifthIndex] = { ...result[fifthIndex], ...secondSecondaryFifthLesson };
    else result.push(secondSecondaryFifthLesson);
    const sixthIndex = result.findIndex((lesson) => lesson?.id === "lesson-6" || lesson?.courseLectureKey === "second-secondary-lecture-6");
    if (sixthIndex >= 0) result[sixthIndex] = { ...result[sixthIndex], ...secondSecondarySixthLesson };
    else result.push(secondSecondarySixthLesson);
    return result;
  })();

  const lessonsWithRequiredVideos = isThirdLectureSevenCourse && !hasThirdLectureSeven
    ? [...lessonsWithSecondSecondaryVideos, thirdLectureSeven]
    : lessonsWithSecondSecondaryVideos;

  // المحاضرة السابعة تظل ظاهرة دائمًا، وتأتي مباشرة بعد الامتحان الشامل.
  const lessons = (() => {
    if (!isThirdLectureSevenCourse) return lessonsWithRequiredVideos;
    const seventhIndex = lessonsWithRequiredVideos.findIndex(
      (lesson) => lesson?.id === "lesson-7" || lesson?.courseLectureKey === "third-lecture-7"
    );
    if (seventhIndex < 0) return lessonsWithRequiredVideos;
    const ordered = [...lessonsWithRequiredVideos];
    const [seventhLesson] = ordered.splice(seventhIndex, 1);
    const comprehensiveIndex = ordered.findIndex((lesson) => {
      const id = String(lesson?.id || "").toLowerCase();
      const title = String(lesson?.title || lesson?.name || "").trim();
      return id.includes("comprehensive") || id.includes("shamel") || title.includes("الامتحان الشامل");
    });
    if (comprehensiveIndex >= 0) ordered.splice(comprehensiveIndex + 1, 0, seventhLesson);
    else ordered.push(seventhLesson);
    return ordered;
  })();

  /*
    =====================================
    كورسات أولى ثانوي الجديدة
    =====================================
  */

  const isFirstSecondaryCourse =
    course.id ===
      "first-month-course" ||
    course.id ===
      "first-month-2-course" ||
    course.id ===
      "first-term-course";

  /*
    =====================================
    كورسات تانية ثانوي الجديدة
    =====================================
  */

  const isSecondSecondaryCourse =
    course.id ===
      "second-month-course" ||
    course.id ===
      "second-month-2-course" ||
    course.id ===
      "second-term-course";

  /*
    =====================================
    كورسات تالتة ثانوي الجديدة
    =====================================
  */

  const isThirdSecondaryCourse =
    course.id ===
      "third-month-course" ||
    course.id ===
      "third-month-2-course" ||
    course.id ===
      "third-term-course";

  /*
    المحاضرة الأولى
    امتحانها يظهر قبل المحاضرة الثانية
  */

  const firstLesson =
    lessons[0] || null;

  /*
    المحاضرة الثانية
    امتحانها يظهر قبل المحاضرة الثالثة
  */

  const secondLesson =
    lessons[1] || null;

  /*
    المحاضرة الثالثة
    امتحانها يظهر قبل المحاضرة الرابعة
  */

  const thirdLesson =
    lessons.find(
      (lesson) =>
        lesson?.id === "lesson-3"
    ) || null;

  const fourthLesson =
    lessons.find(
      (lesson) =>
        lesson?.id === "lesson-4"
    ) || null;

  function hasValue(value) {
    return (
      typeof value === "string" &&
      value.trim() !== ""
    );
  }

  function toggleLesson(lessonId) {
    setOpenedLessons(
      (previous) => ({
        ...previous,

        [lessonId]:
          !previous[lessonId],
      })
    );
  }

  function renderComprehensiveExamCard() {
    return (
      <div className="course-comprehensive-exam-wrap" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="course-comprehensive-exam-card"
          onClick={() => setComprehensiveExamExpanded((previous) => !previous)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 14,
            textAlign: "right", padding: "18px 20px", borderRadius: 18,
            border: "1px solid rgba(255, 255, 255, 0.28)",
            background: "linear-gradient(115deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
            color: "inherit", cursor: "pointer", font: "inherit",
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            transition: "transform .18s ease, border-color .18s ease, background .18s ease",
          }}
        >
          <span aria-hidden="true" style={{
            width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center",
            borderRadius: 13, background: "rgba(255, 190, 120, .14)", color: "#f4bd8b", fontSize: 20,
          }}>
            <FaClipboardCheck />
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 750, fontSize: "1.04rem" }}>الامتحان الشامل</span>
            <span style={{ opacity: .72, fontSize: ".84rem" }}>اختبر مستواك في محتوى الكورس بالكامل</span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: ".8rem", color: "#f4bd8b", fontWeight: 700 }}>180 دقيقة</span>
            <span style={{ fontSize: ".76rem", opacity: .72 }}>محاولة واحدة</span>
          </span>
        </button>
        {comprehensiveExamExpanded && (
          <div style={{
            marginTop: 12, padding: 14, borderRadius: 14,
            background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.14)",
          }}>
            {!hasComprehensiveCourseSubscription && !hasComprehensiveExamCodeAccess && (
              <div style={{
                maxWidth: 360, padding: 14, borderRadius: 14, background: "#f8f3ed",
                border: "1px solid #eadbcd", display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6f4930", fontWeight: "bold" }}>
                  <FaKey /> تفعيل الامتحان الشامل بالكود
                </div>
                <input
                  type="text" value={comprehensiveExamCode || ""}
                  onChange={(event) => onComprehensiveExamCodeChange?.(event.target.value)}
                  placeholder="اكتب كود الحصة" autoComplete="off" maxLength={20}
                  style={{
                    width: "100%", minHeight: 44, padding: "9px 12px", boxSizing: "border-box",
                    border: "1px solid #d7c2ae", borderRadius: 10, background: "#fff", color: "#31271f",
                    WebkitTextFillColor: "#31271f", caretColor: "#31271f", fontSize: 14,
                    fontWeight: 700, textAlign: "center", direction: "ltr",
                  }}
                />
                <button
                  type="button" disabled={activatingComprehensiveExam}
                  onClick={onActivateComprehensiveExamCode}
                  style={{
                    width: "100%", minHeight: 44, border: 0, borderRadius: 10, background: "#6f4930",
                    color: "#fff", font: "inherit", fontWeight: 700,
                    cursor: activatingComprehensiveExam ? "wait" : "pointer",
                  }}
                >
                  <FaKey /> {activatingComprehensiveExam ? "جاري التفعيل..." : "تفعيل الامتحان بالكود"}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => onOpenExam?.(
                { id: "comprehensive-exam", title: "الامتحان الشامل" },
                course.id.startsWith("second-") ? "secondMonthComprehensiveExam" : "thirdMonthComprehensiveExam"
              )}
              style={{
                marginTop: 12, minHeight: 44, padding: "10px 16px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.08)",
                color: "inherit", cursor: "pointer", font: "inherit", fontWeight: 700,
              }}
            >
              دخول الامتحان الشامل
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="course-content-page">
      {/* =========================
          زر الرجوع
      ========================= */}

      <button
        type="button"
        className="course-content-back-btn"
        onClick={onBack}
      >
        <FaArrowRight />

        الرجوع إلى جميع الكورسات
      </button>

      {/* =========================
          بيانات الكورس
      ========================= */}

      <div className="course-content-header">
        <FaBookOpen />

        <div>
          <span>
            {course.grade ||
              "المرحلة الثانوية"}
          </span>

          <h1>
            {course.title ||
              "كورس اللغة العربية"}
          </h1>

          <p>
            {course.description ||
              "محتوى الكورس والمحاضرات."}
          </p>
        </div>
      </div>


      {/* =========================
          لا توجد محاضرات
      ========================= */}

      {lessons.length === 0 ? (
        <div className="course-content-empty">
          <h2>
            لا توجد محاضرات مضافة حاليًا
          </h2>

          <p>
            سيتم إضافة المحتوى قريبًا.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {lessons.map(
            (
              lesson,
              lessonIndex
            ) => {
              const lessonId =
                lesson.id ||
                `lesson-${
                  lessonIndex + 1
                }`;

              const lessonNumber =
                lessonIndex + 1;

              /*
                هل المحاضرة متفعلة؟
              */

              const isThirdSeventhLesson =
                ["third-month-2-course", "third-term-course"].includes(course?.id) &&
                (lesson?.id === "lesson-7" || lesson?.courseLectureKey === "third-lecture-7");

              const isSecondLectureFiveSixCourse =
                ["second-month-2-course", "second-term-course"].includes(course?.id);
              const isSecondLectureFiveOrSix =
                isSecondLectureFiveSixCourse &&
                (lesson?.id === "lesson-5" || lesson?.id === "lesson-6" ||
                  lesson?.courseLectureKey === "second-secondary-lecture-5" ||
                  lesson?.courseLectureKey === "second-secondary-lecture-6");

              const unlocked =
                (!isThirdSeventhLesson || isCenterStudent || isThirdComprehensiveExamCompleted) &&
                (hasComprehensiveCourseSubscription ||
                  (typeof isLessonUnlocked === "function"
                    ? isLessonUnlocked(lesson)
                    : true));

              /*
                هل الطالب شاهد 30%؟
              */

              const watched =
                typeof getLessonWatched ===
                "function"
                  ? getLessonWatched(
                      lesson
                    )
                  : false;

              /*
                هل الواجب اتسلم؟
              */

              const homeworkSubmitted =
                typeof getHomeworkSubmitted ===
                "function"
                  ? getHomeworkSubmitted(
                      lesson
                    )
                  : false;

              const opened =
                openedLessons[
                  lessonId
                ] === true;

              /*
                =====================================
                المحاضرة الثانية لأولى ثانوي
                =====================================
              */

              const isFirstSecondLesson =
                isFirstSecondaryCourse &&
                lessonIndex === 1 &&
                course.id !== "first-month-2-course";

              const isFirstThirdLesson =
                isFirstSecondaryCourse &&
                lesson.id === "lesson-3";

              const isFirstFourthLesson =
                isFirstSecondaryCourse &&
                (lesson.id === "lesson-4" || lesson.courseLectureKey === "first-secondary-lecture-4");

              const isFirstFifthLesson =
                isFirstSecondaryCourse &&
                (lesson.id === "lesson-5" || lesson.courseLectureKey === "first-secondary-lecture-5");

              const isFirstSixthLesson =
                (course.id === "first-month-2-course" || course.id === "first-term-course") &&
                (lesson.id === "lesson-6" || lesson.courseLectureKey === "first-secondary-lecture-6");

              /*
                =====================================
                المحاضرة الثانية لتانية ثانوي
                =====================================
              */

              const isSecondSecondLesson =
                isSecondSecondaryCourse &&
                lessonIndex === 1;

              const isSecondThirdLessonForExam =
                isSecondSecondaryCourse &&
                lesson.id === "lesson-3";

              const isSecondFourthLesson =
                isSecondSecondaryCourse &&
                lesson.id === "lesson-4";

              const isSecondFifthLesson =
                ["second-month-2-course", "second-term-course"].includes(course.id) &&
                (lesson.id === "lesson-5" || lesson.courseLectureKey === "second-secondary-lecture-5");

              const isSecondSixthLesson =
                ["second-month-2-course", "second-term-course"].includes(course.id) &&
                (lesson.id === "lesson-6" || lesson.courseLectureKey === "second-secondary-lecture-6");

              /*
                =====================================
                المحاضرة الثانية لتالتة
                =====================================
              */

              const isSecondThirdLesson =
                isSecondSecondaryCourse &&
                lesson.id ===
                  "lesson-3";

              const isThirdSecondLesson =
                isThirdSecondaryCourse &&
                lesson.id ===
                  "lesson-2";

              /*
                =====================================
                المحاضرة الثالثة لتالتة
                =====================================
              */

              const isThirdThirdLesson =
                isThirdSecondaryCourse &&
                lesson.id ===
                  "lesson-3";

              /*
                =====================================
                المحاضرة الرابعة لتالتة
                =====================================
              */

              const isThirdFourthLesson =
                isThirdSecondaryCourse &&
                lesson.id ===
                  "lesson-4";

              const isThirdFifthLesson =
                isThirdSecondaryCourse &&
                lesson.id ===
                  "lesson-5";

              const isThirdSixthLesson =
                isThirdSecondaryCourse &&
                lesson.id === "lesson-6";

              // مراجعة أكتوبر تفتح مباشرة بدون امتحانات أو واجبات سابقة.
              const isOctoberReviewLesson =
                lesson?.id === "october-review" ||
                lesson?.courseLectureKey === "third-october-review";

              // مراجعة أكتوبر لأولى ثانوي: فيديو فقط بدون امتحان أو واجب سابق.
              const isFirstOctoberReviewLesson =
                lesson?.id === "first-october-review" ||
                lesson?.courseLectureKey === "first-october-review";

              /*
                =====================================
                فتح فيديو المحاضرة
                =====================================
              */

              const canOpenVideo =
                isOctoberReviewLesson ||
                isFirstOctoberReviewLesson ||
                (
                  unlocked &&
                  (
                  (
                    !isFirstSecondLesson &&
                    !isFirstThirdLesson &&
                    !isFirstFourthLesson &&
                    !isFirstFifthLesson &&
                    !isFirstSixthLesson &&
                    !isSecondSecondLesson &&
                    !isSecondThirdLessonForExam &&
                    !isSecondFourthLesson &&
                    !isSecondFifthLesson &&
                    !isSecondSixthLesson &&
                    !isThirdSecondLesson &&
                    !isThirdThirdLesson &&
                    !isThirdFourthLesson &&
                    !isThirdFifthLesson &&
                    !isThirdSixthLesson
                  ) ||
                  (
                    isFirstSecondLesson &&
                    isFirstLecture1ExamCompleted
                  ) ||
                  (
                    isFirstThirdLesson &&
                    isFirstLecture2ExamCompleted
                  ) ||
                  (
                    isFirstFourthLesson &&
                    isFirstLecture4ExamCompleted
                  ) ||
                  (
                    isFirstFifthLesson &&
                    isFirstLecture5ExamCompleted
                  ) ||
                  (
                    isFirstSixthLesson &&
                    isFirstLecture6ExamCompleted
                  ) ||
                  (
                    isSecondSecondLesson &&
                    isSecondLecture1ExamCompleted
                  ) ||
                  (
                    isSecondFourthLesson &&
                    isSecondLecture3ExamCompleted
                  ) ||
                  (
                    isSecondFifthLesson &&
                    (isCenterStudent || isSecondComprehensiveExamCompleted) &&
                    isSecondLecture4ExamCompleted
                  ) ||
                  (
                    isSecondSixthLesson &&
                    (isCenterStudent || isSecondComprehensiveExamCompleted)
                  ) ||
                  (
                    isSecondThirdLesson &&
                    isSecondLecture2ExamCompleted
                  ) ||
                  (
                    isThirdSecondLesson &&
                    isThirdLecture1ExamCompleted
                  ) ||
                  (
                    isThirdThirdLesson &&
                    isThirdLecture2ExamCompleted
                  ) ||
                  (
                    isThirdFourthLesson &&
                    isThirdLecture3ExamCompleted
                  ) ||
                  (
                    isThirdFifthLesson &&
                    isThirdLecture4ExamCompleted
                  ) ||
                  (
                    isThirdSixthLesson &&
                    isThirdLecture5ExamCompleted
                  )
                  )
                );

              /*
                فيديو المحاضرة
              */

              const hasVideo =
                hasValue(
                  lesson.youtubeUrl
                ) ||
                hasValue(
                  lesson.videoUrl
                );

              /*
                PDF
              */

              const hasPdf =
                hasValue(
                  lesson.pdfUrl
                );

              /*
                الواجب
              */

              const hasHomework =
                lesson.homeworkEnabled ===
                  true ||
                hasValue(
                  lesson.homeworkKey
                );

              /*
                =====================================
                فيديو واجب مباشر

                يستخدم في تانية ثانوي
                بعد مشاهدة 30%
                بدون تسليم واجب
                =====================================
              */

              const directHomeworkVideoUrl =
                lesson.homeworkVideoUrl ||
                "";

              const hasDirectHomeworkVideo =
                lesson.homeworkVideoOnly ===
                  true &&
                hasValue(
                  directHomeworkVideoUrl
                );

              /*
                فيديو حل الواجب
              */

              const homeworkSolutionUrl =
                lesson.homeworkSolutionUrl ||
                lesson.solutionVideoUrl ||
                "";

              const hasHomeworkSolution =
                hasValue(
                  homeworkSolutionUrl
                );

              /*
                =====================================
                الكورسات القديمة الخاصة بالبلاغة
                =====================================
              */

              const isOldBalaghaCourse =
                course.id ===
                  "second-course-2" ||
                course.id ===
                  "third-course-2";

              const hasExam1 =
                lesson.exam1 ===
                  true ||
                hasValue(
                  lesson.exam1Key
                ) ||
                isOldBalaghaCourse;

              const hasExam2 =
                lesson.exam2 ===
                  true ||
                hasValue(
                  lesson.exam2Key
                ) ||
                isOldBalaghaCourse;

              /*
                =====================================
                إخفاء الامتحان من المحاضرة الأصلية

                أولى:
                امتحان المحاضرة الأولى يظهر
                قبل المحاضرة الثانية.

                تانية:
                امتحان المحاضرة الأولى يظهر
                قبل المحاضرة الثانية.

                تالتة:
                امتحانات 1 و2 و3 تظهر
                قبل المحاضرات 2 و3 و4.
                =====================================
              */

              const hideExam1InSourceLesson =
                (
                  isFirstSecondaryCourse &&
                  (
                    lessonIndex === 0 ||
                    lesson.id === "lesson-2" ||
                    (course.id === "first-month-2-course" && lesson.id === "lesson-6")
                  )
                ) ||
                (
                  isSecondSecondaryCourse &&
                  (
                    lesson.id === "lesson-1" ||
                    lesson.id === "lesson-2" ||
                    lesson.id === "lesson-3"
                  )
                ) ||
                (
                  isThirdSecondaryCourse &&
                  (
                    lesson.id === "lesson-1" ||
                    lesson.id === "lesson-2" ||
                    lesson.id === "lesson-3" ||
                    lesson.id === "lesson-4" ||
                    lesson.id === "lesson-5" ||
                    lesson.id === "lesson-6"
                  )
                );

              /*
                =====================================
                امتحان المحاضرة الأولى لأولى ثانوي
                يظهر قبل المحاضرة الثانية
                =====================================
              */

              const showFirstSecondaryExamBeforeSecondLesson =
                isFirstSecondaryCourse &&
                course.id !== "first-month-2-course" &&
                lessonIndex === 1 &&
                firstLesson;

              /*
                =====================================
                امتحان المحاضرة الأولى لتانية ثانوي
                يظهر قبل المحاضرة الثانية
                =====================================
              */

              const showSecondSecondaryExamBeforeSecondLesson =
                !isSecondLectureFiveSixCourse &&
                isSecondSecondaryCourse &&
                lessonIndex === 1 &&
                firstLesson;

              /*
                =====================================
                امتحان المحاضرة الأولى لتالتة
                يظهر قبل المحاضرة الثانية
                =====================================
              */

              const showSecondSecondaryExamBeforeThirdLesson =
                !isSecondLectureFiveSixCourse &&
                isSecondSecondaryCourse &&
                lesson.id === "lesson-3" &&
                secondLesson;

              const showFirstExamBeforeSecondLesson =
                !isOctoberReviewLesson &&
                !isSecondLectureFiveSixCourse &&
                (isThirdSecondaryCourse &&
                  lesson.id !== "lesson-6" &&
                  lessonIndex === 1 &&
                  firstLesson);

              /*
                =====================================
                امتحان المحاضرة الثانية لتالتة
                يظهر قبل المحاضرة الثالثة
                =====================================
              */

              const showSecondExamBeforeThirdLesson =
                !isOctoberReviewLesson &&
                (                isThirdSecondaryCourse &&
                lesson.id !== "lesson-6" &&
                lessonIndex === 2 &&
                secondLesson);

              /*
                =====================================
                امتحان المحاضرة الثالثة لتالتة
                يظهر قبل المحاضرة الرابعة
                =====================================
              */

              const showThirdExamBeforeFourthLesson =
                !isOctoberReviewLesson &&
                (                isThirdSecondaryCourse &&
                lesson.id !== "lesson-6" &&
                lessonIndex === 3 &&
                thirdLesson);

              const showFourthExamBeforeFifthLesson =
                !isOctoberReviewLesson &&
                (                isThirdSecondaryCourse &&
                lesson.id !== "lesson-6" &&
                lesson.id ===
                  "lesson-5" &&
                (
                  (
                    fourthLesson &&
                    (
                      fourthLesson.exam1 === true ||
                      hasValue(
                        fourthLesson.exam1Key
                      )
                    )
                  ) ||
                  hasValue(
                    lesson.entryExamKey
                  )
                ));

              const showFirstSecondaryExamBeforeThirdLesson =
                isFirstSecondaryCourse &&
                lesson.id === "lesson-3";

              // امتحان المحاضرة الرابعة لأولى ثانوي يظهر قبل بطاقة المحاضرة الرابعة.
              const showFirstSecondaryExamBeforeFourthLesson =
                isFirstSecondaryCourse &&
                (lesson.id === "lesson-4" || lesson.courseLectureKey === "first-secondary-lecture-4") &&
                hasValue(lesson.exam1Key);

              const showSecondSecondaryExamBeforeFourthLesson =
                isSecondSecondaryCourse &&
                lesson.id === "lesson-4";

              const showSecondSecondaryExamBeforeFifthLesson =
                ["second-month-2-course", "second-term-course"].includes(course.id) &&
                isSecondFifthLesson &&
                hasValue(lesson.exam1Key);

              // امتحان المحاضرة الخامسة يظل ظاهرًا في المحاضرة الخامسة فقط.
              // لا نعرضه داخل بطاقة المحاضرة السادسة حتى لو وصلت بيانات امتحان قديمة معها.
              const showFirstSecondaryExamBeforeFifthLesson =
                isFirstSecondaryCourse &&
                !isFirstSixthLesson &&
                (lesson.id === "lesson-5" || lesson.courseLectureKey === "first-secondary-lecture-5") &&
                !String(lesson.title || "").includes("المحاضرة السادسة") &&
                hasValue(lesson.exam1Key);

              const showFirstSecondaryExamBeforeSixthLesson =
                isFirstSixthLesson &&
                hasValue(lesson.exam1Key);

              const showThirdExamBeforeSixthLesson =
                !isOctoberReviewLesson &&
                (                isThirdSecondaryCourse &&
                lesson.id === "lesson-6");

              return (
                <div key={lessonId} style={{ display: "contents" }}>
                  {isThirdSeventhLesson && renderComprehensiveExamCard()}
                  {isSecondFifthLesson && renderComprehensiveExamCard()}
                  <div
                  style={{
                    background:
                      "#fff",

                    border:
                      "1px solid #e2d3c5",

                    borderRadius:
                      "18px",

                    overflow:
                      "hidden",

                    boxShadow:
                      "0 7px 20px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* =====================================
                      رأس المحاضرة
                  ===================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleLesson(
                        lessonId
                      )
                    }
                    style={{
                      width:
                        "100%",

                      minHeight:
                        "82px",

                      border:
                        "none",

                      background:
                        "#fff",

                      padding:
                        "18px 20px",

                      cursor:
                        "pointer",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "space-between",

                      gap:
                        "15px",

                      textAlign:
                        "right",

                      color:
                        "#31271f",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "12px",
                      }}
                    >
                      <div
                        style={{
                          width:
                            "44px",

                          height:
                            "44px",

                          borderRadius:
                            "12px",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          background:
                            unlocked
                              ? "#e7f6ed"
                              : "#f2ebe5",

                          color:
                            unlocked
                              ? "#168d55"
                              : "#6f4930",

                          flexShrink:
                            0,
                        }}
                      >
                        {unlocked ? (
                          <FaBookOpen />
                        ) : (
                          <FaLock />
                        )}
                      </div>

                      <div>
                        <h2
                          style={{
                            margin:
                              0,

                            fontSize:
                              "20px",
                          }}
                        >
                          {lesson.title ||
                            `المحاضرة ${lessonNumber}`}
                        </h2>

                        <span
                          style={{
                            display:
                              "inline-block",

                            marginTop:
                              "5px",

                            fontSize:
                              "13px",

                            fontWeight:
                              "700",

                            color:
                              unlocked
                                ? "#168d55"
                                : "#8a6a52",
                          }}
                        >
                          {!unlocked
                            ? (
                                isFirstSecondLesson ||
                                isSecondSecondLesson ||
                                isThirdSecondLesson ||
                                isThirdThirdLesson ||
                                isThirdFourthLesson
                              )
                              ? "فعّل المحاضرة بالكود لفتح الامتحان"
                              : "اضغط لعرض تفاصيل المحاضرة"
                            : isFirstSecondLesson &&
                                !isFirstLecture1ExamCompleted
                              ? "تم التفعيل - سلّم الامتحان لفتح الفيديو"
                              : isSecondSecondLesson &&
                                  !isSecondLecture1ExamCompleted
                                ? "تم التفعيل - سلّم الامتحان لفتح الفيديو"
                                : isThirdSecondLesson &&
                                    !isThirdLecture1ExamCompleted
                                  ? "تم التفعيل - سلّم الامتحان لفتح الفيديو"
                                  : isThirdThirdLesson &&
                                      !isThirdLecture2ExamCompleted
                                    ? "تم التفعيل - سلّم الامتحان لفتح الفيديو"
                                    : isThirdFourthLesson &&
                                        !isThirdLecture3ExamCompleted
                                      ? "تم التفعيل - سلّم الامتحان لفتح الفيديو"
                                      : "المحاضرة متاحة"}
                        </span>
                      </div>
                    </div>

                    {opened ? (
                      <FaChevronUp />
                    ) : (
                      <FaChevronDown />
                    )}
                  </button>

                  {/* =====================================
                      محتويات المحاضرة
                  ===================================== */}

                  {opened && (
                    <div
                      style={{
                        padding:
                          "18px",

                        borderTop:
                          "1px solid #eee2d7",
                      }}
                    >
                      {lesson.description && (
                        <p
                          style={{
                            margin:
                              "0 0 16px",

                            color:
                              "#746256",

                            lineHeight:
                              "1.8",
                          }}
                        >
                          {
                            lesson.description
                          }
                        </p>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الأولى - أولى ثانوي
                          قبل المحاضرة الثانية
                      ===================================== */}

                      {showFirstSecondaryExamBeforeSecondLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            onOpenExam?.(
                              firstLesson,
                              firstLesson.exam1Key ||
                                "firstLecture1Exam"
                            )
                          }
                          style={{
                            width:
                              "100%",

                            marginBottom:
                              "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isFirstLecture1ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {firstLesson.exam1Title ||
                                "امتحان المحاضرة الأولى"}
                            </h3>

                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثانية بالكود أولًا"
                                : isFirstLecture1ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثانية"}
                            </p>
                          </div>

                          {isFirstLecture1ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان قبل المحاضرة الرابعة - أولى ثانوي
                          يظهر قبل فيديو المحاضرة الرابعة
                      ===================================== */}

                      {showFirstSecondaryExamBeforeFourthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${unlocked ? "available" : "locked"}`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              lesson,
                              lesson.exam1Key || "firstLecture4Exam"
                            )
                          }
                          style={{ width: "100%", marginBottom: "14px" }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? <FaClipboardCheck /> : <FaLock />}
                          </div>
                          <div className="course-content-card-info">
                            <h3>{lesson.exam1Title || "امتحان قبل المحاضرة الرابعة"}</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الرابعة بالكود أولًا"
                                : "ابدأ الامتحان أولًا؛ وبعد تسليمه افتح فيديو المحاضرة الرابعة"}
                            </p>
                          </div>
                        </button>
                      )}

                      {/* امتحان المحاضرة الخامسة لأولى ثانوي يظهر قبل الفيديو */}
                      {showFirstSecondaryExamBeforeFifthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${unlocked ? "available" : "locked"}`}
                          disabled={!unlocked}
                          onClick={() => onOpenExam?.(lesson, lesson.exam1Key || "firstLecture5Exam")}
                          style={{ width: "100%", marginBottom: "14px" }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? <FaClipboardCheck /> : <FaLock />}
                          </div>
                          <div className="course-content-card-info">
                            <h3>{lesson.exam1Title || "امتحان قبل المحاضرة الخامسة"}</h3>
                            <p>
                              {!unlocked
                                ? "فعّل الكورس أولًا لفتح الامتحان"
                                : isFirstLecture5ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك مراجعة النتيجة"
                                  : "سلّم الامتحان أولًا لفتح فيديو المحاضرة الخامسة"}
                            </p>
                          </div>
                          {isFirstLecture5ExamCompleted && <FaCheckCircle className="course-content-completed-icon" />}
                        </button>
                      )}

                      {/* امتحان ما قبل المحاضرة السادسة - أولى ثانوي */}
                      {showFirstSecondaryExamBeforeSixthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${unlocked ? "available" : "locked"}`}
                          disabled={!unlocked}
                          onClick={() => onOpenExam?.(lesson, lesson.exam1Key || "firstLecture6Exam")}
                          style={{ width: "100%", marginBottom: "14px" }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (isFirstLecture6ExamCompleted ? <FaCheckCircle /> : <FaClipboardCheck />) : <FaLock />}
                          </div>
                          <div className="course-content-card-info">
                            <h3>{lesson.exam1Title || "امتحان قبل المحاضرة السادسة"}</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة السادسة بالكود أولًا"
                                : isFirstLecture6ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك مراجعة النتيجة"
                                  : "سلّم الامتحان أولًا لفتح فيديو المحاضرة السادسة"}
                            </p>
                          </div>
                          {isFirstLecture6ExamCompleted && <FaCheckCircle className="course-content-completed-icon" />}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الأولى - تانية ثانوي
                          قبل المحاضرة الثانية
                      ===================================== */}

                      {showSecondSecondaryExamBeforeSecondLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            onOpenExam?.(
                              firstLesson,
                              firstLesson.exam1Key ||
                                "secondLecture1Exam"
                            )
                          }
                          style={{
                            width:
                              "100%",

                            marginBottom:
                              "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isSecondLecture1ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {firstLesson.exam1Title ||
                                "امتحان المحاضرة الأولى"}
                            </h3>

                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثانية بالكود أولًا"
                                : isSecondLecture1ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثانية"}
                            </p>
                          </div>

                          {isSecondLecture1ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الثانية - أولى ثانوي
                          قبل المحاضرة الثالثة
                      ===================================== */}
                      {showFirstSecondaryExamBeforeThirdLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked ? "available" : "locked"
                          }`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              lesson,
                              "firstLecture2Exam"
                            )
                          }
                          style={{
                            width: "100%",
                            marginBottom: "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isFirstLecture2ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>
                          <div className="course-content-card-info">
                            <h3>امتحان المحاضرة الثانية</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثالثة بالكود أولًا"
                                : isFirstLecture2ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثالثة"}
                            </p>
                          </div>
                          {isFirstLecture2ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الثانية - تانية ثانوي
                          قبل المحاضرة الثالثة
                      ===================================== */}

                      {showSecondSecondaryExamBeforeThirdLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              secondLesson,
                              secondLesson.exam1Key ||
                                "secondLecture2Exam"
                            )
                          }
                          style={{
                            width: "100%",
                            marginBottom: "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isSecondLecture2ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {secondLesson.exam1Title ||
                                "امتحان المحاضرة الثانية"}
                            </h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثالثة بالكود أولًا"
                                : isSecondLecture2ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثالثة"}
                            </p>
                          </div>

                          {isSecondLecture2ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الثالثة - تانية ثانوي
                          قبل المحاضرة الرابعة
                      ===================================== */}
                      {showSecondSecondaryExamBeforeFourthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked ? "available" : "locked"
                          }`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              lesson,
                              "secondLecture3Exam"
                            )
                          }
                          style={{
                            width: "100%",
                            marginBottom: "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isSecondLecture3ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>
                          <div className="course-content-card-info">
                            <h3>امتحان المحاضرة الثالثة</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الرابعة بالكود أولًا"
                                : isSecondLecture3ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الرابعة"}
                            </p>
                          </div>
                          {isSecondLecture3ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* امتحان قبل المحاضرة الخامسة - تانية ثانوي */}
                      {showSecondSecondaryExamBeforeFifthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${unlocked ? "available" : "locked"}`}
                          disabled={!unlocked}
                          onClick={() => onOpenExam?.(lesson, lesson.exam1Key || "secondLecture4Exam")}
                          style={{ width: "100%", marginBottom: "14px" }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (isSecondLecture4ExamCompleted ? <FaCheckCircle /> : <FaClipboardCheck />) : <FaLock />}
                          </div>
                          <div className="course-content-card-info">
                            <h3>{lesson.exam1Title || "امتحان قبل المحاضرة الخامسة"}</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الخامسة بالكود أولًا"
                                : isSecondLecture4ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك مراجعة النتيجة"
                                  : "ابدأ الامتحان قبل مشاهدة المحاضرة الخامسة"}
                            </p>
                          </div>
                          {isSecondLecture4ExamCompleted && <FaCheckCircle className="course-content-completed-icon" />}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الأولى - تالتة ثانوي
                          قبل المحاضرة الثانية
                      ===================================== */}

                      {showFirstExamBeforeSecondLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            onOpenExam?.(
                              firstLesson,
                              firstLesson.exam1Key ||
                                "exam1"
                            )
                          }
                          style={{
                            width:
                              "100%",

                            marginBottom:
                              "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isThirdLecture1ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {firstLesson.exam1Title ||
                                "امتحان المحاضرة الأولى"}
                            </h3>

                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثانية بالكود أولًا"
                                : isThirdLecture1ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثانية"}
                            </p>
                          </div>

                          {isThirdLecture1ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الثانية - تالتة ثانوي
                          قبل المحاضرة الثالثة
                      ===================================== */}

                      {showSecondExamBeforeThirdLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            onOpenExam?.(
                              secondLesson,
                              secondLesson.exam1Key ||
                                "thirdLecture2Exam"
                            )
                          }
                          style={{
                            width:
                              "100%",

                            marginBottom:
                              "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isThirdLecture2ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {secondLesson.exam1Title ||
                                "امتحان المحاضرة الثانية"}
                            </h3>

                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الثالثة بالكود أولًا"
                                : isThirdLecture2ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الثالثة"}
                            </p>
                          </div>

                          {isThirdLecture2ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الثالثة - تالتة ثانوي
                          قبل المحاضرة الرابعة
                      ===================================== */}

                      {showThirdExamBeforeFourthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={
                            !unlocked
                          }
                          onClick={() =>
                            onOpenExam?.(
                              thirdLesson,
                              thirdLesson.exam1Key ||
                                "thirdLecture3Exam"
                            )
                          }
                          style={{
                            width:
                              "100%",

                            marginBottom:
                              "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isThirdLecture3ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {thirdLesson.exam1Title ||
                                "امتحان المحاضرة الثالثة"}
                            </h3>

                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الرابعة بالكود أولًا"
                                : isThirdLecture3ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الرابعة"}
                            </p>
                          </div>

                          {isThirdLecture3ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الرابعة - تالتة ثانوي
                          قبل المحاضرة الخامسة
                      ===================================== */}

                      {showFourthExamBeforeFifthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked
                              ? "available"
                              : "locked"
                          }`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              fourthLesson || lesson,
                              fourthLesson?.exam1Key ||
                                lesson.entryExamKey ||
                                "thirdLecture4Exam"
                            )
                          }
                          style={{
                            width: "100%",
                            marginBottom: "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isThirdLecture4ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>

                          <div className="course-content-card-info">
                            <h3>
                              {fourthLesson?.exam1Title ||
                                lesson.entryExamTitle ||
                                "امتحان المحاضرة الرابعة"}
                            </h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة الخامسة بالكود أولًا"
                                : isThirdLecture4ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة الخامسة"}
                            </p>
                          </div>

                          {isThirdLecture4ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          امتحان المحاضرة الخامسة - تالتة ثانوي
                          قبل المحاضرة السادسة
                      ===================================== */}
                      {showThirdExamBeforeSixthLesson && (
                        <button
                          type="button"
                          className={`course-content-card exam-card ${
                            unlocked ? "available" : "locked"
                          }`}
                          disabled={!unlocked}
                          onClick={() =>
                            onOpenExam?.(
                              lesson,
                              "thirdLecture5Exam"
                            )
                          }
                          style={{
                            width: "100%",
                            marginBottom: "14px",
                          }}
                        >
                          <div className="course-content-card-icon">
                            {unlocked ? (
                              isThirdLecture5ExamCompleted ? (
                                <FaCheckCircle />
                              ) : (
                                <FaClipboardCheck />
                              )
                            ) : (
                              <FaLock />
                            )}
                          </div>
                          <div className="course-content-card-info">
                            <h3>امتحان المحاضرة الخامسة</h3>
                            <p>
                              {!unlocked
                                ? "فعّل المحاضرة السادسة بالكود أولًا"
                                : isThirdLecture5ExamCompleted
                                  ? "تم تسليم الامتحان - يمكنك فتحه لمراجعة النتيجة"
                                  : "ابدأ الامتحان - بعد تسليمه يفتح فيديو المحاضرة السادسة"}
                            </p>
                          </div>
                          {isThirdLecture5ExamCompleted && (
                            <FaCheckCircle className="course-content-completed-icon" />
                          )}
                        </button>
                      )}

                      {/* =====================================
                          فيديو المحاضرة + كود التفعيل
                      ===================================== */}

                      {(hasVideo ||
                        !unlocked) && (
                        <div
                          style={{
                            display:
                              "flex",

                            flexWrap:
                              "wrap",

                            gap:
                              "14px",

                            alignItems:
                              "stretch",

                            marginBottom:
                              "14px",
                          }}
                        >
                          {/* =========================
                              فيديو الشرح
                          ========================= */}

                          {hasVideo && (
                            <button
                              type="button"
                              className={`course-content-card video-card ${
                                canOpenVideo
                                  ? ""
                                  : "locked"
                              }`}
                              disabled={
                                !canOpenVideo
                              }
                              onClick={() =>
                                onOpenVideo?.(
                                  lesson
                                )
                              }
                              style={{
                                flex:
                                  unlocked
                                    ? "1 1 100%"
                                    : "1 1 55%",

                                minWidth:
                                  "260px",

                                margin:
                                  0,
                              }}
                            >
                              <div className="course-content-card-icon">
                                {canOpenVideo ? (
                                  <FaPlay />
                                ) : (
                                  <FaLock />
                                )}
                              </div>

                              <div className="course-content-card-info">
                                <h3>
                                  {lesson.videoTitle ||
                                    "فيديو شرح المحاضرة"}
                                </h3>

                                <p>
                                  {!unlocked
                                    ? "فعّل المحاضرة بالكود أولًا"
                                    : isFirstSecondLesson &&
                                        !isFirstLecture1ExamCompleted
                                      ? "سلّم امتحان المحاضرة الأولى أولًا لفتح الفيديو"
                                      : isSecondSecondLesson &&
                                          !isSecondLecture1ExamCompleted
                                        ? "سلّم امتحان المحاضرة الأولى أولًا لفتح الفيديو"
                                        : (isSecondFifthLesson || isSecondSixthLesson) &&
                                            !isCenterStudent &&
                                            !isSecondComprehensiveExamCompleted
                                          ? "ادخل الامتحان الشامل وسلّمه أولًا لفتح المحاضرتين الخامسة والسادسة"
                                          : isThirdSecondLesson &&
                                            !isThirdLecture1ExamCompleted
                                          ? "سلّم امتحان المحاضرة الأولى أولًا لفتح الفيديو"
                                          : isThirdThirdLesson &&
                                              !isThirdLecture2ExamCompleted
                                            ? "سلّم امتحان المحاضرة الثانية أولًا لفتح الفيديو"
                                            : isThirdFourthLesson &&
                                                !isThirdLecture3ExamCompleted
                                              ? "سلّم امتحان المحاضرة الثالثة أولًا لفتح الفيديو"
                                              : "اضغط لمشاهدة شرح المحاضرة"}
                                </p>

                                {lesson.duration && (
                                  <span>
                                    <FaClock />

                                    مدة الفيديو:{" "}
                                    {
                                      lesson.duration
                                    }
                                  </span>
                                )}
                              </div>

                              {watched && (
                                <FaCheckCircle className="course-content-completed-icon" />
                              )}
                            </button>
                          )}

                          {/* =====================================
                              كود تفعيل المحاضرة
                          ===================================== */}

                          {!unlocked && !hasComprehensiveCourseSubscription && (
                            <div
                              style={{
                                flex:
                                  "0 1 300px",

                                width:
                                  "300px",

                                maxWidth:
                                  "100%",

                                minWidth:
                                  "240px",

                                padding:
                                  "14px",

                                boxSizing:
                                  "border-box",

                                borderRadius:
                                  "14px",

                                background:
                                  "#f8f3ed",

                                border:
                                  "1px solid #eadbcd",

                                display:
                                  "flex",

                                flexDirection:
                                  "column",

                                justifyContent:
                                  "center",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  gap:
                                    "7px",

                                  marginBottom:
                                    "10px",

                                  color:
                                    "#6f4930",

                                  fontWeight:
                                    "bold",
                                }}
                                >
                                <FaKey />

                                تفعيل المحاضرة بالكود
                              </div>

                              <input
                                type="text"
                                value={
                                  lessonActivationCodes?.[
                                    lesson.id
                                  ] ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  onLessonCodeChange?.(
                                    lesson.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="اكتب كود المحاضرة"
                                autoComplete="off"
                                maxLength={
                                  20
                                }
                                style={{
                                  width:
                                    "100%",

                                  minHeight:
                                    "44px",

                                  padding:
                                    "9px 12px",

                                  marginBottom:
                                    "8px",

                                  boxSizing:
                                    "border-box",

                                  border:
                                    "1px solid #d7c2ae",

                                  borderRadius:
                                    "10px",

                                  background:
                                    "#fff",

                                  color:
                                    "#31271f",

                                  WebkitTextFillColor:
                                    "#31271f",

                                  caretColor:
                                    "#31271f",

                                  fontSize:
                                    "14px",

                                  fontWeight:
                                    "700",

                                  textAlign:
                                    "center",

                                  direction:
                                    "ltr",
                                }}
                              />

                              <button
                                type="button"
                                className="course-content-btn"
                                disabled={
                                  activatingLessonId ===
                                  lesson.id
                                }
                                onClick={() =>
                                  onActivateLessonCode?.(
                                    lesson
                                  )
                                }
                                style={{
                                  width:
                                    "100%",

                                  minHeight:
                                    "44px",
                                }}
                              >
                                <FaKey />

                                {activatingLessonId ===
                                lesson.id
                                  ? "جاري التفعيل..."
                                  : "تفعيل الدرس بالكود"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="course-content-items">
                        {/* =========================
                            PDF
                        ========================= */}

                        {hasPdf && (
                          <button
                            type="button"
                            className={`course-content-card pdf-card ${
                              unlocked
                                ? ""
                                : "locked"
                            }`}
                            disabled={
                              !unlocked
                            }
                            onClick={() =>
                              onOpenPdf?.(
                                lesson
                              )
                            }
                          >
                            <div className="course-content-card-icon">
                              {unlocked ? (
                                <FaFilePdf />
                              ) : (
                                <FaLock />
                              )}
                            </div>

                            <div className="course-content-card-info">
                              <h3>
                                ملف المحاضرة
                              </h3>

                              <p>
                                {unlocked
                                  ? "اضغط لفتح ملف المحاضرة"
                                  : "المحاضرة مقفولة"}
                              </p>
                            </div>
                          </button>
                        )}

                        {/* =====================================
                            فيديو الواجب المباشر - تانية ثانوي

                            يفتح بعد مشاهدة 30%
                            بدون تسليم أو تصحيح
                        ===================================== */}

                        {hasDirectHomeworkVideo && !isSecondFifthLesson && !isSecondSixthLesson && (
                          <button
                            type="button"
                            className={`course-content-card video-card ${
                              canOpenVideo &&
                              watched
                                ? ""
                                : "locked"
                            }`}
                            disabled={
                              !canOpenVideo ||
                              !watched
                            }
                            onClick={() =>
                              onOpenHomeworkSolution?.(
                                lesson,
                                directHomeworkVideoUrl
                              )
                            }
                          >
                            <div className="course-content-card-icon">
                              {canOpenVideo &&
                              watched ? (
                                <FaPlay />
                              ) : (
                                <FaLock />
                              )}
                            </div>

                            <div className="course-content-card-info">
                              <h3>
                                {lesson.homeworkTitle ||
                                  "فيديو الواجب"}
                              </h3>

                              <p>
                                {!unlocked
                                  ? "المحاضرة مقفولة"
                                  : isSecondSecondLesson &&
                                      !isSecondLecture1ExamCompleted
                                    ? "سلّم امتحان المحاضرة الأولى أولًا"
                                    : !watched
                                      ? "يفتح بعد مشاهدة 30% من فيديو المحاضرة"
                                      : "اضغط لمشاهدة فيديو الواجب"}
                              </p>
                            </div>
                          </button>
                        )}

                        {/* =====================================
                            الواجب
                            بعد مشاهدة 30%
                        ===================================== */}

                        {hasHomework &&
                          !hasDirectHomeworkVideo && (
                          <button
                            type="button"
                            className={`course-content-card exam-card ${
                              canOpenVideo &&
                              watched
                                ? "available"
                                : "locked"
                            }`}
                            disabled={
                              !canOpenVideo ||
                              !watched
                            }
                            onClick={() =>
                              onOpenHomework?.(
                                lesson
                              )
                            }
                          >
                            <div className="course-content-card-icon">
                              {canOpenVideo &&
                              watched ? (
                                <FaClipboardCheck />
                              ) : (
                                <FaLock />
                              )}
                            </div>

                            <div className="course-content-card-info">
                              <h3>
                                {lesson.homeworkTitle ||
                                  "واجب المحاضرة"}
                              </h3>

                              <p>
                                {!unlocked
                                  ? "المحاضرة مقفولة"
                                  : isFirstSecondLesson &&
                                      !isFirstLecture1ExamCompleted
                                    ? "سلّم الامتحان أولًا ثم شاهد 30% من فيديو الشرح"
                                    : isSecondSecondLesson &&
                                        !isSecondLecture1ExamCompleted
                                      ? "سلّم الامتحان أولًا ثم شاهد 30% من فيديو الشرح"
                                      : isThirdSecondLesson &&
                                          !isThirdLecture1ExamCompleted
                                        ? "سلّم الامتحان أولًا ثم شاهد 30% من فيديو الشرح"
                                        : isThirdThirdLesson &&
                                            !isThirdLecture2ExamCompleted
                                          ? "سلّم الامتحان أولًا ثم شاهد 30% من فيديو الشرح"
                                          : isThirdFourthLesson &&
                                              !isThirdLecture3ExamCompleted
                                            ? "سلّم الامتحان أولًا ثم شاهد 30% من فيديو الشرح"
                                            : !watched
                                              ? "يفتح بعد مشاهدة 30% من فيديو الشرح"
                                              : homeworkSubmitted
                                                ? "تم تسليم الواجب"
                                                : "اضغط لبدء الواجب"}
                              </p>
                            </div>

                            {homeworkSubmitted && (
                              <FaCheckCircle className="course-content-completed-icon" />
                            )}
                          </button>
                        )}

                        {/* =====================================
                            فيديو حل الواجب
                            بعد تسليم الواجب
                        ===================================== */}

                        {hasHomeworkSolution &&
                          !hasDirectHomeworkVideo && (
                          <button
                            type="button"
                            className={`course-content-card video-card ${
                              canOpenVideo &&
                              homeworkSubmitted
                                ? ""
                                : "locked"
                            }`}
                            disabled={
                              !canOpenVideo ||
                              !homeworkSubmitted
                            }
                            onClick={() =>
                              onOpenHomeworkSolution?.(
                                lesson,
                                homeworkSolutionUrl
                              )
                            }
                          >
                            <div className="course-content-card-icon">
                              {canOpenVideo &&
                              homeworkSubmitted ? (
                                <FaPlay />
                              ) : (
                                <FaLock />
                              )}
                            </div>

                            <div className="course-content-card-info">
                              <h3>
                                {lesson.homeworkSolutionTitle ||
                                  "فيديو حل الواجب"}
                              </h3>

                              <p>
                                {!unlocked
                                  ? "المحاضرة مقفولة"
                                  : isFirstSecondLesson &&
                                      !isFirstLecture1ExamCompleted
                                    ? "سلّم الامتحان أولًا"
                                    : isSecondSecondLesson &&
                                        !isSecondLecture1ExamCompleted
                                      ? "سلّم الامتحان أولًا"
                                      : isThirdSecondLesson &&
                                          !isThirdLecture1ExamCompleted
                                        ? "سلّم الامتحان أولًا"
                                        : isThirdThirdLesson &&
                                            !isThirdLecture2ExamCompleted
                                          ? "سلّم الامتحان أولًا"
                                          : isThirdFourthLesson &&
                                              !isThirdLecture3ExamCompleted
                                            ? "سلّم الامتحان أولًا"
                                            : !homeworkSubmitted
                                              ? "سلّم الواجب أولًا لفتح فيديو الحل"
                                              : "اضغط لمشاهدة فيديو حل الواجب"}
                              </p>
                            </div>
                          </button>
                        )}

                        {/* =====================================
                            الامتحان الأول العادي
                        ===================================== */}

                        {hasExam1 &&
                          !hideExam1InSourceLesson &&
                          !isFirstSixthLesson &&
                          !isSecondFifthLesson &&
                          !isSecondSixthLesson &&
                          !showFirstSecondaryExamBeforeFourthLesson && (
                            <button
                              type="button"
                              className={`course-content-card exam-card ${
                                unlocked &&
                                watched
                                  ? "available"
                                  : "locked"
                              }`}
                              disabled={
                                !unlocked ||
                                !watched
                              }
                              onClick={() =>
                                onOpenExam?.(
                                  lesson,
                                  lesson.exam1Key ||
                                    "exam1"
                                )
                              }
                            >
                              <div className="course-content-card-icon">
                                {unlocked &&
                                watched ? (
                                  <FaClipboardCheck />
                                ) : (
                                  <FaLock />
                                )}
                              </div>

                              <div className="course-content-card-info">
                                <h3>
                                  {lesson.exam1Title ||
                                    "الامتحان الأول"}
                                </h3>

                                <p>
                                  {!unlocked
                                    ? "فعّل المحاضرة أولًا"
                                    : watched
                                      ? "اضغط لفتح الامتحان"
                                      : "شاهد 30% من الفيديو أولًا"}
                                </p>
                              </div>
                            </button>
                          )}

                        {/* =========================
                            الامتحان الثاني القديم
                        ========================= */}

                        {hasExam2 && !isFirstSixthLesson && !isSecondFifthLesson && !isSecondSixthLesson && (
                          <button
                            type="button"
                            className={`course-content-card exam-card ${
                              unlocked &&
                              watched
                                ? "available"
                                : "locked"
                            }`}
                            disabled={
                              !unlocked ||
                              !watched
                            }
                            onClick={() =>
                              onOpenExam?.(
                                lesson,
                                lesson.exam2Key ||
                                  "exam2"
                              )
                            }
                          >
                            <div className="course-content-card-icon">
                              {unlocked &&
                              watched ? (
                                <FaClipboardCheck />
                              ) : (
                                <FaLock />
                              )}
                            </div>

                            <div className="course-content-card-info">
                              <h3>
                                {lesson.exam2Title ||
                                  "الامتحان الثاني"}
                              </h3>

                              <p>
                                {!unlocked
                                  ? "فعّل المحاضرة أولًا"
                                  : watched
                                    ? "ابدأ الامتحان الثاني"
                                    : "شاهد 30% من الفيديو أولًا"}
                              </p>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* =========================
                          لا يوجد محتوى
                      ========================= */}

                      {!hasVideo &&
                        !hasPdf &&
                        !hasHomework &&
                        !hasDirectHomeworkVideo &&
                        !hasHomeworkSolution &&
                        !hasExam1 &&
                        (!hasExam2 || isFirstSixthLesson) &&
                        !showFirstSecondaryExamBeforeSecondLesson &&
                        !showSecondSecondaryExamBeforeSecondLesson &&
                        !showSecondSecondaryExamBeforeThirdLesson &&
                        !showFirstExamBeforeSecondLesson &&
                        !showSecondExamBeforeThirdLesson &&
                        !showThirdExamBeforeFourthLesson &&
                        !showFourthExamBeforeFifthLesson &&
                        !showFirstSecondaryExamBeforeThirdLesson &&
                        !showSecondSecondaryExamBeforeFourthLesson &&
                        !showThirdExamBeforeSixthLesson && (
                          <div
                            style={{
                              padding:
                                "20px",

                              borderRadius:
                                "14px",

                              background:
                                "#f7f1e8",

                              textAlign:
                                "center",

                              color:
                                "#6f4930",

                              fontWeight:
                                "bold",
                            }}
                          >
                            لم يتم إضافة
                            محتوى لهذه
                            المحاضرة حتى
                            الآن.
                          </div>
                        )}
                    </div>
                  )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

    </section>
  );
}

export default CourseContent;