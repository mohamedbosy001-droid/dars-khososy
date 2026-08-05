import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaFileAlt,
  FaClipboardCheck,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

import "./Results.css";

function Results({ currentStudent }) {
  const [activeResultsTab, setActiveResultsTab] =
    useState("exams");

  const [examResults, setExamResults] =
    useState([]);

  const [homeworkResults, setHomeworkResults] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [resultsError, setResultsError] =
    useState("");

  useEffect(() => {
    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      setExamResults([]);
      setHomeworkResults([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setResultsError("");

    const studentReference = doc(
      db,
      "students",
      studentUid
    );

    const unsubscribe = onSnapshot(
      studentReference,
      (studentSnapshot) => {
        if (!studentSnapshot.exists()) {
          setExamResults([]);
          setHomeworkResults([]);
          setResultsError(
            "تعذر العثور على بيانات الطالب."
          );
          setIsLoading(false);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const loadedExamResults =
          Array.isArray(
            studentData.examResults
          )
            ? studentData.examResults
            : [];

        const loadedHomeworkResults =
          Array.isArray(
            studentData.homeworkResults
          )
            ? studentData.homeworkResults
            : [];

        setExamResults(
          loadedExamResults.map(
            (result, index) => ({
              id:
                result.id ||
                `exam-${index}`,
              ...result,
            })
          )
        );

        setHomeworkResults(
          loadedHomeworkResults.map(
            (result, index) => ({
              id:
                result.id ||
                `homework-${index}`,
              ...result,
            })
          )
        );

        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading results:",
          error
        );

        setResultsError(
          "تعذر تحميل النتائج حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent]);

  const currentResults =
    activeResultsTab === "exams"
      ? examResults
      : homeworkResults;

  const emptyTitle =
    activeResultsTab === "exams"
      ? "لا توجد نتائج امتحانات حتى الآن"
      : "لا توجد نتائج واجبات حتى الآن";

  const emptyDescription =
    activeResultsTab === "exams"
      ? "أول ما تحل أي امتحان، النتيجة هتظهر هنا بالتفاصيل."
      : "أول ما تحل أي واجب، النتيجة هتظهر هنا بالتفاصيل.";

  function formatResultDate(dateValue) {
    if (!dateValue) {
      return "التاريخ غير محدد";
    }

    try {
      const date =
        typeof dateValue.toDate === "function"
          ? dateValue.toDate()
          : new Date(dateValue);

      return new Intl.DateTimeFormat(
        "ar-EG",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ).format(date);
    } catch {
      return "التاريخ غير محدد";
    }
  }

  function getResultNumbers(result) {
    const score = Number(
      result.score ??
        result.obtainedGrade ??
        result.grade ??
        0
    );

    const totalScore = Number(
      result.totalScore ??
        result.totalGrade ??
        result.total ??
        result.maxGrade ??
        0
    );

    const savedPercentage = Number(
      result.percentage
    );

    const percentage =
      !Number.isNaN(savedPercentage) &&
      result.percentage !== undefined
        ? Math.min(
            Math.max(
              Math.round(savedPercentage),
              0
            ),
            100
          )
        : totalScore > 0
          ? Math.min(
              Math.max(
                Math.round(
                  (score / totalScore) * 100
                ),
                0
              ),
              100
            )
          : 0;

    return {
      score,
      totalScore,
      percentage,
    };
  }

  return (
    <section className="results-page">
      <div className="results-title">
        <FaFileAlt />
        <h1>نتائجك</h1>
      </div>

      <div className="results-tabs">
        <button
          type="button"
          className={`results-tab-btn ${
            activeResultsTab === "exams"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveResultsTab("exams")
          }
        >
          <FaFileAlt />
          نتائج الامتحانات
        </button>

        <button
          type="button"
          className={`results-tab-btn ${
            activeResultsTab === "homework"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveResultsTab("homework")
          }
        >
          <FaClipboardCheck />
          نتائج الواجبات
        </button>
      </div>

      {isLoading ? (
        <div className="empty-results">
          <div className="empty-results-icon">
            <FaFileAlt />
          </div>

          <h2>جاري تحميل النتائج...</h2>

          <p>
            انتظر لحظات حتى يتم تحميل نتائجك.
          </p>
        </div>
      ) : resultsError ? (
        <div className="empty-results">
          <div className="empty-results-icon">
            <FaExclamationTriangle />
          </div>

          <h2>حدث خطأ</h2>

          <p>{resultsError}</p>
        </div>
      ) : currentResults.length === 0 ? (
        <div className="empty-results">
          <div className="empty-results-icon">
            {activeResultsTab === "exams" ? (
              <FaFileAlt />
            ) : (
              <FaClipboardCheck />
            )}
          </div>

          <h2>{emptyTitle}</h2>

          <p>{emptyDescription}</p>
        </div>
      ) : (
        <div className="results-list">
          {currentResults.map((result) => {
            const {
              score,
              totalScore,
              percentage,
            } = getResultNumbers(result);

            const passed =
              result.passed !== undefined
                ? result.passed === true
                : percentage >= 50;

            return (
              <article
                className="result-card"
                key={result.id}
              >
                <div className="result-card-heading">
                  <div>
                    <span className="result-course">
                      {result.courseName ||
                        result.courseTitle ||
                        "كورس اللغة العربية"}
                    </span>

                    <h2>
                      {result.title ||
                        result.examTitle ||
                        result.homeworkTitle ||
                        "نتيجة جديدة"}
                    </h2>

                    <p>
                      {formatResultDate(
                        result.createdAt ||
                          result.date
                      )}
                    </p>
                  </div>

                  <div
                    className={`result-status ${
                      passed
                        ? "passed"
                        : "failed"
                    }`}
                  >
                    {passed ? (
                      <FaCheckCircle />
                    ) : (
                      <FaExclamationTriangle />
                    )}

                    {passed
                      ? "ناجح"
                      : "يحتاج تحسين"}
                  </div>
                </div>

                <div className="result-details">
                  <div className="result-number">
                    <span>درجتك</span>
                    <strong>{score}</strong>
                  </div>

                  <div className="result-number">
                    <span>
                      الدرجة النهائية
                    </span>

                    <strong>
                      {totalScore}
                    </strong>
                  </div>

                  <div className="result-number">
                    <span>النسبة</span>

                    <strong>
                      {percentage}%
                    </strong>
                  </div>
                </div>

                <div className="result-progress">
                  <div
                    className={`result-progress-fill ${
                      passed
                        ? "passed"
                        : "failed"
                    }`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Results;