import {
  FaArrowRight,
  FaBookOpen,
  FaPlay,
  FaClock,
  FaFilePdf,
  FaClipboardCheck,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";

import "./CourseContent.css";

function CourseContent({
  course,
  lesson,
  watched,
  onBack,
  onOpenVideo,
  onOpenPdf,
  onOpenExam,
}) {
  if (!course || !lesson) {
    return (
      <section className="course-content-page">
        <div className="course-content-empty">
          <h2>تعذر تحميل محتوى الكورس</h2>

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

  const isBalaghaCourse =
    course.id === "second-course-2" ||
    course.id === "third-course-2";

  const displayedDuration =
    isBalaghaCourse
      ? "1:38:59"
      : lesson.duration || "1:59:48";

  let pdfText =
    "اضغط لفتح ملف تعليم الإعراب PDF";

  if (course.id === "second-course-2") {
    pdfText =
      "اضغط لفتح ملف البلاغة PDF";
  }

  if (course.id === "third-course-2") {
    pdfText =
      "اضغط لفتح ملف البلاغة تالتة ثانوي PDF";
  }

  return (
    <section className="course-content-page">
      <button
        type="button"
        className="course-content-back-btn"
        onClick={onBack}
      >
        <FaArrowRight />
        الرجوع إلى جميع الكورسات
      </button>

      <div className="course-content-header">
        <FaBookOpen />

        <div>
          <span>
            {course.grade ||
              "الثاني الثانوي"}
          </span>

          <h1>
            {course.title ||
              "كورس اللغة العربية"}
          </h1>

          <p>
            {course.description ||
              "شرح المحاضرة والملف والامتحان."}
          </p>
        </div>
      </div>

      <div className="course-content-section-title">
        <h2>المحاضرة الأولى</h2>

        <p>
          شاهد الفيديو، ثم افتح الملف
          والامتحان.
        </p>
      </div>

      <div className="course-content-items">

        {/* الفيديو */}
        <button
          type="button"
          className="course-content-card video-card"
          onClick={onOpenVideo}
        >
          <div className="course-content-card-icon">
            <FaPlay />
          </div>

          <div className="course-content-card-info">
            <h3>المحاضرة الأولى</h3>

            <p>شرح الفيديو وأفكاره</p>

            <span>
              <FaClock />
              مدة الفيديو:{" "}
              {displayedDuration}
            </span>
          </div>

          {watched && (
            <FaCheckCircle className="course-content-completed-icon" />
          )}
        </button>

        {/* ملف PDF */}
        <button
          type="button"
          className="course-content-card pdf-card"
          onClick={onOpenPdf}
        >
          <div className="course-content-card-icon">
            <FaFilePdf />
          </div>

          <div className="course-content-card-info">
            <h3>
              ملف المحاضرة الأولى
            </h3>

            <p>{pdfText}</p>
          </div>
        </button>

        {/* الامتحان الأول */}
        <button
          type="button"
          className={`course-content-card exam-card ${
            watched
              ? "available"
              : "locked"
          }`}
          disabled={!watched}
          onClick={() =>
            onOpenExam("exam1")
          }
        >
          <div className="course-content-card-icon">
            {watched ? (
              <FaClipboardCheck />
            ) : (
              <FaLock />
            )}
          </div>

          <div className="course-content-card-info">
            <h3>الامتحان الأول</h3>

            <p>
              {watched
                ? "ابدأ الامتحان الأول"
                : "شاهد الفيديو أولًا"}
            </p>
          </div>
        </button>

        {/* الامتحان الثاني */}
        <button
          type="button"
          className={`course-content-card exam-card ${
            watched
              ? "available"
              : "locked"
          }`}
          disabled={!watched}
          onClick={() =>
            onOpenExam("exam2")
          }
        >
          <div className="course-content-card-icon">
            {watched ? (
              <FaClipboardCheck />
            ) : (
              <FaLock />
            )}
          </div>

          <div className="course-content-card-info">
            <h3>الامتحان الثاني</h3>

            <p>
              {watched
                ? "ابدأ الامتحان الثاني"
                : "شاهد الفيديو أولًا"}
            </p>
          </div>
        </button>

      </div>
    </section>
  );
}

export default CourseContent;