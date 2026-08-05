import { useState } from "react";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";
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

    const shouldUpload =
      window.confirm(
        "سيتم رفع الامتحان الأول والثاني إلى Firebase. هل تريدين المتابعة؟"
      );

    if (!shouldUpload) {
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const examsEntries =
        Object.entries(examsData);

      for (const [
        examKey,
        examData,
      ] of examsEntries) {
        if (
          !examData?.id ||
          !Array.isArray(
            examData.questions
          )
        ) {
          throw new Error(
            `بيانات ${examKey} غير مكتملة.`
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
        "✅ تم رفع الامتحان الأول والثاني بنجاح."
      );

      window.alert(
        "✅ تم رفع الامتحانين إلى Firebase."
      );
    } catch (error) {
      console.error(
        "Error uploading exams:",
        error
      );

      setMessage(
        "❌ حدث خطأ أثناء رفع الامتحانين."
      );

      window.alert(
        "حدث خطأ أثناء رفع الامتحانين إلى Firebase."
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
          رفع الامتحانين إلى Firebase
        </h1>

        <p
          style={{
            color: "#80634d",
            lineHeight: 1.8,
          }}
        >
          استخدمي الزر مرة واحدة فقط.
          سيتم إنشاء Collection باسم
          exams ورفع الامتحان الأول
          والثاني بداخله.
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
            : "رفع الامتحانين الآن"}
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