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
    جديد:
    هل امتحان المحاضرة الأولى
    في تالتة ثانوي تم تسليمه؟
  */
  isThirdLecture1ExamCompleted = false,

  lessonActivationCodes,
  onLessonCodeChange,
  onActivateLessonCode,
  activatingLessonId,

  onOpenVideo,
  onOpenPdf,
  onOpenExam,
  onOpenHomework,
  onOpenHomeworkSolution,
}) {
  const [openedLessons, setOpenedLessons] =
    useState({});

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

  const lessons = Array.isArray(
    course.lessons
  )
    ? course.lessons
    : [];

  /*
    =====================================
    كورسات تالتة ثانوي الجديدة
    =====================================
  */
  const isThirdSecondaryCourse =
    course.id ===
      "third-month-course" ||
    course.id ===
      "third-term-course";

  /*
    المحاضرة الأولى
    نستخدم امتحانها داخل المحاضرة الثانية
  */
  const firstLesson =
    lessons[0] || null;

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

                بالنسبة للمحاضرة الثانية:
                ممكن تبقى متفعلة بالكود
                حتى لو الامتحان لسه متسلمش.
              */
              const unlocked =
                typeof isLessonUnlocked ===
                "function"
                  ? isLessonUnlocked(
                      lesson
                    )
                  : true;

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
                هل دي المحاضرة الثانية لتالتة؟
                =====================================
              */
              const isThirdSecondLesson =
                isThirdSecondaryCourse &&
                lessonIndex === 1;

              /*
                =====================================
                فتح الفيديو

                المحاضرات العادية:
                نفس النظام القديم.

                المحاضرة الثانية لتالتة:
                لازم:
                1- المحاضرة تكون متفعلة
                2- الامتحان الأول يكون متسلم

                يعني الكود لوحده
                لا يفتح الفيديو.
                =====================================
              */
              const canOpenVideo =
                unlocked &&
                (
                  !isThirdSecondLesson ||
                  isThirdLecture1ExamCompleted
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
                نخفي امتحان المحاضرة الأولى
                من المحاضرة الأولى
                في تالتة ثانوي
                =====================================
              */
              const hideExam1InFirstLesson =
                isThirdSecondaryCourse &&
                lessonIndex === 0;

              /*
                =====================================
                نعرض امتحان المحاضرة الأولى
                داخل المحاضرة الثانية
                قبل الفيديو
                =====================================
              */
              const showFirstExamBeforeSecondLesson =
                isThirdSecondaryCourse &&
                lessonIndex === 1 &&
                firstLesson &&
                (
                  firstLesson.exam1 ===
                    true ||
                  hasValue(
                    firstLesson.exam1Key
                  )
                );

              return (
                <div
                  key={lessonId}
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
                            ? isThirdSecondLesson
                              ? "فعّل المحاضرة بالكود لفتح الامتحان"
                              : "اضغط لعرض تفاصيل المحاضرة"
                            : isThirdSecondLesson &&
                                !isThirdLecture1ExamCompleted
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
                          امتحان المحاضرة الأولى

                          داخل المحاضرة الثانية.

                          بمجرد تفعيل المحاضرة بالكود:
                          الامتحان يفتح.

                          لا يحتاج مشاهدة 30%.

                          بعد تسليمه:
                          الفيديو يفتح.
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
                                    : isThirdSecondLesson &&
                                        !isThirdLecture1ExamCompleted
                                      ? "سلّم امتحان المحاضرة الأولى أولًا لفتح الفيديو"
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

                              يظهر طالما المحاضرة مقفولة
                          ===================================== */}

                          {!unlocked && (
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
                            الواجب

                            يظل كما هو:
                            بعد مشاهدة 30% من الفيديو
                        ===================================== */}

                        {hasHomework && (
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
                                  : isThirdSecondLesson &&
                                      !isThirdLecture1ExamCompleted
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

                            يظل كما هو:
                            بعد تسليم الواجب فقط
                        ===================================== */}

                        {hasHomeworkSolution && (
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
                                  : isThirdSecondLesson &&
                                      !isThirdLecture1ExamCompleted
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

                            تالتة الجديدة:
                            مش بيظهر تحت المحاضرة الأولى
                        ===================================== */}

                        {hasExam1 &&
                          !hideExam1InFirstLesson && (
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

                        {hasExam2 && (
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
                        !hasHomeworkSolution &&
                        !hasExam1 &&
                        !hasExam2 &&
                        !showFirstExamBeforeSecondLesson && (
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
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

export default CourseContent;