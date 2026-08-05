import {
  FaChartLine,
  FaFileAlt,
  FaClipboardCheck,
  FaVideo,
  FaFire,
} from "react-icons/fa";

import "./LevelIndicator.css";

function LevelIndicator({ currentStudent }) {
  function calculateAverage(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return 0;
    }

    const validPercentages = results
      .map((result) => {
        if (
          result.percentage !== undefined &&
          result.percentage !== null
        ) {
          return Number(result.percentage);
        }

        const obtainedGrade = Number(
          result.obtainedGrade ??
            result.score ??
            result.grade ??
            0
        );

        const totalGrade = Number(
          result.totalGrade ??
            result.total ??
            result.maxGrade ??
            0
        );

        if (totalGrade <= 0) {
          return 0;
        }

        return Math.round(
          (obtainedGrade / totalGrade) * 100
        );
      })
      .filter(
        (value) =>
          !Number.isNaN(value) &&
          value >= 0
      );

    if (validPercentages.length === 0) {
      return 0;
    }

    const total = validPercentages.reduce(
      (sum, value) => sum + value,
      0
    );

    return Math.min(
      100,
      Math.round(
        total / validPercentages.length
      )
    );
  }

  const examResults = Array.isArray(
    currentStudent?.examResults
  )
    ? currentStudent.examResults
    : [];

  const homeworkResults = Array.isArray(
    currentStudent?.homeworkResults
  )
    ? currentStudent.homeworkResults
    : [];

  const watchHistory = Array.isArray(
    currentStudent?.watchHistory
  )
    ? currentStudent.watchHistory
    : [];

  const activatedLessons = Array.isArray(
    currentStudent?.activatedLessons
  )
    ? currentStudent.activatedLessons
    : [];

  const examAverage =
    calculateAverage(examResults);

  const homeworkAverage =
    calculateAverage(homeworkResults);

  const watchedLessonsCount =
    watchHistory.length > 0
      ? watchHistory.length
      : Number(
          currentStudent?.watchedVideos || 0
        );

  const totalAvailableLessons =
    activatedLessons.length;

  const lessonsWatching =
    totalAvailableLessons > 0
      ? Math.min(
          100,
          Math.round(
            (watchedLessonsCount /
              totalAvailableLessons) *
              100
          )
        )
      : watchedLessonsCount > 0
        ? Math.min(
            100,
            watchedLessonsCount * 10
          )
        : 0;

  const completedTasks =
    Number(
      currentStudent?.completedExams || 0
    ) +
    Number(
      currentStudent?.completedHomeworks || 0
    ) +
    watchedLessonsCount;

  const commitment =
    completedTasks > 0
      ? Math.min(100, completedTasks * 5)
      : 0;

  const levelPercentage = Math.min(
    100,
    Math.round(
      examAverage * 0.4 +
        homeworkAverage * 0.25 +
        lessonsWatching * 0.25 +
        commitment * 0.1
    )
  );

  function getLevelData(percentage) {
    if (percentage === 0) {
      return {
        title: "لم تبدأ بعد",
        message:
          "ابدأ بمشاهدة أول درس وحل أول واجب أو امتحان ليتم حساب مستواك.",
      };
    }

    if (percentage >= 85) {
      return {
        title: "ممتاز",
        message:
          "مستواك ممتاز، حافظ على التزامك واستمر بنفس القوة.",
      };
    }

    if (percentage >= 70) {
      return {
        title: "جيد جدًا",
        message:
          "مستواك جيد جدًا، ركّز أكثر على الواجبات للوصول إلى ممتاز.",
      };
    }

    if (percentage >= 50) {
      return {
        title: "جيد",
        message:
          "مستواك جيد، لكنك تحتاج إلى مشاهدة دروس أكثر وحل الواجبات بانتظام.",
      };
    }

    return {
      title: "يحتاج تحسين",
      message:
        "راجع الدروس وحل الواجبات والامتحانات لرفع مستواك.",
    };
  }

  const levelData =
    getLevelData(levelPercentage);

  const indicators = [
    {
      id: 1,
      title: "نتائج الامتحانات",
      value: examAverage,
      icon: <FaFileAlt />,
    },
    {
      id: 2,
      title: "نتائج الواجبات",
      value: homeworkAverage,
      icon: <FaClipboardCheck />,
    },
    {
      id: 3,
      title: "مشاهدة الدروس",
      value: lessonsWatching,
      icon: <FaVideo />,
    },
    {
      id: 4,
      title: "الالتزام",
      value: commitment,
      icon: <FaFire />,
    },
  ];

  return (
    <section className="level-page">
      <div className="level-title">
        <FaChartLine />
        <h1>مؤشر المستوى</h1>
      </div>

      <div className="level-summary-card">
        <div className="level-circle">
          <div
            className="level-circle-progress"
            style={{
              background: `conic-gradient(
                #c99652 ${levelPercentage * 3.6}deg,
                #ead9c3 0deg
              )`,
            }}
          >
            <div className="level-circle-inside">
              <strong>
                {levelPercentage}%
              </strong>

              <span>{levelData.title}</span>
            </div>
          </div>
        </div>

        <div className="level-summary-content">
          <span className="level-small-title">
            مستواك الحالي
          </span>

          <h2>{levelData.title}</h2>

          <p>{levelData.message}</p>

          <div className="level-main-progress">
            <div
              className="level-main-progress-fill"
              style={{
                width: `${levelPercentage}%`,
              }}
            />
          </div>

          <div className="level-progress-numbers">
            <span>0%</span>
            <strong>
              {levelPercentage}%
            </strong>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div className="level-indicators-grid">
        {indicators.map((indicator) => (
          <article
            className="level-indicator-card"
            key={indicator.id}
          >
            <div className="level-indicator-icon">
              {indicator.icon}
            </div>

            <div className="level-indicator-heading">
              <h3>{indicator.title}</h3>

              <strong>
                {indicator.value}%
              </strong>
            </div>

            <div className="level-indicator-progress">
              <div
                className="level-indicator-progress-fill"
                style={{
                  width: `${indicator.value}%`,
                }}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="level-advice-card">
        <div className="level-advice-icon">
          💡
        </div>

        <div>
          <h2>نصيحة لتحسين مستواك</h2>

          <p>{levelData.message}</p>
        </div>
      </div>
    </section>
  );
}

export default LevelIndicator;