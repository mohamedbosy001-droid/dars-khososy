import {
  useEffect,
  useMemo,
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

/* =========================
   الواجب الأول - كما هو
========================= */

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

const FIRST_HOMEWORK_QUESTIONS = Array.from(
  {
    length: 37,
  },
  (_, index) => {
    const questionNumber = index + 1;

    const isCancelled =
      FIRST_HOMEWORK_CANCELLED_QUESTIONS.includes(
        questionNumber
      );

    return {
      id: `homework-1-q${questionNumber}`,

      questionNumber,

      question: `السؤال ${questionNumber}`,

      options: ["أ", "ب", "ج", "د"],

      cancelled: isCancelled,

      correctAnswer: isCancelled
        ? null
        : FIRST_HOMEWORK_CORRECT_ANSWERS[
            questionNumber
          ],
    };
  }
);

/* =========================
   الواجب الثاني
========================= */

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

const SECOND_HOMEWORK_QUESTIONS = Array.from(
  {
    length: 20,
  },
  (_, index) => {
    const questionNumber = index + 1;

    return {
      id: `third-homework-2-q${questionNumber}`,

      questionNumber,

      question: `السؤال ${questionNumber}`,

      options: ["أ", "ب", "ج", "د"],

      cancelled: false,

      correctAnswer:
        SECOND_HOMEWORK_CORRECT_ANSWERS[
          questionNumber
        ],
    };
  }
);

/* =========================
   بيانات الواجبات
========================= */

const HOMEWORKS = [
  {
    id: "homework-1",

    title: "الواجب الأول",

    videoId: "qa2X7xgsay0",

    questions:
      FIRST_HOMEWORK_QUESTIONS,
  },

  {
    id: "third-homework-2",

    title: "الواجب الثاني",

    videoId: "6pv2Rb6UPr4",

    questions:
      SECOND_HOMEWORK_QUESTIONS,
  },
];

function Homework({
  currentStudent,
}) {
  const [openedSection, setOpenedSection] =
    useState(null);

  const [
    activeHomeworkId,
    setActiveHomeworkId,
  ] = useState(null);

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

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const isAllowedStudent =
    currentStudent?.studentType ===
      "center" &&
    (currentStudent?.grade ===
      "الثالث الثانوي" ||
      currentStudent?.grade ===
        "الصف الثالث الثانوي");

  const activeHomework =
    useMemo(
      () =>
        HOMEWORKS.find(
          (homework) =>
            homework.id ===
            activeHomeworkId
        ) || null,
      [activeHomeworkId]
    );

  const questions =
    activeHomework?.questions || [];

  const currentQuestion =
    questions[
      currentQuestionIndex
    ];

  const answeredQuestionsCount =
    questions.filter(
      (question) =>
        question.cancelled ||
        answers[question.id] !==
          undefined
    ).length;

  const progressPercentage =
    questions.length > 0
      ? Math.round(
          (answeredQuestionsCount /
            questions.length) *
            100
        )
      : 0;

  /* =========================
     تحميل حالة كل الواجبات
  ========================= */

  useEffect(() => {
    async function loadDashboard() {
      if (
        !studentUid ||
        !isAllowedStudent
      ) {
        setIsLoadingDashboard(false);
        return;
      }

      try {
        const studentReference = doc(
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

        const nextStatuses = {};

        HOMEWORKS.forEach(
          (homework) => {
            const attempt =
              attempts[
                homework.id
              ];

            const savedResult =
              results.find(
                (item) =>
                  item?.homeworkId ===
                  homework.id
              );

            const savedAnswers =
              attempt?.answers || {};

            const answeredCount =
              homework.questions.filter(
                (question) =>
                  question.cancelled ||
                  savedAnswers[
                    question.id
                  ] !== undefined
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
                attempt?.result?.score ??
                0,

              totalQuestions:
                savedResult?.totalQuestions ??
                homework.questions.length,

              answeredCount,
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
        setIsLoadingDashboard(false);
      }
    }

    loadDashboard();
  }, [
    studentUid,
    isAllowedStudent,
  ]);

  /* =========================
     تحميل الواجب المختار
  ========================= */

  useEffect(() => {
    async function loadHomeworkAttempt() {
      if (
        !activeHomework ||
        !studentUid ||
        !isAllowedStudent
      ) {
        return;
      }

      setIsLoadingAttempt(true);

      setAnswers({});

      setCurrentQuestionIndex(0);

      setSubmitted(false);

      setResult(null);

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

            const studentIsAllowed =
              studentData.studentType ===
                "center" &&
              (studentData.grade ===
                "الثالث الثانوي" ||
                studentData.grade ===
                  "الصف الثالث الثانوي");

            if (!studentIsAllowed) {
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
              homeworkResults.find(
                (savedHomeworkResult) =>
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
                    activeHomework
                      .questions.length -
                      1,
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
          error
        );

        if (
          error.message !==
          "HOMEWORK_NOT_ALLOWED"
        ) {
          window.alert(
            "حدث خطأ أثناء تحميل الواجب."
          );
        }
      } finally {
        setIsLoadingAttempt(false);
      }
    }

    loadHomeworkAttempt();
  }, [
    activeHomeworkId,
    studentUid,
    isAllowedStudent,
    activeHomework,
  ]);

  async function saveAttemptProgress(
    nextAnswers,
    nextQuestionIndex
  ) {
    if (
      !studentUid ||
      !activeHomework ||
      submitted ||
      !isAllowedStudent
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

    const question =
      questions.find(
        (item) =>
          item.id === questionId
      );

    if (question?.cancelled) {
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

  function openHomework(
    homeworkId
  ) {
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

    if (!status?.completed) {
      return;
    }

    setActiveHomeworkId(
      homeworkId
    );

    setOpenedSection("video");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goBackToHomeworkHome() {
    setOpenedSection(null);

    setActiveHomeworkId(null);

    setAnswers({});

    setCurrentQuestionIndex(0);

    setSubmitted(false);

    setResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submitHomework() {
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
          answers[question.id] !==
          undefined
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

    setIsSubmitting(true);

    try {
      let score = 0;

      const reviewedAnswers =
        questions.map(
          (question, index) => {
            if (
              question.cancelled
            ) {
              score += 1;

              return {
                questionId:
                  question.id,

                questionNumber:
                  index + 1,

                selectedOption:
                  null,

                correctOption:
                  null,

                isCorrect: true,

                cancelled: true,
              };
            }

            const selectedOption =
              answers[
                question.id
              ];

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

              isCorrect,

              cancelled: false,
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

      const homeworkResult = {
        homeworkId:
          activeHomework.id,

        homeworkTitle:
          activeHomework.title,

        score,

        totalQuestions,

        percentage,

        answers:
          reviewedAnswers,

        completed: true,

        videoUnlocked: true,

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

          const studentIsAllowed =
            studentData.studentType ===
              "center" &&
            (studentData.grade ===
              "الثالث الثانوي" ||
              studentData.grade ===
                "الصف الثالث الثانوي");

          if (!studentIsAllowed) {
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

          homeworkResults.push(
            homeworkResult
          );

          homeworkAttempts[
            activeHomework.id
          ] = {
            ...(existingAttempt ||
              {}),

            homeworkId:
              activeHomework.id,

            title:
              activeHomework.title,

            started: true,

            completed: true,

            answers,

            currentQuestionIndex,

            videoUnlocked: true,

            completedAt:
              Timestamp.now(),

            updatedAt:
              Timestamp.now(),

            result:
              homeworkResult,
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

      setResult(
        homeworkResult
      );

      setSubmitted(true);

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

      window.scrollTo(0, 0);
    } catch (error) {
      console.error(
        "Error submitting homework:",
        error
      );

      if (
        error.message ===
        "HOMEWORK_ALREADY_COMPLETED"
      ) {
        window.alert(
          "لقد سلمت هذا الواجب من قبل."
        );
      } else if (
        error.message ===
        "HOMEWORK_NOT_ALLOWED"
      ) {
        window.alert(
          "هذا الواجب غير متاح لهذا الحساب."
        );
      } else {
        window.alert(
          "حدث خطأ أثناء تسليم الواجب."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =========================
     غير مسموح
  ========================= */

  if (!isAllowedStudent) {
    return (
      <section className="homework-page">
        <div className="homework-locked-page">
          <FaLock />

          <h2>
            المحتوى غير متاح
          </h2>

          <p>
            هذا الواجب متاح لطلاب
            السنتر بالصف الثالث
            الثانوي فقط.
          </p>
        </div>
      </section>
    );
  }

  /* =========================
     الصفحة الرئيسية للواجبات
  ========================= */

  if (openedSection === null) {
    if (isLoadingDashboard) {
      return (
        <section className="homework-page">
          <div className="homework-empty">
            <h2>
              جاري تحميل الواجبات...
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
            اختر الواجب لبدء الحل أو
            مشاهدة النتيجة بعد التسليم.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {HOMEWORKS.map(
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
                      (answeredCount /
                        homework
                          .questions
                          .length) *
                        100
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

  /* =========================
     تحميل الواجب
  ========================= */

  if (isLoadingAttempt) {
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

  /* =========================
     الفيديو
  ========================= */

  if (
    openedSection === "video"
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
                والفيديو متاح للمشاهدة.
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

  /* =========================
     النتيجة
  ========================= */

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
            {result.totalQuestions}
          </strong>

          <span>
            {result.percentage}%
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

  /* =========================
     حل الواجب
  ========================= */

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
            افتح السؤال من الكتاب
            واختر الإجابة الصحيحة.
            بعد تسليم الواجب سيتم
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
          (question, index) => {
            const isCurrent =
              index ===
              currentQuestionIndex;

            const isAnswered =
              question.cancelled ||
              answers[
                question.id
              ] !== undefined;

            return (
              <button
                type="button"
                key={
                  question.id
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
                {index + 1}
              </button>
            );
          }
        )}
      </div>

      {currentQuestion && (
        <article className="homework-question-card">
          <div className="homework-question-number">
            {currentQuestionIndex +
              1}
          </div>

          <h2>
            السؤال{" "}
            {currentQuestionIndex +
              1}
          </h2>

          {currentQuestion.cancelled ? (
            <div className="homework-cancelled-question">
              <FaCheckCircle />

              <h3>
                السؤال ملغي
              </h3>

              <p>
                لا تحتاج للإجابة
                على هذا السؤال،
                وسيتم احتسابه
                صحيحًا تلقائيًا.
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

                  return (
                    <button
                      type="button"
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
                        {option}
                      </span>

                      <span>
                        الاختيار{" "}
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
            className="homework-navigation-btn next"
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