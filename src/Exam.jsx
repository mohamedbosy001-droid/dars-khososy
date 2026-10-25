import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
} from "react-icons/fa";

import "./Exam.css";

// ملاحظة تنظيمية داخلية: تُترك إعدادات العرض والتنسيق في ملف Exam.css.

const AI_GRADER_URL =
  "https://dars-khososy-ai-grader.mohamedbosy001.workers.dev/";

/*
  ============================
  عرض نص السؤال
  ============================
*/

function renderQuestionText(text = "") {
  const parts = text.split(
    /(\[\[.*?\]\])/g
  );

  return parts.map(
    (part, index) => {
      if (
        part.startsWith("[[") &&
        part.endsWith("]]")
      ) {
        return (
          <span
            key={index}
            className="exam-underlined-word"
          >
            {part.slice(2, -2)}
          </span>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    }
  );
}

/*
  ============================
  هل السؤال مقالي؟
  ============================
*/

function isEssayQuestion(question) {
  return (
    question?.type === "essay" ||
    !Array.isArray(question?.options)
  );
}

/*
  ============================
  درجة السؤال
  ============================
*/

function getQuestionPoints(question) {
  const points = Number(
    question?.points
  );

  if (
    Number.isFinite(points) &&
    points >= 0
  ) {
    return points;
  }

  return 1;
}

/*
  ============================
  هل السؤال تمت إجابته؟
  ============================
*/

function isQuestionAnswered(
  question,
  answer
) {
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

/*
  ============================
  تصحيح المقالي بالـ AI
  ============================
*/

async function gradeEssayWithAI(
  studentAnswer,
  question
) {
  const cleanStudentAnswer =
    String(
      studentAnswer || ""
    ).trim();

  const acceptedAnswers =
    Array.isArray(
      question?.acceptedAnswers
    )
      ? question.acceptedAnswers
          .map((answer) =>
            String(
              answer || ""
            ).trim()
          )
          .filter(Boolean)
      : [];

  if (
    !cleanStudentAnswer ||
    acceptedAnswers.length === 0
  ) {
    return false;
  }

  const response = await fetch(
    AI_GRADER_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        question:
          String(
            question?.question || ""
          ).trim(),

        acceptedAnswers,

        studentAnswer:
          cleanStudentAnswer,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "AI_GRADING_FAILED"
    );
  }

  const data =
    await response.json();

  if (
    data?.success !== true ||
    typeof data?.isCorrect !==
      "boolean"
  ) {
    throw new Error(
      "AI_GRADING_FAILED"
    );
  }

  return data.isCorrect;
}

function Exam({
  exam,
  currentStudent,
  onBack,
}) {
  const [answers, setAnswers] =
    useState({});
  // Keep the latest typed values available synchronously, including the final keystroke before submit.
  const answersRef = useRef({});

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [submitted, setSubmitted] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [
    isLoadingAttempt,
    setIsLoadingAttempt,
  ] = useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showExitModal, setShowExitModal] =
    useState(false);

  const [remainingSeconds, setRemainingSeconds] =
    useState(null);

  const isTimedExam = Number(exam?.durationMinutes) > 0;
  // التصحيح اليدوي مخصص لامتحاني الشامل فقط.
  const isComprehensiveExam =
    exam?.isComprehensiveExam === true ||
    /^(second|third)-month-comprehensive$/.test(String(exam?.id || ""));

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const questions = useMemo(() => {
    return Array.isArray(
      exam?.questions
    )
      ? exam.questions
      : [];
  }, [exam]);

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  const answeredQuestionsCount =
    questions.filter(
      (question) =>
        isQuestionAnswered(
          question,
          answers[question.id]
        )
    ).length;

  const progressPercentage =
    questions.length > 0
      ? Math.round(
          (answeredQuestionsCount /
            questions.length) *
            100
        )
      : 0;

  /*
    ============================
    تحميل / إنشاء محاولة الامتحان
    ============================
  */

  useEffect(() => {
    async function loadExamAttempt() {
      if (
        !studentUid ||
        !exam?.id
      ) {
        setIsLoadingAttempt(false);
        return;
      }

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
                "Student not found."
              );
            }

            const studentData =
              studentSnapshot.data();

            const examAttempts =
              studentData.examAttempts &&
              typeof studentData.examAttempts ===
                "object"
                ? {
                    ...studentData.examAttempts,
                  }
                : {};

            const savedAttempt =
              examAttempts[exam.id];

            const examResults =
              Array.isArray(
                studentData.examResults
              )
                ? studentData.examResults
                : [];

            const savedResult =
              examResults.find(
                (
                  savedExamResult
                ) =>
                  savedExamResult?.examId ===
                  exam.id
              );

            if (
              savedAttempt?.completed ===
                true ||
              savedResult?.completed ===
                true
            ) {
              setResult(
                savedResult ||
                  savedAttempt.result ||
                  null
              );

              setSubmitted(true);

              const completedAnswers = savedAttempt?.answers || {};
              answersRef.current = completedAnswers;
              setAnswers(completedAnswers);

              return;
            }

            if (savedAttempt) {
              let attemptToRestore = savedAttempt;
              const durationMs = Number(exam?.durationMinutes) * 60 * 1000;

              if (durationMs > 0) {
                const startedAtMs = savedAttempt.startedAt?.toMillis
                  ? savedAttempt.startedAt.toMillis()
                  : savedAttempt.startedAt?.seconds
                    ? savedAttempt.startedAt.seconds * 1000
                    : 0;
                const deadline = startedAtMs + durationMs;
                const remaining = startedAtMs > 0
                  ? Math.ceil((deadline - Date.now()) / 1000)
                  : 0;

                // لو لوحة التحكم أعادت فتح محاولة قديمة ولم تحدّث startedAt،
                // فالموعد القديم يجعل المؤقت يبدأ بصفر ويُسلّم الامتحان فورًا.
                // المحاولة المنتهية وغير المسلّمة تُعاد هنا من البداية بمدة الامتحان كاملة.
                if (remaining <= 0) {
                  attemptToRestore = {
                    ...savedAttempt,
                    examId: exam.id,
                    examTitle: exam.title,
                    started: true,
                    completed: false,
                    answers: {},
                    currentQuestionIndex: 0,
                    startedAt: Timestamp.now(),
                    durationMinutes: Number(exam.durationMinutes),
                    updatedAt: Timestamp.now(),
                    result: null,
                  };
                  examAttempts[exam.id] = attemptToRestore;
                  transaction.update(studentReference, {
                    examAttempts,
                    updatedAt: Timestamp.now(),
                  });
                  setRemainingSeconds(Number(exam.durationMinutes) * 60);
                } else {
                  setRemainingSeconds(remaining);
                }
              }

              const restoredAnswers = attemptToRestore.answers || {};
              answersRef.current = restoredAnswers;
              setAnswers(restoredAnswers);

              setCurrentQuestionIndex(
                Math.min(
                  Math.max(Number(attemptToRestore.currentQuestionIndex || 0), 0),
                  Math.max(questions.length - 1, 0)
                )
              );

              return;
            }

            examAttempts[
              exam.id
            ] = {
              examId: exam.id,
              examTitle:
                exam.title,

              started: true,
              completed: false,

              answers: {},
              currentQuestionIndex: 0,

              startedAt:
                Timestamp.now(),

              durationMinutes: Number(exam?.durationMinutes) || null,

              updatedAt:
                Timestamp.now(),
            };

            if (Number(exam?.durationMinutes) > 0) {
              setRemainingSeconds(Number(exam.durationMinutes) * 60);
            }

            transaction.update(
              studentReference,
              {
                examAttempts,

                updatedAt:
                  Timestamp.now(),
              }
            );
          }
        );
      } catch (error) {
        console.error(
          "Error loading exam attempt:",
          error
        );

        window.alert(
          "حدث خطأ أثناء تحميل الامتحان."
        );
      } finally {
        setIsLoadingAttempt(
          false
        );
      }
    }

    loadExamAttempt();
  }, [
    studentUid,
    exam?.id,
    exam?.title,
    questions.length,
  ]);

  // متابعة نتيجة الشامل مباشرةً؛ عند اعتماد المقالي تظهر الدرجة النهائية دون الحاجة لإعادة تحميل الصفحة.
  useEffect(() => {
    if (!isComprehensiveExam || !submitted || result?.gradingStatus === "graded" || !studentUid || !exam?.id) {
      return undefined;
    }

    const studentReference = doc(db, "students", studentUid);
    return onSnapshot(studentReference, (snapshot) => {
      if (!snapshot.exists()) return;
      const studentData = snapshot.data();
      const latestResult = (Array.isArray(studentData.examResults) ? studentData.examResults : [])
        .find((item) => item?.examId === exam.id);
      const attemptResult = studentData.examAttempts?.[exam.id]?.result;
      const approvedResult = latestResult?.gradingStatus === "graded"
        ? latestResult
        : attemptResult?.gradingStatus === "graded"
          ? attemptResult
          : null;
      if (approvedResult) setResult(approvedResult);
    }, (error) => {
      console.error("Failed to listen for final comprehensive exam result:", error);
    });
  }, [isComprehensiveExam, submitted, result?.gradingStatus, studentUid, exam?.id]);

  useEffect(() => {
    if (!isTimedExam || isLoadingAttempt || submitted || remainingSeconds === null) return;
    if (remainingSeconds <= 0) {
      submitExam(true);
      return;
    }
    const timerId = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, (seconds ?? 1) - 1));
    }, 1000);
    return () => window.clearTimeout(timerId);
  }, [isTimedExam, isLoadingAttempt, submitted, remainingSeconds]);

  function formatRemainingTime(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  /*
    ============================
    حفظ التقدم
    ============================
  */

  async function saveAttemptProgress(
    nextAnswers,
    nextQuestionIndex
  ) {
    if (
      !studentUid ||
      !exam?.id ||
      submitted
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
          [`examAttempts.${exam.id}.answers`]:
            nextAnswers,

          [`examAttempts.${exam.id}.currentQuestionIndex`]:
            nextQuestionIndex,

          [`examAttempts.${exam.id}.updatedAt`]:
            Timestamp.now(),

          updatedAt:
            Timestamp.now(),
        }
      );
    } catch (error) {
      console.error(
        "Error saving exam progress:",
        error
      );
    }
  }

  /*
    ============================
    اختيار إجابة MCQ
    ============================
  */

  function chooseAnswer(
    questionId,
    optionIndex
  ) {
    if (submitted) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [questionId]:
        optionIndex,
    };

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    saveAttemptProgress(
      nextAnswers,
      currentQuestionIndex
    );
  }

  /*
    ============================
    كتابة إجابة مقالية
    ============================
  */

  function writeEssayAnswer(
    questionId,
    value
  ) {
    if (submitted) {
      return;
    }

    const chooseOneIds = [
      "second-month-comprehensive-q46",
      "second-month-comprehensive-q47",
      "second-month-comprehensive-q48",
    ];
    const nextAnswers = {
      ...(answersRef.current || answers),
    };
    if (chooseOneIds.includes(questionId) && value.trim()) {
      // الأسئلة 46–48 مجموعة اختيارية: إجابة واحدة فقط.
      chooseOneIds.forEach((id) => {
        if (id !== questionId) nextAnswers[id] = "";
      });
    }
    nextAnswers[questionId] = value;
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
  }

  /*
    ============================
    حفظ إجابة مقالية
    ============================
  */

  function saveEssayAnswer(
    questionId
  ) {
    if (submitted) {
      return;
    }

    const latestAnswers = answersRef.current || answers;
    const nextAnswers = {
      ...latestAnswers,
      [questionId]:
        typeof latestAnswers[questionId] === "string"
          ? latestAnswers[questionId].trim()
          : "",
    };

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    saveAttemptProgress(
      nextAnswers,
      currentQuestionIndex
    );
  }

  /*
    ============================
    التنقل
    ============================
  */

  function goToQuestion(
    questionIndex
  ) {
    if (
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
      currentQuestionIndex - 1
    );
  }

  function goToNextQuestion() {
    goToQuestion(
      currentQuestionIndex + 1
    );
  }

  /*
    الخروج من الامتحان ينهي المحاولة ويسلم الإجابات الحالية.
  */
  async function handleExitExam() {
    if (submitted) {
      onBack?.();
      return;
    }

    setShowExitModal(true);
  }

  async function confirmExitExam() {
    setShowExitModal(false);
    await submitExam(true);
    onBack?.();
  }

  /*
    ============================
    تسليم الامتحان
    ============================
  */

  async function submitExam(isAutoSubmit = false) {
    if (
      !exam ||
      questions.length === 0
    ) {
      window.alert(
        "لا توجد أسئلة في الامتحان."
      );
      return;
    }

    if (
      !isAutoSubmit &&
      answeredQuestionsCount <
      questions.length
    ) {
      const shouldSubmit =
        window.confirm(
          `أجبت عن ${answeredQuestionsCount} من ${questions.length} سؤالًا. هل تريد تسليم الامتحان؟`
        );

      if (!shouldSubmit) {
        return;
      }
    }

    setIsSubmitting(true);

    // Use the latest controlled input values, not a potentially stale render snapshot.
    const submittedAnswers = answersRef.current || answers;

    try {
      let score = 0;

      /*
        نصحح الأسئلة المقالية
        بالـ AI قبل إنشاء النتيجة

        alwaysCorrect:
        أي إجابة مكتوبة تتحسب صحيحة
        بدون إرسالها للـ AI
      */

      const essayGrades = {};

      // في الشامل لا نصحح المقالي آليًا؛ يُترك للمدرسة للتصحيح اليدوي.
      if (!isComprehensiveExam) {
      for (
        const question of questions
      ) {
        if (
          !isEssayQuestion(
            question
          )
        ) {
          continue;
        }

        const savedAnswer =
          submittedAnswers[question.id];

        const studentAnswer =
          typeof savedAnswer ===
          "string"
            ? savedAnswer.trim()
            : "";

        if (
          question.alwaysCorrect ===
          true
        ) {
          essayGrades[
            question.id
          ] =
            studentAnswer.length > 0;

          continue;
        }

        essayGrades[
          question.id
        ] =
          await gradeEssayWithAI(
            studentAnswer,
            question
          );
      }
      }

      /*
        إنشاء مراجعة الإجابات
      */

      const reviewedAnswers =
        questions.map(
          (
            question,
            index
          ) => {
            const questionPoints =
              getQuestionPoints(
                question
              );

            /*
              ==================
              سؤال مقالي
              ==================
            */

            if (
              isEssayQuestion(
                question
              )
            ) {
              const savedAnswer =
                submittedAnswers[
                  question.id
                ];

              const studentAnswer =
                typeof savedAnswer ===
                "string"
                  ? savedAnswer.trim()
                  : "";

              const isCorrect = isComprehensiveExam
                ? null
                : essayGrades[question.id] === true;

              if (isCorrect === true) {
                score += questionPoints;
              }

              return {
                questionId:
                  question.id,

                questionNumber:
                  index + 1,

                type: "essay",

                studentAnswer,

                selectedOption:
                  null,

                correctOption:
                  null,

                question:
                  question.question,

                options: [],

                isCorrect,

                points:
                  questionPoints,

                earnedPoints:
                  isCorrect === true
                    ? questionPoints
                    : 0,
              };
            }

            /*
              ==================
              سؤال اختياري
              ==================
            */

            const selectedOption =
              submittedAnswers[
                question.id
              ];

            const isCorrect =
              selectedOption ===
              question.correctAnswer;

            if (isCorrect) {
              score +=
                questionPoints;
            }

            return {
              questionId:
                question.id,

              questionNumber:
                index + 1,

              type: "mcq",

              selectedOption:
                selectedOption ??
                null,

              correctOption:
                question.correctAnswer,

              question:
                question.question,

              options:
                Array.isArray(
                  question.options
                )
                  ? question.options
                  : [],

              isCorrect,

              points:
                questionPoints,

              earnedPoints:
                isCorrect
                  ? questionPoints
                  : 0,
            };
          }
        );

      /*
        مجموع درجات الامتحان

        أي سؤال قديم بدون points
        = درجة واحدة تلقائيًا
      */

      const calculatedTotal = questions.reduce(
        (total, question) => total + getQuestionPoints(question),
        0
      );
      const totalQuestions = Number(exam?.maxScore) > 0
        ? Number(exam.maxScore)
        : calculatedTotal;

      const percentage =
        totalQuestions > 0
          ? Math.round(
              (score /
                totalQuestions) *
                100
            )
          : 0;

      const examResult = {
        examId: exam.id,
        examTitle:
          exam.title,

        score,
        totalQuestions,
        percentage,

        answers:
          reviewedAnswers,

        completed: true,
        isComprehensiveExam,
        gradingStatus: isComprehensiveExam && reviewedAnswers.some((answer) => answer.type === "essay")
          ? "pending_essay"
          : "graded",

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

          const studentData =
            studentSnapshot.data();

          const examAttempts =
            studentData.examAttempts &&
            typeof studentData.examAttempts ===
              "object"
              ? {
                  ...studentData.examAttempts,
                }
              : {};

          const existingAttempt =
            examAttempts[
              exam.id
            ];

          if (
            existingAttempt?.completed ===
            true
          ) {
            throw new Error(
              "EXAM_ALREADY_COMPLETED"
            );
          }

          const examResults =
            Array.isArray(
              studentData.examResults
            )
              ? [
                  ...studentData
                    .examResults,
                ]
              : [];

          const existingResultIndex =
            examResults.findIndex(
              (
                savedResult
              ) =>
                savedResult?.examId ===
                exam.id
            );

          if (
            existingResultIndex >=
            0
          ) {
            throw new Error(
              "EXAM_ALREADY_COMPLETED"
            );
          }

          examResults.push(
            examResult
          );

          examAttempts[
            exam.id
          ] = {
            ...(existingAttempt ||
              {}),

            examId: exam.id,
            examTitle:
              exam.title,

            started: true,
            completed: true,

            answers: submittedAnswers,

            currentQuestionIndex,

            completedAt:
              Timestamp.now(),

            updatedAt:
              Timestamp.now(),

            isComprehensiveExam,
            gradingStatus: examResult.gradingStatus,
            result:
              examResult,
          };

          transaction.update(
            studentReference,
            {
              examResults,
              examAttempts,

              completedExams:
                Number(
                  studentData.completedExams ||
                    0
                ) + 1,

              updatedAt:
                Timestamp.now(),
            }
          );
        }
      );

      setResult(examResult);
      setSubmitted(true);

      window.scrollTo(
        0,
        0
      );
    } catch (error) {
      console.error(
        "Error submitting exam:",
        error
      );

      if (
        error?.message ===
        "AI_GRADING_FAILED"
      ) {
        window.alert(
          "تعذر تصحيح الإجابة المقالية حاليًا. إجاباتك ما زالت محفوظة، حاول تسليم الامتحان مرة أخرى."
        );
      } else if (
        error?.message ===
        "EXAM_ALREADY_COMPLETED"
      ) {
        window.alert(
          "لقد أنهيت هذا الامتحان من قبل، ولا يمكن فتح محاولة جديدة."
        );
      } else {
        window.alert(
          "حدث خطأ أثناء تسليم الامتحان."
        );
      }
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  /*
    ============================
    تحميل
    ============================
  */

  if (isLoadingAttempt) {
    return (
      <section className="exam-page">
        <div className="exam-empty">
          <h2>
            جاري تحميل الامتحان...
          </h2>
        </div>
      </section>
    );
  }

  /*
    ============================
    لا يوجد امتحان
    ============================
  */

  if (!exam) {
    return (
      <section className="exam-page">
        <div className="exam-empty">
          <h2>
            تعذر تحميل الامتحان
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

  /*
    ============================
    صفحة النتيجة
    ============================
  */

  if (
    submitted &&
    result
  ) {
    if (isComprehensiveExam && result.gradingStatus !== "graded") {
      return (
        <section className="exam-page">
          <button type="button" className="exam-back-btn" onClick={onBack}>
            <FaArrowRight /> الرجوع إلى محتوى الكورس
          </button>
          <div className="exam-result-card" role="status" aria-live="polite">
            <FaClipboardCheck />
            <h1>تم استلام إجاباتك بنجاح</h1>
            <h2>{exam.title}</h2>
            <p style={{ lineHeight: 1.9, maxWidth: 620, margin: "12px auto" }}>
              تم تسليم الامتحان بنجاح، وجارٍ مراجعة إجابات الأسئلة المقالية. ستظهر نتيجتك النهائية فور الانتهاء من التصحيح.
            </p>
          </div>
        </section>
      );
    }

    if (isComprehensiveExam) {
      return (
        <section className="exam-page">
          <button type="button" className="exam-back-btn" onClick={onBack}>
            <FaArrowRight /> الرجوع إلى محتوى الكورس
          </button>
          <div className="exam-result-card">
            <FaClipboardCheck />
            <h1>النتيجة النهائية</h1>
            <h2>{exam.title}</h2>
            <strong>{result.score} من {result.totalQuestions}</strong>
            <span>{result.percentage}%</span>
          </div>
        </section>
      );
    }

    return (
      <section className="exam-page">
        <button
          type="button"
          className="exam-back-btn"
          onClick={onBack}
        >
          <FaArrowRight />
          الرجوع إلى محتوى الكورس
        </button>

        <div className="exam-result-card">
          <FaClipboardCheck />

          <h1>
            نتيجة الامتحان
          </h1>

          <h2>
            {exam.title}
          </h2>

          <strong>
            {result.score} من{" "}
            {
              result.totalQuestions
            }
          </strong>

          <span>
            {result.percentage}%
          </span>
        </div>

        <div className="exam-review-list">
          <h2>
            مراجعة إجاباتك
          </h2>

          {result.answers.map(
            (answer) => {
              const questionData =
                questions.find(
                  (question) =>
                    question.id ===
                    answer.questionId
                );

              const questionText =
                answer.question ||
                questionData?.question ||
                "";

              const answerIsEssay =
                answer.type ===
                  "essay" ||
                isEssayQuestion(
                  questionData
                );

              const questionOptions =
                Array.isArray(
                  answer.options
                )
                  ? answer.options
                  : Array.isArray(
                        questionData?.options
                      )
                    ? questionData.options
                    : [];

              const correctOption =
                answer.correctOption ??
                questionData?.correctAnswer;

              const selectedAnswerText =
                answerIsEssay
                  ? answer.studentAnswer ||
                    "لم تتم كتابة إجابة"
                  : answer.selectedOption !==
                        null &&
                      answer.selectedOption !==
                        undefined
                    ? questionOptions[
                        answer
                          .selectedOption
                      ] ||
                      "إجابة غير متاحة"
                    : "لم يتم اختيار إجابة";

              const correctAnswerText =
                answerIsEssay
                  ? ""
                  : correctOption !==
                        null &&
                      correctOption !==
                        undefined
                    ? questionOptions[
                        correctOption
                      ] ||
                      "الإجابة غير متاحة"
                    : "الإجابة غير متاحة";

              return (
                <article
                  className={`exam-review-item ${
                    answer.isCorrect
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

                  <div
                    style={{
                      width:
                        "100%",
                    }}
                  >
                    <h3>
                      السؤال{" "}
                      {
                        answer.questionNumber
                      }
                    </h3>

                    <p
                      style={{
                        fontWeight:
                          "700",
                        marginBottom:
                          "10px",
                      }}
                    >
                      {renderQuestionText(
                        questionText
                      )}
                    </p>

                    <p>
                      {answer.isCorrect
                        ? "إجابتك صحيحة"
                        : "إجابتك غير صحيحة"}
                    </p>

                    {!answer.isCorrect && (
                      <div
                        style={{
                          marginTop:
                            "12px",
                          padding:
                            "12px",
                          borderRadius:
                            "12px",
                          background:
                            "#fff7f7",
                        }}
                      >
                        <p
                          style={{
                            margin:
                              answerIsEssay
                                ? 0
                                : "0 0 8px",
                          }}
                        >
                          <strong>
                            إجابتك:
                          </strong>{" "}
                          {
                            selectedAnswerText
                          }
                        </p>

                        {!answerIsEssay && (
                          <p
                            style={{
                              margin:
                                0,
                            }}
                          >
                            <strong>
                              الإجابة الصحيحة:
                            </strong>{" "}
                            {
                              correctAnswerText
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            }
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

  return (
    <section className="exam-page">
      {isTimedExam && !submitted && remainingSeconds !== null && (
        <div role="status" style={{ position: "sticky", top: 8, zIndex: 20, margin: "0 auto 12px", width: "fit-content", padding: "10px 16px", borderRadius: 12, background: remainingSeconds <= 300 ? "#b91c1c" : "#172554", color: "#fff", fontWeight: 700 }}>
          الوقت المتبقي: {formatRemainingTime(remainingSeconds)}
        </div>
      )}
      <button
        type="button"
        className="exam-back-btn"
        onClick={handleExitExam}
        disabled={isSubmitting}
      >
        <FaArrowRight />
        خروج وتسليم الامتحان
      </button>

      <div className="exam-header">
        <FaClipboardCheck />

        <div>
          <h1>
            {exam.title}
          </h1>

          <p>
            أجب عن جميع الأسئلة.
            الامتحان متاح لمحاولة
            واحدة فقط.
          </p>
        </div>
      </div>

      <div className="exam-progress-card">
        <div className="exam-progress-info">
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

        <div className="exam-progress-bar">
          <div
            className="exam-progress-fill"
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

      <div className="exam-question-numbers">
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
                className={`exam-number-btn ${
                  isCurrent
                    ? "current"
                    : ""
                } ${
                  isAnswered
                    ? "answered"
                    : ""
                }`}
                onClick={() =>
                  goToQuestion(
                    index
                  )
                }
              >
                {index + 1}
              </button>
            );
          }
        )}
      </div>

      {currentQuestion && (
        <>
        {exam?.id === "second-month-comprehensive" && [45, 46, 47].includes(currentQuestionIndex) && (
          <div role="note" style={{ margin: "0 0 16px", padding: "14px 18px", borderRadius: "12px", border: "2px solid #d97706", background: "#fff3cd", color: "#7f1d1d", direction: "rtl", lineHeight: 1.9, fontWeight: 600, boxShadow: "0 2px 8px rgba(127, 29, 29, 0.10)" }}>
            <strong style={{ color: "#991b1b" }}>تنبيه مهم:</strong> <span style={{ color: "#7f1d1d" }}>الأسئلة 46 و47 و48 بدائل لبعضها؛ اختر سؤالًا واحدًا فقط للإجابة عنه، ولا تجب عن الأسئلة الثلاثة.</span>
          </div>
        )}
        <article className="exam-question-card">
          <div className="exam-question-number">
            {currentQuestionIndex +
              1}
          </div>

          {(currentQuestion?.passage || (currentQuestionIndex === 0 ? exam?.passage : "")) && (
              <div
                style={{
                  marginBottom:
                    "24px",
                  padding:
                    "20px",
                  borderRadius:
                    "16px",
                  border:
                    "1px solid #d8c2aa",
                  lineHeight:
                    "2",
                  whiteSpace:
                    "pre-line",
                  direction:
                    "rtl",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom:
                      "14px",
                  }}
                >
                  اقرأ ثم أجب
                </h3>

                <div>
                  {currentQuestion?.passage || exam?.passage}
                </div>
              </div>
            )}

          <h2>
            {renderQuestionText(
              currentQuestion.question
            )}
          </h2>

          {isEssayQuestion(
            currentQuestion
          ) ? (
            /*
              ==================
              واجهة المقالي
              ==================
            */

            <div
              style={{
                marginTop:
                  "24px",
              }}
            >
              <textarea
                value={
                  typeof answers[
                    currentQuestion
                      .id
                  ] === "string"
                    ? answers[
                        currentQuestion
                          .id
                      ]
                    : ""
                }
                onChange={(event) =>
                  writeEssayAnswer(
                    currentQuestion.id,
                    event.target
                      .value
                  )
                }
                onBlur={() =>
                  saveEssayAnswer(
                    currentQuestion.id
                  )
                }
                placeholder="اكتب إجابتك هنا..."
                disabled={
                  submitted
                }
                style={{
                  width: "100%",
                  minHeight:
                    "180px",
                  padding:
                    "18px",
                  borderRadius:
                    "16px",
                  border:
                    "1px solid #d8c2aa",
                  resize:
                    "vertical",
                  fontFamily:
                    "inherit",
                  fontSize:
                    "17px",
                  lineHeight:
                    "1.8",
                  direction:
                    "rtl",
                  boxSizing:
                    "border-box",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  saveEssayAnswer(
                    currentQuestion.id
                  )
                }
                style={{
                  marginTop:
                    "12px",
                  padding:
                    "12px 20px",
                  border:
                    "none",
                  borderRadius:
                    "12px",
                  cursor:
                    "pointer",
                  fontFamily:
                    "inherit",
                  fontWeight:
                    "700",
                }}
              >
                حفظ الإجابة
              </button>

              <p
                style={{
                  marginTop:
                    "10px",
                  opacity: 0.75,
                }}
              >
                {currentQuestion
                  .alwaysCorrect ===
                true
                  ? "اكتب إجابتك ثم احفظها."
                  : "اكتب الإجابة بطريقتك، وسيتم تصحيحها عند تسليم الامتحان."}
              </p>
            </div>
          ) : (
            /*
              ==================
              واجهة الاختياري
              ==================
            */

            <div className="exam-options-list">
              {currentQuestion.options.map(
                (
                  option,
                  optionIndex
                ) => {
                  const selected =
                    answers[
                      currentQuestion
                        .id
                    ] ===
                    optionIndex;

                  return (
                    <button
                      type="button"
                      className={`exam-option-btn ${
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
                      <span className="exam-option-letter">
                        {
                          [
                            "أ",
                            "ب",
                            "ج",
                            "د",
                          ][
                            optionIndex
                          ]
                        }
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
        </>
      )}

      <div className="exam-navigation-buttons">
        <button
          type="button"
          className="exam-navigation-btn previous"
          disabled={
            currentQuestionIndex ===
            0
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
            className="exam-navigation-btn next"
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
            className="exam-submit-btn"
            disabled={
              isSubmitting
            }
            onClick={
              submitExam
            }
          >
            {isSubmitting
              ? "جاري تصحيح وتسليم الامتحان..."
              : "تسليم الامتحان"}
          </button>
        )}
      </div>


      {showExitModal && (
        <div
          role="presentation"
          onClick={() => setShowExitModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(12, 7, 10, .76)",
            backdropFilter: "blur(7px)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-exam-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(100%, 440px)",
              padding: "28px 24px 22px",
              borderRadius: 24,
              border: "1px solid rgba(244,189,139,.35)",
              background: "linear-gradient(145deg, #2d1d22, #191318)",
              color: "#fff7f1",
              boxShadow: "0 24px 80px rgba(0,0,0,.45)",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            <div style={{
              width: 62, height: 62, margin: "0 auto 16px",
              display: "grid", placeItems: "center",
              borderRadius: 20, background: "rgba(244,189,139,.13)",
              color: "#f4bd8b", fontSize: 28,
            }}>
              <FaTimesCircle />
            </div>
            <h2 id="exit-exam-title" style={{ margin: "0 0 10px", fontSize: "1.35rem" }}>
              هل تريد الخروج من الامتحان؟
            </h2>
            <p style={{ margin: "0 0 24px", lineHeight: 1.9, color: "rgba(255,247,241,.78)", fontSize: ".96rem" }}>
              لو أكدت الخروج، هيتسلّم الامتحان بإجاباتك الحالية وهتنتهي المحاولة، ومش هتقدر ترجع تكملها.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                style={{
                  flex: "1 1 150px", padding: "13px 16px", borderRadius: 13,
                  border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.07)",
                  color: "inherit", font: "inherit", fontWeight: 700, cursor: "pointer",
                }}
              >
                لا، أكمل الامتحان
              </button>
              <button
                type="button"
                onClick={confirmExitExam}
                disabled={isSubmitting}
                style={{
                  flex: "1 1 130px", padding: "13px 16px", borderRadius: 13,
                  border: "1px solid rgba(244,189,139,.5)", background: "#d99a68",
                  color: "#24151a", font: "inherit", fontWeight: 800, cursor: "pointer",
                  opacity: isSubmitting ? .65 : 1,
                }}
              >
                {isSubmitting ? "جاري التسليم..." : "أيوه، اخرج"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Exam;