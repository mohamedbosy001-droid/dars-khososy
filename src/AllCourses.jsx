import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import YouTube from "react-youtube";

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaBookOpen,
  FaGraduationCap,
  FaPlay,
  FaFilePdf,
  FaWhatsapp,
  FaLock,
} from "react-icons/fa";

import CourseContent from "./CourseContent";
import Exam from "./Exam";
import examsData from "./examData";

import secondFreeCourse from "./assets/second-free-course.jpeg";
import secondCourse2 from "./assets/second-course-2.jpeg";
import thirdFreeCourse from "./assets/third-free-course.jpeg";
import thirdCourse2 from "./assets/third-course-2.jpeg";

import "./AllCourses.css";

function AllCourses({ currentStudent }) {
  const platformWhatsAppNumber = "201114497910";

  const [courses, setCourses] = useState([]);

  const [studentData, setStudentData] =
    useState(currentStudent || null);

  const [selectedCourse, setSelectedCourse] =
    useState(null);

  const [selectedExam, setSelectedExam] =
    useState(null);

  const [activeLesson, setActiveLesson] =
    useState(null);

  const [youtubePlayer, setYoutubePlayer] =
    useState(null);

  const [videoIsPlaying, setVideoIsPlaying] =
    useState(false);

  const [watchPercent, setWatchPercent] =
    useState(0);

  const [isSavingWatch, setIsSavingWatch] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [coursesError, setCoursesError] =
    useState("");

  const savingWatchRef = useRef(new Set());

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const studentGrade =
    studentData?.grade ||
    currentStudent?.grade ||
    "";

  /*
    تحميل الكورسات من Firebase
  */
  useEffect(() => {
    setIsLoading(true);
    setCoursesError("");

    const coursesReference =
      collection(db, "courses");

    const unsubscribe = onSnapshot(
      coursesReference,
      (snapshot) => {
        const loadedCourses =
          snapshot.docs.map(
            (courseDocument) => {
              const courseData =
                courseDocument.data();

              const savedLessons =
                Array.isArray(
                  courseData.lessons
                )
                  ? courseData.lessons
                  : [];

              const normalizedLessons =
                savedLessons.length > 0
                  ? savedLessons.map(
                      (lesson, index) => ({
                        ...lesson,

                        id:
                          lesson.id ||
                          `lesson-${index + 1}`,

                        title:
                          lesson.title ||
                          `المحاضرة ${
                            index + 1
                          }`,

                        description:
                          lesson.description ||
                          "شرح المحاضرة والتدريبات الخاصة بها.",

                        youtubeUrl:
                          lesson.youtubeUrl ||
                          lesson.videoUrl ||
                          "",

                        pdfUrl:
                          lesson.pdfUrl ||
                          "/files/تعليم الإعراب.pdf",

                        duration:
                          courseDocument.id ===
                          "second-course-2"
                            ? "1:38:59"
                            : lesson.duration ||
                              "1:59:48",
                      })
                    )
                  : [
                      {
                        id: "lesson-1",

                        title:
                          "المحاضرة الأولى",

                        description:
                          courseData.lessonDescription ||
                          "شرح فيديو المراجعة وأفكاره.",

                        youtubeUrl:
                          courseData.youtubeUrl ||
                          courseData.videoUrl ||
                          "",

                        pdfUrl:
                          courseData.pdfUrl ||
                          "/files/تعليم الإعراب.pdf",

                        duration:
                          courseDocument.id ===
                          "second-course-2"
                            ? "1:38:59"
                            : "1:59:48",
                      },
                    ];

              return {
                id: courseDocument.id,
                ...courseData,
                lessons: normalizedLessons,
              };
            }
          );

        setCourses(loadedCourses);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading courses:",
          error
        );

        setCoursesError(
          "تعذر تحميل الكورسات حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
    متابعة بيانات الطالب مباشرة
  */
  useEffect(() => {
    if (!studentUid) {
      setStudentData(
        currentStudent || null
      );

      return undefined;
    }

    const studentReference = doc(
      db,
      "students",
      studentUid
    );

    const unsubscribe = onSnapshot(
      studentReference,
      (studentSnapshot) => {
        if (studentSnapshot.exists()) {
          setStudentData({
            uid: studentSnapshot.id,
            ...studentSnapshot.data(),
          });
        }
      },
      (error) => {
        console.error(
          "Error loading student:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [studentUid, currentStudent]);

  /*
    الكورس المخفي يظهر على localhost فقط
  */
  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      const belongsToStudentGrade =
        course.grade === studentGrade;

      const isLocalPreview =
        window.location.hostname ===
          "localhost" ||
        window.location.hostname ===
          "127.0.0.1";

      const isAvailableOnline =
        course.active !== false &&
        course.isPublished !== false &&
        course.status !== "hidden";

      return (
        belongsToStudentGrade &&
        (isLocalPreview ||
          isAvailableOnline)
      );
    });
  }, [courses, studentGrade]);

  function getDisplayedPrice(price) {
    const numericPrice = Number(price);

    if (
      price === "" ||
      price === null ||
      price === undefined ||
      Number.isNaN(numericPrice)
    ) {
      return "السعر غير محدد";
    }

    if (numericPrice === 0) {
      return "0 جنيه — مجاني";
    }

    return `${numericPrice} جنيه`;
  }

  /*
    فتح واتساب للاشتراك
  */
  function openCourseSubscription(course) {
    const studentName =
      studentData?.fullName ||
      currentStudent?.fullName ||
      "طالب";

    const studentPhone =
      studentData?.studentPhone ||
      currentStudent?.studentPhone ||
      "";

    const courseName =
      course?.title ||
      "الكورس";

    const message = encodeURIComponent(
      `السلام عليكم، أنا الطالب ${studentName}
رقم الهاتف: ${studentPhone}
وأرغب في الاشتراك في كورس: ${courseName}`
    );

    window.open(
      `https://wa.me/${platformWhatsAppNumber}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    تحديد صورة كل كورس
  */
  function getCourseImage(course) {
    if (
      course.id === "second-course-2"
    ) {
      return secondCourse2;
    }

    if (
      course.id === "third-course-2"
    ) {
      return thirdCourse2;
    }

    if (
      course.id ===
      "free-second-course"
    ) {
      return secondFreeCourse;
    }

    if (
      course.id ===
      "free-third-course"
    ) {
      return thirdFreeCourse;
    }

    if (
      course.image &&
      course.image !== "default" &&
      course.image.startsWith("http")
    ) {
      return course.image;
    }

    return secondFreeCourse;
  }

  function getLessonProgress(
    courseId,
    lessonId
  ) {
    return (
      studentData?.courseProgress?.[
        courseId
      ]?.lessons?.[lessonId] || {}
    );
  }

  function isLessonWatched(
    courseId,
    lessonId
  ) {
    return (
      getLessonProgress(
        courseId,
        lessonId
      ).videoWatched === true
    );
  }

  /*
    فتح صفحة محتوى الكورس
  */
  function openCourseContent(course) {
    setSelectedCourse(course);
    setSelectedExam(null);

    window.scrollTo(0, 0);
  }

  /*
    الرجوع إلى جميع الكورسات
  */
  function closeCourseContent() {
    setSelectedCourse(null);
    setSelectedExam(null);
    setActiveLesson(null);
    setYoutubePlayer(null);
    setVideoIsPlaying(false);
    setWatchPercent(0);

    window.scrollTo(0, 0);
  }

  function extractYouTubeVideoId(url) {
    if (!url) {
      return "";
    }

    try {
      const parsedUrl = new URL(url);

      if (
        parsedUrl.hostname.includes(
          "youtu.be"
        )
      ) {
        return parsedUrl.pathname
          .replace("/", "")
          .split("?")[0];
      }

      if (
        parsedUrl.hostname.includes(
          "youtube.com"
        )
      ) {
        if (
          parsedUrl.pathname.includes(
            "/embed/"
          )
        ) {
          return parsedUrl.pathname
            .split("/embed/")[1]
            .split("/")[0];
        }

        if (
          parsedUrl.pathname.includes(
            "/shorts/"
          )
        ) {
          return parsedUrl.pathname
            .split("/shorts/")[1]
            .split("/")[0];
        }

        return (
          parsedUrl.searchParams.get(
            "v"
          ) || ""
        );
      }
    } catch {
      return "";
    }

    return "";
  }

  /*
    فتح الفيديو داخل المنصة
  */
  function openLesson(course, lesson) {
    if (!course || !lesson) {
      window.alert(
        "تعذر فتح المحاضرة."
      );

      return;
    }

    setActiveLesson({
      course,
      lesson,
    });

    setYoutubePlayer(null);
    setVideoIsPlaying(false);

    setWatchPercent(
      isLessonWatched(
        course.id,
        lesson.id
      )
        ? 30
        : 0
    );
  }

  function closeLesson() {
    setActiveLesson(null);
    setYoutubePlayer(null);
    setVideoIsPlaying(false);
    setWatchPercent(0);
  }

  /*
    حفظ مشاهدة 30% في Firebase
  */
  async function saveWatchCompletion(
    course,
    lesson,
    currentSeconds,
    durationSeconds
  ) {
    const lessonKey =
      `${course.id}-${lesson.id}`;

    if (
      !studentUid ||
      savingWatchRef.current.has(
        lessonKey
      ) ||
      isLessonWatched(
        course.id,
        lesson.id
      )
    ) {
      return;
    }

    savingWatchRef.current.add(
      lessonKey
    );

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

          if (
            !studentSnapshot.exists()
          ) {
            throw new Error(
              "Student not found."
            );
          }

          const savedStudent =
            studentSnapshot.data();

          const now = Timestamp.now();

          const courseProgress = {
            ...(savedStudent.courseProgress ||
              {}),
          };

          const savedCourseProgress = {
            ...(courseProgress[
              course.id
            ] || {}),
          };

          const savedLessons = {
            ...(savedCourseProgress.lessons ||
              {}),
          };

          const oldLessonProgress = {
            ...(savedLessons[lesson.id] ||
              {}),
          };

          const wasAlreadyWatched =
            oldLessonProgress.videoWatched ===
            true;

          savedLessons[lesson.id] = {
            ...oldLessonProgress,

            lessonId: lesson.id,
            lessonTitle:
              lesson.title,

            videoWatched: true,
            watchedPercent: 30,

            watchedSeconds:
              Math.floor(
                currentSeconds
              ),

            videoDurationSeconds:
              Math.floor(
                durationSeconds
              ),

            examUnlocked: true,

            firstWatchedAt:
              oldLessonProgress
                .firstWatchedAt || now,

            lastWatchedAt: now,
          };

          courseProgress[course.id] = {
            ...savedCourseProgress,

            courseId: course.id,
            courseTitle:
              course.title,

            lessons: savedLessons,
            updatedAt: now,
          };

          const watchHistory =
            Array.isArray(
              savedStudent.watchHistory
            )
              ? [
                  ...savedStudent
                    .watchHistory,
                ]
              : [];

          const historyIndex =
            watchHistory.findIndex(
              (historyItem) =>
                historyItem?.courseId ===
                  course.id &&
                historyItem?.lessonId ===
                  lesson.id
            );

          const historyItem = {
            id:
              `${course.id}-${lesson.id}`,

            courseId: course.id,
            courseName:
              course.title,

            lessonId: lesson.id,
            lessonName:
              lesson.title,

            watchedPercent: 30,

            watchedSeconds:
              Math.floor(
                currentSeconds
              ),

            videoDurationSeconds:
              Math.floor(
                durationSeconds
              ),

            videoWatched: true,
            lastWatch: now,
          };

          if (
            historyIndex >= 0
          ) {
            watchHistory[
              historyIndex
            ] = {
              ...watchHistory[
                historyIndex
              ],

              ...historyItem,
            };
          } else {
            watchHistory.push({
              ...historyItem,
              firstWatch: now,
              watchCount: 1,
            });
          }

          transaction.update(
            studentReference,
            {
              courseProgress,
              watchHistory,

              watchedVideos:
                wasAlreadyWatched
                  ? Number(
                      savedStudent.watchedVideos ||
                        0
                    )
                  : Number(
                      savedStudent.watchedVideos ||
                        0
                    ) + 1,

              updatedAt: now,
            }
          );
        }
      );

      setWatchPercent(30);
    } catch (error) {
      console.error(
        "Error saving video watch:",
        error
      );

      savingWatchRef.current.delete(
        lessonKey
      );

      window.alert(
        "حدث خطأ أثناء تسجيل المشاهدة."
      );
    } finally {
      setIsSavingWatch(false);
    }
  }

  /*
    متابعة نسبة مشاهدة فيديو YouTube
  */
  useEffect(() => {
    if (
      !youtubePlayer ||
      !activeLesson ||
      !videoIsPlaying
    ) {
      return undefined;
    }

    const intervalId =
      window.setInterval(
        async () => {
          try {
            const currentSeconds =
              await youtubePlayer.getCurrentTime();

            const durationSeconds =
              await youtubePlayer.getDuration();

            if (
              !durationSeconds ||
              !Number.isFinite(
                durationSeconds
              )
            ) {
              return;
            }

            const calculatedPercent =
              (currentSeconds /
                durationSeconds) *
              100;

            setWatchPercent(
              Math.min(
                Math.round(
                  calculatedPercent
                ),
                100
              )
            );

            if (
              calculatedPercent >= 30
            ) {
              await saveWatchCompletion(
                activeLesson.course,
                activeLesson.lesson,
                currentSeconds,
                durationSeconds
              );
            }
          } catch (error) {
            console.error(
              "YouTube progress error:",
              error
            );
          }
        },
        1000
      );

    return () =>
      window.clearInterval(
        intervalId
      );
  }, [
    youtubePlayer,
    activeLesson,
    videoIsPlaying,
  ]);

  /*
    فتح ملف PDF
  */
  function openPdf(lesson) {
    if (!lesson) {
      return;
    }

    window.open(
      lesson.pdfUrl ||
        "/files/تعليم الإعراب.pdf",
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    فتح الامتحان الأول أو الثاني
  */
  function openExam(
    course,
    lesson,
    examKey
  ) {
    if (
      !course ||
      !lesson ||
      !examKey
    ) {
      return;
    }

    if (
      !isLessonWatched(
        course.id,
        lesson.id
      )
    ) {
      window.alert(
        "الامتحان غير متاح حاليًا."
      );

      return;
    }

    const selectedExamData =
      examsData[examKey];

    if (!selectedExamData) {
      window.alert(
        "تعذر تحميل بيانات الامتحان."
      );

      return;
    }

    setSelectedExam(
      selectedExamData
    );

    setActiveLesson(null);
    setYoutubePlayer(null);
    setVideoIsPlaying(false);

    window.scrollTo(0, 0);
  }

  /*
    الرجوع من الامتحان إلى محتوى الكورس
  */
  function closeExam() {
    setSelectedExam(null);
    window.scrollTo(0, 0);
  }

  /*
    نافذة تشغيل الفيديو
  */
  function renderVideoModal() {
    if (!activeLesson) {
      return null;
    }

    const videoId =
      extractYouTubeVideoId(
        activeLesson.lesson
          .youtubeUrl
      );

    const lessonWatched =
      isLessonWatched(
        activeLesson.course.id,
        activeLesson.lesson.id
      );

    return (
      <div className="course-lesson-overlay">
        <div className="course-lesson-modal">
          <button
            type="button"
            className="course-lesson-close"
            onClick={closeLesson}
            aria-label="إغلاق الفيديو"
          >
            ×
          </button>

          <h2>
            {
              activeLesson.lesson
                .title
            }
          </h2>

          <p className="course-lesson-duration">
            مدة الفيديو:{" "}
            {activeLesson.lesson
              .duration ||
              "1:59:48"}
          </p>

          <div className="course-youtube-wrapper">
            {videoId ? (
              <YouTube
                videoId={videoId}
                opts={{
                  width: "100%",
                  height: "100%",

                  playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                  },
                }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                iframeClassName="youtube-course-player"
                onReady={(event) => {
                  setYoutubePlayer(
                    event.target
                  );
                }}
                onStateChange={(event) => {
                  setVideoIsPlaying(
                    event.data === 1
                  );
                }}
              />
            ) : (
              <div
                style={{
                  minHeight: "350px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                لم تتم إضافة رابط فيديو صحيح.
              </div>
            )}
          </div>

          <div className="course-watch-progress">
            <div className="course-watch-progress-heading">
              <span>
                نسبة المشاهدة
              </span>

              <strong>
                {lessonWatched
                  ? "تم تسجيل المشاهدة"
                  : `${watchPercent}%`}
              </strong>
            </div>

            <div className="course-watch-progress-bar">
              <div
                className="course-watch-progress-fill"
                style={{
                  width: `${Math.min(
                    lessonWatched
                      ? 30
                      : watchPercent,
                    100
                  )}%`,
                }}
              />
            </div>

            <p className="course-watch-message">
              {isSavingWatch
                ? "جاري تسجيل المشاهدة..."
                : lessonWatched
                  ? "✅ تم فتح الامتحانين."
                  : "يتم فتح الامتحانين بعد مشاهدة 30% من الفيديو."}
            </p>
          </div>

          <div className="course-lesson-resources">
            <button
              type="button"
              className="course-pdf-btn"
              onClick={() =>
                openPdf(
                  activeLesson.lesson
                )
              }
            >
              <FaFilePdf />
              ملف المحاضرة PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
    صفحة الامتحان
  */
  if (selectedExam) {
    return (
      <Exam
        exam={selectedExam}
        currentStudent={
          studentData ||
          currentStudent
        }
        onBack={closeExam}
      />
    );
  }

  /*
    صفحة محتوى الكورس
  */
  if (selectedCourse) {
    const firstLesson =
      selectedCourse.lessons?.[0];

    return (
      <>
        <CourseContent
          course={selectedCourse}
          lesson={firstLesson}
          watched={
            firstLesson
              ? isLessonWatched(
                  selectedCourse.id,
                  firstLesson.id
                )
              : false
          }
          onBack={
            closeCourseContent
          }
          onOpenVideo={() =>
            openLesson(
              selectedCourse,
              firstLesson
            )
          }
          onOpenPdf={() =>
            openPdf(firstLesson)
          }
          onOpenExam={(examKey) => {
            let finalExamKey =
              examKey;

            if (
              selectedCourse.id === "second-course-2" ||
              selectedCourse.id === "third-course-2"
            ) {
              if (
                examKey === "exam1"
              ) {
                finalExamKey =
                  "secondCourse2Exam1";
              }

              if (
                examKey === "exam2"
              ) {
                finalExamKey =
                  "secondCourse2Exam2";
              }
            }

            openExam(
              selectedCourse,
              firstLesson,
              finalExamKey
            );
          }}
        />

        {renderVideoModal()}
      </>
    );
  }

  /*
    صفحة جميع الكورسات
  */
  return (
    <>
      <section className="all-courses-page">
        <div className="all-courses-title">
          <FaBookOpen />

          <div>
            <h1>
              جميع الكورسات
            </h1>

            <p>
              الكورسات المتاحة لطلاب{" "}
              {studentGrade ||
                "المرحلة الثانوية"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="all-courses-empty">
            <div className="all-courses-empty-icon">
              <FaGraduationCap />
            </div>

            <h2>
              جاري تحميل الكورسات...
            </h2>
          </div>
        ) : coursesError ? (
          <div className="all-courses-empty">
            <h2>حدث خطأ</h2>
            <p>{coursesError}</p>
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="all-courses-empty">
            <div className="all-courses-empty-icon">
              <FaGraduationCap />
            </div>

            <h2>
              مفيش كورسات متاحة حاليًا
            </h2>
          </div>
        ) : (
          <div className="courses-shop-grid">
            {visibleCourses.map(
              (course) => {
                const firstLesson =
                  course.lessons?.[0];

                const isPaidCourse =
                  Number(course.price) > 0;

                return (
                  <article
                    className="course-shop-card"
                    key={course.id}
                  >
                    <div className="course-shop-main">
                      <div className="course-shop-image-wrapper">
                        <img
                          src={getCourseImage(
                            course
                          )}
                          alt={
                            course.title ||
                            "صورة الكورس"
                          }
                          className="course-shop-image"
                        />

                        <span
                          style={{
                            position:
                              "absolute",

                            top: "14px",
                            right: "14px",

                            padding:
                              "8px 14px",

                            borderRadius:
                              "30px",

                            background:
                              isPaidCourse
                                ? "#31271f"
                                : "#168d55",

                            color: "#fff",

                            fontWeight:
                              "bold",
                          }}
                        >
                          {isPaidCourse
                            ? "اشتراك"
                            : "مجاني"}
                        </span>
                      </div>

                      <div className="course-shop-content">
                        <span className="course-shop-grade">
                          {course.grade ||
                            studentGrade}
                        </span>

                        <h2>
                          {course.title ||
                            "كورس اللغة العربية"}
                        </h2>

                        <p>
                          {course.description ||
                            "شرح منظم وتدريبات واختبارات."}
                        </p>

                        <div className="course-shop-footer">
                          <strong>
                            {getDisplayedPrice(
                              course.price
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="course-card-actions">
                      {isPaidCourse ? (
                        <>
                          <button
                            type="button"
                            className="course-content-btn"
                            disabled
                          >
                            <FaLock />
                            محتوى الكورس مقفول
                          </button>

                          <button
                            type="button"
                            className="course-start-btn"
                            onClick={() =>
                              openCourseSubscription(
                                course
                              )
                            }
                          >
                            <FaWhatsapp />
                            اشترك الآن
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="course-content-btn"
                            onClick={() =>
                              openCourseContent(
                                course
                              )
                            }
                          >
                            <FaBookOpen />
                            محتوى الكورس
                          </button>

                          <button
                            type="button"
                            className="course-start-btn"
                            disabled={
                              !firstLesson
                            }
                            onClick={() =>
                              openLesson(
                                course,
                                firstLesson
                              )
                            }
                          >
                            <FaPlay />
                            ابدأ
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {renderVideoModal()}
    </>
  );
}

export default AllCourses;