import { useEffect, useMemo, useState } from "react";
import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaEye,
  FaInfoCircle,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";

import "./WatchDetails.css";

function WatchDetails({ currentStudent }) {
  const [watchHistory, setWatchHistory] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [watchError, setWatchError] =
    useState("");

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      setWatchHistory([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setWatchError("");

    const studentReference = doc(
      db,
      "students",
      studentUid
    );

    const unsubscribe = onSnapshot(
      studentReference,
      (studentSnapshot) => {
        if (!studentSnapshot.exists()) {
          setWatchHistory([]);
          setWatchError(
            "تعذر العثور على بيانات الطالب."
          );
          setIsLoading(false);
          return;
        }

        const studentData =
          studentSnapshot.data();

        const loadedWatchHistory =
          Array.isArray(
            studentData.watchHistory
          )
            ? studentData.watchHistory
            : [];

        const normalizedHistory =
          loadedWatchHistory.map(
            (item, index) => ({
              id:
                item.id ||
                `watch-${index}`,
              lessonName:
                item.lessonName ||
                item.lessonTitle ||
                "درس بدون اسم",
              courseName:
                item.courseName ||
                item.courseTitle ||
                "كورس اللغة العربية",
              watchDuration:
                item.watchDuration ||
                item.duration ||
                "غير محدد",
              watchCount: Number(
                item.watchCount || 1
              ),
              firstWatch:
                item.firstWatch ||
                item.firstWatchedAt ||
                item.createdAt ||
                null,
              lastWatch:
                item.lastWatch ||
                item.lastWatchedAt ||
                item.updatedAt ||
                null,
            })
          );

        setWatchHistory(normalizedHistory);
        setCurrentPage(1);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading watch history:",
          error
        );

        setWatchError(
          "تعذر تحميل تفاصيل المشاهدات حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent]);

  function formatWatchDate(dateValue) {
    if (!dateValue) {
      return "غير محدد";
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
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      ).format(date);
    } catch {
      return "غير محدد";
    }
  }

  const totalPages = Math.max(
    1,
    Math.ceil(
      watchHistory.length / rowsPerPage
    )
  );

  const displayedHistory = useMemo(() => {
    const startIndex =
      (currentPage - 1) * rowsPerPage;

    return watchHistory.slice(
      startIndex,
      startIndex + rowsPerPage
    );
  }, [
    watchHistory,
    currentPage,
    rowsPerPage,
  ]);

  const firstVisibleRow =
    watchHistory.length === 0
      ? 0
      : (currentPage - 1) *
          rowsPerPage +
        1;

  const lastVisibleRow = Math.min(
    currentPage * rowsPerPage,
    watchHistory.length
  );

  function goToPreviousPage() {
    setCurrentPage((previousPage) =>
      Math.max(previousPage - 1, 1)
    );
  }

  function goToNextPage() {
    setCurrentPage((previousPage) =>
      Math.min(
        previousPage + 1,
        totalPages
      )
    );
  }

  return (
    <section className="watch-details-page">
      <div className="watch-details-heading">
        <FaEye />
        <h1>تفاصيل المشاهدات</h1>
      </div>

      <div className="watch-details-note">
        <FaInfoCircle />

        <p>
          يتم احتساب المشاهدة بعد مشاهدة
          30% من مدة الفيديو.
        </p>
      </div>

      <div className="watch-details-table-wrapper">
        <table className="watch-details-table">
          <thead>
            <tr>
              <th>التسلسل</th>
              <th>اسم الدرس</th>
              <th>اسم الكورس</th>
              <th>مدة المشاهدة</th>
              <th>عدد مرات المشاهدة</th>
              <th>أول مرة مشاهدة</th>
              <th>آخر مرة تم المشاهدة</th>
            </tr>
          </thead>

          <tbody>
            {displayedHistory.map(
              (item, index) => (
                <tr key={item.id}>
                  <td>
                    {(currentPage - 1) *
                      rowsPerPage +
                      index +
                      1}
                  </td>

                  <td>{item.lessonName}</td>
                  <td>{item.courseName}</td>
                  <td>{item.watchDuration}</td>
                  <td>{item.watchCount}</td>

                  <td>
                    {formatWatchDate(
                      item.firstWatch
                    )}
                  </td>

                  <td>
                    {formatWatchDate(
                      item.lastWatch
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        {isLoading && (
          <div className="watch-details-empty">
            <div className="watch-details-empty-icon">
              <FaEye />
            </div>

            <h2>
              جاري تحميل المشاهدات...
            </h2>

            <p>
              انتظر لحظات حتى يتم تحميل
              بيانات المشاهدة.
            </p>
          </div>
        )}

        {!isLoading && watchError && (
          <div className="watch-details-empty">
            <div className="watch-details-empty-icon">
              <FaInfoCircle />
            </div>

            <h2>حدث خطأ</h2>

            <p>{watchError}</p>
          </div>
        )}

        {!isLoading &&
          !watchError &&
          watchHistory.length === 0 && (
            <div className="watch-details-empty">
              <div className="watch-details-empty-icon">
                <FaEye />
              </div>

              <h2>
                مافيش مشاهدات هنا لسه!
              </h2>

              <p>
                أول ما تبدأ مشاهدة أي درس،
                تفاصيل المشاهدة هتظهر هنا.
              </p>
            </div>
          )}
      </div>

      <div className="watch-details-footer">
        <div className="watch-details-page-size">
          <label htmlFor="watchRows">
            صفوف الصفحة:
          </label>

          <select
            id="watchRows"
            value={rowsPerPage}
            onChange={(event) => {
              setRowsPerPage(
                Number(event.target.value)
              );
              setCurrentPage(1);
            }}
          >
            <option value="10">10</option>
            <option value="100">100</option>
            <option value="1000">1000</option>
            <option value="10000">
              10000
            </option>
          </select>
        </div>

        <span className="watch-details-count">
          {firstVisibleRow} -{" "}
          {lastVisibleRow} من{" "}
          {watchHistory.length}
        </span>
      </div>

      <div className="watch-details-pagination">
        <button
          type="button"
          onClick={goToPreviousPage}
          disabled={
            currentPage === 1 ||
            watchHistory.length === 0
          }
        >
          <FaChevronRight />
          السابق
        </button>

        <button
          type="button"
          onClick={goToNextPage}
          disabled={
            currentPage === totalPages ||
            watchHistory.length === 0
          }
        >
          التالي
          <FaChevronLeft />
        </button>
      </div>
    </section>
  );
}

export default WatchDetails;