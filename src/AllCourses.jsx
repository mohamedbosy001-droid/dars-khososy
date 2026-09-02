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
import courseHomeworkData from "./courseHomeworkData";

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

const THIRD_SECONDARY_COURSE_IDS = new Set([
  "third-month-course",
  "third-term-course",
]);

const THIRD_LECTURE_1_EXAM_KEY = "thirdLecture1Exam";
const THIRD_LECTURE_1_EXAM_ID = "third-lecture-1-exam";

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

      videoTitle:
        "فيديو المحاضرة التمهيدية",

      exam1: true,

      exam1Key:
        "secondFreeIntroExam",

      exam1Title:
        "امتحان المحاضرة التمهيدية",
    },
  ],
};

/*
  المحاضرة الثانية لتالتة ثانوي.
  تضاف محليًا إلى كورس الشهر وكورس الترم
  بدون تعديل بيانات Firestore القديمة.
*/
const THIRD_SECOND_LECTURE = {
  id: "lesson-2",

  title:
    "المحاضرة الثانية ( ادب الاحياء والبعث )",

  description:
    "شاهد 30% من المحاضرة لفتح الواجب، وبعد تسليم الواجب يفتح فيديو الحل.",

  youtubeUrl:
    "https://youtu.be/zLFTHNBX4qo",

  videoUrl:
    "https://youtu.be/zLFTHNBX4qo",

  videoTitle:
    "المحاضرة الثانية ( ادب الاحياء والبعث )",

  homeworkEnabled: true,

  homeworkKey:
    "thirdLecture2Homework",

  homeworkTitle:
    "واجب المحاضرة الثانية",

  homeworkSolutionUrl:
    "https://youtu.be/6pv2Rb6UPr4",

  solutionVideoUrl:
    "https://youtu.be/6pv2Rb6UPr4",

  homeworkSolutionTitle:
    "حل واجب المحاضرة الثانية",

  requiresPreviousExam: true,

  requiredExamId:
    THIRD_LECTURE_1_EXAM_ID,
};

function AllCourses({
  currentStudent,
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
    الواجب داخل الكورس
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
    تجهيز محتوى تالتة ثانوي
    ============================
  */

  function prepareThirdSecondaryCourse(
    course
  ) {
    if (
      !course ||
      !THIRD_SECONDARY_COURSE_IDS.has(
        course.id
      )
    ) {
      return course;
    }

    let lessons =
      Array.isArray(
        course.lessons
      )
        ? [...course.lessons]
        : [];

    /*
      لو المحاضرة الأولى موجودة نربط بها الامتحان.
      ولو لم توجد لن ننشئ محاضرة أولى وهمية حتى لا نمسح
      أو نغيّر محتوى Firestore الحالي.
    */
    if (lessons.length > 0) {
      lessons[0] = {
        ...lessons[0],

        id:
          lessons[0].id ||
          "lesson-1",

        exam1: true,

        exam1Key:
          THIRD_LECTURE_1_EXAM_KEY,

        exam1Title:
          "امتحان المحاضرة الأولى",
      };
    }

    const secondLessonIndex =
      lessons.findIndex(
        (lesson) =>
          lesson?.id ===
            "lesson-2" ||
          lesson?.courseLectureKey ===
            "third-lecture-2"
      );

    if (
      secondLessonIndex >= 0
    ) {
      lessons[
        secondLessonIndex
      ] = {
        ...lessons[
          secondLessonIndex
        ],

        ...THIRD_SECOND_LECTURE,

        courseLectureKey:
          "third-lecture-2",
      };
    } else {
      lessons.push({
        ...THIRD_SECOND_LECTURE,

        courseLectureKey:
          "third-lecture-2",
      });
    }

    return {
      ...course,

      lessons,
    };
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

                        homeworkKey:
                          lesson.homeworkKey ||
                          "",

                        homeworkEnabled:
                          lesson.homeworkEnabled ===
                          true,

                        homeworkTitle:
                          lesson.homeworkTitle ||
                          "واجب المحاضرة",

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
                    courseData.pdfUrl ||
                    "";

                  const topHomework =
                    courseData.homeworkUrl ||
                    courseData.homeworkPdfUrl ||
                    "";

                  const topSolution =
                    courseData.homeworkSolutionUrl ||
                    courseData.solutionVideoUrl ||
                    "";

                  const hasOldContent =
                    hasValue(
                      topVideo
                    ) ||
                    hasValue(
                      topPdf
                    ) ||
                    hasValue(
                      topHomework
                    ) ||
                    hasValue(
                      topSolution
                    );

                  if (
                    hasOldContent
                  ) {
                    normalizedLessons =
                      [
                        {
                          id:
                            "lesson-1",

                          title:
                            courseData.lessonTitle ||
                            "المحاضرة الأولى",

                          description:
                            courseData.lessonDescription ||
                            "",

                          youtubeUrl:
                            topVideo,

                          videoUrl:
                            topVideo,

                          pdfUrl:
                            topPdf,

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

                const normalizedCourse = {
                  id:
                    courseDocument.id,

                  ...courseData,

                  lessons:
                    normalizedLessons,
                };

                return prepareThirdSecondaryCourse(
                  normalizedCourse
                );
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

    return () =>
      unsubscribe();
  }, []);

  /*
    ============================
    تحميل بيانات الطالب
    ============================
  */

  useEffect(() => {
    if (!studentUid) {
      setStudentData(
        currentStudent ||
          null
      );

      return undefined;
    }

    const studentReference =
      doc(
        db,
        "students",
        studentUid
      );

    const unsubscribe =
      onSnapshot(
        studentReference,

        (
          studentSnapshot
        ) => {
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

    return () =>
      unsubscribe();
  }, [
    studentUid,
    currentStudent,
  ]);

  /*
    ============================
    تحديث selectedCourse
    عند تحديث بيانات Firestore
    ============================
  */

  useEffect(() => {
    if (!selectedCourse) {
      return;
    }

    const updatedCourse =
      courses.find(
        (course) =>
          course.id ===
          selectedCourse.id
      );

    if (updatedCourse) {
      setSelectedCourse(
        updatedCourse
      );
    }
  }, [courses]);

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
            (
              isLocalPreview ||
              isAvailableOnline
            )
          );
        }
      );
    }, [
      courses,
      studentGrade,
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
      Number(
        course?.price
      ) > 0
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

    if (
      !isPaidCourse(
        course
      )
    ) {
      return true;
    }

    return (
      getCourseAccess(
        course
      )?.active === true
    );
  }

  /*
    ============================
    هل الامتحان تم تسليمه؟
    ============================
  */

  function isExamCompleted(
    examId
  ) {
    if (!examId) {
      return false;
    }

    const savedAttempt =
      studentData
        ?.examAttempts?.[
        examId
      ];

    if (
      savedAttempt?.completed ===
      true
    ) {
      return true;
    }

    const examResults =
      Array.isArray(
        studentData?.examResults
      )
        ? studentData.examResults
        : [];

    return examResults.some(
      (savedResult) =>
        savedResult?.examId ===
          examId &&
        savedResult?.completed ===
          true
    );
  }

  /*
    ============================
    صلاحية الاشتراك الأساسية
    بدون شروط تسلسل المحاضرات
    ============================
  */

  function hasBasicLessonAccess(
    course,
    lesson
  ) {
    if (
      !course ||
      !lesson
    ) {
      return false;
    }

    if (
      !isPaidCourse(
        course
      )
    ) {
      return true;
    }

    const access =
      getCourseAccess(
        course
      );

    if (
      !access?.active
    ) {
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
    صلاحية المحاضرة النهائية

    تالتة ثانوي:
    المحاضرة الثانية لا تفتح
    إلا بعد تسليم امتحان المحاضرة الأولى.
    ============================
  */

  function hasLessonAccess(
    course,
    lesson
  ) {
    const basicAccess =
      hasBasicLessonAccess(
        course,
        lesson
      );

    if (!basicAccess) {
      return false;
    }

    if (
      THIRD_SECONDARY_COURSE_IDS.has(
        course?.id
      ) &&
      lesson?.id ===
        "lesson-2"
    ) {
      return isExamCompleted(
        THIRD_LECTURE_1_EXAM_ID
      );
    }

    return true;
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
    if (
      !course ||
      !lesson
    ) {
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

    if (
      numericPrice === 0
    ) {
      return "0 جنيه — مجاني";
    }

    return `${numericPrice} جنيه`;
  }

  /*
    ============================
    واتساب
    ============================
  */

  function openCourseSubscription(
    course
  ) {
    const studentName =
      studentData?.fullName ||
      currentStudent?.fullName ||
      "طالب";

    const studentPhone =
      studentData?.studentPhone ||
      currentStudent?.studentPhone ||
      "";

    const message =
      encodeURIComponent(
        `السلام عليكم، أنا الطالب ${studentName}
رقم الهاتف: ${studentPhone}
السنة الدراسية: ${
          studentData?.grade ||
          currentStudent?.grade ||
          ""
        }
وأرغب في الاشتراك في كورس: ${
          course?.title ||
          "الكورس"
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
    setActivationCodes(
      (previousCodes) => ({
        ...previousCodes,

        [courseId]:
          value
            .toUpperCase()
            .replace(
              /\s/g,
              ""
            ),
      })
    );
  }

  function handleLessonCodeChange(
    lessonId,
    value
  ) {
    setLessonActivationCodes(
      (previousCodes) => ({
        ...previousCodes,

        [lessonId]:
          value
            .toUpperCase()
            .replace(
              /\s/g,
              ""
            ),
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
    studentUid:
      codeStudentUid,
  }) {
    if (!codeData) {
      return {
        valid: false,
        message:
          "كود التفعيل غير موجود.",
      };
    }

    if (
      codeData.active ===
      false
    ) {
      return {
        valid: false,
        message:
          "كود التفعيل غير مفعل.",
      };
    }

    if (
      codeData.used === true ||
      codeData.isUsed === true
    ) {
      return {
        valid: false,
        message:
          "كود التفعيل مستخدم بالفعل.",
      };
    }

    if (
      codeData.courseId &&
      codeData.courseId !==
        course.id
    ) {
      return {
        valid: false,
        message:
          "كود التفعيل لا يخص هذا الكورس.",
      };
    }

    if (
      codeData.studentUid &&
      codeData.studentUid !==
        codeStudentUid
    ) {
      return {
        valid: false,
        message:
          "كود التفعيل مخصص لطالب آخر.",
      };
    }

    return {
      valid: true,
      message: "",
    };
  }

  /*
    ============================
    تفعيل شهر / ترم
    ============================
  */

  async function activateCourseCode(course) {
    const enteredCode = (
      activationCodes[course.id] || ""
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

    setActivatingCourseId(course.id);

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

          if (!studentSnapshot.exists()) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          const validation =
            validateBasicCode({
              codeData,
              course,
              studentUid,
            });

          if (!validation.valid) {
            if (
              codeData.active ===
              false
            ) {
              throw new Error(
                "CODE_INACTIVE"
              );
            }

            if (
              codeData.used ===
                true ||
              codeData.isUsed ===
                true
            ) {
              throw new Error(
                "CODE_ALREADY_USED"
              );
            }

            if (
              codeData.courseId &&
              codeData.courseId !==
                course.id
            ) {
              throw new Error(
                "WRONG_COURSE"
              );
            }

            throw new Error(
              "INVALID_CODE"
            );
          }

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
              finalAccessType = "term";
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

          oldCourseAccess[course.id] = {
            ...oldAccess,

            active: true,

            courseId: course.id,

            courseTitle:
              course.title,

            grade: course.grade,

            accessType:
              finalAccessType,

            lessonId: null,

            lessonIds: [],

            activatedWithCode:
              enteredCode,

            activatedAt:
              oldAccess.activatedAt ||
              now,

            lastActivatedAt: now,
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

            courseId: course.id,

            title: course.title,

            grade: course.grade,

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

              usedBy: studentUid,

              usedAt: now,
            }
          );

          transaction.update(
            studentReference,
            {
              courseAccess:
                oldCourseAccess,

              subscribedCourses:
                oldSubscriptions,

              updatedAt: now,
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

      showActivationError(error);
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

    /*
      لو المحاضرة الثانية لتالتة ثانوي
      مقفولة بسبب الامتحان السابق،
      الكود لا يتخطى شرط الامتحان.
    */
    if (
      THIRD_SECONDARY_COURSE_IDS.has(
        course?.id
      ) &&
      lesson?.id ===
        "lesson-2" &&
      !isExamCompleted(
        THIRD_LECTURE_1_EXAM_ID
      )
    ) {
      window.alert(
        "لازم تسلّم امتحان المحاضرة الأولى أولًا لفتح المحاضرة الثانية."
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

          if (!studentSnapshot.exists()) {
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          const validation =
            validateBasicCode({
              codeData,
              course,
              studentUid,
            });

          if (!validation.valid) {
            if (
              codeData.active ===
              false
            ) {
              throw new Error(
                "CODE_INACTIVE"
              );
            }

            if (
              codeData.used ===
                true ||
              codeData.isUsed ===
                true
            ) {
              throw new Error(
                "CODE_ALREADY_USED"
              );
            }

            if (
              codeData.courseId &&
              codeData.courseId !==
                course.id
            ) {
              throw new Error(
                "WRONG_COURSE"
              );
            }

            throw new Error(
              "INVALID_CODE"
            );
          }

          if (
            codeData.accessType !==
            "lesson"
          ) {
            throw new Error(
              "NOT_LESSON_CODE"
            );
          }

          /*
            كود المحاضرة ممكن يكون:
            - مربوط بمحاضرة محددة
            - أو كود مرن يفتح المحاضرة
              اللي الطالب كتب الكود عندها
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

          oldCourseAccess[course.id] = {
            ...oldAccess,

            active: true,

            courseId: course.id,

            courseTitle:
              course.title,

            grade: course.grade,

            accessType: "lesson",

            lessonId:
              lessonIds[0] ||
              lesson.id,

            lessonIds,

            activatedWithCode:
              enteredCode,

            activatedAt:
              oldAccess.activatedAt ||
              now,

            lastActivatedAt: now,
          };

          transaction.update(
            codeReference,
            {
              used: true,

              usedBy: studentUid,

              usedAt: now,
            }
          );

          transaction.update(
            studentReference,
            {
              courseAccess:
                oldCourseAccess,

              updatedAt: now,
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
        `✅ تم فتح ${
          lesson.title ||
          "المحاضرة"
        } بنجاح.`
      );
    } catch (error) {
      console.error(
        "Lesson activation error:",
        error
      );

      showActivationError(error);
    } finally {
      setActivatingLessonId("");
    }
  }

  /*
    ============================
    رسائل أخطاء التفعيل
    ============================
  */

  function showActivationError(
    error
  ) {
    const messages = {
      CODE_NOT_FOUND:
        "الكود غير صحيح.",

      CODE_INACTIVE:
        "الكود غير مفعل.",

      CODE_ALREADY_USED:
        "هذا الكود تم استخدامه من قبل.",

      WRONG_GRADE:
        "هذا الكود غير مخصص لسنتك الدراسية.",

      WRONG_COURSE:
        "هذا الكود غير مخصص لهذا الكورس.",

      WRONG_LESSON:
        "هذا الكود غير مخصص لهذه المحاضرة.",

      NOT_LESSON_CODE:
        "هذا كود شهر أو ترم. استخدمه في خانة التفعيل الموجودة خارج الكورس.",

      LESSON_CODE_INSIDE:
        "هذا كود محاضرة. افتح محتوى الكورس واكتب الكود بجانب المحاضرة.",

      LESSON_ALREADY_OPEN:
        "المحاضرة مفتوحة بالفعل ضمن اشتراكك.",

      INVALID_ACCESS_TYPE:
        "نوع كود التفعيل غير صحيح.",

      INVALID_CODE:
        "كود التفعيل غير صحيح.",
    };

    window.alert(
      messages[error.message] ||
        "حدث خطأ أثناء تفعيل الكود."
    );
  }

  /*
    ============================
    صور الكورسات
    ============================
  */

  function getCourseImage(course) {
    if (
      course.id ===
      "second-free-intro-course"
    ) {
      return secondTmhede;
    }

    if (
      course.id ===
      "first-month-course"
    ) {
      return firstMonthCourse;
    }

    if (
      course.id ===
      "first-term-course"
    ) {
      return firstTermCourse;
    }

    if (
      course.id ===
      "second-month-course"
    ) {
      return secondMonthCourse;
    }

    if (
      course.id ===
      "second-term-course"
    ) {
      return secondTermCourse;
    }

    if (
      course.id ===
      "third-month-course"
    ) {
      return thirdMonthCourse;
    }

    if (
      course.id ===
      "third-term-course"
    ) {
      return thirdTermCourse;
    }

    if (
      course.id ===
      "second-course-2"
    ) {
      return secondCourse2;
    }

    if (
      course.id ===
      "third-course-2"
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
      course.image !==
        "default" &&
      course.image.startsWith(
        "http"
      )
    ) {
      return course.image;
    }

    return secondFreeCourse;
  }

  /*
    ============================
    فتح / إغلاق محتوى الكورس
    ============================
  */

  function openCourseContent(
    course
  ) {
    setSelectedCourse(course);

    setSelectedExam(null);

    setSelectedHomework(null);

    setSelectedHomeworkLesson(
      null
    );

    window.scrollTo(0, 0);
  }

  function closeCourseContent() {
    setSelectedCourse(null);

    setSelectedExam(null);

    setSelectedHomework(null);

    setSelectedHomeworkLesson(
      null
    );

    setActiveLesson(null);

    setYoutubePlayer(null);

    setVideoIsPlaying(false);

    setWatchPercent(0);

    window.scrollTo(0, 0);
  }

  /*
    ============================
    استخراج ID فيديو YouTube
    ============================
  */

  function extractYouTubeVideoId(
    url
  ) {
    if (!url) {
      return "";
    }

    if (
      !url.includes("/") &&
      !url.includes(".")
    ) {
      return url;
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
    ============================
    فتح فيديو المحاضرة
    ============================
  */

  function openLesson(
    course,
    lesson
  ) {
    if (!course || !lesson) {
      return;
    }

    if (
      THIRD_SECONDARY_COURSE_IDS.has(
        course.id
      ) &&
      lesson.id ===
        "lesson-2" &&
      !isExamCompleted(
        THIRD_LECTURE_1_EXAM_ID
      )
    ) {
      window.alert(
        "لازم تسلّم امتحان المحاضرة الأولى أولًا لفتح المحاضرة الثانية."
      );

      return;
    }

    if (
      !hasLessonAccess(
        course,
        lesson
      )
    ) {
      window.alert(
        "المحاضرة مقفولة. اكتب كود المحاضرة أولًا."
      );

      return;
    }

    const lessonVideo =
      lesson.youtubeUrl ||
      lesson.videoUrl ||
      "";

    if (
      !hasValue(lessonVideo)
    ) {
      return;
    }

    setActiveLesson({
      course,

      lesson: {
        ...lesson,

        youtubeUrl:
          lessonVideo,
      },

      mode: "lesson",
    });

    setYoutubePlayer(null);

    setVideoIsPlaying(false);

    setWatchPercent(
      isLessonWatched(
        course.id,
        lesson.id
      )
        ? REQUIRED_WATCH_PERCENT
        : 0
    );
  }

  /*
    ============================
    فتح فيديو حل الواجب
    ============================
  */

  function openHomeworkSolution(
    course,
    lesson,
    solutionUrl
  ) {
    if (!course || !lesson) {
      return;
    }

    if (
      !hasLessonAccess(
        course,
        lesson
      )
    ) {
      window.alert(
        "المحاضرة مقفولة."
      );

      return;
    }

    if (
      !isHomeworkSubmitted(
        course,
        lesson
      )
    ) {
      window.alert(
        "لازم تسلّم الواجب أولًا قبل مشاهدة فيديو الحل."
      );

      return;
    }

    if (
      !hasValue(solutionUrl)
    ) {
      return;
    }

    setActiveLesson({
      course,

      lesson: {
        ...lesson,

        title:
          lesson.homeworkSolutionTitle ||
          "فيديو حل الواجب",

        youtubeUrl:
          solutionUrl,
      },

      mode: "solution",
    });

    setYoutubePlayer(null);

    setVideoIsPlaying(false);

    setWatchPercent(0);
  }

  function closeLesson() {
    setActiveLesson(null);

    setYoutubePlayer(null);

    setVideoIsPlaying(false);

    setWatchPercent(0);
  }

  /*
    ============================
    حفظ مشاهدة 30%
    ============================
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

          const now =
            Timestamp.now();

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
            ...(savedLessons[
              lesson.id
            ] || {}),
          };

          const wasAlreadyWatched =
            oldLessonProgress.videoWatched ===
            true;

          savedLessons[lesson.id] = {
            ...oldLessonProgress,

            lessonId:
              lesson.id,

            lessonTitle:
              lesson.title,

            videoWatched:
              true,

            watchedPercent:
              REQUIRED_WATCH_PERCENT,

            watchedSeconds:
              Math.floor(
                currentSeconds
              ),

            videoDurationSeconds:
              Math.floor(
                durationSeconds
              ),

            homeworkUnlocked:
              true,

            examUnlocked:
              true,

            homeworkSolutionUnlocked:
              oldLessonProgress.homeworkSolutionUnlocked ===
              true,

            firstWatchedAt:
              oldLessonProgress.firstWatchedAt ||
              now,

            lastWatchedAt:
              now,
          };

          courseProgress[
            course.id
          ] = {
            ...savedCourseProgress,

            courseId:
              course.id,

            courseTitle:
              course.title,

            lessons:
              savedLessons,

            updatedAt:
              now,
          };

          const watchHistory =
            Array.isArray(
              savedStudent.watchHistory
            )
              ? [
                  ...savedStudent.watchHistory,
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

            courseId:
              course.id,

            courseName:
              course.title,

            lessonId:
              lesson.id,

            lessonName:
              lesson.title,

            watchedPercent:
              REQUIRED_WATCH_PERCENT,

            watchedSeconds:
              Math.floor(
                currentSeconds
              ),

            videoDurationSeconds:
              Math.floor(
                durationSeconds
              ),

            videoWatched:
              true,

            lastWatch:
              now,
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

              firstWatch:
                now,

              watchCount:
                1,
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

              updatedAt:
                now,
            }
          );
        }
      );

      setWatchPercent(
        REQUIRED_WATCH_PERCENT
      );
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
    ============================
    متابعة الفيديو
    ============================
  */

  useEffect(() => {
    if (
      !youtubePlayer ||
      !activeLesson ||
      !videoIsPlaying ||
      activeLesson.mode !==
        "lesson"
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
              (
                currentSeconds /
                durationSeconds
              ) * 100;

            setWatchPercent(
              Math.min(
                Math.round(
                  calculatedPercent
                ),
                100
              )
            );

            if (
              calculatedPercent >=
              REQUIRED_WATCH_PERCENT
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
    ============================
    PDF
    ============================
  */

  function openPdf(
    lesson
  ) {
    if (
      !lesson ||
      !hasValue(
        lesson.pdfUrl
      )
    ) {
      return;
    }

    window.open(
      lesson.pdfUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    ============================
    فتح الواجب المكتوب
    ============================
  */

  function openHomework(
    lesson
  ) {
    if (
      !selectedCourse ||
      !lesson
    ) {
      return;
    }

    if (
      !hasLessonAccess(
        selectedCourse,
        lesson
      )
    ) {
      window.alert(
        "المحاضرة مقفولة."
      );

      return;
    }

    if (
      !isLessonWatched(
        selectedCourse.id,
        lesson.id
      )
    ) {
      window.alert(
        "شاهد 30% من فيديو الشرح أولًا."
      );

      return;
    }

    const homeworkKey =
      lesson.homeworkKey;

    if (
      !hasValue(
        homeworkKey
      )
    ) {
      window.alert(
        "لم يتم ربط واجب بهذه المحاضرة."
      );

      return;
    }

    /*
      واجبات المحاضرات الجديدة الخاصة بالكورس
      نبحث عنها أولًا في الملف المنفصل.

      الواجبات القديمة تظل تعمل من homeworkData
      بدون تغيير نظام تسليم الواجب الخارجي.
    */
    const selectedData =
      courseHomeworkData[
        homeworkKey
      ] ||
      homeworkData[
        homeworkKey
      ];

    if (
      !selectedData
    ) {
      window.alert(
        "تعذر تحميل بيانات الواجب."
      );

      console.error(
        "Homework key not found:",
        homeworkKey
      );

      return;
    }

    setSelectedHomework(
      selectedData
    );

    setSelectedHomeworkLesson(
      lesson
    );

    setHomeworkAnswers({});

    setHomeworkResult(null);

    setActiveLesson(null);

    window.scrollTo(
      0,
      0
    );
  }

  function handleHomeworkAnswer(
    questionId,
    optionIndex
  ) {
    if (
      homeworkResult
    ) {
      return;
    }

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
    تسليم الواجب داخل الكورس
    ============================
  */

  async function submitHomework() {
    if (
      !selectedHomework ||
      !selectedHomeworkLesson ||
      !selectedCourse
    ) {
      return;
    }

    if (!studentUid) {
      window.alert(
        "برجاء تسجيل الدخول أولًا."
      );

      return;
    }

    const activeQuestions =
      Array.isArray(
        selectedHomework.questions
      )
        ? selectedHomework.questions.filter(
            (question) =>
              question.cancelled !==
              true
          )
        : [];

    if (
      activeQuestions.length ===
      0
    ) {
      window.alert(
        "لا توجد أسئلة في الواجب."
      );

      return;
    }

    const unanswered =
      activeQuestions.filter(
        (question) =>
          homeworkAnswers[
            question.id
          ] === undefined
      );

    if (
      unanswered.length > 0
    ) {
      window.alert(
        `لسه عندك ${unanswered.length} سؤال بدون إجابة.`
      );

      return;
    }

    let correctAnswers = 0;

    activeQuestions.forEach(
      (question) => {
        if (
          homeworkAnswers[
            question.id
          ] ===
          question.correctAnswer
        ) {
          correctAnswers += 1;
        }
      }
    );

    const totalQuestions =
      activeQuestions.length;

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (
              correctAnswers /
              totalQuestions
            ) * 100
          )
        : 0;

    setIsSubmittingHomework(
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
            throw new Error(
              "STUDENT_NOT_FOUND"
            );
          }

          const savedStudent =
            studentSnapshot.data();

          const now =
            Timestamp.now();

          const courseProgress = {
            ...(savedStudent.courseProgress ||
              {}),
          };

          const oldCourseProgress = {
            ...(courseProgress[
              selectedCourse.id
            ] || {}),
          };

          const lessonsProgress = {
            ...(oldCourseProgress.lessons ||
              {}),
          };

          const oldLessonProgress = {
            ...(lessonsProgress[
              selectedHomeworkLesson.id
            ] || {}),
          };

          const wasAlreadySubmitted =
            oldLessonProgress.homeworkSubmitted ===
            true;

          lessonsProgress[
            selectedHomeworkLesson.id
          ] = {
            ...oldLessonProgress,

            lessonId:
              selectedHomeworkLesson.id,

            lessonTitle:
              selectedHomeworkLesson.title,

            homeworkUnlocked:
              true,

            homeworkSubmitted:
              true,

            homeworkCompleted:
              true,

            homeworkDone:
              true,

            homeworkSolutionUnlocked:
              true,

            homeworkId:
              selectedHomework.id,

            homeworkTitle:
              selectedHomework.title,

            homeworkScore:
              correctAnswers,

            homeworkTotal:
              totalQuestions,

            homeworkPercentage:
              percentage,

            homeworkSubmittedAt:
              now,
          };

          courseProgress[
            selectedCourse.id
          ] = {
            ...oldCourseProgress,

            courseId:
              selectedCourse.id,

            courseTitle:
              selectedCourse.title,

            lessons:
              lessonsProgress,

            updatedAt:
              now,
          };

          const homeworkResults =
            Array.isArray(
              savedStudent.homeworkResults
            )
              ? [
                  ...savedStudent.homeworkResults,
                ]
              : [];

          const resultIndex =
            homeworkResults.findIndex(
              (result) =>
                result?.courseId ===
                  selectedCourse.id &&
                result?.lessonId ===
                  selectedHomeworkLesson.id &&
                result?.homeworkId ===
                  selectedHomework.id
            );

          const resultData = {
            id:
              `${selectedCourse.id}-${selectedHomeworkLesson.id}-${selectedHomework.id}`,

            homeworkId:
              selectedHomework.id,

            homeworkTitle:
              selectedHomework.title,

            courseId:
              selectedCourse.id,

            courseTitle:
              selectedCourse.title,

            lessonId:
              selectedHomeworkLesson.id,

            lessonTitle:
              selectedHomeworkLesson.title,

            grade:
              selectedCourse.grade,

            score:
              correctAnswers,

            total:
              totalQuestions,

            percentage,

            answers:
              homeworkAnswers,

            submitted:
              true,

            completed:
              true,

            homeworkSubmitted:
              true,

            submittedAt:
              now,
          };

          if (
            resultIndex >= 0
          ) {
            homeworkResults[
              resultIndex
            ] = {
              ...homeworkResults[
                resultIndex
              ],

              ...resultData,
            };
          } else {
            homeworkResults.push(
              resultData
            );
          }

          transaction.update(
            studentReference,
            {
              courseProgress,

              homeworkResults,

              completedHomeworks:
                wasAlreadySubmitted
                  ? Number(
                      savedStudent.completedHomeworks ||
                        0
                    )
                  : Number(
                      savedStudent.completedHomeworks ||
                        0
                    ) + 1,

              updatedAt:
                now,
            }
          );
        }
      );

      setHomeworkResult({
        score:
          correctAnswers,

        total:
          totalQuestions,

        percentage,
      });

      window.scrollTo(
        0,
        0
      );
    } catch (error) {
      console.error(
        "Homework submit error:",
        error
      );

      window.alert(
        "حدث خطأ أثناء تسليم الواجب."
      );
    } finally {
      setIsSubmittingHomework(
        false
      );
    }
  }

  function closeHomework() {
    setSelectedHomework(null);

    setSelectedHomeworkLesson(
      null
    );

    setHomeworkAnswers({});

    setHomeworkResult(null);

    window.scrollTo(
      0,
      0
    );
  }

  /*
    ============================
    الامتحان
    ============================
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
      !hasLessonAccess(
        course,
        lesson
      )
    ) {
      window.alert(
        "المحاضرة مقفولة."
      );

      return;
    }

    if (
      !isLessonWatched(
        course.id,
        lesson.id
      )
    ) {
      window.alert(
        "شاهد 30% من الفيديو أولًا."
      );

      return;
    }

    let finalExamKey =
      examKey;

    if (
      course.id ===
      "second-course-2"
    ) {
      if (
        examKey ===
        "exam1"
      ) {
        finalExamKey =
          "secondCourse2Exam1";
      }

      if (
        examKey ===
        "exam2"
      ) {
        finalExamKey =
          "secondCourse2Exam2";
      }
    }

    const selectedExamData =
      examsData[
        finalExamKey
      ];

    if (
      !selectedExamData
    ) {
      window.alert(
        "تعذر تحميل بيانات الامتحان."
      );

      console.error(
        "Exam key not found:",
        finalExamKey
      );

      return;
    }

    setSelectedExam(
      selectedExamData
    );

    setActiveLesson(null);

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
    مودال الفيديو
    ============================
  */

  function renderVideoModal() {
    if (!activeLesson) {
      return null;
    }

    const videoId =
      extractYouTubeVideoId(
        activeLesson.lesson.youtubeUrl
      );

    const isMainLesson =
      activeLesson.mode ===
      "lesson";

    const lessonWatched =
      isMainLesson
        ? isLessonWatched(
            activeLesson.course.id,
            activeLesson.lesson.id
          )
        : true;

    const hasHomework =
      activeLesson.lesson
        ?.homeworkEnabled ===
        true ||
      hasValue(
        activeLesson.lesson
          ?.homeworkKey
      );

    return (
      <div className="course-lesson-overlay">
        <div className="course-lesson-modal">
          <button
            type="button"
            className="course-lesson-close"
            onClick={closeLesson}
          >
            ×
          </button>

          <h2>
            {activeLesson.lesson.title}
          </h2>

          {activeLesson.lesson.duration && (
            <p className="course-lesson-duration">
              مدة الفيديو:{" "}
              {
                activeLesson.lesson
                  .duration
              }
            </p>
          )}

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
                onReady={(event) =>
                  setYoutubePlayer(
                    event.target
                  )
                }
                onStateChange={(
                  event
                ) => {
                  if (
                    isMainLesson
                  ) {
                    setVideoIsPlaying(
                      event.data === 1
                    );
                  }
                }}
              />
            ) : (
              <div>
                لم تتم إضافة رابط فيديو صحيح.
              </div>
            )}
          </div>

          {isMainLesson && (
            <div className="course-watch-progress">
              <div className="course-watch-progress-heading">
                <span>
                  نسبة المشاهدة
                </span>

                <strong>
                  {lessonWatched
                    ? "تم تسجيل 30%"
                    : `${watchPercent}%`}
                </strong>
              </div>

              <div className="course-watch-progress-bar">
                <div
                  className="course-watch-progress-fill"
                  style={{
                    width: `${Math.min(
                      lessonWatched
                        ? REQUIRED_WATCH_PERCENT
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
                    ? hasHomework
                      ? "✅ تم مشاهدة 30% وفتح الواجب."
                      : "✅ تم مشاهدة 30% وفتح الامتحان."
                    : hasHomework
                      ? "يتم فتح الواجب بعد مشاهدة 30% من فيديو الشرح."
                      : "يتم فتح الامتحان بعد مشاهدة 30% من فيديو الشرح."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /*
    ============================
    صفحة الواجب
    ============================
  */

  if (
    selectedHomework &&
    selectedHomeworkLesson &&
    selectedCourse
  ) {
    const questions =
      Array.isArray(
        selectedHomework.questions
      )
        ? selectedHomework.questions.filter(
            (question) =>
              question.cancelled !==
              true
          )
        : [];

    return (
      <section
        style={{
          width: "100%",
          minHeight: "100vh",
          padding: "25px",
          direction: "rtl",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={closeHomework}
          style={{
            marginBottom: "25px",
            padding: "12px 18px",
            border:
              "1px solid #8b6546",
            borderRadius: "12px",
            background: "#fffaf3",
            color: "#6b472f",
            fontWeight: "800",
            cursor: "pointer",
            display:
              "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaArrowRight />
          الرجوع إلى المحاضرة
        </button>

        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              padding: "25px",
              marginBottom: "25px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg,#3d281c,#67472f)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <FaClipboardCheck
              style={{
                fontSize: "38px",
                marginBottom:
                  "10px",
              }}
            />

            <h1
              style={{
                margin:
                  "0 0 8px",
              }}
            >
              {selectedHomework.title ||
                "واجب المحاضرة"}
            </h1>

            <p
              style={{
                margin: 0,
              }}
            >
              {
                selectedHomeworkLesson.title
              }
            </p>

            <p>
              عدد الأسئلة:{" "}
              {questions.length}
            </p>
          </div>

          {homeworkResult && (
            <div
              style={{
                marginBottom:
                  "25px",
                padding: "22px",
                borderRadius:
                  "16px",
                textAlign:
                  "center",
                background:
                  "#e8f7ee",
                color:
                  "#176b43",
                fontWeight:
                  "bold",
              }}
            >
              <FaCheckCircle
                style={{
                  fontSize:
                    "30px",
                  marginBottom:
                    "8px",
                }}
              />

              <h2>
                تم تسليم الواجب ✅
              </h2>

              <p
                style={{
                  fontSize:
                    "20px",
                }}
              >
                درجتك:{" "}
                {
                  homeworkResult.score
                }{" "}
                من{" "}
                {
                  homeworkResult.total
                }
              </p>

              <p>
                النسبة:{" "}
                {
                  homeworkResult.percentage
                }
                %
              </p>

              <p>
                تم فتح فيديو حل
                الواجب.
              </p>
            </div>
          )}

          {questions.map(
            (
              question,
              questionIndex
            ) => {
              const selectedAnswer =
                homeworkAnswers[
                  question.id
                ];

              return (
                <div
                  key={
                    question.id
                  }
                  style={{
                    marginBottom:
                      "18px",
                    padding:
                      "22px",
                    borderRadius:
                      "16px",
                    border:
                      "1px solid #d9c1aa",
                    background:
                      "#fffaf3",
                    boxShadow:
                      "0 7px 18px rgba(0,0,0,0.07)",
                  }}
                >
                  <h3
                    style={{
                      margin:
                        "0 0 18px",
                      lineHeight:
                        "1.9",
                      color:
                        "#4a2f1f",
                    }}
                  >
                    {questionIndex +
                      1}
                    .{" "}
                    {
                      question.question
                    }
                  </h3>

                  <div
                    style={{
                      display:
                        "grid",
                      gap: "10px",
                    }}
                  >
                    {question.options.map(
                      (
                        option,
                        optionIndex
                      ) => {
                        const checked =
                          selectedAnswer ===
                          optionIndex;

                        return (
                          <button
                            key={
                              optionIndex
                            }
                            type="button"
                            disabled={
                              !!homeworkResult
                            }
                            onClick={() =>
                              handleHomeworkAnswer(
                                question.id,
                                optionIndex
                              )
                            }
                            style={{
                              width:
                                "100%",
                              padding:
                                "14px 16px",
                              borderRadius:
                                "12px",
                              border:
                                checked
                                  ? "2px solid #8b6546"
                                  : "1px solid #d9c1aa",
                              background:
                                checked
                                  ? "#f3e5d5"
                                  : "#fff",
                              color:
                                "#3d281c",
                              textAlign:
                                "right",
                              fontWeight:
                                "700",
                              cursor:
                                homeworkResult
                                  ? "default"
                                  : "pointer",
                            }}
                          >
                            {
                              option
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            }
          )}

          {!homeworkResult && (
            <button
              type="button"
              disabled={
                isSubmittingHomework
              }
              onClick={
                submitHomework
              }
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius:
                  "14px",
                background:
                  "#6b472f",
                color: "#fff",
                fontSize:
                  "18px",
                fontWeight:
                  "900",
                cursor:
                  "pointer",
                marginBottom:
                  "30px",
              }}
            >
              {isSubmittingHomework
                ? "جاري تسليم الواجب..."
                : "تسليم الواجب"}
            </button>
          )}
        </div>
      </section>
    );
  }

  /*
    ============================
    صفحة الامتحان
    ============================
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
    ============================
    محتوى الكورس
    ============================
  */

  if (selectedCourse) {
    return (
      <>
        <CourseContent
          course={
            selectedCourse
          }
          onBack={
            closeCourseContent
          }
          isLessonUnlocked={(
            lesson
          ) =>
            hasLessonAccess(
              selectedCourse,
              lesson
            )
          }
          getLessonWatched={(
            lesson
          ) =>
            isLessonWatched(
              selectedCourse.id,
              lesson.id
            )
          }
          getHomeworkSubmitted={(
            lesson
          ) =>
            isHomeworkSubmitted(
              selectedCourse,
              lesson
            )
          }
          lessonActivationCodes={
            lessonActivationCodes
          }
          onLessonCodeChange={
            handleLessonCodeChange
          }
          activatingLessonId={
            activatingLessonId
          }
          onActivateLessonCode={(
            lesson
          ) =>
            activateLessonCode(
              selectedCourse,
              lesson
            )
          }
          onOpenVideo={(
            lesson
          ) =>
            openLesson(
              selectedCourse,
              lesson
            )
          }
          onOpenPdf={(
            lesson
          ) =>
            openPdf(
              lesson
            )
          }
          onOpenHomework={(
            lesson
          ) =>
            openHomework(
              lesson
            )
          }
          onOpenHomeworkSolution={(
            lesson,
            solutionUrl
          ) =>
            openHomeworkSolution(
              selectedCourse,
              lesson,
              solutionUrl
            )
          }
          onOpenExam={(
            lesson,
            examKey
          ) =>
            openExam(
              selectedCourse,
              lesson,
              examKey
            )
          }
        />

        {renderVideoModal()}
      </>
    );
  }

  /*
    ============================
    جميع الكورسات
    ============================
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
              الكورسات المتاحة
              لطلاب{" "}
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
              جاري تحميل
              الكورسات...
            </h2>
          </div>
        ) : coursesError ? (
          <div className="all-courses-empty">
            <h2>
              حدث خطأ
            </h2>

            <p>
              {coursesError}
            </p>
          </div>
        ) : visibleCourses.length ===
          0 ? (
          <div className="all-courses-empty">
            <div className="all-courses-empty-icon">
              <FaGraduationCap />
            </div>

            <h2>
              مفيش كورسات متاحة
              حاليًا
            </h2>
          </div>
        ) : (
          <div className="courses-shop-grid">
            {visibleCourses.map(
              (course) => {
                const paid =
                  isPaidCourse(
                    course
                  );

                const unlocked =
                  hasCourseAccess(
                    course
                  );

                const courseAccess =
                  getCourseAccess(
                    course
                  );

                const hasWholeCourseAccess =
                  !paid ||
                  (unlocked &&
                    courseAccess?.accessType !==
                      "lesson");

                return (
                  <article
                    className="course-shop-card"
                    key={
                      course.id
                    }
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
                            top:
                              "14px",
                            right:
                              "14px",
                            padding:
                              "8px 14px",
                            borderRadius:
                              "30px",
                            background:
                              paid
                                ? hasWholeCourseAccess
                                  ? "#168d55"
                                  : "#31271f"
                                : "#168d55",
                            color:
                              "#fff",
                            fontWeight:
                              "bold",
                          }}
                        >
                          {!paid
                            ? "مجاني"
                            : hasWholeCourseAccess
                              ? "مشترك"
                              : courseAccess?.accessType ===
                                  "lesson"
                                ? "عندك محاضرة مفعلة"
                                : "اشتراك"}
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

                      {hasWholeCourseAccess ? (
                        <button
                          type="button"
                          className="course-start-btn"
                          disabled={
                            !course.lessons
                              ?.length
                          }
                          onClick={() => {
                            const firstAvailable =
                              course.lessons?.find(
                                (
                                  lesson
                                ) =>
                                  hasLessonAccess(
                                    course,
                                    lesson
                                  ) &&
                                  hasValue(
                                    lesson.youtubeUrl ||
                                      lesson.videoUrl
                                  )
                              );

                            if (
                              firstAvailable
                            ) {
                              openLesson(
                                course,
                                firstAvailable
                              );
                            } else {
                              openCourseContent(
                                course
                              );
                            }
                          }}
                        >
                          <FaPlay />
                          ابدأ
                        </button>
                      ) : (
                        <>
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

                          <div
                            style={{
                              width:
                                "100%",
                              marginTop:
                                "12px",
                            }}
                          >
                            <input
                              type="text"
                              value={
                                activationCodes[
                                  course.id
                                ] ||
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                handleActivationCodeChange(
                                  course.id,
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="كود الشهر أو الترم"
                              autoComplete="off"
                              maxLength={
                                20
                              }
                              style={{
                                width:
                                  "100%",
                                minHeight:
                                  "48px",
                                padding:
                                  "10px 14px",
                                borderRadius:
                                  "12px",
                                border:
                                  "1px solid #d7c2ae",
                                fontSize:
                                  "16px",
                                fontWeight:
                                  "700",
                                textAlign:
                                  "center",
                                boxSizing:
                                  "border-box",
                                marginBottom:
                                  "10px",
                                direction:
                                  "ltr",
                                color:
                                  "#222",
                                background:
                                  "#fff",
                                WebkitTextFillColor:
                                  "#222",
                                caretColor:
                                  "#222",
                              }}
                            />

                            <button
                              type="button"
                              className="course-content-btn"
                              style={{
                                width:
                                  "100%",
                              }}
                              disabled={
                                activatingCourseId ===
                                course.id
                              }
                              onClick={() =>
                                activateCourseCode(
                                  course
                                )
                              }
                            >
                              {activatingCourseId ===
                              course.id
                                ? "جاري التفعيل..."
                                : "تفعيل اشتراك الكورس"}
                            </button>
                          </div>
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