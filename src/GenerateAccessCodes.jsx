import {
  useMemo,
  useState,
} from "react";

import {
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";

/*
  =====================================
  بيانات السنوات والكورسات
  =====================================
*/

const gradesData = [
  {
    grade: "الأول الثانوي",

    lessonPrefix: "FL",

    monthCourseId:
      "first-month-course",

    monthCourseTitle:
      "كورس شهر أولى ثانوي",

    monthPrefix: "FM",

    termCourseId:
      "first-term-course",

    termCourseTitle:
      "كورس ترم أولى ثانوي",

    termPrefix: "FT",
  },

  {
    grade: "الثاني الثانوي",

    lessonPrefix: "SL",

    monthCourseId:
      "second-month-course",

    monthCourseTitle:
      "كورس شهر تانية ثانوي",

    monthPrefix: "SM",

    termCourseId:
      "second-term-course",

    termCourseTitle:
      "كورس ترم تانية ثانوي",

    termPrefix: "ST",
  },

  {
    grade: "الثالث الثانوي",

    lessonPrefix: "TL",

    monthCourseId:
      "third-month-course",

    monthCourseTitle:
      "كورس شهر تالتة ثانوي",

    monthPrefix: "TM",

    termCourseId:
      "third-term-course",

    termCourseTitle:
      "كورس ترم تالتة ثانوي",

    termPrefix: "TT",
  },
];

/*
  =====================================
  إنشاء كود عشوائي
  =====================================
*/

function generateCode(
  prefix = "AC"
) {
  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return `${prefix}${randomPart}`;
}

/*
  =====================================
  المكون
  =====================================
*/

function GenerateAccessCodes() {
  const [
    grade,
    setGrade,
  ] = useState(
    "الأول الثانوي"
  );

  const [
    accessType,
    setAccessType,
  ] = useState(
    "lesson"
  );

  const [
    codesCount,
    setCodesCount,
  ] = useState(300);

  const [
    isGenerating,
    setIsGenerating,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    generatedCodes,
    setGeneratedCodes,
  ] = useState([]);

  const [
    copyMessage,
    setCopyMessage,
  ] = useState("");

  /*
    =====================================
    السنة المختارة
    =====================================
  */

  const selectedGradeData =
    useMemo(() => {
      return gradesData.find(
        (item) =>
          item.grade === grade
      );
    }, [grade]);

  /*
    =====================================
    اسم نوع الكود
    =====================================
  */

  function getAccessTypeText(
    type
  ) {
    if (type === "lesson") {
      return "حصة";
    }

    if (type === "month") {
      return "شهر";
    }

    if (type === "term") {
      return "ترم";
    }

    return "";
  }

  /*
    =====================================
    Prefix
    =====================================
  */

  function getPrefix(
    gradeData,
    type
  ) {
    if (!gradeData) {
      return "AC";
    }

    if (type === "lesson") {
      return (
        gradeData.lessonPrefix ||
        "LC"
      );
    }

    if (type === "month") {
      return (
        gradeData.monthPrefix ||
        "MC"
      );
    }

    if (type === "term") {
      return (
        gradeData.termPrefix ||
        "TC"
      );
    }

    return "AC";
  }

  /*
    =====================================
    بيانات الكورس حسب نوع الكود
    =====================================
  */

  function getCourseData(
    gradeData,
    type
  ) {
    if (!gradeData) {
      return {
        courseId: null,
        courseTitle: "",
      };
    }

    /*
      كود الحصة مرن.

      مش مربوط بكورس أو
      محاضرة محددة وقت الإنشاء.

      بيتربط بالمحاضرة
      وقت استخدام الطالب للكود.
    */
    if (type === "lesson") {
      return {
        courseId: null,

        courseTitle:
          `أي محاضرة - ${gradeData.grade}`,
      };
    }

    if (type === "month") {
      return {
        courseId:
          gradeData.monthCourseId,

        courseTitle:
          gradeData.monthCourseTitle,
      };
    }

    if (type === "term") {
      return {
        courseId:
          gradeData.termCourseId,

        courseTitle:
          gradeData.termCourseTitle,
      };
    }

    return {
      courseId: null,
      courseTitle: "",
    };
  }

  /*
    =====================================
    بيانات الكود في Firebase
    =====================================
  */

  function buildCodeData({
    code,
    gradeData,
    type,
  }) {
    const now =
      Timestamp.now();

    const courseData =
      getCourseData(
        gradeData,
        type
      );

    /*
      كود الحصة
    */
    if (type === "lesson") {
      return {
        code,

        active: true,

        used: false,

        accessType:
          "lesson",

        grade:
          gradeData.grade,

        /*
          مهم جدًا:
          الكود مش مربوط
          بمحاضرة وقت الإنشاء
        */
        flexibleLesson:
          true,

        targetScope:
          "grade",

        lessonId: null,

        lessonTitle: null,

        lessonIds: [],

        courseId: null,

        courseTitle:
          courseData.courseTitle,

        /*
          القيم دي تتسجل
          وقت استخدام الكود
        */
        assignedCourseId:
          null,

        assignedCourseTitle:
          null,

        assignedLessonId:
          null,

        assignedLessonTitle:
          null,

        createdAt: now,

        usedBy: null,

        usedAt: null,
      };
    }

    /*
      كود الشهر / الترم
    */
    return {
      code,

      active: true,

      used: false,

      accessType:
        type,

      grade:
        gradeData.grade,

      courseId:
        courseData.courseId,

      courseTitle:
        courseData.courseTitle,

      flexibleLesson:
        false,

      targetScope:
        type,

      createdAt: now,

      usedBy: null,

      usedAt: null,
    };
  }

  /*
    =====================================
    تغيير السنة
    =====================================
  */

  function handleGradeChange(
    event
  ) {
    setGrade(
      event.target.value
    );

    setMessage("");

    setGeneratedCodes([]);

    setCopyMessage("");
  }

  /*
    =====================================
    تغيير النوع
    =====================================
  */

  function handleAccessTypeChange(
    event
  ) {
    setAccessType(
      event.target.value
    );

    setMessage("");

    setGeneratedCodes([]);

    setCopyMessage("");
  }

  /*
    =====================================
    إنشاء مجموعة أكواد
    =====================================
  */

  async function createCodesGroup({
    gradeData,
    type,
    count,
    onProgress,
  }) {
    const createdCodes =
      new Set();

    const prefix =
      getPrefix(
        gradeData,
        type
      );

    /*
      إنشاء أكواد مختلفة
    */
    while (
      createdCodes.size <
      count
    ) {
      createdCodes.add(
        generateCode(
          prefix
        )
      );
    }

    const codesArray =
      Array.from(
        createdCodes
      );

    /*
      الحفظ في:
      accessCode
      بدون حرف s
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

      const codeData =
        buildCodeData({
          code,

          gradeData,

          type,
        });

      await setDoc(
        codeReference,
        codeData
      );

      if (
        typeof onProgress ===
        "function"
      ) {
        onProgress(
          index + 1,
          count
        );
      }
    }

    return codesArray;
  }

  /*
    =====================================
    إنشاء النوع المختار فقط
    =====================================
  */

  async function generateAccessCodes() {
    const numericCount =
      Number(
        codesCount
      );

    setGeneratedCodes([]);

    setCopyMessage("");

    if (
      !selectedGradeData
    ) {
      setMessage(
        "❌ بيانات السنة غير موجودة."
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

    const accessText =
      getAccessTypeText(
        accessType
      );

    let extraText = "";

    if (
      accessType ===
      "lesson"
    ) {
      extraText =
        "\nكود الحصة صالح لأي محاضرة في نفس السنة، ويستخدم مرة واحدة فقط.";
    }

    const confirmed =
      window.confirm(
        `سيتم إنشاء ${numericCount} كود.

السنة: ${grade}
نوع الكود: ${accessText}${extraText}

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
      const codes =
        await createCodesGroup({
          gradeData:
            selectedGradeData,

          type:
            accessType,

          count:
            numericCount,

          onProgress: (
            current,
            total
          ) => {
            setMessage(
              `جاري إنشاء الأكواد... ${current} / ${total}`
            );
          },
        });

      setGeneratedCodes(
        codes
      );

      setMessage(
        `✅ تم إنشاء ${numericCount} كود بنجاح.

السنة: ${grade}
نوع الكود: ${accessText}`
      );
    } catch (error) {
      console.error(
        "Generate codes error:",
        error
      );

      setMessage(
        "❌ حدث خطأ أثناء إنشاء الأكواد. راجعي Firebase Rules والـ Console."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  /*
    =====================================
    إنشاء الـ 2700 كود مرة واحدة

    لكل سنة:
    300 حصة
    300 شهر
    300 ترم

    الإجمالي:
    2700
    =====================================
  */

  async function generateAllCodes() {
    const confirmed =
      window.confirm(
        `سيتم إنشاء 2700 كود مرة واحدة:

الأول الثانوي:
300 حصة
300 شهر
300 ترم

الثاني الثانوي:
300 حصة
300 شهر
300 ترم

الثالث الثانوي:
300 حصة
300 شهر
300 ترم

هل تريدين المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setIsGenerating(true);

    setGeneratedCodes([]);

    setCopyMessage("");

    setMessage(
      "جاري بدء إنشاء 2700 كود..."
    );

    try {
      const allCodes =
        [];

      const types = [
        "lesson",
        "month",
        "term",
      ];

      let finishedGroups =
        0;

      const totalGroups =
        gradesData.length *
        types.length;

      for (
        const gradeData of gradesData
      ) {
        for (
          const type of types
        ) {
          const typeText =
            getAccessTypeText(
              type
            );

          const codes =
            await createCodesGroup({
              gradeData,

              type,

              count: 300,

              onProgress: (
                current,
                total
              ) => {
                setMessage(
                  `جاري إنشاء الأكواد...

السنة: ${gradeData.grade}
النوع: ${typeText}

${current} / ${total}

المجموعات المكتملة:
${finishedGroups} / ${totalGroups}`
                );
              },
            });

          /*
            نخزن البيانات
            بشكل منظم
          */
          codes.forEach(
            (code) => {
              allCodes.push({
                code,

                grade:
                  gradeData.grade,

                accessType:
                  type,

                accessText:
                  typeText,
              });
            }
          );

          finishedGroups +=
            1;
        }
      }

      setGeneratedCodes(
        allCodes.map(
          (item) =>
            item.code
        )
      );

      setMessage(
        `✅ تم إنشاء جميع الأكواد بنجاح.

الإجمالي: 2700 كود

الأول الثانوي:
300 حصة + 300 شهر + 300 ترم

الثاني الثانوي:
300 حصة + 300 شهر + 300 ترم

الثالث الثانوي:
300 حصة + 300 شهر + 300 ترم`
      );
    } catch (error) {
      console.error(
        "Generate all codes error:",
        error
      );

      setMessage(
        "❌ حدث خطأ أثناء إنشاء مجموعة الأكواد. راجعي الـ Console قبل إعادة المحاولة."
      );
    } finally {
      setIsGenerating(
        false
      );
    }
  }

  /*
    =====================================
    نسخ كود واحد
    =====================================
  */

  async function copySingleCode(
    code
  ) {
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
    =====================================
    نسخ كل الأكواد
    =====================================
  */

  async function copyAllCodes() {
    if (
      generatedCodes.length ===
      0
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedCodes.join(
          "\n"
        )
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
    =====================================
    الواجهة
    =====================================
  */

  return (
    <div
      style={{
        minHeight:
          "100vh",

        padding:
          "30px",

        direction:
          "rtl",

        background:
          "#f7f1e8",

        color:
          "#33261f",
      }}
    >
      <div
        style={{
          maxWidth:
            "750px",

          margin:
            "40px auto",

          padding:
            "30px",

          borderRadius:
            "20px",

          background:
            "#fff",

          boxShadow:
            "0 12px 35px rgba(0,0,0,0.1)",

          color:
            "#33261f",
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
            أكواد الحصص والشهور
            والترم
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
            value={
              grade
            }
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

        {/* النوع */}
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

        {/*
          شرح كود الحصة المرن
        */}
        {accessType ===
          "lesson" && (
          <div
            style={{
              marginBottom:
                "20px",

              padding:
                "15px",

              borderRadius:
                "12px",

              background:
                "#f4eadc",

              color:
                "#5b3b28",

              fontWeight:
                "700",

              lineHeight:
                "1.8",
            }}
          >
            كود الحصة غير مرتبط
            بمحاضرة محددة.

            <br />

            الطالب يضع الكود بجانب
            المحاضرة التي يريد فتحها،
            سواء الأولى أو الثانية أو
            الثالثة، ويُستخدم الكود مرة
            واحدة فقط.
          </div>
        )}

        {/*
          تفاصيل الشهر / الترم
        */}
        {accessType !==
          "lesson" &&
          selectedGradeData && (
            <div
              style={{
                marginBottom:
                  "20px",

                padding:
                  "14px",

                borderRadius:
                  "12px",

                background:
                  "#fffaf3",

                border:
                  "1px solid #dfc5a3",

                color:
                  "#5b3b28",

                fontWeight:
                  "700",
              }}
            >
              {accessType ===
              "month"
                ? selectedGradeData.monthCourseTitle
                : selectedGradeData.termCourseTitle}
            </div>
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
                event.target.value
              );

              setMessage(
                ""
              );

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

        {/* إنشاء النوع المحدد */}
        <button
          type="button"
          disabled={
            isGenerating
          }
          onClick={
            generateAccessCodes
          }
          style={{
            width:
              "100%",

            minHeight:
              "58px",

            border:
              "none",

            borderRadius:
              "12px",

            background:
              isGenerating
                ? "#9b887a"
                : "#6f4930",

            color:
              "#fff",

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
            : `إنشاء ${codesCount || 0} كود`}
        </button>

        {/* فاصل */}
        <div
          style={{
            margin:
              "25px 0",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "12px",

            color:
              "#9a7d67",
          }}
        >
          <div
            style={{
              flex: 1,

              height:
                "1px",

              background:
                "#dfcbb8",
            }}
          />

          أو

          <div
            style={{
              flex: 1,

              height:
                "1px",

              background:
                "#dfcbb8",
            }}
          />
        </div>

        {/* إنشاء 2700 */}
        <button
          type="button"
          disabled={
            isGenerating
          }
          onClick={
            generateAllCodes
          }
          style={{
            width:
              "100%",

            minHeight:
              "62px",

            border:
              "none",

            borderRadius:
              "12px",

            background:
              isGenerating
                ? "#809086"
                : "#188b50",

            color:
              "#fff",

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
          إنشاء كل الـ 2700 كود
        </button>

        <p
          style={{
            textAlign:
              "center",

            color:
              "#806654",

            lineHeight:
              "1.7",

            fontSize:
              "14px",
          }}
        >
          300 حصة + 300 شهر +
          300 ترم لكل سنة
        </p>

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
              الأكواد التي تم إنشاؤها
            </h2>

            <p
              style={{
                textAlign:
                  "center",

                color:
                  "#725442",

                fontWeight:
                  "bold",
              }}
            >
              العدد:{" "}
              {
                generatedCodes.length
              }
            </p>

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
                      `${code}-${index}`
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

            <button
              type="button"
              onClick={
                copyAllCodes
              }
              style={{
                width:
                  "100%",

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

/*
  =====================================
  Styles
  =====================================
*/

const labelStyle = {
  display:
    "block",

  marginBottom:
    "8px",

  fontWeight:
    "bold",

  color:
    "#4a2f1f",
};

const inputStyle = {
  width:
    "100%",

  minHeight:
    "50px",

  padding:
    "10px 14px",

  borderRadius:
    "12px",

  border:
    "1px solid #d7c2ae",

  fontSize:
    "16px",

  fontWeight:
    "700",

  color:
    "#2f2119",

  background:
    "#ffffff",

  WebkitTextFillColor:
    "#2f2119",

  caretColor:
    "#2f2119",

  boxSizing:
    "border-box",
};

export default GenerateAccessCodes;