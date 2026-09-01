import { useEffect, useState } from "react";
import "./App.css";

import AllCourses from "./AllCourses";
import MyLessons from "./MyLessons";
import WatchDetails from "./WatchDetails";
import Invoices from "./Invoices";
import Results from "./Results";
import LevelIndicator from "./LevelIndicator";
import MyPoints from "./MyPoints";
import TopTen from "./TopTen";
import UploadExams from "./UploadExams";
import Homework from "./Homework";
import GenerateAccessCodes from "./GenerateAccessCodes";

import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaYoutube,
  FaFacebookF,
  FaTiktok,
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaBookOpen,
  FaCheckCircle,
  FaVideo,
  FaClipboardCheck,
  FaCreditCard,
  FaSignOutAlt,
  FaWhatsapp,
  FaAward,
  FaGraduationCap,
  FaBookReader,
  FaPlay,
  FaFileAlt,
  FaChartLine,
  FaBullseye,
  FaTrophy,
} from "react-icons/fa";

import coverTeacherImage from "./assets/omar-elshaier.jpeg";
import heroBanner from "./assets/hero-banner.jpeg";
import firstSecondaryImage from "./assets/first-secondary.jpeg";
import secondSecondaryImage from "./assets/second-secondary.jpeg";
import thirdSecondaryImage from "./assets/third-secondary.jpeg";
import secondFreeCourse from "./assets/second-free-course.jpeg";

import secondTmhede from "./assets/second-tmhede.jpeg";
import firstMonthCourse from "./assets/first-month.jpeg";
import firstTermCourse from "./assets/first-term.jpeg";
import secondMonthCourse from "./assets/second-month.jpeg";
import secondTermCourse from "./assets/second-term.jpeg";
import thirdMonthCourse from "./assets/third-month.jpeg";
import thirdTermCourse from "./assets/third-term.jpeg";

const platformWhatsAppNumber = "201114497910";

/*
  ========================================
  الكورسات التي ستظهر قبل تسجيل الدخول
  ========================================
*/
const publicCourses = [
  {
    id: "first-month-course",
    title: "كورس الشهر الأول أولى ثانوي",
    grade: "الأول الثانوي",
    price: 100,
    image: firstMonthCourse,
  },
  {
    id: "first-term-course",
    title: "كورس الترم الأول أولى ثانوي",
    grade: "الأول الثانوي",
    price: 300,
    image: firstTermCourse,
  },
  {
    id: "second-free-intro-course",
    title: "المحاضرة التمهيدية",
    grade: "الثاني الثانوي",
    price: 0,
    image: secondTmhede,
  },
  {
    id: "second-month-course",
    title: "كورس الشهر الأول تانية ثانوي",
    grade: "الثاني الثانوي",
    price: 150,
    image: secondMonthCourse,
  },
  {
    id: "second-term-course",
    title: "كورس الترم الأول تانية ثانوي",
    grade: "الثاني الثانوي",
    price: 400,
    image: secondTermCourse,
  },
  {
    id: "third-month-course",
    title: "كورس الشهر الأول تالته ثانوي",
    grade: "الثالث الثانوي",
    price: 150,
    image: thirdMonthCourse,
  },
  {
    id: "third-term-course",
    title: "كورس الترم الأول تالته ثانوي",
    grade: "الثالث الثانوي",
    price: 400,
    image: thirdTermCourse,
  },
];

const initialRegisterData = {
  fullName: "",
  studentPhone: "",
  parentPhone: "",
  governorate: "",
  grade: "",
  educationType: "",
  studentType: "",
  password: "",
  confirmPassword: "",
};

const initialLoginData = {
  phone: "",
  password: "",
};

function App() {
  /*
    لو اللينك فيه:
    ?course=course-id

    الطالب غير المسجل يدخل صفحة المنصة.
    الطالب المسجل يدخل على الكورسات.
  */
  const [page, setPage] = useState(() => {
    const savedStudent = localStorage.getItem("omarCurrentStudent");

    const courseId = new URLSearchParams(
      window.location.search
    ).get("course");

    if (savedStudent) {
      return "studentProfile";
    }

    return courseId ? "website" : "links";
  });

  const [darkMode, setDarkMode] = useState(true);

  const [showInstructions, setShowInstructions] =
    useState(false);

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  /*
    لو الطالب فتح لينك كورس وهو مسجل
    نخليه يدخل قسم كل الكورسات مباشرة.
  */
  const [studentProfileSection, setStudentProfileSection] =
    useState(() =>
      new URLSearchParams(window.location.search).get("course")
        ? "allCourses"
        : "profile"
    );

  /*
    ID الكورس الموجود في اللينك.
  */
  const [sharedCourseId, setSharedCourseId] = useState(
    () =>
      new URLSearchParams(window.location.search).get("course") ||
      ""
  );

  const [registerData, setRegisterData] =
    useState(initialRegisterData);

  const [registerMessage, setRegisterMessage] = useState("");
  const [registerMessageType, setRegisterMessageType] =
    useState("");

  const [loginData, setLoginData] =
    useState(initialLoginData);

  const [loginMessage, setLoginMessage] = useState("");
  const [loginMessageType, setLoginMessageType] =
    useState("");

  const [showLoginPassword, setShowLoginPassword] =
    useState(false);

  const [currentStudent, setCurrentStudent] = useState(() => {
    const savedStudent =
      localStorage.getItem("omarCurrentStudent");

    try {
      return savedStudent
        ? JSON.parse(savedStudent)
        : null;
    } catch {
      return null;
    }
  });

  /*
    أنيميشن الصفحة.
  */
  useEffect(() => {
    const reveals = document.querySelectorAll(
      ".reveal-right, .reveal-up"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          } else {
            entry.target.classList.remove("show");
          }
        });
      },
      {
        threshold: 0.55,
        rootMargin: "-80px 0px -80px 0px",
      }
    );

    reveals.forEach((element) =>
      observer.observe(element)
    );

    return () => observer.disconnect();
  }, [page]);

  /*
    لو حد فتح لينك كورس من بره
    ننزل تلقائيًا للكارت الخاص به.
  */
  useEffect(() => {
    if (page !== "website" || !sharedCourseId) {
      return;
    }

    const timer = window.setTimeout(() => {
      const courseElement = document.getElementById(
        `public-course-${sharedCourseId}`
      );

      courseElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [page, sharedCourseId]);

  /*
    تكوين لينك مشاركة خاص بالكورس.
  */
  function getCourseShareUrl(courseId) {
    const url = new URL(window.location.href);

    url.search = "";
    url.hash = "";

    url.searchParams.set("course", courseId);

    return url.toString();
  }

  /*
    مشاركة الكورس.
  */
  async function sharePublicCourse(course) {
    const shareUrl = getCourseShareUrl(course.id);

    try {
      if (navigator.share) {
        await navigator.share({
          title: course.title,
          text: `شوف ${course.title}`,
          url: shareUrl,
        });

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);

        window.alert("تم نسخ لينك الكورس.");

        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }

    window.prompt(
      "انسخ لينك الكورس:",
      shareUrl
    );
  }

  /*
    عند الضغط على اشترك الآن:
    نحفظ الكورس في الـ URL
    وبعدها نفتح التسجيل.
  */
  function openRegisterForCourse(course) {
    setSharedCourseId(course.id);

    const url = new URL(window.location.href);

    url.searchParams.set(
      "course",
      course.id
    );

    window.history.replaceState(
      {},
      "",
      url
    );

    openRegisterPage();
  }

  function openRegisterPage() {
    setRegisterData(initialRegisterData);

    setRegisterMessage("");
    setRegisterMessageType("");

    setShowInstructions(true);

    setPage("register");

    window.scrollTo(0, 0);
  }

  function openLoginPage() {
    setLoginData(initialLoginData);

    setLoginMessage("");
    setLoginMessageType("");

    setShowLoginPassword(false);

    setPage("login");

    window.scrollTo(0, 0);
  }

  function openWebsitePage() {
    setPage("website");

    window.scrollTo(0, 0);
  }

  function openStudentSection(sectionName) {
    setStudentProfileSection(sectionName);

    window.scrollTo(0, 0);
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;

    setRegisterData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setRegisterMessage("");
    setRegisterMessageType("");
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setLoginMessage("");
    setLoginMessageType("");
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();

    const {
      fullName,
      studentPhone,
      parentPhone,
      governorate,
      grade,
      educationType,
      studentType,
      password,
      confirmPassword,
    } = registerData;

    if (
      !fullName.trim() ||
      !studentPhone.trim() ||
      !parentPhone.trim() ||
      !governorate ||
      !grade ||
      !educationType ||
      !studentType ||
      !password ||
      !confirmPassword
    ) {
      setRegisterMessage(
        "من فضلك املأ جميع البيانات المطلوبة."
      );

      setRegisterMessageType("error");

      return;
    }

    if (fullName.trim().length < 6) {
      setRegisterMessage(
        "من فضلك اكتب الاسم بالكامل باللغة العربية."
      );

      setRegisterMessageType("error");

      return;
    }

    const phoneRegex =
      /^01[0125][0-9]{8}$/;

    const cleanStudentPhone =
      studentPhone.trim();

    const cleanParentPhone =
      parentPhone.trim();

    if (!phoneRegex.test(cleanStudentPhone)) {
      setRegisterMessage(
        "من فضلك اكتب رقم هاتف الطالب بشكل صحيح."
      );

      setRegisterMessageType("error");

      return;
    }

    if (!phoneRegex.test(cleanParentPhone)) {
      setRegisterMessage(
        "من فضلك اكتب رقم هاتف ولي الأمر بشكل صحيح."
      );

      setRegisterMessageType("error");

      return;
    }

    if (password.length < 6) {
      setRegisterMessage(
        "كلمة السر يجب ألا تقل عن 6 أحرف أو أرقام."
      );

      setRegisterMessageType("error");

      return;
    }

    if (password !== confirmPassword) {
      setRegisterMessage(
        "كلمة السر وتأكيد كلمة السر غير متطابقين."
      );

      setRegisterMessageType("error");

      return;
    }

    setRegisterMessage(
      "جاري إنشاء الحساب..."
    );

    setRegisterMessageType("pending");

    let firebaseUser = null;

    try {
      const firebaseEmail =
        `${cleanStudentPhone}@dars-khososy.com`;

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          firebaseEmail,
          password
        );

      firebaseUser =
        userCredential.user;

      const studentStatus =
        studentType === "center"
          ? "active"
          : "pending";

      const newStudent = {
        uid: firebaseUser.uid,

        fullName: fullName.trim(),

        studentPhone:
          cleanStudentPhone,

        parentPhone:
          cleanParentPhone,

        governorate,

        grade,

        educationType,

        studentType,

        status: studentStatus,

        watchedVideos: 0,

        completedExams: 0,

        completedHomeworks: 0,

        obtainedGrades: 0,

        totalGrades: 0,

        points: 0,

        subscribedCourses: [],

        activatedLessons: [],

        examResults: [],

        homeworkResults: [],

        watchHistory: [],

        role: "student",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      /*
        مهم:
        لو Firebase Auth أنشأ الحساب
        لكن Firestore فشل،
        نحذف حساب Auth حتى لا يظهر
        "رقم الهاتف مسجل بالفعل"
        في المحاولة التالية.
      */
      try {
        await setDoc(
          doc(
            db,
            "students",
            firebaseUser.uid
          ),
          newStudent
        );
      } catch (firestoreError) {
        console.error(
          "Firestore student creation error:",
          firestoreError
        );

        try {
          await deleteUser(
            firebaseUser
          );

          firebaseUser = null;

          console.log(
            "Incomplete Firebase Auth account deleted."
          );
        } catch (deleteError) {
          console.error(
            "Failed to delete incomplete Firebase Auth account:",
            deleteError
          );
        }

        throw firestoreError;
      }

      await signOut(auth);

      setRegisterData(
        initialRegisterData
      );

      if (studentType === "center") {
        setRegisterMessage(
          "تم إنشاء حساب طالب السنتر وتفعيله بنجاح. يمكنك الآن تسجيل الدخول."
        );

        setRegisterMessageType(
          "success"
        );
      } else {
        setRegisterMessage(
          "تم إرسال طلب إنشاء الحساب. حساب طالب الأونلاين قيد مراجعة المدرس."
        );

        setRegisterMessageType(
          "pending"
        );
      }
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setRegisterMessage(
          "يوجد حساب مسجل بالفعل برقم الهاتف ده."
        );
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        setRegisterMessage(
          "كلمة السر ضعيفة."
        );
      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        setRegisterMessage(
          "تحقق من اتصال الإنترنت."
        );
      } else if (
        error.code ===
          "permission-denied" ||
        error.code ===
          "firestore/permission-denied"
      ) {
        setRegisterMessage(
          "حدث خطأ أثناء حفظ بيانات الحساب. حاول مرة أخرى."
        );
      } else {
        setRegisterMessage(
          "حدث خطأ أثناء إنشاء الحساب."
        );
      }

      setRegisterMessageType(
        "error"
      );

      try {
        await signOut(auth);
      } catch {
        // تجاهل خطأ تسجيل الخروج
      }
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const cleanPhone =
      loginData.phone.trim();

    const password =
      loginData.password;

    if (!cleanPhone || !password) {
      setLoginMessage(
        "من فضلك اكتب رقم الهاتف وكلمة السر."
      );

      setLoginMessageType("error");

      return;
    }

    if (
      !/^01[0125][0-9]{8}$/.test(
        cleanPhone
      )
    ) {
      setLoginMessage(
        "من فضلك اكتب رقم هاتف صحيح."
      );

      setLoginMessageType("error");

      return;
    }

    setLoginMessage(
      "جاري تسجيل الدخول..."
    );

    setLoginMessageType("pending");
    try {
      const email = `${cleanPhone}@dars-khososy.com`;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const docRef = doc(
        db,
        "students",
        userCredential.user.uid
      );

      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await signOut(auth);

        setLoginMessage(
          "بيانات الطالب غير موجودة."
        );

        setLoginMessageType("error");

        return;
      }

      const student = {
        uid: docSnap.id,
        ...docSnap.data(),
      };

      if (student.status === "pending") {
        setLoginMessage(
          "حسابك قيد المراجعة ولم يتم تفعيله بعد."
        );

        setLoginMessageType("pending");

        await signOut(auth);

        return;
      }

      if (
        student.status === "blocked" ||
        student.status === "inactive"
      ) {
        setLoginMessage(
          "الحساب غير مفعل حاليًا. تواصل مع المدرس أو إدارة المنصة."
        );

        setLoginMessageType("error");

        await signOut(auth);

        return;
      }

      setCurrentStudent(student);

      localStorage.setItem(
        "omarCurrentStudent",
        JSON.stringify(student)
      );

      /*
        لو الطالب دخل من لينك كورس مباشر
        نفتحه على جميع الكورسات.
      */
      setStudentProfileSection(
        sharedCourseId
          ? "allCourses"
          : "profile"
      );

      setPage("studentProfile");

      setLoginMessage("");

      setLoginMessageType("");

      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setLoginMessage(
          "رقم الهاتف أو كلمة السر غير صحيحة."
        );
      } else if (
        error.code === "auth/too-many-requests"
      ) {
        setLoginMessage(
          "تم إجراء محاولات تسجيل دخول كثيرة. حاول مرة أخرى بعد قليل."
        );
      } else if (
        error.code === "auth/network-request-failed"
      ) {
        setLoginMessage(
          "تحقق من اتصال الإنترنت وحاول مرة أخرى."
        );
      } else {
        setLoginMessage(
          "حدث خطأ أثناء تسجيل الدخول."
        );
      }

      setLoginMessageType("error");
    }
  }

  async function handleStudentLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }

    localStorage.removeItem(
      "omarCurrentStudent"
    );

    setCurrentStudent(null);

    setStudentProfileSection(
      "profile"
    );

    setLoginData(
      initialLoginData
    );

    setLoginMessage("");

    setLoginMessageType("");

    setPage("website");

    window.scrollTo(0, 0);
  }

  if (
    window.location.hash ===
    "#upload-exams"
  ) {
    return <UploadExams />;
  }

  if (
    window.location.hash ===
    "#generate-access-codes"
  ) {
    return <GenerateAccessCodes />;
  }

  /*
    ========================================
    صفحة الطالب بعد تسجيل الدخول
    ========================================
  */

  if (page === "studentProfile") {
    if (!currentStudent) {
      return (
        <div className="student-profile-page">
          <div className="student-session-message">
            <h2>
              برجاء تسجيل الدخول أولًا
            </h2>

            <button
              type="button"
              onClick={openLoginPage}
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      );
    }

    const isCenterStudent =
      currentStudent.studentType ===
      "center";

    const studentTypeText =
      isCenterStudent
        ? "طالب سنتر"
        : "طالب أونلاين";

    const educationTypeText =
      currentStudent.educationType ===
      "عام"
        ? "ثانوي عام"
        : currentStudent.educationType ||
          "ثانوي عام";

    const watchedVideos =
      Number(
        currentStudent.watchedVideos
      ) || 0;

    const completedExams =
      Number(
        currentStudent.completedExams
      ) || 0;

    const obtainedGrades =
      Number(
        currentStudent.obtainedGrades
      ) || 0;

    const totalGrades =
      Number(
        currentStudent.totalGrades
      ) || 0;

    const subscribedCourses =
      Array.isArray(
        currentStudent.subscribedCourses
      )
        ? currentStudent.subscribedCourses
        : [];

    const gradesPercentage =
      totalGrades > 0
        ? Math.round(
            (obtainedGrades /
              totalGrades) *
              100
          )
        : 0;

    const whatsappMessage =
      encodeURIComponent(
        `السلام عليكم، أنا الطالب ${currentStudent.fullName} وأحتاج مساعدة من منصة أ/ عمر الشاعر.`
      );

    return (
      <div
        className={
          darkMode
            ? "student-profile-page dark-student-profile-page"
            : "student-profile-page light-student-profile-page"
        }
      >
        <header className="student-dashboard-header">
          <div className="student-dashboard-top">
            <div className="student-dashboard-logo">
              درس خصوصي
            </div>

            <div className="student-dashboard-actions">
              <button
                type="button"
                className="student-dark-mode-btn"
                onClick={() =>
                  setDarkMode(
                    (prev) => !prev
                  )
                }
                aria-label="تغيير وضع الألوان"
              >
                {darkMode
                  ? "☀️"
                  : "🌙"}
              </button>

              <button
                type="button"
                className="student-logout-btn"
                onClick={
                  handleStudentLogout
                }
              >
                <FaSignOutAlt />
                تسجيل الخروج
              </button>
            </div>
          </div>

          <nav className="student-dashboard-nav">
            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "profile"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "profile"
                )
              }
            >
              <FaUserGraduate />
              ملف الطالب
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "courses"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "courses"
                )
              }
            >
              <FaGraduationCap />
              كورساتي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "allCourses"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "allCourses"
                )
              }
            >
              <FaBookOpen />
              جميع الكورسات
            </button>

            {isCenterStudent && (
              <button
                type="button"
                className={`student-nav-btn ${
                  studentProfileSection ===
                  "homeworkSubmission"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  openStudentSection(
                    "homeworkSubmission"
                  )
                }
              >
                <FaClipboardCheck />
                تسليم الواجب
              </button>
            )}

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "lessons"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "lessons"
                )
              }
            >
              <FaVideo />
              دروسي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "watchDetails"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "watchDetails"
                )
              }
            >
              <FaEye />
              تفاصيل المشاهدات
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "invoices"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "invoices"
                )
              }
            >
              <FaCreditCard />
              الفواتير
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "results"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "results"
                )
              }
            >
              <FaFileAlt />
              نتائجك
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "levelIndicator"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "levelIndicator"
                )
              }
            >
              <FaChartLine />
              مؤشر المستوى
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "myPoints"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "myPoints"
                )
              }
            >
              <FaBullseye />
              نقاطي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection ===
                "topTen"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                openStudentSection(
                  "topTen"
                )
              }
            >
              <FaTrophy />
              أعلى 10
            </button>
          </nav>
        </header>

        <main className="student-profile-main">
          {studentProfileSection ===
            "profile" && (
            <>
              <section className="student-profile-title">
                <h1>
                  ملف الطالب
                </h1>
              </section>

              <div className="student-profile-layout">
                <section className="student-information-section">
                  <div className="student-section-heading">
                    <h2>
                      بيانات المستخدم
                    </h2>
                  </div>

                  <div className="student-information-card">
                    <div className="student-avatar">
                      <FaUserGraduate />
                    </div>

                    <div className="student-main-data">
                      <h2>
                        {
                          currentStudent.fullName
                        }
                      </h2>

                      <div className="student-data-list">
                        <p>
                          <FaPhoneAlt />

                          <span>
                            {
                              currentStudent.studentPhone
                            }
                          </span>
                        </p>

                        <p>
                          <FaMapMarkerAlt />

                          <span>
                            {
                              currentStudent.governorate
                            }
                          </span>
                        </p>

                        <p>
                          <FaBookOpen />

                          <span>
                            {
                              educationTypeText
                            }
                          </span>
                        </p>

                        <p>
                          <FaUserGraduate />

                          <span>
                            {
                              currentStudent.grade
                            }
                          </span>
                        </p>

                        <p>
                          <FaCheckCircle />

                          <span>
                            {
                              studentTypeText
                            }
                          </span>
                        </p>
                      </div>

                      <div className="student-account-status">
                        <FaCheckCircle />
                        الحساب مفعل
                      </div>
                    </div>
                  </div>
                </section>

                <section className="student-statistics-section">
                  <div className="student-section-heading">
                    <h2>
                      إحصائياتك
                    </h2>
                  </div>

                  <div className="student-statistics-grid">
                    <article className="student-stat-card">
                      <div className="student-stat-icon">
                        <FaVideo />
                      </div>

                      <h3>
                        عدد مرات مشاهدة
                        الفيديوهات
                      </h3>

                      <strong>
                        {watchedVideos}
                      </strong>

                      <span>
                        {watchedVideos ===
                        1
                          ? "فيديو"
                          : "فيديوهات"}
                      </span>
                    </article>

                    <article className="student-stat-card">
                      <div className="student-stat-icon">
                        <FaClipboardCheck />
                      </div>

                      <h3>
                        عدد الاختبارات التي
                        خلصتها
                      </h3>

                      <strong>
                        {completedExams}
                      </strong>

                      <span>
                        {completedExams ===
                        1
                          ? "اختبار"
                          : "اختبارات"}
                      </span>
                    </article>

                    <article className="student-grades-card">
                      <div className="student-grades-content">
                        <div className="student-stat-icon grades-icon">
                          <FaAward />
                        </div>

                        <div className="student-grades-text">
                          <h3>
                            الدرجات التي حصلت
                            عليها
                          </h3>

                          <div className="student-grades-numbers">
                            <strong>
                              {
                                obtainedGrades
                              }
                            </strong>

                            <span>
                              من{" "}
                              {
                                totalGrades
                              }
                            </span>
                          </div>
                        </div>

                        <div className="student-grades-percentage">
                          <strong>
                            {
                              gradesPercentage
                            }
                            %
                          </strong>
                        </div>
                      </div>

                      <div className="student-grades-progress">
                        <div
                          className="student-grades-progress-fill"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                gradesPercentage,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </>
          )}

          {studentProfileSection ===
            "courses" && (
            <section className="student-courses-page">
              <section className="student-profile-title">
                <h1>
                  كورساتي
                </h1>
              </section>

              {subscribedCourses.length ===
              0 ? (
                <div className="student-empty-courses">
                  <div className="student-empty-courses-icon">
                    <FaBookReader />
                  </div>

                  <h2>
                    مافيش كورسات هنا لسه!
                  </h2>

                  <p>
                    أول ما يتم إضافة أي
                    كورس إلى حسابك هتلاقيه
                    ظاهر هنا وتقدر تبدأ
                    المذاكرة فورًا.
                  </p>
                </div>
              ) : (
                <div className="student-courses-grid">
                  {subscribedCourses.map(
                    (
                      course,
                      index
                    ) => {
                      const courseId =
                        course.id ||
                        course.courseId ||
                        `${
                          course.title ||
                          "course"
                        }-${index}`;

                      const courseProgress =
                        Math.min(
                          Math.max(
                            Number(
                              course.progress
                            ) || 0,
                            0
                          ),
                          100
                        );

                      const savedImage =
                        typeof course.image ===
                        "string"
                          ? course.image.trim()
                          : "";

                      const courseImage =
                        savedImage &&
                        savedImage !==
                          "default"
                          ? savedImage
                          : secondFreeCourse;

                      return (
                        <article
                          className="student-course-card"
                          key={
                            courseId
                          }
                        >
                          <div className="student-course-image-wrapper">
                            <img
                              src={
                                courseImage
                              }
                              alt={
                                course.title ||
                                "صورة الكورس"
                              }
                              className="student-course-image"
                              onError={(
                                event
                              ) => {
                                event.currentTarget.onerror =
                                  null;

                                event.currentTarget.src =
                                  secondFreeCourse;
                              }}
                            />

                            <span className="student-course-status">
                              مشترك
                            </span>
                          </div>

                          <div className="student-course-content">
                            <span className="student-course-grade">
                              {course.grade ||
                                currentStudent.grade}
                            </span>

                            <h2>
                              {course.title ||
                                "كورس اللغة العربية"}
                            </h2>

                            <p>
                              {course.description ||
                                "شرح منظم، تدريبات واختبارات تساعدك على فهم المنهج وتحقيق أفضل نتيجة."}
                            </p>

                            <div className="student-course-progress-info">
                              <span>
                                نسبة إكمال
                                الكورس
                              </span>

                              <strong>
                                {
                                  courseProgress
                                }
                                %
                              </strong>
                            </div>

                            <div className="student-course-progress-bar">
                              <div
                                className="student-course-progress-fill"
                                style={{
                                  width: `${courseProgress}%`,
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              className="student-open-course-btn"
                              onClick={() =>
                                openStudentSection(
                                  "allCourses"
                                )
                              }
                            >
                              <FaPlay />
                              دخول الكورس
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}

          {studentProfileSection ===
            "allCourses" && (
            <AllCourses
              currentStudent={
                currentStudent
              }
              targetCourseId={
                sharedCourseId
              }
            />
          )}

          {studentProfileSection ===
            "homeworkSubmission" &&
            isCenterStudent && (
              <Homework
                currentStudent={
                  currentStudent
                }
              />
            )}

          {studentProfileSection ===
            "lessons" && (
            <MyLessons
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "watchDetails" && (
            <WatchDetails
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "invoices" && (
            <Invoices
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "results" && (
            <Results
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "levelIndicator" && (
            <LevelIndicator
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "myPoints" && (
            <MyPoints
              currentStudent={
                currentStudent
              }
            />
          )}

          {studentProfileSection ===
            "topTen" && (
            <TopTen
              currentStudent={
                currentStudent
              }
            />
          )}
        </main>

        <a
          href={`https://wa.me/${platformWhatsAppNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="student-whatsapp-floating"
          aria-label="تواصل معنا على واتساب"
          title="تواصل معنا على واتساب"
        >
          <FaWhatsapp />
        </a>
      </div>
    );
  }

  /*
    ========================================
    صفحة تسجيل الدخول
    ========================================
  */
  if (page === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <button
            type="button"
            className="auth-back-btn"
            onClick={openWebsitePage}
          >
            الرجوع للمنصة
          </button>

          <div className="auth-logo">
            درس خصوصي
          </div>

          <div className="auth-heading">
            <h1>تسجيل الدخول</h1>

            <p>
              اكتب رقم الهاتف وكلمة السر للدخول إلى حسابك
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleLoginSubmit}
          >
            <div className="auth-field">
              <label htmlFor="loginPhone">
                رقم هاتف الطالب
              </label>

              <input
                id="loginPhone"
                type="tel"
                name="phone"
                value={loginData.phone}
                onChange={handleLoginChange}
                placeholder="01xxxxxxxxx"
                maxLength={11}
                dir="ltr"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="loginPassword">
                كلمة السر
              </label>

              <div className="password-input-wrapper">
                <input
                  id="loginPassword"
                  type={
                    showLoginPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="اكتب كلمة السر"
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() =>
                    setShowLoginPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showLoginPassword
                      ? "إخفاء كلمة السر"
                      : "إظهار كلمة السر"
                  }
                >
                  {showLoginPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>
            </div>

            {loginMessage && (
              <div
                className={`auth-message ${loginMessageType}`}
              >
                {loginMessage}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              className="forgot-password-btn"
              onClick={() =>
                setShowForgotPassword(true)
              }
            >
              نسيت كلمة السر؟
            </button>

            <div className="auth-switch">
              ليس لديك حساب؟

              <button
                type="button"
                onClick={openRegisterPage}
              >
                إنشاء حساب
              </button>
            </div>
          </form>

          {showForgotPassword && (
            <div
              className="instructions-overlay"
              onClick={() =>
                setShowForgotPassword(false)
              }
            >
              <div
                className="instructions-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  type="button"
                  className="instructions-close"
                  onClick={() =>
                    setShowForgotPassword(false)
                  }
                >
                  ×
                </button>

                <h2>نسيت كلمة السر؟</h2>

                <p>
                  تواصل مع إدارة المنصة وسيتم مساعدتك في تغيير كلمة السر.
                </p>

                <a
                  href={`https://wa.me/${platformWhatsAppNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-submit-btn"
                >
                  <FaWhatsapp />
                  تواصل معنا على واتساب
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /*
    ========================================
    صفحة إنشاء الحساب
    ========================================
  */
  if (page === "register") {
    return (
      <div className="register-page">
        <div className="register-container">
          <button
            type="button"
            className="auth-back-btn"
            onClick={openWebsitePage}
          >
            الرجوع للمنصة
          </button>

          <div className="register-heading">
            <div className="auth-logo">
              درس خصوصي
            </div>

            <h1>إنشاء حساب جديد</h1>

            <p>
              سجل بياناتك بشكل صحيح للانضمام إلى المنصة
            </p>
          </div>

          <form
            className="register-form"
            onSubmit={handleRegisterSubmit}
          >
            <div className="register-field full-width">
              <label htmlFor="fullName">
                الاسم بالكامل
              </label>

              <input
                id="fullName"
                type="text"
                name="fullName"
                value={registerData.fullName}
                onChange={handleRegisterChange}
                placeholder="اكتب اسم الطالب بالكامل باللغة العربية"
              />
            </div>

            <div className="register-grid">
              <div className="register-field">
                <label htmlFor="studentPhone">
                  رقم هاتف الطالب
                </label>

                <input
                  id="studentPhone"
                  type="tel"
                  name="studentPhone"
                  value={registerData.studentPhone}
                  onChange={handleRegisterChange}
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  dir="ltr"
                />
              </div>

              <div className="register-field">
                <label htmlFor="parentPhone">
                  رقم هاتف ولي الأمر
                </label>

                <input
                  id="parentPhone"
                  type="tel"
                  name="parentPhone"
                  value={registerData.parentPhone}
                  onChange={handleRegisterChange}
                  placeholder="01xxxxxxxxx"
                  maxLength={11}
                  dir="ltr"
                />
              </div>

              <div className="register-field">
                <label htmlFor="governorate">
                  المحافظة
                </label>

                <select
                  id="governorate"
                  name="governorate"
                  value={registerData.governorate}
                  onChange={handleRegisterChange}
                >
                  <option value="">
                    اختر المحافظة
                  </option>

                  <option value="القاهرة">
                    القاهرة
                  </option>
                  <option value="الجيزة">
                    الجيزة
                  </option>
                  <option value="القليوبية">
                    القليوبية
                  </option>
                  <option value="الإسكندرية">
                    الإسكندرية
                  </option>
                  <option value="البحيرة">
                    البحيرة
                  </option>
                  <option value="مطروح">
                    مطروح
                  </option>
                  <option value="الدقهلية">
                    الدقهلية
                  </option>
                  <option value="دمياط">
                    دمياط
                  </option>
                  <option value="الغربية">
                    الغربية
                  </option>
                  <option value="كفر الشيخ">
                    كفر الشيخ
                  </option>
                  <option value="المنوفية">
                    المنوفية
                  </option>
                  <option value="الشرقية">
                    الشرقية
                  </option>
                  <option value="بورسعيد">
                    بورسعيد
                  </option>
                  <option value="الإسماعيلية">
                    الإسماعيلية
                  </option>
                  <option value="السويس">
                    السويس
                  </option>
                  <option value="شمال سيناء">
                    شمال سيناء
                  </option>
                  <option value="جنوب سيناء">
                    جنوب سيناء
                  </option>
                  <option value="الفيوم">
                    الفيوم
                  </option>
                  <option value="بني سويف">
                    بني سويف
                  </option>
                  <option value="المنيا">
                    المنيا
                  </option>
                  <option value="أسيوط">
                    أسيوط
                  </option>
                  <option value="سوهاج">
                    سوهاج
                  </option>
                  <option value="قنا">
                    قنا
                  </option>
                  <option value="الأقصر">
                    الأقصر
                  </option>
                  <option value="أسوان">
                    أسوان
                  </option>
                  <option value="البحر الأحمر">
                    البحر الأحمر
                  </option>
                  <option value="الوادي الجديد">
                    الوادي الجديد
                  </option>
                  <option value="أخرى">
                    أخرى
                  </option>
                </select>
              </div>

              <div className="register-field">
                <label htmlFor="grade">
                  الصف الدراسي
                </label>

                <select
                  id="grade"
                  name="grade"
                  value={registerData.grade}
                  onChange={handleRegisterChange}
                >
                  <option value="">
                    اختر الصف الدراسي
                  </option>

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

              <div className="register-field">
                <label htmlFor="educationType">
                  نوع التعليم
                </label>

                <select
                  id="educationType"
                  name="educationType"
                  value={registerData.educationType}
                  onChange={handleRegisterChange}
                >
                  <option value="">
                    اختر نوع التعليم
                  </option>

                  <option value="ثانوي عام">
                    ثانوي عام
                  </option>

                  <option value="ثانوي أزهري">
                    ثانوي أزهري
                  </option>
                </select>
              </div>

              <div className="register-field">
                <label htmlFor="studentType">
                  نوع الطالب
                </label>

                <select
                  id="studentType"
                  name="studentType"
                  value={registerData.studentType}
                  onChange={handleRegisterChange}
                >
                  <option value="">
                    اختر نوع الطالب
                  </option>

                  <option value="center">
                    طالب سنتر
                  </option>

                  <option value="online">
                    طالب أونلاين
                  </option>
                </select>
              </div>

              <div className="register-field">
                <label htmlFor="password">
                  كلمة السر
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  placeholder="6 أحرف أو أرقام على الأقل"
                />
              </div>

              <div className="register-field">
                <label htmlFor="confirmPassword">
                  تأكيد كلمة السر
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  placeholder="اكتب كلمة السر مرة أخرى"
                />
              </div>
            </div>

            {registerMessage && (
              <div
                className={`auth-message ${registerMessageType}`}
              >
                {registerMessage}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn register-submit-btn"
            >
              إنشاء الحساب
            </button>

            <div className="auth-switch">
              لديك حساب بالفعل؟

              <button
                type="button"
                onClick={openLoginPage}
              >
                تسجيل الدخول
              </button>
            </div>
          </form>
        </div>

        {showInstructions && (
          <div
            className="instructions-overlay"
            onClick={() =>
              setShowInstructions(false)
            }
          >
            <div
              className="instructions-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="instructions-close"
                onClick={() =>
                  setShowInstructions(false)
                }
              >
                ×
              </button>

              <h2>
                تعليمات إنشاء الحساب
              </h2>

              <div className="instructions-list">
                <p>
                  1- اكتب جميع بياناتك بشكل صحيح.
                </p>

                <p>
                  2- اكتب الاسم بالكامل باللغة العربية.
                </p>

                <p>
                  3- اختر نوع الطالب بشكل صحيح.
                </p>

                <p>
                  4- طالب السنتر يتم تفعيل حسابه تلقائيًا.
                </p>

                <p>
                  5- طالب الأونلاين يحتاج موافقة المدرس لتفعيل الحساب.
                </p>

                <p>
                  6- احتفظ برقم الهاتف وكلمة السر لتسجيل الدخول مرة أخرى.
                </p>
              </div>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() =>
                  setShowInstructions(false)
                }
              >
                فهمت، ابدأ التسجيل
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
    ========================================
    صفحة المنصة العامة
    ========================================
  */
  if (page === "website") {
    return (
      <div className="website-page">
        <header className="website-header">
          <div className="website-logo">
            درس خصوصي
          </div>

          <div className="website-header-actions">
            <button
              type="button"
              className="website-login-btn"
              onClick={openLoginPage}
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              className="website-register-btn"
              onClick={openRegisterPage}
            >
              إنشاء حساب
            </button>

            <button
              type="button"
              className="website-back-btn"
              onClick={() => {
                setPage("links");
                window.scrollTo(0, 0);
              }}
            >
              رجوع
            </button>
          </div>
        </header>

        <main>
          <section className="hero-section">
            <img
              src={heroBanner}
              alt="منصة درس خصوصي"
              className="hero-banner"
            />

            <button
              type="button"
              className="hero-register-hotspot"
              onClick={openRegisterPage}
              aria-label="سجل معنا"
            >
              سجل معنا
            </button>
          </section>

          <section className="website-intro-section reveal-up">
            <div className="section-title">
              <span>
                منصة اللغة العربية
              </span>

              <h2>
                رحلتك نحو التفوق تبدأ من هنا
              </h2>

              <p>
                شرح مبسط، تدريبات منظمة، اختبارات ومتابعة تساعدك على تحقيق أفضل نتيجة.
              </p>
            </div>
          </section>

          <section className="website-features-section">
            <div className="section-title reveal-up">
              <span>
                مميزات المنصة
              </span>

              <h2>
                كل اللي محتاجه في مكان واحد
              </h2>
            </div>

            <div className="website-features-grid">
              <article className="website-feature-card reveal-up">
                <FaBookOpen />

                <h3>
                  شرح مبسط
                </h3>

                <p>
                  شرح منظم وواضح يساعدك على فهم المنهج خطوة بخطوة.
                </p>
              </article>

              <article className="website-feature-card reveal-up">
                <FaVideo />

                <h3>
                  اتفرج كتير
                </h3>

                <p>
                  تابع دروسك وفيديوهاتك من أي مكان وفي الوقت المناسب ليك.
                </p>
              </article>

              <article className="website-feature-card reveal-up">
                <FaClipboardCheck />

                <h3>
                  اختبارات
                </h3>

                <p>
                  اختبر مستواك باستمرار واعرف نقاط القوة والحاجات اللي محتاجة مراجعة.
                </p>
              </article>

              <article className="website-feature-card reveal-up">
                <FaAward />

                <h3>
                  وفر وقتك
                </h3>

                <p>
                  مذاكرة منظمة ومحتوى مرتب يساعدك تستفيد من وقتك بأفضل شكل.
                </p>
              </article>
            </div>
          </section>

          <section className="subscription-section">
            <div className="section-title reveal-up">
              <span>
                اشتراك المنصة
              </span>

              <h2>
                ذاكر بطريقة منظمة
              </h2>

              <p>
                اختار الكورس المناسب ليك وابدأ رحلة المذاكرة مع أ/ عمر الشاعر.
              </p>
            </div>

            <div className="subscription-grid">
              <article className="subscription-card reveal-up">
                <FaBookReader />

                <h3>
                  تنظيم
                </h3>

                <p>
                  المحتوى متقسم ومرتب علشان تعرف تبدأ منين وتكمل إزاي.
                </p>
              </article>

              <article className="subscription-card reveal-up">
                <FaPlay />

                <h3>
                  شرح
                </h3>

                <p>
                  محاضرات تساعدك تفهم المنهج وتراجع عليه.
                </p>
              </article>

              <article className="subscription-card reveal-up">
                <FaClipboardCheck />

                <h3>
                  اختبارات
                </h3>

                <p>
                  اختبارات وتدريبات بعد الدروس لمتابعة مستواك.
                </p>
              </article>

              <article className="subscription-card reveal-up">
                <FaGraduationCap />

                <h3>
                  مراجعات
                </h3>

                <p>
                  مراجعات تساعدك تثبت المعلومات قبل الامتحانات.
                </p>
              </article>
            </div>

            <button
              type="button"
              className="subscription-register-btn"
              onClick={openRegisterPage}
            >
              اشترك الآن
            </button>
          </section>

          {/*
            ======================================
            الكورسات المتاحة قبل تسجيل الدخول
            ======================================
          */}
          <section
            id="public-courses"
            style={{
              width: "100%",
              padding: "80px 20px",
              background: "#0b0b10",
              direction: "rtl",
            }}
          >
            <div
              style={{
                width: "min(1180px, 100%)",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "40px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "10px",
                    fontWeight: "700",
                    fontSize: "15px",
                  }}
                >
                  اختار الكورس المناسب ليك
                </span>

                <h2
                  style={{
                    margin: "0 0 12px",
                    fontSize: "clamp(28px, 5vw, 44px)",
                    color: "#ffffff",
                  }}
                >
                  الكورسات المتاحة
                </h2>

                <p
                  style={{
                    margin: "0 auto",
                    maxWidth: "650px",
                    lineHeight: "1.9",
                    color: "#b9b9c3",
                  }}
                >
                  تقدر تشوف الكورسات قبل إنشاء الحساب، وبعد ما تختار الكورس المناسب سجل في المنصة وابدأ المذاكرة.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "24px",
                }}
              >
                {publicCourses.map((course) => {
                  const isFree =
                    Number(course.price) <= 0;

                  const isSharedCourse =
                    sharedCourseId === course.id;

                  return (
                    <article
                      key={course.id}
                      id={`public-course-${course.id}`}
                      style={{
                        overflow: "hidden",
                        borderRadius: "22px",
                        background: "#15151d",
                        border: isSharedCourse
                          ? "2px solid #ffffff"
                          : "1px solid rgba(255,255,255,0.09)",
                        boxShadow: isSharedCourse
                          ? "0 0 30px rgba(255,255,255,0.13)"
                          : "0 15px 40px rgba(0,0,0,0.22)",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 10",
                          overflow: "hidden",
                          background: "#20202a",
                        }}
                      >
                        <img
                          src={course.image}
                          alt={course.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          padding: "22px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            marginBottom: "10px",
                            fontSize: "14px",
                            color: "#c5c5cf",
                          }}
                        >
                          {course.grade}
                        </span>

                        <h3
                          style={{
                            color: "#ffffff",
                            fontSize: "21px",
                            lineHeight: "1.6",
                            margin: "0 0 14px",
                          }}
                        >
                          {course.title}
                        </h3>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                            marginBottom: "18px",
                          }}
                        >
                          <span
                            style={{
                              color: "#a9a9b4",
                              fontSize: "14px",
                            }}
                          >
                            سعر الكورس
                          </span>

                          <strong
                            style={{
                              color: "#ffffff",
                              fontSize: "20px",
                            }}
                          >
                            {isFree
                              ? "مجاني"
                              : `${course.price} جنيه`}
                          </strong>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openRegisterForCourse(course)
                            }
                            style={{
                              border: "none",
                              borderRadius: "12px",
                              padding: "13px 10px",
                              fontFamily: "inherit",
                              fontWeight: "800",
                              cursor: "pointer",
                            }}
                          >
                            {isFree
                              ? "ابدأ مجانًا"
                              : "اشترك الآن"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              sharePublicCourse(course)
                            }
                            style={{
                              borderRadius: "12px",
                              padding: "13px 10px",
                              fontFamily: "inherit",
                              fontWeight: "700",
                              cursor: "pointer",
                              background: "transparent",
                              color: "#ffffff",
                              border:
                                "1px solid rgba(255,255,255,0.25)",
                            }}
                          >
                            مشاركة الكورس
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
          <section className="stages-section">
            <div className="stages-heading reveal-up delay-1">
              <h2>اختر مرحلتك الدراسية</h2>

              <p>
                اختر الصف المناسب وابدأ رحلتك مع الشرح
                والاختبارات والمراجعات.
              </p>
            </div>

            <div className="stages-grid">
              <article className="stage-card reveal-up delay-2">
                <img
                  src={firstSecondaryImage}
                  alt="الصف الأول الثانوي"
                  className="stage-image"
                />

                <div className="stage-basic-info">
                  <h3>الأول الثانوي</h3>
                  <p>كل محتوى الصف الأول الثانوي</p>
                </div>

                <div className="stage-overlay">
                  <h3>محتوى الأول الثانوي</h3>

                  <p>
                    دروس منظمة، تدريبات، اختبارات ومراجعات
                    تساعدك على التفوق.
                  </p>

                  <button
                    type="button"
                    onClick={openRegisterPage}
                    className="stage-register-btn"
                  >
                    سجل معنا
                  </button>
                </div>
              </article>

              <article className="stage-card reveal-up delay-3">
                <img
                  src={secondSecondaryImage}
                  alt="الصف الثاني الثانوي"
                  className="stage-image"
                />

                <div className="stage-basic-info">
                  <h3>الثاني الثانوي</h3>
                  <p>كل محتوى الصف الثاني الثانوي</p>
                </div>

                <div className="stage-overlay">
                  <h3>محتوى الثاني الثانوي</h3>

                  <p>
                    شرح مبسط، تدريبات متنوعة واختبارات تساعدك
                    تتابع مستواك.
                  </p>

                  <button
                    type="button"
                    onClick={openRegisterPage}
                    className="stage-register-btn"
                  >
                    سجل معنا
                  </button>
                </div>
              </article>

              <article className="stage-card reveal-up delay-4">
                <img
                  src={thirdSecondaryImage}
                  alt="الصف الثالث الثانوي"
                  className="stage-image"
                />

                <div className="stage-basic-info">
                  <h3>الثالث الثانوي</h3>
                  <p>كل محتوى الصف الثالث الثانوي</p>
                </div>

                <div className="stage-overlay">
                  <h3>محتوى الثالث الثانوي</h3>

                  <p>
                    مراجعات شاملة، اختبارات ونماذج امتحانات
                    تساعدك تحقق هدفك.
                  </p>

                  <button
                    type="button"
                    onClick={openRegisterPage}
                    className="stage-register-btn"
                  >
                    سجل معنا
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section className="social-strip">
            <p>تابعنا على مواقع التواصل</p>

            <div className="social-links">
              <a
                href="https://www.youtube.com/@omaralshaaeir"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon youtube"
                aria-label="يوتيوب"
              >
                <FaYoutube />
              </a>

              <a
                href="https://www.facebook.com/share/1DC3Tc36r3/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon facebook"
                aria-label="فيسبوك"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://www.tiktok.com/@omaralshaaeir1?_r=1&_t=ZS-97ag9K1QdpU"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon tiktok"
                aria-label="تيك توك"
              >
                <FaTiktok />
              </a>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /*
    ========================================
    الصفحة الأولى - روابط أ/ عمر الشاعر
    ========================================
  */
  return (
    <div className="app">
      <div className="decor decor-1" />
      <div className="decor decor-2" />
      <div className="decor decor-3" />

      <main className="profile-card">
        <div className="logo">
          <img
            src={coverTeacherImage}
            alt="أ / عمر الشاعر"
            className="logo-img"
          />
        </div>

        <h1>درس خصوصي</h1>
        <h2>أ / عمر الشاعر</h2>

        <p className="subtitle">
          مدرس اللغة العربية
        </p>

        <p className="welcome">
          أهلاً بك في منصة أ/ عمر الشاعر
          <br />

          <span className="welcome-line">
            <span className="welcome-text">
              تعلم اللغة العربية بأسلوب بسيط وممتع
            </span>

            <span className="welcome-emoji">
              🤎
            </span>
          </span>
        </p>

        <div className="links">
          <a
            href={`https://wa.me/${platformWhatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            قناة الواتساب
          </a>

          <button
            type="button"
            onClick={openWebsitePage}
            className="link-btn"
          >
            منصة درس خصوصي
          </button>

          <a
            href="https://www.facebook.com/share/1DC3Tc36r3/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            فيسبوك
          </a>

          <a
            href="https://www.youtube.com/@omaralshaaeir"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            يوتيوب
          </a>

          <a
            href="https://www.tiktok.com/@omaralshaaeir1?_r=1&_t=ZS-97ag9K1QdpU"
            target="_blank"
            rel="noopener noreferrer"
            className="link-btn"
          >
            تيك توك
          </a>
        </div>

        <footer>
          ©️ 2026 درس خصوصي
        </footer>
      </main>
    </div>
  );
}

export default App;