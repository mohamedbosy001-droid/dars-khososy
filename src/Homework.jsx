import { useEffect, useState } from "react";
import YouTube from "react-youtube";
import {
  FaLock,
  FaCheckCircle,
  FaPlay,
} from "react-icons/fa";

import {
  doc,
  onSnapshot,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import "./Homework.css";

const HOMEWORK_ID = "homework-1";

function Homework({ currentStudent }) {
  const [answers, setAnswers] = useState({
    question1: "",
    question2: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const studentUid =
    currentStudent?.uid ||
    auth.currentUser?.uid ||
    "";

  const isCenterStudent =
    currentStudent?.studentType === "center";

  /*
    متابعة بيانات الطالب من Firebase
    لمعرفة هل سلّم الواجب قبل كده أم لا
  */
  useEffect(() => {
    if (!studentUid || !isCenterStudent) {
      setIsLoading(false);
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
        if (!studentSnapshot.exists()) {
          setIsLoading(false);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const savedHomework =
          studentData?.homeworkSubmissions?.[
            HOMEWORK_ID
          ];

        if (savedHomework?.submitted === true) {
          setSubmitted(true);

          if (savedHomework.answers) {
            setAnswers({
              question1:
                savedHomework.answers.question1 || "",
              question2:
                savedHomework.answers.question2 || "",
            });
          }
        } else {
          setSubmitted(false);
        }

        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading homework:",
          error
        );

        setMessage(
          "حدث خطأ أثناء تحميل بيانات الواجب."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentUid, isCenterStudent]);

  /*
    الواجب لا يظهر إلا لطالب السنتر
  */
  if (!isCenterStudent) {
    return null;
  }

  function handleAnswerChange(event) {
    if (submitted) {
      return;
    }

    const { name, value } = event.target;

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [name]: value,
    }));

    setMessage("");
  }

  /*
    حفظ تسليم الواجب في Firebase
  */
  async function handleSubmitHomework(event) {
    event.preventDefault();

    if (submitted) {
      return;
    }

    if (
      !answers.question1 ||
      !answers.question2
    ) {
      setMessage(
        "من فضلك جاوب على جميع الأسئلة الأول."
      );

      return;
    }

    if (!studentUid) {
      setMessage(
        "تعذر تحديد حساب الطالب. سجل الدخول مرة أخرى."
      );

      return;
    }

    setIsSubmitting(true);
    setMessage("جاري تسليم الواجب...");

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

          if (!studentSnapshot.exists()) {
            throw new Error(
              "Student document not found."
            );
          }

          const studentData =
            studentSnapshot.data();

          /*
            حماية إضافية:
            نتأكد إن الحساب طالب سنتر
          */
          if (
            studentData.studentType !== "center"
          ) {
            throw new Error(
              "Homework is only available for center students."
            );
          }

          const oldSubmissions = {
            ...(studentData.homeworkSubmissions ||
              {}),
          };

          const oldHomework =
            oldSubmissions[HOMEWORK_ID];

          const wasAlreadySubmitted =
            oldHomework?.submitted === true;

          const now = Timestamp.now();

          oldSubmissions[HOMEWORK_ID] = {
            homeworkId: HOMEWORK_ID,

            title: "الواجب الأول",

            answers: {
              question1:
                answers.question1,

              question2:
                answers.question2,
            },

            submitted: true,

            videoUnlocked: true,

            submittedAt:
              oldHomework?.submittedAt ||
              now,

            updatedAt: now,
          };

          const oldCompletedHomeworks =
            Number(
              studentData.completedHomeworks ||
                0
            );

          transaction.update(
            studentReference,
            {
              homeworkSubmissions:
                oldSubmissions,

              completedHomeworks:
                wasAlreadySubmitted
                  ? oldCompletedHomeworks
                  : oldCompletedHomeworks + 1,

              updatedAt: now,
            }
          );
        }
      );

      setSubmitted(true);

      setMessage(
        "✅ تم تسليم الواجب بنجاح وتم فتح الفيديو."
      );
    } catch (error) {
      console.error(
        "Error submitting homework:",
        error
      );

      setMessage(
        "حدث خطأ أثناء تسليم الواجب. حاول مرة أخرى."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="homework-page">
        <div className="homework-heading">
          <h1>تسليم الواجب</h1>

          <p>
            جاري تحميل الواجب...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="homework-page">
      <div className="homework-heading">
        <h1>تسليم الواجب</h1>

        <p>
          جاوب على جميع الأسئلة، وبعد تسليم
          الواجب هيتفتح الفيديو.
        </p>
      </div>

      <form
        className="homework-form"
        onSubmit={handleSubmitHomework}
      >
        <div className="homework-question-card">
          <h2>السؤال الأول</h2>

          <p>اختر الإجابة الصحيحة:</p>

          <label>
            <input
              type="radio"
              name="question1"
              value="answer1"
              checked={
                answers.question1 ===
                "answer1"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الأولى
          </label>

          <label>
            <input
              type="radio"
              name="question1"
              value="answer2"
              checked={
                answers.question1 ===
                "answer2"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الثانية
          </label>

          <label>
            <input
              type="radio"
              name="question1"
              value="answer3"
              checked={
                answers.question1 ===
                "answer3"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الثالثة
          </label>
        </div>

        <div className="homework-question-card">
          <h2>السؤال الثاني</h2>

          <p>اختر الإجابة الصحيحة:</p>

          <label>
            <input
              type="radio"
              name="question2"
              value="answer1"
              checked={
                answers.question2 ===
                "answer1"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الأولى
          </label>

          <label>
            <input
              type="radio"
              name="question2"
              value="answer2"
              checked={
                answers.question2 ===
                "answer2"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الثانية
          </label>

          <label>
            <input
              type="radio"
              name="question2"
              value="answer3"
              checked={
                answers.question2 ===
                "answer3"
              }
              onChange={handleAnswerChange}
              disabled={submitted}
            />

            الإجابة الثالثة
          </label>
        </div>

        {message && (
          <div className="homework-message">
            {message}
          </div>
        )}

        {!submitted && (
          <button
            type="submit"
            className="homework-submit-btn"
            disabled={isSubmitting}
          >
            <FaCheckCircle />

            {isSubmitting
              ? "جاري التسليم..."
              : "تسليم الواجب"}
          </button>
        )}

        {submitted && (
          <div className="homework-message">
            <FaCheckCircle />
            تم تسليم هذا الواجب
          </div>
        )}
      </form>

      <section className="homework-video-section">
        <h2>
          فيديو بعد تسليم الواجب
        </h2>

        {!submitted ? (
          <div className="homework-video-locked">
            <FaLock />

            <h3>الفيديو مقفول</h3>

            <p>
              لازم تحل وتسلم الواجب الأول
              علشان الفيديو يتفتح.
            </p>
          </div>
        ) : (
          <div className="homework-video-unlocked">
            <div className="homework-video-status">
              <FaPlay />
              الفيديو متاح الآن
            </div>

            <div className="homework-video-wrapper">
              <YouTube
                videoId="VIDEO_ID_HERE"
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
              />
            </div>
          </div>
        )}
      </section>
    </section>
  );
}

export default Homework;