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
  FaArrowRight,
  FaClipboardCheck,
  FaCheckCircle,
} from "react-icons/fa";

import CourseContent from "./CourseContent";

import Exam from "./Exam";

import examsData from "./examData";

import homeworkData from "./homeworkData";

/* الصور القديمة */

import secondFreeCourse from "./assets/second-free-course.jpeg";

import secondCourse2 from "./assets/second-course-2.jpeg";

import thirdFreeCourse from "./assets/third-free-course.jpeg";

import thirdCourse2 from "./assets/third-course-2.jpeg";

/* صورة المحاضرة التمهيدية المجانية الجديدة */

import secondTmhede from "./assets/second-tmhede.jpeg";

/* صور الكورسات المدفوعة */

import firstMonthCourse from "./assets/first-month.jpeg";

import firstTermCourse from "./assets/first-term.jpeg";

import secondMonthCourse from "./assets/second-month.jpeg";

import secondTermCourse from "./assets/second-term.jpeg";

import thirdMonthCourse from "./assets/third-month.jpeg";

import thirdTermCourse from "./assets/third-term.jpeg";

import "./AllCourses.css";

const REQUIRED_WATCH_PERCENT = 30;

/*
  الكورسات المجانية القديمة تظل موجودة في الكود/Firestore
  ولكن لا تظهر للطلاب على المنصة.
*/
const HIDDEN_LEGACY_FREE_COURSE_IDS = new Set([
  "free-second-course",
  "second-course-2",
  "free-third-course",
  "third-course-2",
]);

/*
  الكورس المجاني الجديد للصف الثاني الثانوي.
  لا يحتاج كود تفعيل لأن السعر = 0.
*/
const SECOND_FREE_INTRO_COURSE = {
  id: "second-free-intro-course",
  title: "المحاضرة التمهيدية",
  grade: "الصف الثاني الثانوي",
  description:
    "المحاضرة التمهيدية في اللغة العربية للصف الثاني الثانوي.",
  price: 0,
  isFree: true,
  active: true,
  isPublished: true,
  status: "active",
  lessons: [
    {
      id: "lesson-1",
      title: "المحاضرة التمهيدية",
      description:
        "شاهد المحاضرة، وبعد مشاهدة 30% من الفيديو سيفتح الامتحان.",
      youtubeUrl:
        "https://www.youtube.com/watch?v=34F77pri94c",
      videoUrl:
        "https://www.youtube.com/watch?v=34F77pri94c",
      videoTitle: "فيديو المحاضرة التمهيدية",
      exam1: true,
      exam1Key: "secondFreeIntroExam",
      exam1Title: "امتحان المحاضرة التمهيدية",
    },
  ],
};

function AllCourses({
  currentStudent,
  targetCourseId = "",
}) {
  const platformWhatsAppNumber =
    "201114497910";

  const [courses, setCourses] =
    useState([]);

  const [
    studentData,
    setStudentData,
  ] = useState(
    currentStudent || null
  );

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState(null);

  const [
    selectedExam,
    setSelectedExam,
  ] = useState(null);

  /*
    ============================
    الواجب
    ============================
  */

  const [
    selectedHomework,
    setSelectedHomework,
  ] = useState(null);

  const [
    selectedHomeworkLesson,
    setSelectedHomeworkLesson,
  ] = useState(null);

  const [
    homeworkAnswers,
    setHomeworkAnswers,
  ] = useState({});

  const [
    homeworkResult,
    setHomeworkResult,
  ] = useState(null);

  const [
    isSubmittingHomework,
    setIsSubmittingHomework,
  ] = useState(false);

  const [
    activeLesson,
    setActiveLesson,
  ] = useState(null);

  const [
    youtubePlayer,
    setYoutubePlayer,
  ] = useState(null);

  const [
    videoIsPlaying,
    setVideoIsPlaying,
  ] = useState(false);

  const [
    watchPercent,
    setWatchPercent,
  ] = useState(0);

  const [
    isSavingWatch,
    setIsSavingWatch,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    coursesError,
    setCoursesError,
  ] = useState("");

  /*
    كود الشهر / الترم
  */

  const [
    activationCodes,
    setActivationCodes,
  ] = useState({});

  const [
    activatingCourseId,
    setActivatingCourseId,
  ] = useState("");

  /*
    أكواد المحاضرات
  */

  const [
    lessonActivationCodes,
    setLessonActivationCodes,
  ] = useState({});

  const [
    activatingLessonId,
    setActivatingLessonId,
  ] = useState("");

  const savingWatchRef =
    useRef(new Set());

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const studentGrade =
    studentData?.grade ||
    currentStudent?.grade ||
    "";

  /*
    ============================
    Helpers
    ============================
  */

  function normalizeGrade(
    grade
  ) {
    if (!grade) {
      return "";
    }

    return String(grade)
      .trim()
      .replace(
        /^الصف\s+/,
        ""
      );
  }

  function normalizeText(
    value
  ) {
    if (!value) {
      return "";
    }

    return String(value)
      .trim()
      .replace(
        /\s+/g,
        " "
      );
  }

  function hasValue(
    value
  ) {
    return (
      typeof value ===
        "string" &&
      value.trim() !== ""
    );
  }

  /*
    ============================
    تحميل الكورسات
    ============================
  */

  useEffect(() => {
    setIsLoading(true);

    setCoursesError("");

    const coursesReference =
      collection(
        db,
        "courses"
      );

    const unsubscribe =
      onSnapshot(
        coursesReference,

        (snapshot) => {
          const loadedCourses =
            snapshot.docs.map(
              (
                courseDocument
              ) => {
                const courseData =
                  courseDocument.data();

                const savedLessons =
                  Array.isArray(
                    courseData.lessons
                  )
                    ? courseData.lessons
                    : [];

                let normalizedLessons =
                  [];

                if (
                  savedLessons.length >
                  0
                ) {
                  normalizedLessons =
                    savedLessons.map(
                      (
                        lesson,
                        index
                      ) => ({
                        ...lesson,

                        id:
                          lesson.id ||
                          `lesson-${
                            index + 1
                          }`,

                        title:
                          lesson.title ||
                          `المحاضرة ${
                            index + 1
                          }`,

                        description:
                          lesson.description ||
                          "",

                        youtubeUrl:
                          lesson.youtubeUrl ||
                          lesson.videoUrl ||
                          "",

                        videoUrl:
                          lesson.videoUrl ||
                          lesson.youtubeUrl ||
                          "",

                        pdfUrl:
                          lesson.pdfUrl ||
                          "",

                        duration:
                          lesson.duration ||
                          "",

                        /*
                          الواجب الجديد
                        */

                        homeworkKey:
                          lesson.homeworkKey ||
                          "",

                        homeworkEnabled:
                          lesson.homeworkEnabled ===
                          true,

                        homeworkTitle:
                          lesson.homeworkTitle ||
                          "واجب المحاضرة",

                        /*
                          دعم القديم
                        */

                        homeworkUrl:
                          lesson.homeworkUrl ||
                          lesson.homeworkPdfUrl ||
                          "",

                        homeworkPdfUrl:
                          lesson.homeworkPdfUrl ||
                          lesson.homeworkUrl ||
                          "",

                        homeworkSolutionUrl:
                          lesson.homeworkSolutionUrl ||
                          lesson.solutionVideoUrl ||
                          "",

                        solutionVideoUrl:
                          lesson.solutionVideoUrl ||
                          lesson.homeworkSolutionUrl ||
                          "",
                      })
                    );
              
                } else {
                  const topVideo =
                    courseData.youtubeUrl ||
                    courseData.videoUrl ||
                    "";

                  const topPdf =
                    courseData.pdfUrl || "";

                  const topHomework =
                    courseData.homeworkUrl ||
                    courseData.homeworkPdfUrl ||
                    "";

                  const topSolution =
                    courseData.homeworkSolutionUrl ||
                    courseData.solutionVideoUrl ||
                    "";

                  const hasOldContent =
                    hasValue(topVideo) ||
                    hasValue(topPdf) ||
                    hasValue(topHomework) ||
                    hasValue(topSolution);

                  if (hasOldContent) {
                    normalizedLessons = [
                      {
                        id: "lesson-1",

                        title:
                          courseData.lessonTitle ||
                          "المحاضرة الأولى",

                        description:
                          courseData.lessonDescription ||
                          "",

                        youtubeUrl: topVideo,

                        videoUrl: topVideo,

                        pdfUrl: topPdf,

                        duration:
                          courseData.duration ||
                          "",

                        homeworkUrl:
                          topHomework,

                        homeworkPdfUrl:
                          topHomework,

                        homeworkSolutionUrl:
                          topSolution,

                        solutionVideoUrl:
                          topSolution,

                        homeworkKey:
                          courseData.homeworkKey ||
                          "",
                      },
                    ];
                  }
                }

                return {
                  id: courseDocument.id,

                  ...courseData,

                  lessons:
                    normalizedLessons,
                };
              }
            );

          setCourses([
            ...loadedCourses.filter(
              (course) =>
                course.id !==
                SECOND_FREE_INTRO_COURSE.id
            ),

            SECOND_FREE_INTRO_COURSE,
          ]);

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
    ============================
    متابعة الطالب
    ============================
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

    const unsubscribe =
      onSnapshot(
        studentReference,

        (studentSnapshot) => {
          if (
            studentSnapshot.exists()
          ) {
            setStudentData({
              uid:
                studentSnapshot.id,

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
  }, [
    studentUid,
    currentStudent,
  ]);

  /*
    ============================
    كورسات السنة فقط
    ============================
  */

  const visibleCourses =
    useMemo(() => {
      return courses.filter(
        (course) => {
          const belongsToStudentGrade =
            normalizeGrade(
              course.grade
            ) ===
            normalizeGrade(
              studentGrade
            );

          const isLocalPreview =
            window.location
              .hostname ===
              "localhost" ||
            window.location
              .hostname ===
              "127.0.0.1";

          const isAvailableOnline =
            course.active !==
              false &&
            course.isPublished !==
              false &&
            course.status !==
              "hidden";

          const isHiddenLegacyFreeCourse =
            HIDDEN_LEGACY_FREE_COURSE_IDS.has(
              course.id
            );

          return (
            !isHiddenLegacyFreeCourse &&
            belongsToStudentGrade &&
            (isLocalPreview ||
              isAvailableOnline)
          );
        }
      );
    }, [
      courses,
      studentGrade,
    ]);

  /*
    ============================
    فتح الكورس من لينك المشاركة
    ============================
  */

  useEffect(() => {
    if (
      !targetCourseId ||
      selectedCourse
    ) {
      return;
    }

    const targetCourse =
      visibleCourses.find(
        (course) =>
          course.id ===
          targetCourseId
      );

    if (targetCourse) {
      setSelectedCourse(
        targetCourse
      );

      window.scrollTo(0, 0);
    }
  }, [
    targetCourseId,
    visibleCourses,
    selectedCourse,
  ]);

  /*
    ============================
    الصلاحيات
    ============================
  */

  function isPaidCourse(
    course
  ) {
    return (
      Number(course?.price) > 0
    );
  }

  function getCourseAccess(
    course
  ) {
    if (!course) {
      return null;
    }

    return (
      studentData
        ?.courseAccess?.[
        course.id
      ] || null
    );
  }

  function hasCourseAccess(
    course
  ) {
    if (!course) {
      return false;
    }

    if (!isPaidCourse(course)) {
      return true;
    }

    return (
      getCourseAccess(
        course
      )?.active === true
    );
  }

  function hasLessonAccess(
    course,
    lesson
  ) {
    if (!course || !lesson) {
      return false;
    }

    if (!isPaidCourse(course)) {
      return true;
    }

    const access =
      getCourseAccess(course);

    if (!access?.active) {
      return false;
    }

    if (
      access.accessType ===
        "term" ||
      access.accessType ===
        "month" ||
      access.accessType ===
        "fullCourse" ||
      !access.accessType
    ) {
      return true;
    }

    if (
      access.accessType ===
      "lesson"
    ) {
      if (
        access.lessonId ===
        lesson.id
      ) {
        return true;
      }

      if (
        Array.isArray(
          access.lessonIds
        ) &&
        access.lessonIds.includes(
          lesson.id
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /*
    ============================
    تقدم المحاضرة
    ============================
  */

  function getLessonProgress(
    courseId,
    lessonId
  ) {
    return (
      studentData
        ?.courseProgress?.[
        courseId
      ]?.lessons?.[
        lessonId
      ] || {}
    );
  }

  function isLessonWatched(
    courseId,
    lessonId
  ) {
    const progress =
      getLessonProgress(
        courseId,
        lessonId
      );

    return (
      progress.videoWatched ===
        true ||
      Number(
        progress.watchedPercent
      ) >=
        REQUIRED_WATCH_PERCENT
    );
  }

  /*
    ============================
    هل الواجب اتسلم؟
    ============================
  */

  function isHomeworkSubmitted(
    course,
    lesson
  ) {
    if (!course || !lesson) {
      return false;
    }

    const progress =
      getLessonProgress(
        course.id,
        lesson.id
      );

    if (
      progress.homeworkSubmitted ===
        true ||
      progress.homeworkCompleted ===
        true ||
      progress.homeworkDone ===
        true ||
      progress.homeworkSolutionUnlocked ===
        true
    ) {
      return true;
    }

    const homeworkResults =
      Array.isArray(
        studentData?.homeworkResults
      )
        ? studentData.homeworkResults
        : [];

    return homeworkResults.some(
      (result) => {
        if (!result) {
          return false;
        }

        const resultCourseId =
          result.courseId ||
          result.courseID ||
          "";

        const resultLessonId =
          result.lessonId ||
          result.lessonID ||
          "";

        const completed =
          result.completed ===
            true ||
          result.submitted ===
            true ||
          result.homeworkSubmitted ===
            true;

        return (
          completed &&
          resultCourseId ===
            course.id &&
          resultLessonId ===
            lesson.id
        );
      }
    );
  }

  /*
    ============================
    السعر
    ============================
  */

  function getDisplayedPrice(
    price
  ) {
    const numericPrice =
      Number(price);

    if (
      price === "" ||
      price === null ||
      price === undefined ||
      Number.isNaN(
        numericPrice
      )
    ) {
      return "السعر غير محدد";
    }

    if (numericPrice === 0) {
      return "0 جنيه — مجاني";
    }

    return `${numericPrice} جنيه`;
  }

  /*
    ============================
    واتساب
    ============================
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

    const message = encodeURIComponent(
      `السلام عليكم، أنا الطالب ${studentName}

رقم الهاتف: ${studentPhone}

السنة الدراسية: ${
        studentData?.grade ||
        currentStudent?.grade ||
        ""
      }

وأرغب في الاشتراك في كورس: ${
        course?.title || "الكورس"
      }`
    );

    window.open(
      `https://wa.me/${platformWhatsAppNumber}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    ============================
    كتابة الأكواد
    ============================
  */

  function handleActivationCodeChange(
    courseId,
    value
  ) {
    setActivationCodes((previousCodes) => ({
      ...previousCodes,

      [courseId]: value
        .toUpperCase()
        .replace(/\s/g, ""),
    }));
  }

  function handleLessonCodeChange(
    lessonId,
    value
  ) {
    setLessonActivationCodes(
      (previousCodes) => ({
        ...previousCodes,

        [lessonId]: value
          .toUpperCase()
          .replace(/\s/g, ""),
      })
    );
  }

  /*
    ============================
    التحقق من الكود
    ============================
  */

  function validateBasicCode({
    codeData,
    course,
    savedStudent,
  }) {
    if (codeData.active !== true) {
      throw new Error(
        "CODE_INACTIVE"
      );
    }

    if (codeData.used === true) {
      throw new Error(
        "CODE_ALREADY_USED"
      );
    }

    const codeGrade =
      normalizeGrade(
        codeData.grade
      );

    const studentSavedGrade =
      normalizeGrade(
        savedStudent.grade
      );

    const courseGrade =
      normalizeGrade(
        course.grade
      );

    if (
      codeGrade &&
      codeGrade !== studentSavedGrade
    ) {
      throw new Error(
        "WRONG_GRADE"
      );
    }

    if (
      codeGrade &&
      courseGrade &&
      codeGrade !== courseGrade
    ) {
      throw new Error(
        "WRONG_COURSE"
      );
    }

    const codeCourseId =
      normalizeText(
        codeData.courseId
      );

    const currentCourseId =
      normalizeText(
        course.id
      );

    const codeCourseTitle =
      normalizeText(
        codeData.courseTitle
      );

    const currentCourseTitle =
      normalizeText(
        course.title
      );

    const sameCourseId =
      Boolean(
        codeCourseId &&
          currentCourseId &&
          codeCourseId ===
            currentCourseId
      );

    const sameCourseTitle =
      Boolean(
        codeCourseTitle &&
          currentCourseTitle &&
          codeCourseTitle ===
            currentCourseTitle
      );

    if (
      !sameCourseId &&
      !sameCourseTitle
    ) {
      throw new Error(
        "WRONG_COURSE"
      );
    }
  }

  /*
    ============================
    تفعيل شهر / ترم
    ============================
  */

  async function activateCourseCode(
    course
  ) {
    const enteredCode = (
      activationCodes[
        course.id
      ] || ""
    )
      .trim()
      .toUpperCase();

    if (!studentUid) {
      window.alert(
        "برجاء تسجيل الدخول أولًا."
      );

      return;
    }

    if (!enteredCode) {
      window.alert(
        "من فضلك اكتب كود التفعيل أولًا."
      );

      return;
    }

    setActivatingCourseId(
      course.id
    );

    try {
      const codeReference = doc(
        db,
        "accessCode",
        enteredCode
      );

      const studentReference = doc(
        db,
        "students",
        studentUid
      );

      await runTransaction(
        db,
        async (transaction) => {
          const codeSnapshot =
            await transaction.get(
              codeReference
            );

          if (!codeSnapshot.exists()) {
            throw new Error(
              "CODE_NOT_FOUND"
            );
          }

          const codeData =
            codeSnapshot.data();

          const studentSnapshot =
            await transaction.get(
              studentReference
            );

          if (
            !studentSnapshot.exists()
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          validateBasicCode({
            codeData,
            course,
            savedStudent,
          });

          const accessType =
            codeData.accessType ||
            "fullCourse";

          if (
            accessType === "lesson"
          ) {
            throw new Error(
              "LESSON_CODE_INSIDE"
            );
          }

          if (
            ![
              "month",
              "term",
              "fullCourse",
            ].includes(accessType)
          ) {
            throw new Error(
              "INVALID_ACCESS_TYPE"
            );
          }

          const now =
            Timestamp.now();

          const oldCourseAccess = {
            ...(savedStudent.courseAccess ||
              {}),
          };

          const oldAccess =
            oldCourseAccess[
              course.id
            ] || {};

          let finalAccessType =
            accessType;

          if (
            oldAccess.active === true
          ) {
            if (
              oldAccess.accessType ===
                "term" ||
              accessType === "term"
            ) {
              finalAccessType =
                "term";
            } else if (
              oldAccess.accessType ===
                "month" ||
              oldAccess.accessType ===
                "fullCourse"
            ) {
              finalAccessType =
                oldAccess.accessType;
            }
          }

          oldCourseAccess[
            course.id
          ] = {
            ...oldAccess,

            active: true,

            courseId:
              course.id,

            courseTitle:
              course.title,

            grade:
              course.grade,

            accessType:
              finalAccessType,

            lessonId: null,

            lessonIds: [],

            activatedWithCode:
              enteredCode,

            activatedAt:
              oldAccess.activatedAt ||
              now,

            lastActivatedAt:
              now,
          };

          const oldSubscriptions =
            Array.isArray(
              savedStudent.subscribedCourses
            )
              ? [
                  ...savedStudent.subscribedCourses,
                ]
              : [];

          const subscriptionIndex =
            oldSubscriptions.findIndex(
              (subscription) => {
                if (
                  typeof subscription ===
                  "string"
                ) {
                  return (
                    subscription ===
                    course.id
                  );
                }

                return (
                  subscription?.id ===
                    course.id ||
                  subscription?.courseId ===
                    course.id
                );
              }
            );

          const subscriptionData = {
            id: course.id,

            courseId:
              course.id,

            title:
              course.title,

            grade:
              course.grade,

            image:
              course.image || "",

            description:
              course.description ||
              "",

            progress: 0,

            subscribed: true,

            accessType:
              finalAccessType,

            activatedAt: now,
          };

          if (
            subscriptionIndex >= 0
          ) {
            oldSubscriptions[
              subscriptionIndex
            ] = {
              ...(typeof oldSubscriptions[
                subscriptionIndex
              ] === "object"
                ? oldSubscriptions[
                    subscriptionIndex
                  ]
                : {}),

              ...subscriptionData,
            };
          } else {
            oldSubscriptions.push(
              subscriptionData
            );
          }

          transaction.update(
            codeReference,
            {
              used: true,

              usedBy:
                studentUid,

              usedAt:
                now,
            }
          );

          transaction.update(
            studentReference,
            {
              courseAccess:
                oldCourseAccess,

              subscribedCourses:
                oldSubscriptions,

              updatedAt:
                now,
            }
          );
        }
      );

      setActivationCodes(
        (previousCodes) => ({
          ...previousCodes,

          [course.id]: "",
        })
      );

      window.alert(
        "✅ تم تفعيل الاشتراك بنجاح."
      );
    } catch (error) {
      console.error(
        "Course activation error:",
        error
      );

      showActivationError(
        error
      );
    } finally {
      setActivatingCourseId("");
    }
  }

  /*
    ============================
    تفعيل كود محاضرة
    ============================
  */

  async function activateLessonCode(
    course,
    lesson
  ) {
    const enteredCode = (
      lessonActivationCodes[
        lesson.id
      ] || ""
    )
      .trim()
      .toUpperCase();

    if (!studentUid) {
      window.alert(
        "برجاء تسجيل الدخول أولًا."
      );

      return;
    }

    if (!enteredCode) {
      window.alert(
        "اكتب كود المحاضرة أولًا."
      );

      return;
    }

    setActivatingLessonId(
      lesson.id
    );

    try {
      const codeReference = doc(
        db,
        "accessCode",
        enteredCode
      );

      const studentReference = doc(
        db,
        "students",
        studentUid
      );

      await runTransaction(
        db,
        async (transaction) => {
          const codeSnapshot =
            await transaction.get(
              codeReference
            );

          if (!codeSnapshot.exists()) {
            throw new Error(
              "CODE_NOT_FOUND"
            );
          }

          const codeData =
            codeSnapshot.data();

          const studentSnapshot =
            await transaction.get(
              studentReference
            );

          if (
            !studentSnapshot.exists()
          ) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          validateBasicCode({
            codeData,
            course,
            savedStudent,
          });

          if (
            codeData.accessType !==
            "lesson"
          ) {
            throw new Error(
              "NOT_LESSON_CODE"
            );
          }

          /*
            الكود القديم ممكن يكون مربوط
            بمحاضرة معينة.

            والكود المرن الجديد لو مفيهوش
            lessonId يفتح المحاضرة اللي
            الطالب كتب الكود جنبها.
          */

          const allowedCodeLessons =
            [];

          if (codeData.lessonId) {
            allowedCodeLessons.push(
              codeData.lessonId
            );
          }

          if (
            Array.isArray(
              codeData.lessonIds
            )
          ) {
            allowedCodeLessons.push(
              ...codeData.lessonIds
            );
          }

          const isFlexibleLessonCode =
            allowedCodeLessons.length ===
            0;

          if (
            !isFlexibleLessonCode &&
            !allowedCodeLessons.includes(
              lesson.id
            )
          ) {
            throw new Error(
              "WRONG_LESSON"
            );
          }

          const now =
            Timestamp.now();

          const oldCourseAccess = {
            ...(savedStudent.courseAccess ||
              {}),
          };

          const oldAccess =
            oldCourseAccess[
              course.id
            ] || {};

          if (
            oldAccess.active ===
              true &&
            (
              oldAccess.accessType ===
                "month" ||
              oldAccess.accessType ===
                "term" ||
              oldAccess.accessType ===
                "fullCourse"
            )
          ) {
            throw new Error(
              "LESSON_ALREADY_OPEN"
            );
          }

          let lessonIds =
            Array.isArray(
              oldAccess.lessonIds
            )
              ? [
                  ...oldAccess.lessonIds,
                ]
              : [];

          if (
            oldAccess.lessonId &&
            !lessonIds.includes(
              oldAccess.lessonId
            )
          ) {
            lessonIds.push(
              oldAccess.lessonId
            );
          }

          if (
            !lessonIds.includes(
              lesson.id
            )
          ) {
            lessonIds.push(
              lesson.id
            );
          }

          oldCourseAccess[
            course.id
          ] = {
            ...oldAccess,

            active: true,

            courseId:
              course.id,

            courseTitle:
              course.title,

            grade:
              course.grade,

            accessType:
              "lesson",

            lessonId:
              lesson.id,

            lessonIds,

            activatedWithCode:
              enteredCode,

            activatedAt:
              oldAccess.activatedAt ||
              now,

            lastActivatedAt:
              now,
          };

          transaction.update(
            codeReference,
            {
              used: true,

              usedBy:
                studentUid,

              usedAt:
                now,

              usedForCourseId:
                course.id,

              usedForLessonId:
                lesson.id,
            }
          );

          transaction.update(
            studentReference,
            {
              courseAccess:
                oldCourseAccess,

              updatedAt:
                now,
            }
          );
        }
      );

      setLessonActivationCodes(
        (previousCodes) => ({
          ...previousCodes,

          [lesson.id]: "",
        })
      );

      window.alert(
        "✅ تم فتح المحاضرة بنجاح."
      );
    } catch (error) {
      console.error(
        "Lesson activation error:",
        error
      );

      showActivationError(
        error
      );
    } finally {
      setActivatingLessonId("");
    }
  }

  function showActivationError(
    error
  ) {
    switch (error?.message) {
      case "CODE_NOT_FOUND":
        window.alert(
          "الكود غير موجود."
        );
        break;

      case "CODE_INACTIVE":
        window.alert(
          "الكود غير مفعل."
        );
        break;

      case "CODE_ALREADY_USED":
        window.alert(
          "الكود مستخدم بالفعل."
        );
        break;

      case "WRONG_GRADE":
        window.alert(
          "الكود غير مخصص للصف الدراسي الخاص بك."
        );
        break;

      case "WRONG_COURSE":
        window.alert(
          "الكود غير مخصص لهذا الكورس."
        );
        break;

      case "WRONG_LESSON":
        window.alert(
          "الكود غير مخصص لهذه المحاضرة."
        );
        break;

      case "NOT_LESSON_CODE":
        window.alert(
          "هذا الكود ليس كود محاضرة."
        );
        break;

      case "LESSON_CODE_INSIDE":
        window.alert(
          "هذا كود محاضرة، استخدمه داخل المحاضرة."
        );
        break;

      case "INVALID_ACCESS_TYPE":
        window.alert(
          "نوع الكود غير صحيح."
        );
        break;

      case "LESSON_ALREADY_OPEN":
        window.alert(
          "الكورس مفتوح بالفعل ولا تحتاج كود محاضرة."
        );
        break;

      case "STUDENT_NOT_FOUND":
        window.alert(
          "بيانات الطالب غير موجودة."
        );
        break;

      default:
        window.alert(
          "حدث خطأ أثناء تفعيل الكود."
        );
    }
  }

  /*
    ============================
    فتح الكورس
    ============================
  */

  function openCourse(
    course
  ) {
    if (!course) {
      return;
    }

    setSelectedCourse(
      course
    );

    setSelectedExam(
      null
    );

    setSelectedHomework(
      null
    );

    setSelectedHomeworkLesson(
      null
    );

    setHomeworkAnswers(
      {}
    );

    setHomeworkResult(
      null
    );

    setActiveLesson(
      null
    );

    setWatchPercent(
      0
    );

    window.scrollTo(
      0,
      0
    );
  }

  function closeCourse() {
    setSelectedCourse(
      null
    );

    setSelectedExam(
      null
    );

    setSelectedHomework(
      null
    );

    setSelectedHomeworkLesson(
      null
    );

    setHomeworkAnswers(
      {}
    );

    setHomeworkResult(
      null
    );

    setActiveLesson(
      null
    );

    setYoutubePlayer(
      null
    );

    setVideoIsPlaying(
      false
    );

    setWatchPercent(
      0
    );

    window.scrollTo(
      0,
      0
    );
  }

  /*
    ============================
    فيديو يوتيوب
    ============================
  */

  function extractYoutubeVideoId(
    url
  ) {
    if (!url) {
      return "";
    }

    try {
      const parsedUrl =
        new URL(url);

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
          parsedUrl.pathname.startsWith(
            "/shorts/"
          )
        ) {
          return parsedUrl.pathname
            .split(
              "/shorts/"
            )[1]
            ?.split("/")[0];
        }

        if (
          parsedUrl.pathname.startsWith(
            "/embed/"
          )
        ) {
          return parsedUrl.pathname
            .split(
              "/embed/"
            )[1]
            ?.split("/")[0];
        }

        return (
          parsedUrl.searchParams.get(
            "v"
          ) || ""
        );
      }

      return "";
    } catch {
      return "";
    }
  }

  function handleYoutubeReady(
    event
  ) {
    setYoutubePlayer(
      event.target
    );
  }

  function handleYoutubeStateChange(
    event
  ) {
    const playerState =
      event.data;

    setVideoIsPlaying(
      playerState === 1
    );

    if (
      playerState === 0 ||
      playerState === 2
    ) {
      saveCurrentWatchProgress();
    }
  }

  useEffect(() => {
    if (
      !youtubePlayer ||
      !activeLesson ||
      !selectedCourse ||
      !videoIsPlaying
    ) {
      return undefined;
    }

    const interval =
      window.setInterval(
        async () => {
          try {
            const duration =
              await youtubePlayer.getDuration();

            const currentTime =
              await youtubePlayer.getCurrentTime();

            if (
              !duration ||
              duration <= 0
            ) {
              return;
            }

            const percent =
              Math.min(
                100,
                Math.max(
                  0,
                  Math.floor(
                    (currentTime /
                      duration) *
                      100
                  )
                )
              );

            setWatchPercent(
              percent
            );

            if (
              percent >=
              REQUIRED_WATCH_PERCENT
            ) {
              saveWatchProgress({
                course:
                  selectedCourse,

                lesson:
                  activeLesson,

                watchedPercent:
                  percent,

                markWatched:
                  true,
              });
            }
          } catch (error) {
            console.error(
              "YouTube progress error:",
              error
            );
          }
        },
        5000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [
    youtubePlayer,
    activeLesson,
    selectedCourse,
    videoIsPlaying,
  ]);

  async function saveCurrentWatchProgress() {
    if (
      !youtubePlayer ||
      !selectedCourse ||
      !activeLesson
    ) {
      return;
    }

    try {
      const duration =
        await youtubePlayer.getDuration();

      const currentTime =
        await youtubePlayer.getCurrentTime();

      if (
        !duration ||
        duration <= 0
      ) {
        return;
      }

      const percent =
        Math.min(
          100,
          Math.max(
            0,
            Math.floor(
              (currentTime /
                duration) *
                100
            )
          )
        );

      setWatchPercent(
        percent
      );

      await saveWatchProgress({
        course:
          selectedCourse,

        lesson:
          activeLesson,

        watchedPercent:
          percent,

        markWatched:
          percent >=
          REQUIRED_WATCH_PERCENT,
      });
    } catch (error) {
      console.error(
        "Save current watch progress error:",
        error
      );
    }
  }

  async function saveWatchProgress({
    course,
    lesson,
    watchedPercent,
    markWatched,
  }) {
    if (
      !studentUid ||
      !course ||
      !lesson
    ) {
      return;
    }

    const savingKey =
      `${course.id}-${lesson.id}`;

    if (
      savingWatchRef.current.has(
        savingKey
      )
    ) {
      return;
    }

    savingWatchRef.current.add(
      savingKey
    );

    setIsSavingWatch(
      true
    );

    try {
      const studentReference =
        doc(
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
            return;
          }

          const savedStudent =
            studentSnapshot.data();

          const oldCourseProgress = {
            ...(savedStudent.courseProgress ||
              {}),
          };

          const currentCourseProgress = {
            ...(oldCourseProgress[
              course.id
            ] || {}),
          };

          const lessonsProgress = {
            ...(currentCourseProgress.lessons ||
              {}),
          };

          const currentLessonProgress = {
            ...(lessonsProgress[
              lesson.id
            ] || {}),
          };

          const previousPercent =
            Number(
              currentLessonProgress.watchedPercent
            ) || 0;

          const finalPercent =
            Math.max(
              previousPercent,
              Number(
                watchedPercent
              ) || 0
            );

          lessonsProgress[
            lesson.id
          ] = {
            ...currentLessonProgress,

            watchedPercent:
              finalPercent,

            videoWatched:
              currentLessonProgress.videoWatched ===
                true ||
              markWatched ===
                true ||
              finalPercent >=
                REQUIRED_WATCH_PERCENT,

            lastWatchedAt:
              Timestamp.now(),
          };

          currentCourseProgress.lessons =
            lessonsProgress;

          oldCourseProgress[
            course.id
          ] =
            currentCourseProgress;

          transaction.update(
            studentReference,
            {
              courseProgress:
                oldCourseProgress,

              updatedAt:
                Timestamp.now(),
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "Watch progress save error:",
        error
      );
    } finally {
      savingWatchRef.current.delete(
        savingKey
      );

      setIsSavingWatch(
        false
      );
    }
  }

  /*
    ============================
    فتح الامتحان
    ============================
  */

  function openExam(
    course,
    lesson,
    examKey
  ) {
    if (
      !course ||
      !lesson
    ) {
      return;
    }

    const watched =
      isLessonWatched(
        course.id,
        lesson.id
      );

    if (!watched) {
      window.alert(
        `لازم تشاهد ${REQUIRED_WATCH_PERCENT}% على الأقل من الفيديو علشان الامتحان يفتح.`
      );

      return;
    }

    const exam =
      examsData?.[
        examKey
      ];

    if (!exam) {
      window.alert(
        "الامتحان غير متاح حاليًا."
      );

      return;
    }

    setSelectedExam(
      exam
    );

    setSelectedHomework(
      null
    );

    window.scrollTo(
      0,
      0
    );
  }

  function closeExam() {
    setSelectedExam(null);

    window.scrollTo(
      0,
      0
    );
  }

  /*
    ============================
    فتح الفيديو
    ============================
  */

  function openLessonVideo(
    course,
    lesson,
    mode = "lesson"
  ) {
    if (
      !course ||
      !lesson
    ) {
      return;
    }

    if (
      mode === "lesson" &&
      !hasLessonAccess(
        course,
        lesson
      )
    ) {
      window.alert(
        "المحاضرة غير مفعلة على حسابك."
      );

      return;
    }

    setActiveLesson({
      course,
      lesson,
      mode,
    });

    setYoutubePlayer(
      null
    );

    setVideoIsPlaying(
      false
    );

    const progress =
      getLessonProgress(
        course.id,
        lesson.id
      );

    setWatchPercent(
      Number(
        progress.watchedPercent
      ) || 0
    );
  }

  function closeLesson() {
    saveCurrentWatchProgress();

    setActiveLesson(
      null
    );

    setYoutubePlayer(
      null
    );

    setVideoIsPlaying(
      false
    );

    setWatchPercent(
      0
    );
  }

  /*
    ============================
    الواجب
    ============================
  */

  function getHomeworkForLesson(
    lesson
  ) {
    if (!lesson) {
      return null;
    }

    const homeworkKey =
      lesson.homeworkKey ||
      "";

    if (
      homeworkKey &&
      homeworkData?.[
        homeworkKey
      ]
    ) {
      return homeworkData[
        homeworkKey
      ];
    }

    return null;
  }

  function openHomework(
    course,
    lesson
  ) {
    if (
      !course ||
      !lesson
    ) {
      return;
    }

    const watched =
      isLessonWatched(
        course.id,
        lesson.id
      );

    if (!watched) {
      window.alert(
        `شاهد ${REQUIRED_WATCH_PERCENT}% من الفيديو أولًا علشان الواجب يفتح.`
      );

      return;
    }

    const homework =
      getHomeworkForLesson(
        lesson
      );

    if (!homework) {
      window.alert(
        "الواجب غير متاح حاليًا."
      );

      return;
    }

    if (
      isHomeworkSubmitted(
        course,
        lesson
      )
    ) {
      window.alert(
        "تم تسليم الواجب بالفعل."
      );

      return;
    }

    setSelectedHomework(
      homework
    );

    setSelectedHomeworkLesson({
      course,
      lesson,
    });

    setHomeworkAnswers(
      {}
    );

    setHomeworkResult(
      null
    );

    setSelectedExam(
      null
    );

    setActiveLesson(
      null
    );

    window.scrollTo(
      0,
      0
    );
  }

  function closeHomework() {
    setSelectedHomework(
      null
    );

    setSelectedHomeworkLesson(
      null
    );

    setHomeworkAnswers(
      {}
    );

    setHomeworkResult(
      null
    );

    window.scrollTo(
      0,
      0
    );
  }

  function handleHomeworkAnswer(
    questionId,
    optionIndex
  ) {
    setHomeworkAnswers(
      (previousAnswers) => ({
        ...previousAnswers,

        [questionId]:
          optionIndex,
      })
    );
  }

  /*
    ============================
    تسليم الواجب
    ============================
  */

  async function submitHomework() {
    if (
      !selectedHomework ||
      !selectedHomeworkLesson ||
      !studentUid
    ) {
      return;
    }

    const questions =
      Array.isArray(
        selectedHomework.questions
      )
        ? selectedHomework.questions
        : [];

    if (
      questions.length === 0
    ) {
      window.alert(
        "لا توجد أسئلة في الواجب."
      );

      return;
    }

    const unansweredQuestions =
      questions.filter(
        (question) =>
          homeworkAnswers[
            question.id
          ] === undefined
      );

    if (
      unansweredQuestions.length >
      0
    ) {
      const continueSubmit =
        window.confirm(
          `يوجد ${unansweredQuestions.length} سؤال بدون إجابة. هل تريد تسليم الواجب؟`
        );

      if (!continueSubmit) {
        return;
      }
    }

    const confirmSubmit =
      window.confirm(
        "هل أنت متأكد من تسليم الواجب؟ لن تتمكن من المحاولة مرة أخرى إلا إذا أعاد المدرس فتحه."
      );

    if (!confirmSubmit) {
      return;
    }

    setIsSubmittingHomework(
      true
    );

    try {
      const {
        course,
        lesson,
      } =
        selectedHomeworkLesson;

      let score = 0;

      const reviewedAnswers =
        questions.map(
          (
            question,
            index
          ) => {
            const selectedOption =
              homeworkAnswers[
                question.id
              ];

            const correctOption =
              question.correctAnswer;

            const isCorrect =
              selectedOption ===
              correctOption;

            if (isCorrect) {
              score += 1;
            }

            return {
              questionId:
                question.id,

              questionNumber:
                index + 1,

              question:
                question.question,

              options:
                Array.isArray(
                  question.options
                )
                  ? question.options
                  : [],

              selectedOption:
                selectedOption ??
                null,

              correctOption,

              isCorrect,
            };
          }
        );

      const totalQuestions =
        questions.length;

      const percentage =
        totalQuestions > 0
          ? Math.round(
              (score /
                totalQuestions) *
                100
            )
          : 0;

      const now =
        Timestamp.now();

      const resultData = {
        homeworkId:
          selectedHomework.id ||
          lesson.homeworkKey ||
          `${course.id}-${lesson.id}-homework`,

        homeworkTitle:
          selectedHomework.title ||
          lesson.homeworkTitle ||
          "واجب المحاضرة",

        courseId:
          course.id,

        courseTitle:
          course.title,

        lessonId:
          lesson.id,

        lessonTitle:
          lesson.title,

        score,

        totalQuestions,

        percentage,

        completed: true,

        submitted: true,

        homeworkSubmitted:
          true,

        submittedAt:
          now,

        answers:
          reviewedAnswers,
      };

      const studentReference =
        doc(
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
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          /*
            ----------------------------
            homeworkResults
            ----------------------------
          */

          const oldHomeworkResults =
            Array.isArray(
              savedStudent.homeworkResults
            )
              ? [
                  ...savedStudent.homeworkResults,
                ]
              : [];

          const existingResultIndex =
            oldHomeworkResults.findIndex(
              (result) =>
                result?.courseId ===
                  course.id &&
                result?.lessonId ===
                  lesson.id
            );

          if (
            existingResultIndex >=
            0
          ) {
            const oldResult =
              oldHomeworkResults[
                existingResultIndex
              ];

            if (
              oldResult?.completed ===
                true ||
              oldResult?.submitted ===
                true
            ) {
              throw new Error(
                "HOMEWORK_ALREADY_SUBMITTED"
              );
            }

            oldHomeworkResults[
              existingResultIndex
            ] =
              resultData;
          } else {
            oldHomeworkResults.push(
              resultData
            );
          }

          /*
            ----------------------------
            courseProgress
            ----------------------------
          */

          const oldCourseProgress = {
            ...(savedStudent.courseProgress ||
              {}),
          };

          const currentCourseProgress = {
            ...(oldCourseProgress[
              course.id
            ] || {}),
          };

          const lessonsProgress = {
            ...(currentCourseProgress.lessons ||
              {}),
          };

          const lessonProgress = {
            ...(lessonsProgress[
              lesson.id
            ] || {}),
          };

          lessonsProgress[
            lesson.id
          ] = {
            ...lessonProgress,

            homeworkSubmitted:
              true,

            homeworkCompleted:
              true,

            homeworkDone:
              true,

            homeworkScore:
              score,

            homeworkTotal:
              totalQuestions,

            homeworkPercentage:
              percentage,

            homeworkSubmittedAt:
              now,

            homeworkSolutionUnlocked:
              true,
          };

          currentCourseProgress.lessons =
            lessonsProgress;

          oldCourseProgress[
            course.id
          ] =
            currentCourseProgress;

          const completedHomeworks =
            Number(
              savedStudent.completedHomeworks
            ) || 0;

          transaction.update(
            studentReference,
            {
              homeworkResults:
                oldHomeworkResults,

              courseProgress:
                oldCourseProgress,

              completedHomeworks:
                completedHomeworks +
                1,

              updatedAt:
                now,
            }
          );
        }
      );

      setHomeworkResult(
        resultData
      );

      window.scrollTo(
        0,
        0
      );
    } catch (error) {
      console.error(
        "Homework submit error:",
        error
      );

      if (
        error?.message ===
        "HOMEWORK_ALREADY_SUBMITTED"
      ) {
        window.alert(
          "تم تسليم الواجب بالفعل."
        );
      } else if (
        error?.message ===
        "STUDENT_NOT_FOUND"
      ) {
        window.alert(
          "بيانات الطالب غير موجودة."
        );
      } else {
        window.alert(
          "حدث خطأ أثناء تسليم الواجب."
        );
      }
    } finally {
      setIsSubmittingHomework(
        false
      );
    }
  }

  /*
    ============================
    صور الكورسات
    ============================
  */

  function getCourseImage(
    course
  ) {
    if (!course) {
      return secondFreeCourse;
    }

    const savedImage =
      typeof course.image ===
      "string"
        ? course.image.trim()
        : "";

    if (
      savedImage &&
      savedImage !==
        "default"
    ) {
      return savedImage;
    }

    switch (course.id) {
      case "first-month-course":
        return firstMonthCourse;

      case "first-term-course":
        return firstTermCourse;

      case "second-month-course":
        return secondMonthCourse;

      case "second-term-course":
        return secondTermCourse;

      case "third-month-course":
        return thirdMonthCourse;

      case "third-term-course":
        return thirdTermCourse;

      case "second-free-intro-course":
        return secondTmhede;

      case "free-second-course":
        return secondFreeCourse;

      case "second-course-2":
        return secondCourse2;

      case "free-third-course":
        return thirdFreeCourse;

      case "third-course-2":
        return thirdCourse2;

      default:
        return secondFreeCourse;
    }
  }

  /*
    ============================
    في حالة الامتحان
    ============================
  */

  if (
    selectedExam &&
    selectedCourse
  ) {
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
    ============================
    شاشة الواجب
    ============================
  */

  if (
    selectedHomework &&
    selectedHomeworkLesson
  ) {
    const questions =
      Array.isArray(
        selectedHomework.questions
      )
        ? selectedHomework.questions
        : [];

    return (
      <div className="all-courses-page">
        <div className="all-courses-container">
          <button
            type="button"
            className="course-back-button"
            onClick={
              closeHomework
            }
          >
            <FaArrowRight />

            الرجوع إلى الكورس
          </button>

          <section className="homework-page-card">
            <div className="homework-page-heading">
              <span className="homework-page-icon">
                <FaClipboardCheck />
              </span>

              <div>
                <h2>
                  {selectedHomework.title ||
                    "واجب المحاضرة"}
                </h2>

                <p>
                  {
                    selectedHomeworkLesson
                      .course.title
                  }
                  {" — "}
                  {
                    selectedHomeworkLesson
                      .lesson.title
                  }
                </p>
              </div>
            </div>

            {homeworkResult ? (
              <div className="homework-result-box">
                <FaCheckCircle />

                <h3>
                  تم تسليم الواجب
                </h3>

                <strong>
                  {
                    homeworkResult.score
                  }
                  {" / "}
                  {
                    homeworkResult.totalQuestions
                  }
                </strong>

                <p>
                  النسبة:{" "}
                  {
                    homeworkResult.percentage
                  }
                  %
                </p>

                <div className="homework-review-list">
                  {homeworkResult.answers.map(
                    (
                      answer,
                      index
                    ) => (
                      <article
                        key={
                          answer.questionId ||
                          index
                        }
                        className={`homework-review-item ${
                          answer.isCorrect
                            ? "correct"
                            : "wrong"
                        }`}
                      >
                        <h4>
                          سؤال{" "}
                          {
                            answer.questionNumber
                          }
                          :{" "}
                          {
                            answer.question
                          }
                        </h4>

                        <p>
                          إجابتك:{" "}
                          {answer.selectedOption ===
                          null
                            ? "بدون إجابة"
                            : answer.options?.[
                                answer
                                  .selectedOption
                              ] ||
                              "بدون إجابة"}
                        </p>

                        {!answer.isCorrect && (
                          <p>
                            الإجابة الصحيحة:{" "}
                            {answer.options?.[
                              answer
                                .correctOption
                            ] ||
                              "غير متاحة"}
                          </p>
                        )}
                      </article>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="homework-questions-list">
                  {questions.map(
                    (
                      question,
                      questionIndex
                    ) => (
                      <article
                        className="homework-question-card"
                        key={
                          question.id ||
                          questionIndex
                        }
                      >
                        <h3>
                          سؤال{" "}
                          {
                            questionIndex +
                            1
                          }
                        </h3>

                        <p className="homework-question-text">
                          {
                            question.question
                          }
                        </p>

                        <div className="homework-options-list">
                          {(
                            question.options ||
                            []
                          ).map(
                            (
                              option,
                              optionIndex
                            ) => (
                              <label
                                className={`homework-option ${
                                  homeworkAnswers[
                                    question.id
                                  ] ===
                                  optionIndex
                                    ? "selected"
                                    : ""
                                }`}
                                key={
                                  optionIndex
                                }
                              >
                                <input
                                  type="radio"
                                  name={`homework-${question.id}`}
                                  checked={
                                    homeworkAnswers[
                                      question.id
                                    ] ===
                                    optionIndex
                                  }
                                  onChange={() =>
                                    handleHomeworkAnswer(
                                      question.id,
                                      optionIndex
                                    )
                                  }
                                />

                                <span>
                                  {option}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="homework-submit-button"
                  onClick={
                    submitHomework
                  }
                  disabled={
                    isSubmittingHomework
                  }
                >
                  {isSubmittingHomework
                    ? "جاري تسليم الواجب..."
                    : "تسليم الواجب"}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }

  /*
    ============================
    مشاهدة المحاضرة
    ============================
  */

  if (
    activeLesson &&
    selectedCourse
  ) {
    const lesson =
      activeLesson.lesson ||
      activeLesson;

    const videoUrl =
      lesson.youtubeUrl ||
      lesson.videoUrl ||
      "";

    const youtubeVideoId =
      extractYoutubeVideoId(
        videoUrl
      );

    const lessonProgress =
      getLessonProgress(
        selectedCourse.id,
        lesson.id
      );

    const currentPercent =
      Math.max(
        Number(
          lessonProgress.watchedPercent
        ) || 0,
        Number(
          watchPercent
        ) || 0
      );

    return (
      <div className="all-courses-page">
        <div className="all-courses-container">
          <button
            type="button"
            className="course-back-button"
            onClick={
              closeLesson
            }
          >
            <FaArrowRight />
            الرجوع إلى الكورس
          </button>

          <section className="lesson-watch-page">
            <div className="lesson-watch-heading">
              <span>
                {
                  selectedCourse.title
                }
              </span>

              <h2>
                {
                  lesson.title
                }
              </h2>

              {lesson.description && (
                <p>
                  {
                    lesson.description
                  }
                </p>
              )}
            </div>

            {youtubeVideoId ? (
              <div className="lesson-video-wrapper">
                <YouTube
                  videoId={
                    youtubeVideoId
                  }
                  className="lesson-youtube-player"
                  iframeClassName="lesson-youtube-iframe"
                  onReady={
                    handleYoutubeReady
                  }
                  onStateChange={
                    handleYoutubeStateChange
                  }
                  opts={{
                    width: "100%",
                    height: "100%",
                    playerVars: {
                      rel: 0,
                      modestbranding: 1,
                    },
                  }}
                />
              </div>
            ) : (
              <div className="all-courses-empty">
                <h2>
                  الفيديو غير متاح حاليًا
                </h2>
              </div>
            )}

            <div className="lesson-watch-progress">
              <div className="lesson-watch-progress-info">
                <span>
                  نسبة المشاهدة
                </span>

                <strong>
                  {
                    currentPercent
                  }
                  %
                </strong>
              </div>

              <div className="lesson-watch-progress-bar">
                <div
                  className="lesson-watch-progress-fill"
                  style={{
                    width: `${Math.min(
                      currentPercent,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p>
                بعد مشاهدة{" "}
                {
                  REQUIRED_WATCH_PERCENT
                }
                % من الفيديو هتقدر تدخل
                الامتحان والواجب الخاص
                بالمحاضرة.
              </p>

              {isSavingWatch && (
                <small>
                  جاري حفظ نسبة المشاهدة...
                </small>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  /*
    ============================
    محتوى الكورس
    ============================
  */

  if (selectedCourse) {
    const selectedLessons =
      Array.isArray(
        selectedCourse.lessons
      )
        ? selectedCourse.lessons
        : [];

    const courseIsPaid =
      isPaidCourse(
        selectedCourse
      );

    const courseAccess =
      hasCourseAccess(
        selectedCourse
      );

    return (
      <div className="all-courses-page">
        <div className="all-courses-container">
          <button
            type="button"
            className="course-back-button"
            onClick={
              closeCourse
            }
          >
            <FaArrowRight />
            الرجوع إلى جميع الكورسات
          </button>

          <section className="selected-course-header">
            <div className="selected-course-image-wrapper">
              <img
                src={getCourseImage(
                  selectedCourse
                )}
                alt={
                  selectedCourse.title
                }
                className="selected-course-image"
                onError={(
                  event
                ) => {
                  event.currentTarget.onerror =
                    null;

                  event.currentTarget.src =
                    secondFreeCourse;
                }}
              />
            </div>

            <div className="selected-course-details">
              <span className="selected-course-grade">
                {
                  selectedCourse.grade
                }
              </span>

              <h1>
                {
                  selectedCourse.title
                }
              </h1>

              <p>
                {selectedCourse.description ||
                  "شرح منظم وتدريبات واختبارات تساعدك على فهم المنهج وتحقيق أفضل نتيجة."}
              </p>

              <div className="selected-course-price">
                {courseIsPaid ? (
                  <>
                    <span>
                      سعر الكورس
                    </span>

                    <strong>
                      {getDisplayedPrice(
                        selectedCourse.price
                      )}
                    </strong>
                  </>
                ) : (
                  <strong>
                    الكورس مجاني
                  </strong>
                )}
              </div>

              {courseIsPaid &&
                courseAccess && (
                  <div className="course-access-success">
                    <FaCheckCircle />
                    الكورس مفعل على حسابك
                  </div>
                )}
            </div>
          </section>

          {courseIsPaid &&
            !courseAccess && (
              <section className="course-activation-section">
                <div className="course-activation-heading">
                  <h2>
                    تفعيل الكورس
                  </h2>

                  <p>
                    اكتب كود الاشتراك الخاص
                    بالشهر أو الترم.
                  </p>
                </div>

                <div className="course-activation-box">
                  <input
                    type="text"
                    value={
                      activationCodes[
                        selectedCourse.id
                      ] || ""
                    }
                    onChange={(
                      event
                    ) =>
                      handleActivationCodeChange(
                        selectedCourse.id,
                        event.target.value
                      )
                    }
                    placeholder="اكتب كود التفعيل"
                    maxLength={40}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      activateCourseCode(
                        selectedCourse
                      )
                    }
                    disabled={
                      activatingCourseId ===
                      selectedCourse.id
                    }
                  >
                    {activatingCourseId ===
                    selectedCourse.id
                      ? "جاري التفعيل..."
                      : "تفعيل الكورس"}
                  </button>
                </div>

                <button
                  type="button"
                  className="course-whatsapp-button"
                  onClick={() =>
                    openCourseSubscription(
                      selectedCourse
                    )
                  }
                >
                  <FaWhatsapp />
                  الاشتراك عن طريق واتساب
                </button>
              </section>
            )}

          <section className="course-lessons-section">
            <div className="course-lessons-heading">
              <FaBookOpen />

              <div>
                <h2>
                  محتوى الكورس
                </h2>

                <p>
                  اختر المحاضرة التي تريد
                  مذاكرتها.
                </p>
              </div>
            </div>

            {selectedLessons.length ===
            0 ? (
              <div className="all-courses-empty">
                <FaBookOpen />

                <h2>
                  لا توجد محاضرات داخل
                  الكورس حاليًا
                </h2>
              </div>
            ) : (
              <div className="course-lessons-list">
                {selectedLessons.map(
                  (
                    lesson,
                    lessonIndex
                  ) => {
                    const unlocked =
                      hasLessonAccess(
                        selectedCourse,
                        lesson
                      );

                    const watched =
                      isLessonWatched(
                        selectedCourse.id,
                        lesson.id
                      );

                    const homeworkSubmitted =
                      isHomeworkSubmitted(
                        selectedCourse,
                        lesson
                      );

                    const homework =
                      getHomeworkForLesson(
                        lesson
                      );

                    const progress =
                      getLessonProgress(
                        selectedCourse.id,
                        lesson.id
                      );

                    const watchedPercent =
                      Number(
                        progress.watchedPercent
                      ) || 0;

                    const examKey =
                      lesson.exam1Key ||
                      lesson.examKey ||
                      "";

                    const hasExam =
                      Boolean(
                        examKey &&
                          examsData?.[
                            examKey
                          ]
                      );

                    const hasPdf =
                      Boolean(
                        lesson.pdfUrl
                      );

                    const isFreeCourse =
                      !isPaidCourse(
                        selectedCourse
                      );

                    return (
                      <article
                        className="course-lesson-card"
                        key={
                          lesson.id ||
                          lessonIndex
                        }
                      >
                        <div className="course-lesson-number">
                          {
                            lessonIndex +
                            1
                          }
                        </div>

                        <div className="course-lesson-main">
                          <div className="course-lesson-title-row">
                            <div>
                              <h3>
                                {lesson.title ||
                                  `المحاضرة ${
                                    lessonIndex +
                                    1
                                  }`}
                              </h3>

                              {lesson.description && (
                                <p>
                                  {
                                    lesson.description
                                  }
                                </p>
                              )}
                            </div>

                            <div className="course-lesson-status">
                              {unlocked ? (
                                <span className="lesson-unlocked">
                                  <FaCheckCircle />
                                  مفتوحة
                                </span>
                              ) : (
                                <span className="lesson-locked">
                                  غير مفعلة
                                </span>
                              )}

                              {watched && (
                                <span className="lesson-watched">
                                  تم مشاهدة{" "}
                                  {
                                    REQUIRED_WATCH_PERCENT
                                  }
                                  %+
                                </span>
                              )}

                              {homeworkSubmitted && (
                                <span className="lesson-homework-done">
                                  تم تسليم الواجب
                                </span>
                              )}
                            </div>
                          </div>

                          {unlocked && (
                            <div className="course-lesson-progress">
                              <div>
                                <span>
                                  المشاهدة
                                </span>

                                <strong>
                                  {
                                    watchedPercent
                                  }
                                  %
                                </strong>
                              </div>

                              <div className="course-lesson-progress-bar">
                                <div
                                  className="course-lesson-progress-fill"
                                  style={{
                                    width: `${Math.min(
                                      watchedPercent,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {!unlocked &&
                            courseIsPaid &&
                            !courseAccess && (
                              <div className="lesson-code-section">
                                <p>
                                  لو معاك كود
                                  محاضرة منفصلة
                                  اكتبه هنا:
                                </p>

                                <div className="lesson-code-box">
                                  <input
                                    type="text"
                                    value={
                                      lessonActivationCodes[
                                        lesson.id
                                      ] || ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      handleLessonCodeChange(
                                        lesson.id,
                                        event.target.value
                                      )
                                    }
                                    placeholder="كود المحاضرة"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      activateLessonCode(
                                        selectedCourse,
                                        lesson
                                      )
                                    }
                                    disabled={
                                      activatingLessonId ===
                                      lesson.id
                                    }
                                  >
                                    {activatingLessonId ===
                                    lesson.id
                                      ? "جاري..."
                                      : "تفعيل"}
                                  </button>
                                </div>
                              </div>
                            )}

                          <div className="course-lesson-actions">
                            <button
                              type="button"
                              className="lesson-action-button video"
                              disabled={
                                !unlocked &&
                                !isFreeCourse
                              }
                              onClick={() =>
                                openLessonVideo(
                                  selectedCourse,
                                  lesson
                                )
                              }
                            >
                              <FaPlay />
                              مشاهدة المحاضرة
                            </button>

                            {hasPdf && (
                              <button
                                type="button"
                                className="lesson-action-button pdf"
                                disabled={
                                  !unlocked &&
                                  !isFreeCourse
                                }
                                onClick={() =>
                                  window.open(
                                    lesson.pdfUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                <FaFilePdf />
                                ملف المحاضرة
                              </button>
                            )}

                            {homework && (
                              <button
                                type="button"
                                className="lesson-action-button homework"
                                disabled={
                                  !watched ||
                                  homeworkSubmitted
                                }
                                onClick={() =>
                                  openHomework(
                                    selectedCourse,
                                    lesson
                                  )
                                }
                              >
                                <FaClipboardCheck />

                                {homeworkSubmitted
                                  ? "تم تسليم الواجب"
                                  : "حل الواجب"}
                              </button>
                            )}

                            {hasExam && (
                              <button
                                type="button"
                                className="lesson-action-button exam"
                                disabled={
                                  !watched
                                }
                                onClick={() =>
                                  openExam(
                                    selectedCourse,
                                    lesson,
                                    examKey
                                  )
                                }
                              >
                                <FaGraduationCap />
                                دخول الامتحان
                              </button>
                            )}
                          </div>

                          {!watched &&
                            unlocked &&
                            (hasExam ||
                              homework) && (
                              <p className="lesson-watch-note">
                                شاهد{" "}
                                {
                                  REQUIRED_WATCH_PERCENT
                                }
                                % على الأقل من
                                الفيديو لفتح
                                الامتحان والواجب.
                              </p>
                            )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  /*
    ============================
    جميع الكورسات
    ============================
  */

  return (
    <section className="all-courses-page">
      <div className="all-courses-container">
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
            <FaGraduationCap />

            <h2>
              جاري تحميل الكورسات...
            </h2>
          </div>
        ) : coursesError ? (
          <div className="all-courses-empty">
            <FaBookOpen />

            <h2>
              تعذر تحميل الكورسات
            </h2>

            <p>
              {coursesError}
            </p>
          </div>
        ) : visibleCourses.length ===
          0 ? (
          <div className="all-courses-empty">
            <FaGraduationCap />

            <h2>
              لا توجد كورسات متاحة
              حاليًا
            </h2>

            <p>
              أول ما يتم إضافة كورسات
              للسنة الدراسية الخاصة بك
              هتظهر هنا.
            </p>
          </div>
        ) : (
          <div className="all-courses-grid">
            {visibleCourses.map(
              (course) => {
                const paid =
                  isPaidCourse(
                    course
                  );

                const access =
                  hasCourseAccess(
                    course
                  );

                const lessons =
                  Array.isArray(
                    course.lessons
                  )
                    ? course.lessons
                    : [];

                return (
                  <article
                    className={`all-course-card ${
                      targetCourseId ===
                      course.id
                        ? "shared-target-course"
                        : ""
                    }`}
                    key={
                      course.id
                    }
                  >
                    <div className="all-course-card-image">
                      <img
                        src={getCourseImage(
                          course
                        )}
                        alt={
                          course.title
                        }
                        onError={(
                          event
                        ) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            secondFreeCourse;
                        }}
                      />

                      {!paid && (
                        <span className="all-course-free-badge">
                          مجاني
                        </span>
                      )}

                      {paid &&
                        access && (
                          <span className="all-course-active-badge">
                            مفعل
                          </span>
                        )}
                    </div>

                    <div className="all-course-card-content">
                      <span className="all-course-grade">
                        {
                          course.grade
                        }
                      </span>

                      <h2>
                        {
                          course.title
                        }
                      </h2>

                      <p>
                        {course.description ||
                          "شرح منظم، تدريبات واختبارات تساعدك على فهم المنهج."}
                      </p>

                      <div className="all-course-meta">
                        <span>
                          <FaBookOpen />
                          {
                            lessons.length
                          }{" "}
                          محاضرة
                        </span>

                        <strong>
                          {paid
                            ? getDisplayedPrice(
                                course.price
                              )
                            : "مجاني"}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="all-course-open-button"
                        onClick={() =>
                          openCourse(
                            course
                          )
                        }
                      >
                        <FaPlay />

                        {paid &&
                        !access
                          ? "عرض تفاصيل الكورس"
                          : "دخول الكورس"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
        </div>
    </section>
  );
}

export default AllCourses;