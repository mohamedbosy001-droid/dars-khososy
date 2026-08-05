import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaBullseye,
  FaVideo,
  FaClipboardCheck,
  FaFileAlt,
  FaTrophy,
  FaCrown,
  FaStar,
} from "react-icons/fa";

import "./MyPoints.css";

function MyPoints({ currentStudent }) {
  const [studentData, setStudentData] =
    useState(currentStudent || null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [pointsError, setPointsError] =
    useState("");

  useEffect(() => {
    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      setStudentData(null);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setPointsError("");

    const studentReference = doc(
      db,
      "students",
      studentUid
    );

    const unsubscribe = onSnapshot(
      studentReference,
      (studentSnapshot) => {
        if (!studentSnapshot.exists()) {
          setStudentData(null);
          setPointsError(
            "تعذر العثور على بيانات الطالب."
          );
          setIsLoading(false);
          return;
        }

        setStudentData({
          uid: studentSnapshot.id,
          ...studentSnapshot.data(),
        });

        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading student points:",
          error
        );

        setPointsError(
          "تعذر تحميل النقاط حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent]);

  const watchedVideos = Number(
    studentData?.watchedVideos || 0
  );

  const completedHomeworks = Number(
    studentData?.completedHomeworks || 0
  );

  const completedExams = Number(
    studentData?.completedExams || 0
  );

  const completedCourses = Number(
    studentData?.completedCourses || 0
  );

  const dailyLogins = Number(
    studentData?.dailyLogins || 0
  );

  const examResults = Array.isArray(
    studentData?.examResults
  )
    ? studentData.examResults
    : [];

  const homeworkResults = Array.isArray(
    studentData?.homeworkResults
  )
    ? studentData.homeworkResults
    : [];

  const perfectExamScores =
    examResults.filter((result) => {
      const percentage = Number(
        result.percentage ??
          (
            Number(
              result.obtainedGrade ??
                result.score ??
                0
            ) /
            Number(
              result.totalGrade ??
                result.total ??
                1
            )
          ) *
            100
      );

      return percentage >= 100;
    }).length;

  const perfectHomeworkScores =
    homeworkResults.filter((result) => {
      const percentage = Number(
        result.percentage ??
          (
            Number(
              result.obtainedGrade ??
                result.score ??
                0
            ) /
            Number(
              result.totalGrade ??
                result.total ??
                1
            )
          ) *
            100
      );

      return percentage >= 100;
    }).length;

  const perfectScores =
    perfectExamScores +
    perfectHomeworkScores;

  const calculatedVideoPoints =
    watchedVideos * 10;

  const calculatedHomeworkPoints =
    completedHomeworks * 20;

  const calculatedExamPoints =
    completedExams * 30;

  const calculatedPerfectScorePoints =
    perfectScores * 20;

  const calculatedCoursePoints =
    completedCourses * 100;

  const calculatedLoginPoints =
    dailyLogins * 5;

  const calculatedTotalPoints =
    calculatedVideoPoints +
    calculatedHomeworkPoints +
    calculatedExamPoints +
    calculatedPerfectScorePoints +
    calculatedCoursePoints +
    calculatedLoginPoints;

  const savedPoints = Number(
    studentData?.points
  );

  const totalPoints =
    !Number.isNaN(savedPoints) &&
    savedPoints > 0
      ? savedPoints
      : calculatedTotalPoints;

  function getRank(points) {
    if (points >= 2000) {
      return {
        title: "بطل المنصة",
        icon: <FaCrown />,
        nextRank: null,
        currentTarget: 2000,
        nextTarget: 2000,
      };
    }

    if (points >= 1000) {
      return {
        title: "متميز",
        icon: <FaTrophy />,
        nextRank: "بطل المنصة",
        currentTarget: 1000,
        nextTarget: 2000,
      };
    }

    if (points >= 500) {
      return {
        title: "مجتهد",
        icon: <FaStar />,
        nextRank: "متميز",
        currentTarget: 500,
        nextTarget: 1000,
      };
    }

    return {
      title: "مبتدئ",
      icon: <FaBullseye />,
      nextRank: "مجتهد",
      currentTarget: 0,
      nextTarget: 500,
    };
  }

  const rankData = getRank(totalPoints);

  const progressPercentage =
    rankData.nextRank
      ? Math.min(
          Math.round(
            ((totalPoints -
              rankData.currentTarget) /
              (rankData.nextTarget -
                rankData.currentTarget)) *
              100
          ),
          100
        )
      : 100;

  const remainingPoints =
    rankData.nextRank
      ? Math.max(
          rankData.nextTarget -
            totalPoints,
          0
        )
      : 0;

  const activities = [
    {
      id: 1,
      title: "مشاهدة الفيديوهات",
      description: `${watchedVideos} فيديو × 10 نقاط`,
      points: calculatedVideoPoints,
      icon: <FaVideo />,
    },
    {
      id: 2,
      title: "حل الواجبات",
      description: `${completedHomeworks} واجب × 20 نقطة`,
      points: calculatedHomeworkPoints,
      icon: <FaClipboardCheck />,
    },
    {
      id: 3,
      title: "حل الامتحانات",
      description: `${completedExams} امتحان × 30 نقطة`,
      points: calculatedExamPoints,
      icon: <FaFileAlt />,
    },
    {
      id: 4,
      title: "الدرجات النهائية",
      description: `${perfectScores} نتيجة كاملة × 20 نقطة`,
      points:
        calculatedPerfectScorePoints,
      icon: <FaStar />,
    },
    {
      id: 5,
      title: "إنهاء الكورسات",
      description: `${completedCourses} كورس × 100 نقطة`,
      points: calculatedCoursePoints,
      icon: <FaTrophy />,
    },
  ];

  if (isLoading) {
    return (
      <section className="points-page">
        <div className="points-title">
          <FaBullseye />
          <h1>نقاطي</h1>
        </div>

        <div className="points-empty-message">
          <FaBullseye />

          <div>
            <h2>جاري تحميل النقاط...</h2>

            <p>
              انتظر لحظات حتى يتم تحميل
              بيانات حسابك.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (pointsError) {
    return (
      <section className="points-page">
        <div className="points-title">
          <FaBullseye />
          <h1>نقاطي</h1>
        </div>

        <div className="points-empty-message">
          <FaBullseye />

          <div>
            <h2>حدث خطأ</h2>
            <p>{pointsError}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="points-page">
      <div className="points-title">
        <FaBullseye />
        <h1>نقاطي</h1>
      </div>

      <div className="points-summary">
        <div className="points-total-card">
          <span>إجمالي نقاطك</span>

          <strong>{totalPoints}</strong>

          <p>نقطة</p>
        </div>

        <div className="points-rank-card">
          <div className="points-rank-icon">
            {rankData.icon}
          </div>

          <div>
            <span>رتبتك الحالية</span>
            <h2>{rankData.title}</h2>
          </div>
        </div>
      </div>

      <div className="points-progress-card">
        <div className="points-progress-heading">
          <div>
            <h2>
              {rankData.nextRank
                ? `الطريق إلى رتبة ${rankData.nextRank}`
                : "وصلت لأعلى رتبة"}
            </h2>

            <p>
              {rankData.nextRank
                ? `متبقي لك ${remainingPoints} نقطة`
                : "أنت الآن بطل المنصة"}
            </p>
          </div>

          <strong>
            {progressPercentage}%
          </strong>
        </div>

        <div className="points-progress">
          <div
            className="points-progress-fill"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="points-progress-numbers">
          <span>{totalPoints} نقطة</span>

          <span>
            {rankData.nextTarget} نقطة
          </span>
        </div>
      </div>

      <div className="points-activities">
        <h2>تفاصيل النقاط</h2>

        <div className="points-activities-grid">
          {activities.map((activity) => (
            <article
              className="points-activity-card"
              key={activity.id}
            >
              <div className="points-activity-icon">
                {activity.icon}
              </div>

              <div className="points-activity-content">
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
              </div>

              <strong>
                +{activity.points}
              </strong>
            </article>
          ))}
        </div>
      </div>

      {totalPoints === 0 && (
        <div className="points-empty-message">
          <FaBullseye />

          <div>
            <h2>ابدأ تجمع نقاطك</h2>

            <p>
              شاهد الدروس وحل الواجبات
              والامتحانات، وهتظهر نقاطك هنا
              تلقائيًا.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default MyPoints;