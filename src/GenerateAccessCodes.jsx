import { useMemo, useState } from "react";

import {
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";

/*
  بيانات الكورسات
*/
const coursesData = [
  {
    id: "first-month-course",
    title: "كورس شهر أولى ثانوي",
    grade: "الأول الثانوي",
    type: "month",
    prefix: "FM",
  },
  {
    id: "first-term-course",
    title: "كورس ترم أولى ثانوي",
    grade: "الأول الثانوي",
    type: "term",
    prefix: "FT",
  },

  {
    id: "second-month-course",
    title: "كورس شهر تانية ثانوي",
    grade: "الثاني الثانوي",
    type: "month",
    prefix: "SM",
  },
  {
    id: "second-term-course",
    title: "كورس ترم تانية ثانوي",
    grade: "الثاني الثانوي",
    type: "term",
    prefix: "ST",
  },

  {
    id: "third-month-course",
    title: "كورس شهر تالتة ثانوي",
    grade: "الثالث الثانوي",
    type: "month",
    prefix: "TM",
  },
  {
    id: "third-term-course",
    title: "كورس ترم تالتة ثانوي",
    grade: "الثالث الثانوي",
    type: "term",
    prefix: "TT",
  },
];

/*
  إنشاء كود عشوائي
*/
function generateCode(prefix = "AC") {
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `${prefix}${randomPart}`;
}

function GenerateAccessCodes() {
  const [grade, setGrade] =
    useState("الأول الثانوي");

  const [accessType, setAccessType] =
    useState("month");

  const [courseId, setCourseId] =
    useState("first-month-course");

  const [lessonId, setLessonId] =
    useState("");

  const [lessonTitle, setLessonTitle] =
    useState("");

  const [codesCount, setCodesCount] =
    useState(300);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
    الأكواد التي تم إنشاؤها
  */
  const [generatedCodes, setGeneratedCodes] =
    useState([]);

  /*
    رسالة النسخ
  */
  const [copyMessage, setCopyMessage] =
    useState("");

  /*
    كورسات السنة المختارة
  */
  const gradeCourses = useMemo(() => {
    return coursesData.filter(
      (course) =>
        course.grade === grade
    );
  }, [grade]);

  /*
    الكورس المختار
  */
  const selectedCourse = useMemo(() => {
    return coursesData.find(
      (course) =>
        course.id === courseId
    );
  }, [courseId]);

  /*
    تغيير السنة
  */
  function handleGradeChange(event) {
    const newGrade =
      event.target.value;

    setGrade(newGrade);
    setMessage("");
    setGeneratedCodes([]);
    setCopyMessage("");

    const availableCourses =
      coursesData.filter(
        (course) =>
          course.grade === newGrade
      );

    const wantedCourseType =
      accessType === "lesson"
        ? "month"
        : accessType;

    const preferredCourse =
      availableCourses.find(
        (course) =>
          course.type ===
          wantedCourseType
      ) ||
      availableCourses[0];

    if (preferredCourse) {
      setCourseId(
        preferredCourse.id
      );
    }
  }

  /*
    تغيير نوع الكود
  */
  function handleAccessTypeChange(
    event
  ) {
    const newType =
      event.target.value;

    setAccessType(newType);
    setMessage("");
    setGeneratedCodes([]);
    setCopyMessage("");

    const wantedCourseType =
      newType === "lesson"
        ? "month"
        : newType;

    const matchingCourse =
      coursesData.find(
        (course) =>
          course.grade === grade &&
          course.type ===
            wantedCourseType
      );

    if (matchingCourse) {
      setCourseId(
        matchingCourse.id
      );
    }

    if (
      newType !== "lesson"
    ) {
      setLessonId("");
      setLessonTitle("");
    }
  }

  /*
    Prefix
  */
  function getCodePrefix() {
    if (!selectedCourse) {
      return "AC";
    }

    if (
      accessType === "lesson"
    ) {
      if (
        grade ===
        "الأول الثانوي"
      ) {
        return "FL";
      }

      if (
        grade ===
        "الثاني الثانوي"
      ) {
        return "SL";
      }

      if (
        grade ===
        "الثالث الثانوي"
      ) {
        return "TL";
      }
    }

    return (
      selectedCourse.prefix ||
      "AC"
    );
  }

  /*
    نسخ كود واحد
  */
  async function copySingleCode(code) {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopyMessage(
        `✅ تم نسخ الكود: ${code}`
      );
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      setCopyMessage(
        "❌ تعذر نسخ الكود."
      );
    }
  }

  /*
    نسخ كل الأكواد
  */
  async function copyAllCodes() {
    if (
      generatedCodes.length === 0
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedCodes.join("\n")
      );

      setCopyMessage(
        `✅ تم نسخ ${generatedCodes.length} كود.`
      );
    } catch (error) {
      console.error(
        "Copy error:",
        error
      );

      setCopyMessage(
        "❌ تعذر نسخ الأكواد."
      );
    }
  }

  /*
    إنشاء الأكواد
  */
  async function generateAccessCodes() {
    const numericCount =
      Number(codesCount);

    setGeneratedCodes([]);
    setCopyMessage("");

    if (!selectedCourse) {
      setMessage(
        "❌ من فضلك اختاري الكورس."
      );

      return;
    }

    if (
      !Number.isInteger(
        numericCount
      ) ||
      numericCount < 1 ||
      numericCount > 1000
    ) {
      setMessage(
        "❌ عدد الأكواد يجب أن يكون من 1 إلى 1000."
      );

      return;
    }

    /*
      لو كود حصة
    */
    if (
      accessType === "lesson" &&
      !lessonId.trim()
    ) {
      setMessage(
        "❌ اكتبي ID المحاضرة أولًا."
      );

      return;
    }

    const accessText =
      accessType === "lesson"
        ? "حصة"
        : accessType ===
            "month"
          ? "شهر"
          : "ترم";

    const confirmed =
      window.confirm(
        `سيتم إنشاء ${numericCount} كود.

السنة: ${grade}
نوع الكود: ${accessText}
الكورس: ${selectedCourse.title}${
          accessType ===
          "lesson"
            ? `\nالمحاضرة: ${
                lessonTitle ||
                lessonId
              }`
            : ""
        }

هل تريدين المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setIsGenerating(true);

    setMessage(
      "جاري إنشاء الأكواد..."
    );

    try {
      const createdCodes =
        new Set();

      const prefix =
        getCodePrefix();

      while (
        createdCodes.size <
        numericCount
      ) {
        createdCodes.add(
          generateCode(prefix)
        );
      }

      const codesArray =
        Array.from(
          createdCodes
        );

      /*
        Firebase Collection:
        accessCode
        بدون s
      */
      for (
        let index = 0;
        index <
        codesArray.length;
        index += 1
      ) {
        const code =
          codesArray[index];

        const codeReference =
          doc(
            db,
            "accessCode",
            code
          );

        const codeData = {
          code,

          active: true,

          used: false,

          accessType,

          grade,

          courseId:
            selectedCourse.id,

          courseTitle:
            selectedCourse.title,

          createdAt:
            Timestamp.now(),

          usedBy: null,

          usedAt: null,
        };

        /*
          بيانات الحصة
        */
        if (
          accessType ===
          "lesson"
        ) {
          codeData.lessonId =
            lessonId.trim();

          codeData.lessonTitle =
            lessonTitle.trim() ||
            lessonId.trim();
        }

        await setDoc(
          codeReference,
          codeData
        );

        setMessage(
          `جاري إنشاء الأكواد... ${
            index + 1
          } / ${numericCount}`
        );
      }

      /*
        نعرض الأكواد بعد إنشائها
      */
      setGeneratedCodes(
        codesArray
      );

      setMessage(
        `✅ تم إنشاء ${numericCount} كود بنجاح.

السنة: ${grade}
نوع الكود: ${accessText}
الكورس: ${selectedCourse.title}`
      );
    } catch (error) {
      console.error(
        "Generate codes error:",
        error
      );

      setMessage(
        "❌ حدث خطأ أثناء إنشاء الأكواد. راجعي Console و Firebase Rules."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        direction: "rtl",
        background:
          "#f7f1e8",
        color: "#33261f",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin:
            "40px auto",
          padding: "30px",
          borderRadius:
            "20px",
          background: "#fff",
          boxShadow:
            "0 12px 35px rgba(0,0,0,0.1)",
          color: "#33261f",
        }}
      >
        <div
          style={{
            textAlign:
              "center",
            marginBottom:
              "30px",
          }}
        >
          <h1
            style={{
              color:
                "#4a2f1f",
            }}
          >
            إنشاء أكواد التفعيل
          </h1>

          <p
            style={{
              color:
                "#725442",
            }}
          >
            إنشاء أكواد الحصص
            والشهور والترم
          </p>
        </div>

        {/* السنة */}
        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <label
            style={
              labelStyle
            }
          >
            السنة الدراسية
          </label>

          <select
            value={grade}
            onChange={
              handleGradeChange
            }
            disabled={
              isGenerating
            }
            style={
              inputStyle
            }
          >
            <option value="الأول الثانوي">
              الأول الثانوي
            </option>

            <option value="الثاني الثانوي">
              الثاني الثانوي
            </option>

            <option value="الثالث الثانوي">
              الثالث الثانوي
            </option>
          </select>
        </div>

        {/* نوع الكود */}
        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <label
            style={
              labelStyle
            }
          >
            نوع الكود
          </label>

          <select
            value={
              accessType
            }
            onChange={
              handleAccessTypeChange
            }
            disabled={
              isGenerating
            }
            style={
              inputStyle
            }
          >
            <option value="lesson">
              كود حصة
            </option>

            <option value="month">
              كود شهر
            </option>

            <option value="term">
              كود ترم
            </option>
          </select>
        </div>

        {/* الكورس */}
        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <label
            style={
              labelStyle
            }
          >
            الكورس
          </label>

          <select
            value={courseId}
            onChange={(
              event
            ) => {
              setCourseId(
                event.target
                  .value
              );

              setMessage("");
              setGeneratedCodes(
                []
              );
              setCopyMessage(
                ""
              );
            }}
            disabled={
              isGenerating
            }
            style={
              inputStyle
            }
          >
            {gradeCourses.map(
              (course) => (
                <option
                  key={
                    course.id
                  }
                  value={
                    course.id
                  }
                >
                  {
                    course.title
                  }
                </option>
              )
            )}
          </select>
        </div>

        {/* الحصة */}
        {accessType ===
          "lesson" && (
          <>
            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <label
                style={
                  labelStyle
                }
              >
                ID المحاضرة
              </label>

              <input
                type="text"
                value={
                  lessonId
                }
                onChange={(
                  event
                ) => {
                  setLessonId(
                    event.target
                      .value
                  );

                  setMessage(
                    ""
                  );

                  setGeneratedCodes(
                    []
                  );
                }}
                placeholder="مثال: lesson-1"
                disabled={
                  isGenerating
                }
                style={
                  inputStyle
                }
              />
            </div>

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <label
                style={
                  labelStyle
                }
              >
                اسم المحاضرة
              </label>

              <input
                type="text"
                value={
                  lessonTitle
                }
                onChange={(
                  event
                ) =>
                  setLessonTitle(
                    event.target
                      .value
                  )
                }
                placeholder="مثال: المحاضرة الأولى"
                disabled={
                  isGenerating
                }
                style={
                  inputStyle
                }
              />
            </div>
          </>
        )}

        {/* العدد */}
        <div
          style={{
            marginBottom:
              "20px",
          }}
        >
          <label
            style={
              labelStyle
            }
          >
            عدد الأكواد
          </label>

          <input
            type="number"
            min="1"
            max="1000"
            value={
              codesCount
            }
            onChange={(
              event
            ) => {
              setCodesCount(
                event.target
                  .value
              );

              setMessage("");
              setGeneratedCodes(
                []
              );
              setCopyMessage(
                ""
              );
            }}
            disabled={
              isGenerating
            }
            style={
              inputStyle
            }
          />
        </div>

        <button
          type="button"
          disabled={
            isGenerating
          }
          onClick={
            generateAccessCodes
          }
          style={{
            width: "100%",
            minHeight:
              "58px",
            marginTop:
              "10px",
            border: "none",
            borderRadius:
              "12px",
            background:
              isGenerating
                ? "#9b887a"
                : "#6f4930",
            color: "#fff",
            fontSize:
              "17px",
            fontWeight:
              "bold",
            cursor:
              isGenerating
                ? "wait"
                : "pointer",
          }}
        >
          {isGenerating
            ? "جاري إنشاء الأكواد..."
            : "إنشاء الأكواد"}
        </button>

        {/* الرسالة */}
        {message && (
          <div
            style={{
              marginTop:
                "25px",
              padding:
                "16px",
              borderRadius:
                "12px",
              background:
                "#f4eadc",
              color:
                "#4a2f1f",
              whiteSpace:
                "pre-line",
              textAlign:
                "center",
              fontWeight:
                "bold",
              lineHeight:
                "1.8",
            }}
          >
            {message}
          </div>
        )}

        {/* الأكواد */}
        {generatedCodes.length >
          0 && (
          <div
            style={{
              marginTop:
                "25px",
              padding:
                "20px",
              border:
                "2px solid #c7a47c",
              borderRadius:
                "16px",
              background:
                "#fffaf3",
            }}
          >
            <h2
              style={{
                margin:
                  "0 0 15px",
                textAlign:
                  "center",
                color:
                  "#4a2f1f",
              }}
            >
              الأكواد التي تم
              إنشاؤها
            </h2>

            {generatedCodes.length ===
            1 ? (
              <button
                type="button"
                onClick={() =>
                  copySingleCode(
                    generatedCodes[0]
                  )
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "18px",
                  border:
                    "2px dashed #6f4930",
                  borderRadius:
                    "12px",
                  background:
                    "#f7f1e8",
                  color:
                    "#2f2119",
                  fontSize:
                    "25px",
                  fontWeight:
                    "900",
                  letterSpacing:
                    "2px",
                  cursor:
                    "pointer",
                  direction:
                    "ltr",
                }}
              >
                {
                  generatedCodes[0]
                }
              </button>
            ) : (
              <div
                style={{
                  maxHeight:
                    "350px",
                  overflowY:
                    "auto",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid #ddc6ad",
                  background:
                    "#fff",
                }}
              >
                {generatedCodes.map(
                  (
                    code,
                    index
                  ) => (
                    <button
                      key={
                        code
                      }
                      type="button"
                      onClick={() =>
                        copySingleCode(
                          code
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "12px 15px",
                        border:
                          "none",
                        borderBottom:
                          "1px solid #eee0d2",
                        background:
                          "#fff",
                        color:
                          "#2f2119",
                        fontWeight:
                          "900",
                        fontSize:
                          "16px",
                        cursor:
                          "pointer",
                        direction:
                          "ltr",
                        textAlign:
                          "center",
                      }}
                    >
                      {index +
                        1}
                      . {code}
                    </button>
                  )
                )}
              </div>
            )}

            <button
              type="button"
              onClick={
                copyAllCodes
              }
              style={{
                width: "100%",
                minHeight:
                  "50px",
                marginTop:
                  "15px",
                border:
                  "none",
                borderRadius:
                  "11px",
                background:
                  "#188b50",
                color:
                  "#fff",
                fontSize:
                  "16px",
                fontWeight:
                  "bold",
                cursor:
                  "pointer",
              }}
            >
              نسخ كل الأكواد
            </button>

            {copyMessage && (
              <p
                style={{
                  margin:
                    "12px 0 0",
                  textAlign:
                    "center",
                  color:
                    "#4a2f1f",
                  fontWeight:
                    "bold",
                }}
              >
                {
                  copyMessage
                }
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
  color: "#4a2f1f",
};

const inputStyle = {
  width: "100%",
  minHeight: "50px",
  padding: "10px 14px",
  borderRadius: "12px",
  border:
    "1px solid #d7c2ae",
  fontSize: "16px",
  fontWeight: "700",

  /*
    دي أهم حاجة:
    لون الكتابة جوه المربعات
  */
  color: "#2f2119",

  background: "#ffffff",
  WebkitTextFillColor:
    "#2f2119",

  boxSizing:
    "border-box",
};

export default GenerateAccessCodes;