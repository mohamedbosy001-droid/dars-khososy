import { useState } from "react";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import examsData from "./examData";

function UploadExams() {
  const [isUploading, setIsUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function uploadExams() {
    if (isUploading) {
      return;
    }

    console.log(
      "Firebase user:",
      auth.currentUser
    );

    if (!auth.currentUser) {
      setMessage(
        "❌ Firebase مش شايف تسجيل الدخول."
      );

      window.alert(
        "Firebase مش شايف تسجيل الدخول. سجلي دخول للمنصة الأول ثم حاولي مرة أخرى."
      );

      return;
    }

    const shouldUpload =
      window.confirm(
        "سيتم رفع امتحاني الكورس الجديد إلى Firebase. هل تريدين المتابعة؟"
      );

    if (!shouldUpload) {
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const newExams = [
        [
          "secondCourse2Exam1",
          examsData.secondCourse2Exam1,
        ],
        [
          "secondCourse2Exam2",
          examsData.secondCourse2Exam2,
        ],
      ];

      for (const [
        examKey,
        examData,
      ] of newExams) {
        if (
          !examData ||
          !examData.id ||
          !Array.isArray(
            examData.questions
          )
        ) {
          throw new Error(
            `بيانات ${examKey} غير موجودة أو غير مكتملة.`
          );
        }

        const examReference = doc(
          db,
          "exams",
          examData.id
        );

        await setDoc(
          examReference,
          {
            ...examData,

            examKey,

            isPublished: true,
            status: "active",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }

      setMessage(
        "✅ تم رفع امتحاني الكورس الجديد بنجاح."
      );

      window.alert(
        "✅ تم رفع امتحاني الكورس الجديد إلى Firebase."
      );
    } catch (error) {
      console.error(
        "Error uploading exams:",
        error
      );

      const errorMessage =
        error?.message ||
        "حدث خطأ غير معروف.";

      setMessage(
        `❌ ${errorMessage}`
      );

      window.alert(
        `حدث خطأ أثناء الرفع:\n${errorMessage}`
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section
      style={{
        minHeight: "70vh",
        padding: "30px",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "50px auto",
          padding: "30px",
          border:
            "1px solid #dfc5a3",
          borderRadius: "20px",
          background: "#fffaf3",
          boxShadow:
            "0 12px 30px rgba(74, 47, 31, 0.12)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            marginTop: 0,
            color: "#4a2f1f",
          }}
        >
          رفع امتحاني الكورس الجديد
        </h1>

        <p
          style={{
            color: "#80634d",
            lineHeight: 1.8,
          }}
        >
          سيتم رفع الامتحان الأول
          والثاني الخاصين بكورس
          second-course-2 فقط.
        </p>

        <button
          type="button"
          disabled={isUploading}
          onClick={uploadExams}
          style={{
            width: "100%",
            minHeight: "55px",
            marginTop: "20px",
            border: "none",
            borderRadius: "13px",
            color: "#fff",
            background:
              "linear-gradient(135deg, #188b50, #34b36e)",
            fontSize: "17px",
            fontWeight: "900",
            cursor: isUploading
              ? "wait"
              : "pointer",
            opacity: isUploading
              ? 0.65
              : 1,
          }}
        >
          {isUploading
            ? "جاري رفع الامتحانين..."
            : "رفع امتحاني الكورس الجديد"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "18px",
              fontWeight: "800",
              color: message.startsWith(
                "✅"
              )
                ? "#188b50"
                : "#c94d43",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
}

export default UploadExams;