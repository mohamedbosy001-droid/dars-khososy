import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  doc,
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

function renderQuestionText(text = "") {
  const parts = text.split(/(\[\[.*?\]\])/g);

  return parts.map((part, index) => {
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
  });
}

function Exam({
  exam,
  currentStudent,
  onBack,
}) {
  const [answers, setAnswers] =
    useState({});

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

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const questions = useMemo(() => {
    return Array.isArray(exam?.questions)
      ? exam.questions
      : [];
  }, [exam]);

  const currentQuestion =
    questions[currentQuestionIndex];

  const answeredQuestionsCount =
    questions.filter(
      (question) =>
        answers[question.id] !== undefined
    ).length;

  const progressPercentage =
    questions.length > 0
      ? Math.round(
          (answeredQuestionsCount /
            questions.length) *
            100
        )
      : 0;

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
                (savedExamResult) =>
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
                    questions.length - 1,
                    0
                  )
                )
              );

              return;
            }

            examAttempts[exam.id] = {
              examId: exam.id,
              examTitle: exam.title,

              started: true,
              completed: false,

              answers: {},
              currentQuestionIndex: 0,

              startedAt:
                Timestamp.now(),

              updatedAt:
                Timestamp.now(),
            };

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
        setIsLoadingAttempt(false);
      }
    }

    loadExamAttempt();
  }, [
    studentUid,
    exam?.id,
    exam?.title,
    questions.length,
  ]);

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
      const studentReference = doc(
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

  function chooseAnswer(
    questionId,
    optionIndex
  ) {
    if (submitted) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [questionId]: optionIndex,
    };

    setAnswers(nextAnswers);

    saveAttemptProgress(
      nextAnswers,
      currentQuestionIndex
    );
  }

  function goToQuestion(
    questionIndex
  ) {
    if (
      questionIndex < 0 ||
      questionIndex >= questions.length
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

  async function submitExam() {
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

    try {
      let score = 0;

      const reviewedAnswers =
        questions.map(
          (question, index) => {
            const selectedOption =
              answers[question.id];

            const isCorrect =
              selectedOption ===
              question.correctAnswer;

            if (isCorrect) {
              score += 1;
            }

            return {
              questionId:
                question.id,

              questionNumber:
                index + 1,

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

      const examResult = {
        examId: exam.id,
        examTitle: exam.title,

        score,
        totalQuestions,
        percentage,

        answers:
          reviewedAnswers,

        completed: true,

        submittedAt:
          Timestamp.now(),
      };

      if (!studentUid) {
        throw new Error(
          "Student UID is missing."
        );
      }

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
            examAttempts[exam.id];

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
              (savedResult) =>
                savedResult?.examId ===
                exam.id
            );

          if (
            existingResultIndex >= 0
          ) {
            throw new Error(
              "EXAM_ALREADY_COMPLETED"
            );
          }

          examResults.push(
            examResult
          );

          examAttempts[exam.id] = {
            ...(existingAttempt || {}),

            examId: exam.id,
            examTitle: exam.title,

            started: true,
            completed: true,

            answers,

            currentQuestionIndex,

            completedAt:
              Timestamp.now(),

            updatedAt:
              Timestamp.now(),

            result: examResult,
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

      window.scrollTo(0, 0);
    } catch (error) {
      console.error(
        "Error submitting exam:",
        error
      );

      if (
        error.message ===
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
      setIsSubmitting(false);
    }
  }

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

  if (submitted && result) {
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

          <h1>نتيجة الامتحان</h1>

          <h2>{exam.title}</h2>

          <strong>
            {result.score} من{" "}
            {result.totalQuestions}
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
                answer.selectedOption !==
                  null &&
                answer.selectedOption !==
                  undefined
                  ? questionOptions[
                      answer.selectedOption
                    ] ||
                    "إجابة غير متاحة"
                  : "لم يتم اختيار إجابة";

              const correctAnswerText =
                correctOption !==
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
                      width: "100%",
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
                        fontWeight: "700",
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
                              "0 0 8px",
                          }}
                        >
                          <strong>
                            إجابتك:
                          </strong>{" "}
                          {
                            selectedAnswerText
                          }
                        </p>

                        <p
                          style={{
                            margin: 0,
                          }}
                        >
                          <strong>
                            الإجابة الصحيحة:
                          </strong>{" "}
                          {
                            correctAnswerText
                          }
                        </p>
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

      <div className="exam-header">
        <FaClipboardCheck />

        <div>
          <h1>{exam.title}</h1>

          <p>
            اختر إجابة واحدة لكل سؤال.
            الامتحان متاح لمحاولة واحدة فقط.
          </p>
        </div>
      </div>

      <div className="exam-progress-card">
        <div className="exam-progress-info">
          <strong>
            السؤال{" "}
            {currentQuestionIndex + 1} من{" "}
            {questions.length}
          </strong>

          <span>
            تم حل{" "}
            {answeredQuestionsCount} من{" "}
            {questions.length}
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
          (question, index) => {
            const isCurrent =
              index ===
              currentQuestionIndex;

            const isAnswered =
              answers[question.id] !==
              undefined;

            return (
              <button
                type="button"
                key={question.id}
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
                  goToQuestion(index)
                }
              >
                {index + 1}
              </button>
            );
          }
        )}
      </div>

      {currentQuestion && (
        <article className="exam-question-card">
          <div className="exam-question-number">
            {currentQuestionIndex + 1}
          </div>

          <h2>
            {renderQuestionText(
              currentQuestion.question
            )}
          </h2>

          <div className="exam-options-list">
            {currentQuestion.options.map(
              (
                option,
                optionIndex
              ) => {
                const selected =
                  answers[
                    currentQuestion.id
                  ] === optionIndex;

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
                        ][optionIndex]
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
        </article>
      )}

      <div className="exam-navigation-buttons">
        <button
          type="button"
          className="exam-navigation-btn previous"
          disabled={
            currentQuestionIndex === 0
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
            disabled={isSubmitting}
            onClick={submitExam}
          >
            {isSubmitting
              ? "جاري تسليم الامتحان..."
              : "تسليم الامتحان"}
          </button>
        )}
      </div>
    </section>
  );
}

export default Exam;