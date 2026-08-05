import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";

import {
  FaTrophy,
  FaCrown,
  FaMedal,
  FaUserGraduate,
} from "react-icons/fa";

import "./TopTen.css";

function TopTen({ currentStudent }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [topTenError, setTopTenError] =
    useState("");

  const studentGrade =
    currentStudent?.grade || "";

  useEffect(() => {
    if (!studentGrade) {
      setStudents([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setTopTenError("");

    const studentsQuery = query(
      collection(db, "students"),
      where("grade", "==", studentGrade),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const studentsData = snapshot.docs.map(
          (studentDocument) => ({
            id: studentDocument.id,
            ...studentDocument.data(),
          })
        );

        setStudents(studentsData);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading top ten students:",
          error
        );

        setTopTenError(
          "تعذر تحميل ترتيب الطلاب حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentGrade]);

  function calculateStudentPoints(student) {
    const savedPoints = Number(student.points);

    if (
      !Number.isNaN(savedPoints) &&
      savedPoints > 0
    ) {
      return savedPoints;
    }

    const watchedVideos = Number(
      student.watchedVideos || 0
    );

    const completedHomeworks = Number(
      student.completedHomeworks || 0
    );

    const completedExams = Number(
      student.completedExams || 0
    );

    const completedCourses = Number(
      student.completedCourses || 0
    );

    const dailyLogins = Number(
      student.dailyLogins || 0
    );

    const examResults = Array.isArray(
      student.examResults
    )
      ? student.examResults
      : [];

    const homeworkResults = Array.isArray(
      student.homeworkResults
    )
      ? student.homeworkResults
      : [];

    function isPerfectResult(result) {
      const savedPercentage = Number(
        result.percentage
      );

      if (
        result.percentage !== undefined &&
        !Number.isNaN(savedPercentage)
      ) {
        return savedPercentage >= 100;
      }

      const score = Number(
        result.score ??
          result.obtainedGrade ??
          0
      );

      const totalScore = Number(
        result.totalScore ??
          result.totalGrade ??
          result.total ??
          0
      );

      if (totalScore <= 0) {
        return false;
      }

      return (
        Math.round(
          (score / totalScore) * 100
        ) >= 100
      );
    }

    const perfectScores =
      examResults.filter(isPerfectResult).length +
      homeworkResults.filter(isPerfectResult).length;

    return (
      watchedVideos * 10 +
      completedHomeworks * 20 +
      completedExams * 30 +
      perfectScores * 20 +
      completedCourses * 100 +
      dailyLogins * 5
    );
  }

 const sortedStudents = students
  .map((student) => ({
    ...student,
    calculatedPoints: calculateStudentPoints(student),
  }))
  .filter((student) => student.calculatedPoints > 0)
  .sort((firstStudent, secondStudent) => {
    return (
      secondStudent.calculatedPoints -
      firstStudent.calculatedPoints
    );
  })
  .slice(0, 10);

  function getPositionIcon(position) {
    if (position === 1) {
      return <FaCrown />;
    }

    if (position === 2 || position === 3) {
      return <FaMedal />;
    }

    return <span>{position}</span>;
  }

  return (
    <section className="top-ten-page">
      <div className="top-ten-title">
        <FaTrophy />
        <h1>أعلى 10</h1>
      </div>

      <div className="top-ten-intro">
        <FaCrown />

        <div>
          <h2>أبطال المنصة</h2>

          <p>
            ترتيب طلاب {studentGrade ||
              "المرحلة الثانوية"} بيتحدد حسب
            النقاط الناتجة عن مشاهدة الدروس وحل
            الواجبات والامتحانات.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="top-ten-empty">
          <div className="top-ten-empty-icon">
            <FaTrophy />
          </div>

          <h2>جاري تحميل الترتيب...</h2>

          <p>
            انتظر لحظات حتى يتم تحميل ترتيب
            الطلاب.
          </p>
        </div>
      ) : topTenError ? (
        <div className="top-ten-empty">
          <div className="top-ten-empty-icon">
            <FaTrophy />
          </div>

          <h2>حدث خطأ</h2>

          <p>{topTenError}</p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="top-ten-empty">
          <div className="top-ten-empty-icon">
            <FaTrophy />
          </div>

          <h2>لا يوجد ترتيب حتى الآن</h2>

          <p>
            أول ما طلاب صفك يبدأوا مشاهدة الدروس
            وحل الواجبات والامتحانات، هيظهر أعلى
            10 هنا.
          </p>
        </div>
      ) : (
        <div className="top-ten-list">
          {sortedStudents.map(
            (student, index) => {
              const position = index + 1;

              const isCurrentStudent =
                student.id ===
                  currentStudent?.uid ||
                student.uid ===
                  currentStudent?.uid;

              return (
                <article
                  className={`top-ten-student top-position-${position} ${
                    isCurrentStudent
                      ? "current-student"
                      : ""
                  }`}
                  key={student.id}
                >
                  <div className="top-ten-position">
                    {getPositionIcon(position)}
                  </div>

                  <div className="top-ten-avatar">
                    <FaUserGraduate />
                  </div>

                  <div className="top-ten-student-info">
                    <h2>
                      {student.fullName ||
                        "طالب المنصة"}
                    </h2>

                    <p>
                      {student.grade ||
                        studentGrade}

                      {isCurrentStudent
                        ? " — أنت"
                        : ""}
                    </p>
                  </div>

                  <div className="top-ten-points">
                    <strong>
                      {
                        student.calculatedPoints
                      }
                    </strong>

                    <span>نقطة</span>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      <div className="top-ten-note">
        <FaTrophy />

        <p>
          استمر في التعلم واجمع نقاط أكثر علشان
          تدخل ضمن أبطال صفك على المنصة.
        </p>
      </div>
    </section>
  );
}

export default TopTen;