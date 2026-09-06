import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import YouTube from "react-youtube";

import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import homeworkData from "./homeworkData";

import {
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
  FaLock,
  FaPlay,
  FaChevronLeft,
} from "react-icons/fa";

import "./Homework.css";

/* =========================================================
   Helpers عامة
========================================================= */

function normalizeGrade(value) {
  const text = String(value || "")
    .trim()
    .replace(/^الصف\s+/u, "");

  if (
    text.includes("الثاني") ||
    text.includes("الثانى") ||
    text.includes("تاني") ||
    text.includes("تانية")
  ) {
    return "الثاني الثانوي";
  }

  if (
    text.includes("الثالث") ||
    text.includes("تالت") ||
    text.includes("تالتة")
  ) {
    return "الثالث الثانوي";
  }

  return text;
}

function normalizeArabicText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()

    /* إزالة التشكيل */
    .replace(
      /[\u0617-\u061A\u064B-\u0652]/g,
      ""
    )

    /* إزالة التطويل */
    .replace(/ـ/g, "")

    /* توحيد الألف */
    .replace(/[أإآٱ]/g, "ا")

    /* توحيد الياء */
    .replace(/ى/g, "ي")

    /* توحيد الهاء والتاء المربوطة */
    .replace(/ة/g, "ه")

    /* إزالة علامات الترقيم */
    .replace(
      /[.,،؛;:!?؟"'“”‘’()[\]{}]/g,
      " "
    )

    /* المسافات */
    .replace(/\s+/g, " ")
    .trim();
}

function isEssayQuestion(question) {
  return (
    question?.type === "essay" ||
    !Array.isArray(question?.options)
  );
}

function isQuestionAnswered(
  question,
  answer
) {
  if (question?.cancelled) {
    return true;
  }

  if (isEssayQuestion(question)) {
    return (
      typeof answer === "string" &&
      answer.trim().length > 0
    );
  }

  return (
    answer !== undefined &&
    answer !== null
  );
}

function getQuestionDisplayNumber(
  question,
  index
) {
  return (
    question?.number ??
    question?.questionNumber ??
    index + 1
  );
}

/* =========================================================
   تصحيح المقالي
========================================================= */

function getImportantWords(text) {
  const ignoredWords = new Set([
    "هو",
    "هي",
    "في",
    "من",
    "على",
    "عن",
    "الى",
    "إلى",
    "و",
    "او",
    "أو",
    "ان",
    "إن",
    "انه",
    "أنه",
    "لان",
    "لأن",
    "ب",
    "ال",
    "اسلوب",
    "أسلوب",
    "وسيله",
    "وسيلة",
    "نوع",
  ]);

  return normalizeArabicText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length > 1 &&
        !ignoredWords.has(word)
    );
}

function calculateAnswerSimilarity(
  firstText,
  secondText
) {
  const firstWords =
    getImportantWords(firstText);

  const secondWords =
    getImportantWords(secondText);

  if (
    firstWords.length === 0 ||
    secondWords.length === 0
  ) {
    return 0;
  }

  const firstSet = new Set(
    firstWords
  );

  const secondSet = new Set(
    secondWords
  );

  let common = 0;

  firstSet.forEach((word) => {
    if (secondSet.has(word)) {
      common += 1;
    }
  });

  const largestLength = Math.max(
    firstSet.size,
    secondSet.size
  );

  if (largestLength === 0) {
    return 0;
  }

  return common / largestLength;
}

function isEssayAnswerCorrect(
  studentAnswer,
  question
) {
  const normalizedStudent =
    normalizeArabicText(
      studentAnswer
    );

  if (!normalizedStudent) {
    return false;
  }

  const acceptedAnswers =
    Array.isArray(
      question?.acceptedAnswers
    )
      ? question.acceptedAnswers
      : [];

  if (
    acceptedAnswers.length === 0
  ) {
    return false;
  }

  for (const acceptedAnswer of acceptedAnswers) {
    const normalizedAccepted =
      normalizeArabicText(
        acceptedAnswer
      );

    if (
      normalizedStudent ===
      normalizedAccepted
    ) {
      return true;
    }

    const studentWords =
      getImportantWords(
        normalizedStudent
      );

    const acceptedWords =
      getImportantWords(
        normalizedAccepted
      );

    /*
      الإجابات القصيرة جدًا
      يجب أن تكون مطابقة مباشرة.
    */

    if (
      studentWords.length <= 1 ||
      acceptedWords.length <= 1
    ) {
      continue;
    }

    const similarity =
      calculateAnswerSimilarity(
        normalizedStudent,
        normalizedAccepted
      );

    if (similarity >= 0.7) {
      return true;
    }
  }

  return false;
}

/* =========================================================
   الواجب الأول - تالتة ثانوي
========================================================= */

const FIRST_HOMEWORK_CANCELLED_QUESTIONS = [
  7,
  17,
  18,
  19,
  24,
  26,
  27,
  33,
];

const FIRST_HOMEWORK_CORRECT_ANSWERS = {
  1: 1,
  2: 1,
  3: 0,
  4: 1,
  5: 1,
  6: 2,

  8: 1,
  9: 3,
  10: 2,
  11: 2,
  12: 0,
  13: 1,
  14: 1,
  15: 3,
  16: 1,

  20: 0,
  21: 1,
  22: 1,
  23: 3,

  25: 2,

  28: 2,
  29: 0,
  30: 1,
  31: 1,
  32: 0,

  34: 1,
  35: 3,
  36: 1,
  37: 2,
};

const FIRST_HOMEWORK_QUESTIONS =
  Array.from(
    {
      length: 37,
    },
    (_, index) => {
      const questionNumber =
        index + 1;

      const isCancelled =
        FIRST_HOMEWORK_CANCELLED_QUESTIONS.includes(
          questionNumber
        );

      return {
        id: `homework-1-q${questionNumber}`,

        questionNumber,

        question: `السؤال ${questionNumber}`,

        options: [
          "أ",
          "ب",
          "ج",
          "د",
        ],

        cancelled:
          isCancelled,

        correctAnswer:
          isCancelled
            ? null
            : FIRST_HOMEWORK_CORRECT_ANSWERS[
                questionNumber
              ],
      };
    }
  );

/* =========================================================
   الواجب الثاني - تالتة ثانوي
========================================================= */

const SECOND_HOMEWORK_CORRECT_ANSWERS = {
  1: 3,
  2: 1,
  3: 0,
  4: 3,
  5: 1,
  6: 2,
  7: 1,
  8: 1,
  9: 1,
  10: 1,
  11: 2,
  12: 0,
  13: 1,
  14: 0,
  15: 3,
  16: 0,
  17: 1,
  18: 2,
  19: 0,
  20: 1,
};

const SECOND_HOMEWORK_QUESTIONS =
  Array.from(
    {
      length: 20,
    },
    (_, index) => {
      const questionNumber =
        index + 1;

      return {
        id: `third-homework-2-q${questionNumber}`,

        questionNumber,

        question: `السؤال ${questionNumber}`,

        options: [
          "أ",
          "ب",
          "ج",
          "د",
        ],

        cancelled: false,

        correctAnswer:
          SECOND_HOMEWORK_CORRECT_ANSWERS[
            questionNumber
          ],
      };
    }
  );

/* =========================================================
   واجب تانية ثانوي من homeworkData
========================================================= */

const SECOND_CENTER_HOMEWORK_SOURCE =
  homeworkData?.[
    "second-center-homework-1"
  ] || null;

const SECOND_CENTER_HOMEWORK =
  SECOND_CENTER_HOMEWORK_SOURCE
    ? {
        ...SECOND_CENTER_HOMEWORK_SOURCE,

        id:
          SECOND_CENTER_HOMEWORK_SOURCE.id ||
          "second-center-homework-1",

        title:
          SECOND_CENTER_HOMEWORK_SOURCE.title ||
          "واجب تانية ثانوي",

        grade:
          SECOND_CENTER_HOMEWORK_SOURCE.grade ||
          "الثاني الثانوي",

        studentType: "center",

        centerOnly: true,

        videoId:
          SECOND_CENTER_HOMEWORK_SOURCE.videoId ||
          "LosP4RjBCfM",

        questions:
          Array.isArray(
            SECOND_CENTER_HOMEWORK_SOURCE.questions
          )
            ? SECOND_CENTER_HOMEWORK_SOURCE.questions
            : [],
      }
    : null;

/* =========================================================
   بيانات الواجبات
========================================================= */

const HOMEWORKS = [
  {
    id: "homework-1",

    title:
      "واجب المحاضرة الأولي",

    grade:
      "الثالث الثانوي",

    studentType: "center",

    videoId:
      "qa2X7xgsay0",

    questions:
      FIRST_HOMEWORK_QUESTIONS,
  },

  {
    id: "third-homework-2",

    title:
      "واجب المحاضرة الثانية",

    grade:
      "الثالث الثانوي",

    studentType: "center",

    videoId:
      "6pv2Rb6UPr4",

    questions:
      SECOND_HOMEWORK_QUESTIONS,
  },

  ...(SECOND_CENTER_HOMEWORK
    ? [
        SECOND_CENTER_HOMEWORK,
      ]
    : []),
];

/* =========================================================
   هل الطالب مسموح له؟
========================================================= */

function canStudentAccessHomework(
  student,
  homework
) {
  if (
    !student ||
    !homework
  ) {
    return false;
  }

  if (
    student.studentType !==
    "center"
  ) {
    return false;
  }

  const studentGrade =
    normalizeGrade(
      student.grade
    );

  const homeworkGrade =
    normalizeGrade(
      homework.grade
    );

  if (
    homeworkGrade &&
    studentGrade !==
      homeworkGrade
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   تنظيف محاولات الواجبات القديمة

   مهم:
   لو الواجب مكتمل، لا نحتاج الاحتفاظ
   بنسخة كاملة من النتيجة والإجابات
   داخل homeworkAttempts لأن النتيجة
   الأصلية موجودة في homeworkResults.
========================================================= */

function cleanCompletedHomeworkAttempts(
  attempts
) {
  const cleanedAttempts = {};

  Object.entries(
    attempts || {}
  ).forEach(
    ([homeworkId, attempt]) => {
      if (
        !attempt ||
        typeof attempt !==
          "object"
      ) {
        cleanedAttempts[
          homeworkId
        ] = attempt;

        return;
      }

      if (
        attempt.completed ===
        true
      ) {
        const oldResult =
          attempt.result &&
          typeof attempt.result ===
            "object"
            ? attempt.result
            : {};

        cleanedAttempts[
          homeworkId
        ] = {
          ...attempt,

          /*
            بعد التسليم لا نحتاج
            نسخة أخرى من كل الإجابات.
          */
          answers: {},

          /*
            نخزن ملخص النتيجة فقط.
          */
          result: {
            homeworkId:
              oldResult.homeworkId ||
              attempt.homeworkId ||
              homeworkId,

            score:
              oldResult.score ??
              0,

            totalQuestions:
              oldResult.totalQuestions ??
              0,

            percentage:
              oldResult.percentage ??
              0,

            completed: true,

            submitted: true,

            videoUnlocked: true,
          },
        };

        return;
      }

      cleanedAttempts[
        homeworkId
      ] = attempt;
    }
  );

  return cleanedAttempts;
}

/* =========================================================
   Component
========================================================= */

function Homework({
  currentStudent,
}) {
  const [
    openedSection,
    setOpenedSection,
  ] = useState(null);

  const [
    activeHomeworkId,
    setActiveHomeworkId,
  ] = useState(null);

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState(null);

  const [
    isLoadingAttempt,
    setIsLoadingAttempt,
  ] = useState(false);

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    homeworkStatuses,
    setHomeworkStatuses,
  ] = useState({});

  /*
    Lock فوري.
    useState وحده يحتاج Render جديد،
    لكن useRef يتغير فورًا.
  */
  const submittingRef =
    useRef(false);

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const studentGrade =
    normalizeGrade(
      currentStudent?.grade
    );

  const isAllowedStudent =
    currentStudent?.studentType ===
      "center" &&
    (
      studentGrade ===
        "الثالث الثانوي" ||
      studentGrade ===
        "الثاني الثانوي"
    );

  /* =========================================================
     الواجبات المناسبة للطالب
  ========================================================= */

  const studentHomeworks =
    useMemo(() => {
      return HOMEWORKS.filter(
        (homework) =>
          canStudentAccessHomework(
            currentStudent,
            homework
          )
      );
    }, [currentStudent]);

  const activeHomework =
    useMemo(
      () =>
        studentHomeworks.find(
          (homework) =>
            homework.id ===
            activeHomeworkId
        ) || null,
      [
        activeHomeworkId,
        studentHomeworks,
      ]
    );

  const questions =
    activeHomework?.questions ||
    [];

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  const answeredQuestionsCount =
    questions.filter(
      (question) =>
        isQuestionAnswered(
          question,
          answers[
            question.id
          ]
        )
    ).length;

  const progressPercentage =
    questions.length > 0
      ? Math.round(
          (
            answeredQuestionsCount /
            questions.length
          ) * 100
        )
      : 0;

  /* =========================================================
     تحميل حالة كل الواجبات
  ========================================================= */

  useEffect(() => {
    async function loadDashboard() {
      if (
        !studentUid ||
        !isAllowedStudent
      ) {
        setIsLoadingDashboard(
          false
        );

        return;
      }

      setIsLoadingDashboard(
        true
      );

      try {
        const studentReference =
          doc(
            db,
            "students",
            studentUid
          );

        const studentSnapshot =
          await getDoc(
            studentReference
          );

        if (
          !studentSnapshot.exists()
        ) {
          return;
        }

        const studentData =
          studentSnapshot.data();

        const attempts =
          studentData.homeworkAttempts &&
          typeof studentData.homeworkAttempts ===
            "object"
            ? studentData.homeworkAttempts
            : {};

        const results =
          Array.isArray(
            studentData.homeworkResults
          )
            ? studentData.homeworkResults
            : [];

        const nextStatuses =
          {};

        studentHomeworks.forEach(
          (homework) => {
            const attempt =
              attempts[
                homework.id
              ];

            const savedResult =
              [...results]
                .reverse()
                .find(
                  (item) =>
                    item?.homeworkId ===
                    homework.id
                );

            const savedAnswers =
              attempt?.answers ||
              {};

            const answeredCount =
              homework.questions.filter(
                (question) =>
                  isQuestionAnswered(
                    question,
                    savedAnswers[
                      question.id
                    ]
                  )
              ).length;

            nextStatuses[
              homework.id
            ] = {
              completed:
                attempt?.completed ===
                  true ||
                savedResult?.completed ===
                  true,

              score:
                savedResult?.score ??
                attempt?.result
                  ?.score ??
                0,

              totalQuestions:
                savedResult
                  ?.totalQuestions ??
                attempt?.result
                  ?.totalQuestions ??
                homework.questions
                  .length,

              answeredCount:
                attempt?.completed ===
                  true ||
                savedResult?.completed ===
                  true
                  ? homework.questions
                      .length
                  : answeredCount,
            };
          }
        );

        setHomeworkStatuses(
          nextStatuses
        );
      } catch (error) {
        console.error(
          "Error loading homework dashboard:",
          error
        );
      } finally {
        setIsLoadingDashboard(
          false
        );
      }
    }

    loadDashboard();
  }, [
    studentUid,
    isAllowedStudent,
    studentHomeworks,
  ]);

  /* =========================================================
     تحميل الواجب المختار
  ========================================================= */

  useEffect(() => {
    async function loadHomeworkAttempt() {
      if (
        !activeHomework ||
        !studentUid ||
        !isAllowedStudent
      ) {
        return;
      }

      setIsLoadingAttempt(
        true
      );

      setAnswers({});

      setCurrentQuestionIndex(
        0
      );

      setSubmitted(false);

      setResult(null);

      try {
        const studentReference =
          doc(
            db,
            "students",
            studentUid
          );

        await runTransaction(
          db,
          async (
            transaction
          ) => {
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

            const studentData =
              studentSnapshot.data();

            if (
              !canStudentAccessHomework(
                studentData,
                activeHomework
              )
            ) {
              throw new Error(
                "HOMEWORK_NOT_ALLOWED"
              );
            }

            const homeworkAttempts =
              studentData.homeworkAttempts &&
              typeof studentData.homeworkAttempts ===
                "object"
                ? {
                    ...studentData.homeworkAttempts,
                  }
                : {};

            const savedAttempt =
              homeworkAttempts[
                activeHomework.id
              ];

            const homeworkResults =
              Array.isArray(
                studentData.homeworkResults
              )
                ? studentData.homeworkResults
                : [];

            const savedResult =
              [...homeworkResults]
                .reverse()
                .find(
                  (
                    savedHomeworkResult
                  ) =>
                    savedHomeworkResult?.homeworkId ===
                    activeHomework.id
                );

            if (
              savedAttempt?.completed ===
                true ||
              savedResult?.completed ===
                true
            ) {
              setResult(
                savedResult ||
                  savedAttempt?.result ||
                  null
              );

              setSubmitted(
                true
              );

              setAnswers(
                savedAttempt?.answers ||
                  {}
              );

              return;
            }

            if (savedAttempt) {
              setAnswers(
                savedAttempt.answers ||
                  {}
              );

              setCurrentQuestionIndex(
                Math.min(
                  Math.max(
                    Number(
                      savedAttempt.currentQuestionIndex ||
                        0
                    ),
                    0
                  ),
                  Math.max(
                    activeHomework
                      .questions
                      .length - 1,
                    0
                  )
                )
              );

              return;
            }

            homeworkAttempts[
              activeHomework.id
            ] = {
              homeworkId:
                activeHomework.id,

              title:
                activeHomework.title,

              courseId:
                activeHomework.courseId ||
                "",

              lessonId:
                activeHomework.lessonId ||
                "",

              grade:
                activeHomework.grade ||
                "",

              started: true,

              completed: false,

              submitted: false,

              answers: {},

              currentQuestionIndex:
                0,

              startedAt:
                Timestamp.now(),

              updatedAt:
                Timestamp.now(),
            };

            transaction.update(
              studentReference,
              {
                homeworkAttempts,

                updatedAt:
                  Timestamp.now(),
              }
            );
          }
        );
      } catch (error) {
        console.error(
          "Error loading homework:",
          {
            code: error?.code,
            message:
              error?.message,
            error,
          }
        );

        if (
          error?.message !==
          "HOMEWORK_NOT_ALLOWED"
        ) {
          window.alert(
            "حدث خطأ أثناء تحميل الواجب."
          );
        }
      } finally {
        setIsLoadingAttempt(
          false
        );
      }
    }

    loadHomeworkAttempt();
  }, [
    activeHomeworkId,
    studentUid,
    isAllowedStudent,
    activeHomework,
  ]);

  /* =========================================================
     حفظ التقدم
  ========================================================= */

  async function saveAttemptProgress(
    nextAnswers,
    nextQuestionIndex
  ) {
    /*
      أثناء التسليم نوقف أي Autosave
      حتى لا يدخل تحديث مع Transaction.
    */

    if (
      submittingRef.current ||
      isSubmitting ||
      !studentUid ||
      !activeHomework ||
      submitted ||
      !isAllowedStudent
    ) {
      return;
    }

    try {
      const studentReference =
        doc(
          db,
          "students",
          studentUid
        );

      await updateDoc(
        studentReference,
        {
          [`homeworkAttempts.${activeHomework.id}.answers`]:
            nextAnswers,

          [`homeworkAttempts.${activeHomework.id}.currentQuestionIndex`]:
            nextQuestionIndex,

          [`homeworkAttempts.${activeHomework.id}.updatedAt`]:
            Timestamp.now(),

          updatedAt:
            Timestamp.now(),
        }
      );
    } catch (error) {
      console.error(
        "Error saving homework progress:",
        {
          code: error?.code,
          message:
            error?.message,
          error,
        }
      );

      /*
        لا نظهر Alert أثناء الحل
        حتى لا نزعج الطالب.
        الإجابات تظل موجودة في React
        ويمكن المحاولة مجددًا.
      */
    }
  }

  /* =========================================================
     الاختياري
  ========================================================= */

  function chooseAnswer(
    questionId,
    optionIndex
  ) {
    if (
      submitted ||
      submittingRef.current
    ) {
      return;
    }

    const question =
      questions.find(
        (item) =>
          item.id ===
          questionId
      );

    if (
      question?.cancelled ||
      isEssayQuestion(
        question
      )
    ) {
      return;
    }

    const nextAnswers = {
      ...answers,

      [questionId]:
        optionIndex,
    };

    setAnswers(
      nextAnswers
    );

    saveAttemptProgress(
      nextAnswers,
      currentQuestionIndex
    );
  }

  /* =========================================================
     المقالي
  ========================================================= */

  function writeEssayAnswer(
    questionId,
    value
  ) {
    if (
      submitted ||
      submittingRef.current
    ) {
      return;
    }

    const question =
      questions.find(
        (item) =>
          item.id ===
          questionId
      );

    if (
      !question ||
      question.cancelled ||
      !isEssayQuestion(
        question
      )
    ) {
      return;
    }

    const nextAnswers = {
      ...answers,

      [questionId]:
        value,
    };

    setAnswers(
      nextAnswers
    );
  }

  function saveEssayAnswer() {
    if (
      submitted ||
      submittingRef.current
    ) {
      return;
    }

    const nextAnswers = {
      ...answers,
    };

    saveAttemptProgress(
      nextAnswers,
      currentQuestionIndex
    );
  }

  /* =========================================================
     التنقل
  ========================================================= */

  function goToQuestion(
    questionIndex
  ) {
    if (
      submittingRef.current ||
      questionIndex < 0 ||
      questionIndex >=
        questions.length
    ) {
      return;
    }

    setCurrentQuestionIndex(
      questionIndex
    );

    saveAttemptProgress(
      answers,
      questionIndex
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goToPreviousQuestion() {
    goToQuestion(
      currentQuestionIndex -
        1
    );
  }

  function goToNextQuestion() {
    goToQuestion(
      currentQuestionIndex +
        1
    );
  }

  function openHomework(
    homeworkId
  ) {
    if (
      submittingRef.current
    ) {
      return;
    }

    setActiveHomeworkId(
      homeworkId
    );

    setOpenedSection(
      "homework"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openVideo(
    homeworkId
  ) {
    const status =
      homeworkStatuses[
        homeworkId
      ];

    if (
      !status?.completed
    ) {
      return;
    }

    setActiveHomeworkId(
      homeworkId
    );

    setOpenedSection(
      "video"
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goBackToHomeworkHome() {
    if (
      submittingRef.current
    ) {
      return;
    }

    setOpenedSection(null);

    setActiveHomeworkId(
      null
    );

    setAnswers({});

    setCurrentQuestionIndex(
      0
    );

    setSubmitted(false);

    setResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     تسليم الواجب
  ========================================================= */

  async function submitHomework() {
    /*
      يمنع الضغط مرتين بسرعة
    */
    if (
      submittingRef.current ||
      isSubmitting
    ) {
      return;
    }

    if (!activeHomework) {
      return;
    }

    if (
      questions.length === 0
    ) {
      window.alert(
        "لا توجد أسئلة في الواجب."
      );

      return;
    }

    const activeQuestions =
      questions.filter(
        (question) =>
          !question.cancelled
      );

    const answeredActiveQuestions =
      activeQuestions.filter(
        (question) =>
          isQuestionAnswered(
            question,
            answers[
              question.id
            ]
          )
      ).length;

    if (
      answeredActiveQuestions <
      activeQuestions.length
    ) {
      const shouldSubmit =
        window.confirm(
          `أجبت عن ${answeredActiveQuestions} من ${activeQuestions.length} سؤالًا مطلوبًا. هل تريد تسليم الواجب؟`
        );

      if (!shouldSubmit) {
        return;
      }
    }

    /*
      Lock فوري قبل أي await
    */
    submittingRef.current =
      true;

    setIsSubmitting(
      true
    );

    try {
      let score = 0;

      const reviewedAnswers =
        questions.map(
          (
            question,
            index
          ) => {
            const questionNumber =
              getQuestionDisplayNumber(
                question,
                index
              );

            /* =========================
               السؤال الملغي
            ========================= */

            if (
              question.cancelled
            ) {
              score += 1;

              return {
                questionId:
                  question.id,

                questionNumber,

                answerType:
                  "cancelled",

                selectedOption:
                  null,

                selectedAnswer:
                  null,

                correctOption:
                  null,

                correctAnswerText:
                  null,

                isCorrect: true,

                cancelled: true,
              };
            }

            const savedAnswer =
              answers[
                question.id
              ];

            /* =========================
               مقالي
            ========================= */

            if (
              isEssayQuestion(
                question
              )
            ) {
              const studentAnswer =
                typeof savedAnswer ===
                "string"
                  ? savedAnswer.trim()
                  : "";

              const isCorrect =
                isEssayAnswerCorrect(
                  studentAnswer,
                  question
                );

              if (isCorrect) {
                score += 1;
              }

              return {
                questionId:
                  question.id,

                questionNumber,

                answerType:
                  "essay",

                selectedOption:
                  null,

                selectedAnswer:
                  studentAnswer ||
                  null,

                correctOption:
                  null,

                /*
                  محفوظة للإدارة فقط.
                  لا يتم عرضها للطالب.
                */
                correctAnswerText:
                  Array.isArray(
                    question.acceptedAnswers
                  ) &&
                  question
                    .acceptedAnswers
                    .length > 0
                    ? question
                        .acceptedAnswers[0]
                    : null,

                isCorrect,

                cancelled: false,
              };
            }

            /* =========================
               اختياري
            ========================= */

            const selectedOption =
              savedAnswer;

            const isCorrect =
              selectedOption ===
              question.correctAnswer;

            if (isCorrect) {
              score += 1;
            }

            return {
              questionId:
                question.id,

              questionNumber,

              answerType:
                "choice",

              selectedOption:
                selectedOption ??
                null,

              selectedAnswer:
                null,

              correctOption:
                question.correctAnswer,

              correctAnswerText:
                Array.isArray(
                  question.options
                ) &&
                question.options[
                  question.correctAnswer
                ] !== undefined
                  ? question.options[
                      question.correctAnswer
                    ]
                  : null,

              isCorrect,

              cancelled: false,
            };
          }
        );

      /*
        نفس النظام القديم:
        السؤال الملغي محسوب صحيحًا.
      */

      const totalQuestions =
        questions.length;

      const percentage =
        totalQuestions > 0
          ? Math.round(
              (
                score /
                totalQuestions
              ) * 100
            )
          : 0;

      const homeworkResult = {
        homeworkId:
          activeHomework.id,

        homeworkTitle:
          activeHomework.title,

        courseId:
          activeHomework.courseId ||
          "",

        lessonId:
          activeHomework.lessonId ||
          "",

        grade:
          activeHomework.grade ||
          "",

        score,

        totalQuestions,

        percentage,

        /*
          هنا فقط نحفظ مراجعة
          الإجابات كاملة.
        */
        answers:
          reviewedAnswers,

        completed: true,

        submitted: true,

        videoUnlocked: true,

        submittedAt:
          Timestamp.now(),
      };

      if (!studentUid) {
        throw new Error(
          "Student UID is missing."
        );
      }

      const studentReference =
        doc(
          db,
          "students",
          studentUid
        );

      await runTransaction(
        db,
        async (
          transaction
        ) => {
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

          const studentData =
            studentSnapshot.data();

          if (
            !canStudentAccessHomework(
              studentData,
              activeHomework
            )
          ) {
            throw new Error(
              "HOMEWORK_NOT_ALLOWED"
            );
          }

          /*
            ننظف أي نتائج كبيرة قديمة
            موجودة داخل attempts.
          */

          const originalAttempts =
            studentData.homeworkAttempts &&
            typeof studentData.homeworkAttempts ===
              "object"
              ? {
                  ...studentData.homeworkAttempts,
                }
              : {};

          const homeworkAttempts =
            cleanCompletedHomeworkAttempts(
              originalAttempts
            );

          const existingAttempt =
            homeworkAttempts[
              activeHomework.id
            ];

          if (
            existingAttempt?.completed ===
            true
          ) {
            throw new Error(
              "HOMEWORK_ALREADY_COMPLETED"
            );
          }

          const homeworkResults =
            Array.isArray(
              studentData.homeworkResults
            )
              ? [
                  ...studentData.homeworkResults,
                ]
              : [];

          const existingResultIndex =
            homeworkResults.findIndex(
              (savedResult) =>
                savedResult?.homeworkId ===
                activeHomework.id
            );

          if (
            existingResultIndex >= 0
          ) {
            throw new Error(
              "HOMEWORK_ALREADY_COMPLETED"
            );
          }

          /*
            النتيجة الكاملة هنا مرة واحدة فقط.
          */

          homeworkResults.push(
            homeworkResult
          );

          /*
            داخل attempt نخزن ملخص فقط.
            لا نكرر reviewedAnswers.
            وبعد التسليم لا نحتاج raw answers.
          */

          homeworkAttempts[
            activeHomework.id
          ] = {
            ...(existingAttempt ||
              {}),

            homeworkId:
              activeHomework.id,

            title:
              activeHomework.title,

            courseId:
              activeHomework.courseId ||
              "",

            lessonId:
              activeHomework.lessonId ||
              "",

            grade:
              activeHomework.grade ||
              "",

            started: true,

            completed: true,

            submitted: true,

            /*
              تفريغ الإجابات هنا يوفر
              مساحة كبيرة في Document.
            */
            answers: {},

            currentQuestionIndex,

            videoUnlocked: true,

            completedAt:
              Timestamp.now(),

            submittedAt:
              Timestamp.now(),

            updatedAt:
              Timestamp.now(),

            /*
              ملخص صغير فقط.
            */
            result: {
              homeworkId:
                activeHomework.id,

              score,

              totalQuestions,

              percentage,

              completed: true,

              submitted: true,

              videoUnlocked: true,
            },
          };

          transaction.update(
            studentReference,
            {
              homeworkResults,

              homeworkAttempts,

              completedHomeworks:
                Number(
                  studentData.completedHomeworks ||
                    0
                ) + 1,

              updatedAt:
                Timestamp.now(),
            }
          );
        }
      );

      /*
        Firebase أكد أن التسليم تم.
      */

      setResult(
        homeworkResult
      );

      setSubmitted(
        true
      );

      setHomeworkStatuses(
        (previous) => ({
          ...previous,

          [activeHomework.id]: {
            completed: true,

            score,

            totalQuestions,

            answeredCount:
              totalQuestions,
          },
        })
      );

      setOpenedSection(
        "homework"
      );

      window.scrollTo(
        0,
        0
      );
    } catch (error) {
      /*
        مهم جدًا:
        أي مشكلة جديدة سنعرف
        Code الحقيقي في Console.
      */

      console.error(
        "Error submitting homework:",
        {
          message:
            error?.message,

          code:
            error?.code,

          name:
            error?.name,

          studentUid,

          homeworkId:
            activeHomework?.id,

          fullError:
            error,
        }
      );

      if (
        error?.message ===
        "HOMEWORK_ALREADY_COMPLETED"
      ) {
        /*
          لو Firebase قال إن الواجب
          مسلّم بالفعل، نعتبره محميًا
          من التسليم المكرر.
        */

        window.alert(
          "لقد سلمت هذا الواجب من قبل."
        );
      } else if (
        error?.message ===
        "HOMEWORK_NOT_ALLOWED"
      ) {
        window.alert(
          "هذا الواجب غير متاح لهذا الحساب."
        );
      } else if (
        error?.code ===
        "permission-denied"
      ) {
        window.alert(
          "تعذر حفظ الواجب بسبب صلاحيات الحساب. برجاء التواصل مع إدارة المنصة."
        );
      } else if (
        error?.code ===
          "unavailable" ||
        error?.code ===
          "deadline-exceeded" ||
        error?.code ===
          "network-request-failed"
      ) {
        window.alert(
          "الاتصال بالإنترنت غير مستقر. إجاباتك ما زالت موجودة، حاول تسليم الواجب مرة أخرى."
        );
      } else if (
        error?.code ===
          "resource-exhausted" ||
        error?.code ===
          "failed-precondition"
      ) {
        window.alert(
          "تعذر حفظ الواجب حاليًا. برجاء المحاولة مرة أخرى، وإذا استمرت المشكلة تواصل مع إدارة المنصة."
        );
      } else if (
        error?.code ===
        "aborted"
      ) {
        window.alert(
          "حدث تعارض بسيط أثناء حفظ الواجب. حاول الضغط على تسليم الواجب مرة أخرى."
        );
      } else {
        window.alert(
          "حدث خطأ أثناء تسليم الواجب. حاول مرة أخرى، وإذا استمرت المشكلة تواصل مع إدارة المنصة."
        );
      }
    } finally {
      submittingRef.current =
        false;

      setIsSubmitting(
        false
      );
    }
  }

  /* =========================================================
     غير مسموح
  ========================================================= */

  if (!isAllowedStudent) {
    return (
      <section className="homework-page">
        <div className="homework-locked-page">
          <FaLock />

          <h2>
            المحتوى غير متاح
          </h2>

          <p>
            تسليم الواجب متاح
            لطلاب السنتر فقط.
          </p>
        </div>
      </section>
    );
  }

  /* =========================================================
     الصفحة الرئيسية للواجبات
  ========================================================= */

  if (
    openedSection === null
  ) {
    if (
      isLoadingDashboard
    ) {
      return (
        <section className="homework-page">
          <div className="homework-empty">
            <h2>
              جاري تحميل
              الواجبات...
            </h2>
          </div>
        </section>
      );
    }

    if (
      studentHomeworks.length ===
      0
    ) {
      return (
        <section className="homework-page">
          <div className="homework-empty">
            <h2>
              لا توجد واجبات
              متاحة حاليًا.
            </h2>
          </div>
        </section>
      );
    }

    return (
      <section className="homework-page homework-dashboard">
        <div className="homework-dashboard-heading">
          <h1>
            تسليم الواجب
          </h1>

          <p>
            اختر الواجب لبدء الحل
            أو مشاهدة النتيجة بعد
            التسليم.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {studentHomeworks.map(
            (homework) => {
              const status =
                homeworkStatuses[
                  homework.id
                ] || {};

              const homeworkCompleted =
                status.completed ===
                true;

              const answeredCount =
                status.answeredCount ||
                0;

              const homeworkProgress =
                homework.questions
                  .length > 0
                  ? Math.round(
                      (
                        answeredCount /
                        homework
                          .questions
                          .length
                      ) * 100
                    )
                  : 0;

              return (
                <div
                  key={
                    homework.id
                  }
                >
                  <button
                    type="button"
                    className={`homework-main-card ${
                      homeworkCompleted
                        ? "completed"
                        : ""
                    }`}
                    onClick={() =>
                      openHomework(
                        homework.id
                      )
                    }
                  >
                    <div className="homework-main-card-icon">
                      <FaClipboardCheck />
                    </div>

                    <div className="homework-main-card-content">
                      <span className="homework-main-card-label">
                        واجب
                      </span>

                      <h2>
                        {
                          homework.title
                        }
                      </h2>

                      <p>
                        {homeworkCompleted
                          ? `تم تسليم الواجب — نتيجتك ${status.score ?? 0} من ${status.totalQuestions ?? homework.questions.length}`
                          : answeredCount >
                              0
                            ? `تم حل ${answeredCount} من ${homework.questions.length} — اضغط للاستكمال`
                            : `${homework.questions.length} سؤالًا — اضغط لبدء حل الواجب`}
                      </p>

                      {!homeworkCompleted && (
                        <div className="homework-card-progress">
                          <div
                            className="homework-card-progress-fill"
                            style={{
                              width: `${homeworkProgress}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="homework-main-card-arrow">
                      {homeworkCompleted ? (
                        <FaCheckCircle />
                      ) : (
                        <FaChevronLeft />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`homework-video-card ${
                      homeworkCompleted
                        ? "unlocked"
                        : "locked"
                    }`}
                    onClick={() =>
                      openVideo(
                        homework.id
                      )
                    }
                  >
                    <div className="homework-video-card-icon">
                      {homeworkCompleted ? (
                        <FaPlay />
                      ) : (
                        <FaLock />
                      )}
                    </div>

                    <div className="homework-video-card-content">
                      <h3>
                        فيديو شرح{" "}
                        {
                          homework.title
                        }
                      </h3>

                      <p>
                        {homeworkCompleted
                          ? "الفيديو متاح الآن — اضغط للمشاهدة"
                          : `يتم فتح الفيديو بعد تسليم ${homework.title}`}
                      </p>
                    </div>

                    <div className="homework-video-card-status">
                      {homeworkCompleted
                        ? "مشاهدة"
                        : "مغلق"}
                    </div>
                  </button>
                </div>
              );
            }
          )}
        </div>
      </section>
    );
  }

  /* =========================================================
     تحميل الواجب
  ========================================================= */

  if (
    isLoadingAttempt
  ) {
    return (
      <section className="homework-page">
        <div className="homework-empty">
          <h2>
            جاري تحميل الواجب...
          </h2>
        </div>
      </section>
    );
  }

  /* =========================================================
     الفيديو
  ========================================================= */

  if (
    openedSection ===
    "video"
  ) {
    if (
      !activeHomework ||
      !submitted
    ) {
      return (
        <section className="homework-page">
          <button
            type="button"
            className="homework-back-dashboard-btn"
            onClick={
              goBackToHomeworkHome
            }
          >
            <FaArrowRight />
            رجوع
          </button>

          <div className="homework-video-locked">
            <FaLock />

            <h3>
              فيديو شرح الواجب
            </h3>

            <p>
              لازم تسلم الواجب قبل
              مشاهدة الفيديو.
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="homework-page">
        <button
          type="button"
          className="homework-back-dashboard-btn"
          onClick={
            goBackToHomeworkHome
          }
        >
          <FaArrowRight />
          رجوع
        </button>

        <section className="homework-video-section">
          <div className="homework-video-status">
            <FaPlay />

            <div>
              <h2>
                فيديو شرح{" "}
                {
                  activeHomework.title
                }
              </h2>

              <p>
                الواجب تم تسليمه،
                والفيديو متاح
                للمشاهدة.
              </p>
            </div>
          </div>

          <div className="homework-video-wrapper">
            <YouTube
              videoId={
                activeHomework.videoId
              }
              opts={{
                width: "100%",
                height: "100%",

                playerVars: {
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
              iframeClassName="homework-youtube-player"
            />
          </div>
        </section>
      </section>
    );
  }

  /* =========================================================
     النتيجة
  ========================================================= */

  if (
    openedSection ===
      "homework" &&
    submitted &&
    result &&
    activeHomework
  ) {
    return (
      <section className="homework-page">
        <button
          type="button"
          className="homework-back-dashboard-btn"
          onClick={
            goBackToHomeworkHome
          }
        >
          <FaArrowRight />
          رجوع للواجبات
        </button>

        <div className="homework-result-card">
          <FaClipboardCheck />

          <h1>
            نتيجة الواجب
          </h1>

          <h2>
            {
              activeHomework.title
            }
          </h2>

          <strong>
            {result.score} من{" "}
            {
              result.totalQuestions
            }
          </strong>

          <span>
            {
              result.percentage
            }
            %
          </span>
        </div>

        <div className="homework-review-list">
          <h2>
            مراجعة إجاباتك
          </h2>

          {Array.isArray(
            result.answers
          ) &&
            result.answers.map(
              (answer) => (
                <article
                  className={`homework-review-item ${
                    answer.cancelled
                      ? "cancelled"
                      : answer.isCorrect
                        ? "correct"
                        : "wrong"
                  }`}
                  key={
                    answer.questionId
                  }
                >
                  <div>
                    {answer.isCorrect ? (
                      <FaCheckCircle />
                    ) : (
                      <FaTimesCircle />
                    )}
                  </div>

                  <div>
                    <h3>
                      السؤال{" "}
                      {
                        answer.questionNumber
                      }
                    </h3>

                    <p>
                      {answer.cancelled
                        ? "السؤال ملغي — تم احتسابه صحيحًا."
                        : answer.isCorrect
                          ? "إجابتك صحيحة"
                          : "إجابتك غير صحيحة"}
                    </p>
                  </div>
                </article>
              )
            )}
        </div>
      </section>
    );
  }

  /* =========================================================
     حل الواجب
  ========================================================= */

  if (!activeHomework) {
    return null;
  }

  return (
    <section className="homework-page">
      <button
        type="button"
        className="homework-back-dashboard-btn"
        onClick={
          goBackToHomeworkHome
        }
        disabled={
          isSubmitting
        }
      >
        <FaArrowRight />
        رجوع للواجبات
      </button>

      <div className="homework-header">
        <FaClipboardCheck />

        <div>
          <h1>
            {
              activeHomework.title
            }
          </h1>

          <p>
            أجب عن الأسئلة ثم سلم
            الواجب. بعد التسليم سيتم
            فتح فيديو الشرح.
          </p>
        </div>
      </div>

      <div className="homework-progress-card">
        <div className="homework-progress-info">
          <strong>
            السؤال{" "}
            {currentQuestionIndex +
              1}{" "}
            من {questions.length}
          </strong>

          <span>
            تم حل{" "}
            {
              answeredQuestionsCount
            }{" "}
            من {questions.length}
          </span>
        </div>

        <div className="homework-progress-bar">
          <div
            className="homework-progress-fill"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <p>
          نسبة الإنجاز:{" "}
          {progressPercentage}%
        </p>
      </div>

      <div className="homework-question-numbers">
        {questions.map(
          (
            question,
            index
          ) => {
            const isCurrent =
              index ===
              currentQuestionIndex;

            const isAnswered =
              isQuestionAnswered(
                question,
                answers[
                  question.id
                ]
              );

            return (
              <button
                type="button"
                key={
                  question.id
                }
                disabled={
                  isSubmitting
                }
                className={`homework-number-btn ${
                  isCurrent
                    ? "current"
                    : ""
                } ${
                  isAnswered
                    ? "answered"
                    : ""
                } ${
                  question.cancelled
                    ? "cancelled"
                    : ""
                }`}
                onClick={() =>
                  goToQuestion(
                    index
                  )
                }
              >
                {getQuestionDisplayNumber(
                  question,
                  index
                )}
              </button>
            );
          }
        )}
      </div>

      {currentQuestion && (
        <article className="homework-question-card">
          <div className="homework-question-number">
            {getQuestionDisplayNumber(
              currentQuestion,
              currentQuestionIndex
            )}
          </div>

          <h2>
            السؤال{" "}
            {getQuestionDisplayNumber(
              currentQuestion,
              currentQuestionIndex
            )}
          </h2>

          {currentQuestion.question &&
            currentQuestion.question !==
              `السؤال ${
                currentQuestionIndex +
                1
              }` && (
              <p
                style={{
                  margin:
                    "15px 0 22px",
                  lineHeight: "2",
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                {
                  currentQuestion.question
                }
              </p>
            )}

          {currentQuestion.cancelled ? (
            <div className="homework-cancelled-question">
              <FaCheckCircle />

              <h3>
                السؤال ملغي
              </h3>

              <p>
                لا تحتاج للإجابة على
                هذا السؤال، وسيتم
                احتسابه صحيحًا
                تلقائيًا.
              </p>
            </div>
          ) : isEssayQuestion(
              currentQuestion
            ) ? (
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <textarea
                value={
                  answers[
                    currentQuestion.id
                  ] || ""
                }
                disabled={
                  isSubmitting
                }
                onChange={(event) =>
                  writeEssayAnswer(
                    currentQuestion.id,
                    event.target.value
                  )
                }
                onBlur={
                  saveEssayAnswer
                }
                placeholder="اكتب إجابتك هنا..."
                rows={6}
                style={{
                  width: "100%",
                  minHeight: "150px",
                  resize: "vertical",
                  border:
                    "2px solid #eadfce",
                  borderRadius:
                    "16px",
                  padding:
                    "16px 18px",
                  fontFamily:
                    "inherit",
                  fontSize: "17px",
                  lineHeight: "1.9",
                  outline: "none",
                  background:
                    "#fffdf9",
                  color:
                    "#4a2f1f",
                  boxSizing:
                    "border-box",
                }}
              />

              <p
                style={{
                  marginTop: "10px",
                  opacity: "0.7",
                  fontSize: "14px",
                }}
              >
                اكتب الإجابة
                بطريقتك، وسيتم
                تصحيحها عند تسليم
                الواجب.
              </p>
            </div>
          ) : (
            <div className="homework-options-list">
              {currentQuestion.options.map(
                (
                  option,
                  optionIndex
                ) => {
                  const selected =
                    answers[
                      currentQuestion.id
                    ] ===
                    optionIndex;

                  const letters = [
                    "أ",
                    "ب",
                    "ج",
                    "د",
                  ];

                  return (
                    <button
                      type="button"
                      disabled={
                        isSubmitting
                      }
                      className={`homework-option-btn ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      key={`${currentQuestion.id}-${optionIndex}`}
                      onClick={() =>
                        chooseAnswer(
                          currentQuestion.id,
                          optionIndex
                        )
                      }
                    >
                      <span className="homework-option-letter">
                        {letters[
                          optionIndex
                        ] ||
                          optionIndex +
                            1}
                      </span>

                      <span>
                        {option}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </article>
      )}

      <div className="homework-navigation-buttons">
        <button
          type="button"
          className="homework-navigation-btn previous"
          disabled={
            currentQuestionIndex ===
              0 ||
            isSubmitting
          }
          onClick={
            goToPreviousQuestion
          }
        >
          <FaArrowRight />
          السؤال السابق
        </button>

        {currentQuestionIndex <
        questions.length - 1 ? (
          <button
            type="button"
            className="homework-navigation-btn next"
            disabled={
              isSubmitting
            }
            onClick={
              goToNextQuestion
            }
          >
            السؤال التالي
            <FaArrowLeft />
          </button>
        ) : (
          <button
            type="button"
            className="homework-submit-btn"
            disabled={
              isSubmitting
            }
            onClick={
              submitHomework
            }
          >
            {isSubmitting
              ? "جاري تسليم الواجب..."
              : "تسليم الواجب"}
          </button>
        )}
      </div>
    </section>
  );
}

export default Homework;