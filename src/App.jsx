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

import {
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

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

const platformWhatsAppNumber = "201114497910";

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
  const [page, setPage] = useState(() => {
    const savedStudent = localStorage.getItem("omarCurrentStudent");
    return savedStudent ? "studentProfile" : "links";
  });

  const [darkMode, setDarkMode] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [studentProfileSection, setStudentProfileSection] = useState("profile");
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerMessageType, setRegisterMessageType] = useState("");
  const [loginData, setLoginData] = useState(initialLoginData);
  const [loginMessage, setLoginMessage] = useState("");
  const [loginMessageType, setLoginMessageType] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [currentStudent, setCurrentStudent] = useState(() => {
    const savedStudent = localStorage.getItem("omarCurrentStudent");

    try {
      return savedStudent ? JSON.parse(savedStudent) : null;
    } catch {
      return null;
    }
  });

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

    reveals.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [page]);

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
      setRegisterMessage("من فضلك املأ جميع البيانات المطلوبة.");
      setRegisterMessageType("error");
      return;
    }

    if (fullName.trim().length < 6) {
      setRegisterMessage("من فضلك اكتب الاسم بالكامل باللغة العربية.");
      setRegisterMessageType("error");
      return;
    }

    const phoneRegex = /^01[0125][0-9]{8}$/;

    if (!phoneRegex.test(studentPhone.trim())) {
      setRegisterMessage("من فضلك اكتب رقم هاتف الطالب بشكل صحيح.");
      setRegisterMessageType("error");
      return;
    }

    if (!phoneRegex.test(parentPhone.trim())) {
      setRegisterMessage("من فضلك اكتب رقم هاتف ولي الأمر بشكل صحيح.");
      setRegisterMessageType("error");
      return;
    }

    if (password.length < 6) {
      setRegisterMessage("كلمة السر يجب ألا تقل عن 6 أحرف أو أرقام.");
      setRegisterMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterMessage("كلمة السر وتأكيد كلمة السر غير متطابقين.");
      setRegisterMessageType("error");
      return;
    }

    setRegisterMessage("جاري إنشاء الحساب...");
    setRegisterMessageType("pending");

    try {
      const cleanStudentPhone = studentPhone.trim();
      const cleanParentPhone = parentPhone.trim();
      const firebaseEmail = `${cleanStudentPhone}@dars-khososy.com`;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        firebaseEmail,
        password
      );

      const firebaseUser = userCredential.user;

      const studentStatus =
        studentType === "center" ? "active" : "pending";

      const newStudent = {
        uid: firebaseUser.uid,
        fullName: fullName.trim(),
        studentPhone: cleanStudentPhone,
        parentPhone: cleanParentPhone,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        doc(db, "students", firebaseUser.uid),
        newStudent
      );

      await signOut(auth);
      setRegisterData(initialRegisterData);

      if (studentType === "center") {
        setRegisterMessage(
          "تم إنشاء حساب طالب السنتر وتفعيله بنجاح. يمكنك الآن تسجيل الدخول."
        );
        setRegisterMessageType("success");
      } else {
        setRegisterMessage(
          "تم إرسال طلب إنشاء الحساب. حساب طالب الأونلاين قيد مراجعة المدرس."
        );
        setRegisterMessageType("pending");
      }
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        setRegisterMessage("يوجد حساب مسجل بالفعل برقم الهاتف ده.");
      } else if (error.code === "auth/weak-password") {
        setRegisterMessage("كلمة السر ضعيفة.");
      } else if (error.code === "auth/network-request-failed") {
        setRegisterMessage("تحقق من اتصال الإنترنت.");
      } else {
        setRegisterMessage("حدث خطأ أثناء إنشاء الحساب.");
      }

      setRegisterMessageType("error");

      try {
        await signOut(auth);
      } catch {
        // تجاهل خطأ تسجيل الخروج
      }
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const { phone, password } = loginData;

    if (!phone || !password) {
      setLoginMessage("من فضلك اكتب رقم الهاتف وكلمة السر.");
      setLoginMessageType("error");
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      setLoginMessage("من فضلك اكتب رقم هاتف صحيح.");
      setLoginMessageType("error");
      return;
    }

    try {
      const email = `${phone}@dars-khososy.com`;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const docRef = doc(db, "students", userCredential.user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setLoginMessage("بيانات الطالب غير موجودة.");
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

      setCurrentStudent(student);

      localStorage.setItem(
        "omarCurrentStudent",
        JSON.stringify(student)
      );

      setStudentProfileSection("profile");
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
        setLoginMessage("رقم الهاتف أو كلمة السر غير صحيحة.");
      } else {
        setLoginMessage("حدث خطأ أثناء تسجيل الدخول.");
      }

      setLoginMessageType("error");
    }
  }

  async function handleStudentLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("omarCurrentStudent");

    setCurrentStudent(null);
    setStudentProfileSection("profile");
    setLoginData(initialLoginData);
    setLoginMessage("");
    setLoginMessageType("");
    setPage("website");
    window.scrollTo(0, 0);
  }

  if (window.location.hash === "#upload-exams") {
    return <UploadExams />;
  }

  if (page === "studentProfile") {
    if (!currentStudent) {
      return (
        <div className="student-profile-page">
          <div className="student-session-message">
            <h2>برجاء تسجيل الدخول أولًا</h2>

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

    const studentTypeText =
      currentStudent.studentType === "center"
        ? "طالب سنتر"
        : "طالب أونلاين";

    const educationTypeText = "ثانوي عام";
    const watchedVideos = currentStudent.watchedVideos || 0;
    const completedExams = currentStudent.completedExams || 0;
    const obtainedGrades = currentStudent.obtainedGrades || 0;
    const totalGrades = currentStudent.totalGrades || 0;

    const subscribedCourses = Array.isArray(
      currentStudent.subscribedCourses
    )
      ? currentStudent.subscribedCourses
      : [];

    const gradesPercentage =
      totalGrades > 0
        ? Math.round((obtainedGrades / totalGrades) * 100)
        : 0;

    const whatsappMessage = encodeURIComponent(
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
                onClick={() => setDarkMode(!darkMode)}
                aria-label="تغيير وضع الألوان"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              <button
                type="button"
                className="student-logout-btn"
                onClick={handleStudentLogout}
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
                studentProfileSection === "profile" ? "active" : ""
              }`}
              onClick={() => openStudentSection("profile")}
            >
              <FaUserGraduate />
              ملف الطالب
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "courses" ? "active" : ""
              }`}
              onClick={() => openStudentSection("courses")}
            >
              <FaGraduationCap />
              كورساتي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "allCourses" ? "active" : ""
              }`}
              onClick={() => openStudentSection("allCourses")}
            >
              <FaBookOpen />
              جميع الكورسات
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "lessons" ? "active" : ""
              }`}
              onClick={() => openStudentSection("lessons")}
            >
              <FaVideo />
              دروسي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "watchDetails" ? "active" : ""
              }`}
              onClick={() => openStudentSection("watchDetails")}
            >
              <FaEye />
              تفاصيل المشاهدات
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "invoices" ? "active" : ""
              }`}
              onClick={() => openStudentSection("invoices")}
            >
              <FaCreditCard />
              الفواتير
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "results" ? "active" : ""
              }`}
              onClick={() => openStudentSection("results")}
            >
              <FaFileAlt />
              نتائجك
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "levelIndicator" ? "active" : ""
              }`}
              onClick={() => openStudentSection("levelIndicator")}
            >
              <FaChartLine />
              مؤشر المستوى
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "myPoints" ? "active" : ""
              }`}
              onClick={() => openStudentSection("myPoints")}
            >
              <FaBullseye />
              نقاطي
            </button>

            <button
              type="button"
              className={`student-nav-btn ${
                studentProfileSection === "topTen" ? "active" : ""
              }`}
              onClick={() => openStudentSection("topTen")}
            >
              <FaTrophy />
              أعلى 10
            </button>
          </nav>
        </header>

        <main className="student-profile-main">
          {studentProfileSection === "profile" && (
            <>
              <section className="student-profile-title">
                <h1>ملف الطالب</h1>
              </section>

              <div className="student-profile-layout">
                <section className="student-information-section">
                  <div className="student-section-heading">
                    <h2>بيانات المستخدم</h2>
                  </div>

                  <div className="student-information-card">
                    <div className="student-avatar">
                      <FaUserGraduate />
                    </div>

                    <div className="student-main-data">
                      <h2>{currentStudent.fullName}</h2>

                      <div className="student-data-list">
                        <p>
                          <FaPhoneAlt />
                          <span>{currentStudent.studentPhone}</span>
                        </p>

                        <p>
                          <FaMapMarkerAlt />
                          <span>{currentStudent.governorate}</span>
                        </p>

                        <p>
                          <FaBookOpen />
                          <span>{educationTypeText}</span>
                        </p>

                        <p>
                          <FaUserGraduate />
                          <span>{currentStudent.grade}</span>
                        </p>

                        <p>
                          <FaCheckCircle />
                          <span>{studentTypeText}</span>
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
                    <h2>إحصائياتك</h2>
                  </div>

                  <div className="student-statistics-grid">
                    <article className="student-stat-card">
                      <div className="student-stat-icon">
                        <FaVideo />
                      </div>

                      <h3>عدد مرات مشاهدة الفيديوهات</h3>
                      <strong>{watchedVideos}</strong>
                      <span>{watchedVideos === 1 ? "فيديو" : "فيديوهات"}</span>
                    </article>

                    <article className="student-stat-card">
                      <div className="student-stat-icon">
                        <FaClipboardCheck />
                      </div>

                      <h3>عدد الاختبارات التي خلصتها</h3>
                      <strong>{completedExams}</strong>
                      <span>{completedExams === 1 ? "اختبار" : "اختبارات"}</span>
                    </article>

                    <article className="student-grades-card">
                      <div className="student-grades-content">
                        <div className="student-stat-icon grades-icon">
                          <FaAward />
                        </div>

                        <div className="student-grades-text">
                          <h3>الدرجات التي حصلت عليها</h3>

                          <div className="student-grades-numbers">
                            <strong>{obtainedGrades}</strong>
                            <span>من {totalGrades}</span>
                          </div>
                        </div>

                        <div className="student-grades-percentage">
                          <strong>{gradesPercentage}%</strong>
                        </div>
                      </div>

                      <div className="student-grades-progress">
                        <div
                          className="student-grades-progress-fill"
                          style={{
                            width: `${Math.min(gradesPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </>
          )}

          {studentProfileSection === "courses" && (
            <section className="student-courses-page">
              <section className="student-profile-title">
                <h1>كورساتي</h1>
              </section>

              {subscribedCourses.length === 0 ? (
                <div className="student-empty-courses">
                  <div className="student-empty-courses-icon">
                    <FaBookReader />
                  </div>

                  <h2>مافيش كورسات هنا لسه!</h2>

                  <p>
                    أول ما يتم إضافة أي كورس إلى حسابك هتلاقيه ظاهر هنا وتقدر تبدأ
                    المذاكرة فورًا.
                  </p>
                </div>
              ) : (
                <div className="student-courses-grid">
                  {subscribedCourses.map((course, index) => {
                    const courseId =
                      course.id ||
                      course.courseId ||
                      `${course.title}-${index}`;

                    const courseProgress = Math.min(
                      Math.max(Number(course.progress) || 0, 0),
                      100
                    );

                    const savedImage =
                      typeof course.image === "string"
                        ? course.image.trim()
                        : "";

                    const courseImage =
                      savedImage && savedImage !== "default"
                        ? savedImage
                        : secondFreeCourse;

                    return (
                      <article
                        className="student-course-card"
                        key={courseId}
                      >
                        <div className="student-course-image-wrapper">
                          <img
                            src={courseImage}
                            alt={course.title || "صورة الكورس"}
                            className="student-course-image"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = secondFreeCourse;
                            }}
                          />

                          <span className="student-course-status">
                            مشترك
                          </span>
                        </div>

                        <div className="student-course-content">
                          <span className="student-course-grade">
                            {course.grade || currentStudent.grade}
                          </span>

                          <h2>{course.title || "كورس اللغة العربية"}</h2>

                          <p>
                            {course.description ||
                              "شرح منظم، تدريبات واختبارات تساعدك على فهم المنهج وتحقيق أفضل نتيجة."}
                          </p>

                          <div className="student-course-progress-info">
                            <span>نسبة إكمال الكورس</span>
                            <strong>{courseProgress}%</strong>
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
                            onClick={() => openStudentSection("allCourses")}
                          >
                            <FaPlay />
                            دخول الكورس
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {studentProfileSection === "allCourses" && (
            <AllCourses currentStudent={currentStudent} />
          )}

          {studentProfileSection === "lessons" && (
            <MyLessons currentStudent={currentStudent} />
          )}

          {studentProfileSection === "watchDetails" && (
            <WatchDetails currentStudent={currentStudent} />
          )}

          {studentProfileSection === "invoices" && (
            <Invoices currentStudent={currentStudent} />
          )}

          {studentProfileSection === "results" && (
            <Results currentStudent={currentStudent} />
          )}

          {studentProfileSection === "levelIndicator" && (
            <LevelIndicator currentStudent={currentStudent} />
          )}

          {studentProfileSection === "myPoints" && (
            <MyPoints currentStudent={currentStudent} />
          )}

          {studentProfileSection === "topTen" && (
            <TopTen currentStudent={currentStudent} />
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

  if (page === "login") {
    return (
      <div
        className={
          darkMode
            ? "login-page dark-login-page"
            : "login-page light-login-page"
        }
      >
        <header className="site-header login-header">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="dark-btn"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="site-logo">درس خصوصي</div>

          <button
            type="button"
            onClick={openRegisterPage}
            className="signup-btn"
          >
            أنشئ حسابك
          </button>

          <button
            type="button"
            onClick={() => {
              setPage("website");
              setLoginMessage("");
              window.scrollTo(0, 0);
            }}
            className="back-btn"
          >
            رجوع
          </button>
        </header>

        <main className="login-main">
          <div className="login-card">
            <div className="login-heading">
              <h1>تسجيل الدخول</h1>

              <p>
                اكتب رقم هاتفك وكلمة السر للدخول إلى حسابك.
              </p>
            </div>

            <form
              className="login-form"
              onSubmit={handleLoginSubmit}
            >
              <div className="login-input-wrapper">
                <input
                  type="tel"
                  name="phone"
                  value={loginData.phone}
                  onChange={handleLoginChange}
                  placeholder="رقم الهاتف"
                  inputMode="numeric"
                  maxLength="11"
                  autoComplete="tel"
                />
              </div>

              <div className="login-input-wrapper password-input-wrapper">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="كلمة السر"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={
                    showLoginPassword
                      ? "إخفاء كلمة السر"
                      : "إظهار كلمة السر"
                  }
                >
                  {showLoginPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>

              <button
                type="button"
                className="forgot-password-btn"
                onClick={() => {
                  setShowForgotPassword(true);
                  setLoginMessage("");
                  setLoginMessageType("");
                }}
              >
                هل نسيت كلمة المرور؟
              </button>

              {loginMessage && (
                <div
                  className={`login-result-message ${loginMessageType}`}
                >
                  {loginMessageType === "success" && (
                    <span className="login-result-icon">✅</span>
                  )}

                  {loginMessageType === "pending" && (
                    <span className="login-result-icon">ℹ️</span>
                  )}

                  {loginMessageType === "error" && (
                    <span className="login-result-icon">⚠️</span>
                  )}

                  <p>{loginMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="main-login-btn"
              >
                تسجيل الدخول
              </button>

              <p className="login-create-text">
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  className="login-create-btn"
                  onClick={openRegisterPage}
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </form>
          </div>
        </main>

        {showForgotPassword && (
          <div className="instructions-overlay">
            <div className="instructions-modal">
              <div className="information-icon">🔑</div>

              <h2>استرجاع كلمة المرور</h2>

              <p
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: "#666",
                }}
              >
                اكتب بياناتك وسيتم مراجعة الطلب بواسطة المدرس.
              </p>

              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();

                  const form = event.currentTarget;
                  const fullName = form.elements.fullName.value.trim();
                  const studentPhone = form.elements.studentPhone.value.trim();
                  const parentPhone = form.elements.parentPhone.value.trim();

                  const messageBox = form.querySelector(
                    ".forgot-password-validation-message"
                  );

                  if (!fullName || !studentPhone || !parentPhone) {
                    messageBox.textContent =
                      "⚠️ من فضلك اكتب جميع البيانات المطلوبة.";

                    messageBox.className =
                      "forgot-password-validation-message error";

                    return;
                  }

                  if (fullName.length < 6) {
                    messageBox.textContent =
                      "⚠️ من فضلك اكتب الاسم بالكامل بشكل صحيح.";

                    messageBox.className =
                      "forgot-password-validation-message error";

                    return;
                  }

                  const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;

                  if (!egyptianPhoneRegex.test(studentPhone)) {
                    messageBox.textContent =
                      "⚠️ رقم هاتف الطالب غير صحيح، لازم يكون 11 رقم.";

                    messageBox.className =
                      "forgot-password-validation-message error";

                    return;
                  }

                  if (!egyptianPhoneRegex.test(parentPhone)) {
                    messageBox.textContent =
                      "⚠️ رقم هاتف ولي الأمر غير صحيح، لازم يكون 11 رقم.";

                    messageBox.className =
                      "forgot-password-validation-message error";

                    return;
                  }

                  messageBox.textContent =
                    "✅ تم إرسال الطلب بنجاح، وسيتم مراجعة البيانات والتواصل معك.";

                  messageBox.className =
                    "forgot-password-validation-message success";

                  form.reset();
                }}
              >
                <div className="form-grid">
                  <div className="form-field full-width-field">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="الاسم بالكامل"
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-field">
                    <input
                      type="tel"
                      name="studentPhone"
                      placeholder="رقم هاتف الطالب"
                      inputMode="numeric"
                      maxLength="11"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="form-field">
                    <input
                      type="tel"
                      name="parentPhone"
                      placeholder="رقم هاتف ولي الأمر"
                      inputMode="numeric"
                      maxLength="11"
                    />
                  </div>
                </div>

                <p className="forgot-password-validation-message" />

                <button
                  type="submit"
                  className="create-account-btn"
                >
                  إرسال الطلب
                </button>
              </form>

              <button
                type="button"
                className="text-login-btn"
                onClick={() => setShowForgotPassword(false)}
              >
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (page === "register") {
    return (
      <div
        className={
          darkMode
            ? "register-page dark-register-page"
            : "register-page light-register-page"
        }
      >
        <header className="site-header register-header">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="dark-btn"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="site-logo">درس خصوصي</div>

          <button
            type="button"
            onClick={openLoginPage}
            className="login-btn"
          >
            تسجيل الدخول
          </button>

          <button
            type="button"
            onClick={() => {
              setPage("website");
              setRegisterMessage("");
              window.scrollTo(0, 0);
            }}
            className="back-btn"
          >
            رجوع
          </button>
        </header>

        <main className="register-main">
          <div className="register-card">
            <div className="register-card-heading">
              <span className="register-small-title">
                منصة أ / عمر الشاعر
              </span>

              <h1>إنشاء حساب جديد</h1>

              <p>
                اكتب بياناتك بشكل صحيح وحدد هل أنت طالب سنتر أم طالب أونلاين.
              </p>
            </div>

            <form
              className="register-form"
              onSubmit={handleRegisterSubmit}
              noValidate
            >
              <div className="form-grid">
                <div className="form-field full-width-field">
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    placeholder="الاسم بالكامل رباعي باللغة العربية"
                    autoComplete="name"
                  />
                </div>

                <div className="form-field">
                  <input
                    id="studentPhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength="11"
                    name="studentPhone"
                    value={registerData.studentPhone}
                    onChange={handleRegisterChange}
                    placeholder="رقم هاتف الطالب"
                    autoComplete="tel"
                  />
                </div>

                <div className="form-field">
                  <input
                    id="parentPhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength="11"
                    name="parentPhone"
                    value={registerData.parentPhone}
                    onChange={handleRegisterChange}
                    placeholder="رقم هاتف ولي الأمر"
                  />
                </div>

                <div className="form-field">
                  <select
                    id="governorate"
                    name="governorate"
                    value={registerData.governorate}
                    onChange={handleRegisterChange}
                  >
                    <option value="">اختر محافظتك</option>
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="المنوفية">المنوفية</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="كفر الشيخ">كفر الشيخ</option>
                    <option value="الفيوم">الفيوم</option>
                    <option value="بني سويف">بني سويف</option>
                    <option value="المنيا">المنيا</option>
                    <option value="أسيوط">أسيوط</option>
                    <option value="سوهاج">سوهاج</option>
                    <option value="قنا">قنا</option>
                    <option value="الأقصر">الأقصر</option>
                    <option value="أسوان">أسوان</option>
                    <option value="أخرى">محافظة أخرى</option>
                  </select>
                </div>

                <div className="form-field">
                  <select
                    id="grade"
                    name="grade"
                    value={registerData.grade}
                    onChange={handleRegisterChange}
                  >
                    <option value="">اختر السنة الدراسية</option>
                    <option value="الأول الثانوي">الأول الثانوي</option>
                    <option value="الثاني الثانوي">الثاني الثانوي</option>
                    <option value="الثالث الثانوي">الثالث الثانوي</option>
                  </select>
                </div>

                <div className="form-field">
                  <select
                    id="educationType"
                    name="educationType"
                    value={registerData.educationType}
                    onChange={handleRegisterChange}
                  >
                    <option value="">اختر نوع التعليم</option>
                    <option value="عام">ثانوي عام</option>
                  </select>
                </div>

                <div className="form-field">
                  <select
                    id="studentType"
                    name="studentType"
                    value={registerData.studentType}
                    onChange={handleRegisterChange}
                  >
                    <option value="">اختر نوع الطالب</option>
                    <option value="center">طالب سنتر</option>
                    <option value="online">طالب أونلاين</option>
                  </select>
                </div>

                <div className="form-field">
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder="كلمة السر"
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-field">
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="تأكيد كلمة السر"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {registerMessage && (
                <div
                  className={`register-result-message ${registerMessageType}`}
                >
                  {registerMessageType === "success" && (
                    <span className="result-icon">✅</span>
                  )}

                  {registerMessageType === "pending" && (
                    <span className="result-icon">⏳</span>
                  )}

                  {registerMessageType === "error" && (
                    <span className="result-icon">⚠️</span>
                  )}

                  <p>{registerMessage}</p>
                </div>
              )}

              <button
                type="submit"
                className="create-account-btn"
              >
                إنشاء الحساب
              </button>

              <p className="already-account">
                لديك حساب بالفعل؟{" "}
                <button
                  type="button"
                  className="text-login-btn"
                  onClick={openLoginPage}
                >
                  تسجيل الدخول
                </button>
              </p>
            </form>
          </div>
        </main>

        {showInstructions && (
          <div className="instructions-overlay">
            <div className="instructions-modal">
              <div className="information-icon">i</div>

              <h2>تعليمات هامة</h2>

              <div className="instructions-list">
                <p>
                  <span>1</span>
                  يجب كتابة بيانات صحيحة خاصة رقم الطالب ورقم ولي الأمر.
                </p>

                <p>
                  <span>2</span>
                  اكتب الاسم بالكامل باللغة العربية.
                </p>

                <p>
                  <span>3</span>
                  اختر نوع الطالب بشكل صحيح: طالب سنتر أو طالب أونلاين.
                </p>

                <p>
                  <span>4</span>
                  يجب الالتزام بمشاهدة الفيديوهات وحل الواجب والامتحانات.
                </p>

                <p>
                  <span>5</span>
                  أي طالب غير ملتزم مش هيكمل معانا.
                </p>

                <p>
                  <span>6</span>
                  احتفظ بكلمة السر ولا تشاركها مع أي شخص.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="instructions-confirm-btn"
              >
                حسنًا
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (page === "website") {
    return (
      <div
        className={
          darkMode
            ? "website-page dark-website"
            : "website-page"
        }
      >
        <header className="site-header">
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="dark-btn"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <div className="site-logo">درس خصوصي</div>

          <div className="auth-buttons">
            <button
              type="button"
              onClick={openLoginPage}
              className="login-btn"
            >
              تسجيل الدخول
            </button>

            <button
              type="button"
              onClick={openRegisterPage}
              className="signup-btn"
            >
              إنشاء حساب
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPage("links")}
            className="back-btn"
          >
            رجوع
          </button>
        </header>

        <section className="hero-section">
          <div className="hero-bg image-hero">
            <img
              src={heroBanner}
              alt="أ / عمر الشاعر"
              className="hero-banner-img"
            />

            <button
              type="button"
              onClick={openRegisterPage}
              className="register-hotspot"
              aria-label="سجل معنا"
            >
              سجل معنا
            </button>
          </div>
        </section>

        <section className="intro-section reveal-right">
          <h2>رحلتك نحو التفوق تبدأ من هنا</h2>

          <p>
            منصة تعليمية متكاملة تقدم شرحًا مبسطًا، واختبارات دورية، ومحتوى
            احترافي يساعدك على إتقان اللغة العربية.
          </p>
        </section>

        <section className="features-section">
          <h2 className="reveal-up delay-1">ليه تشترك معانا؟</h2>

          <div className="features-cards">
            <div className="feature-card reveal-up delay-2">
              <p>وفر وقتك وروّق مزاجك</p>
            </div>

            <div className="feature-card reveal-up delay-3">
              <p>اتفرج كتير زي ما تحب</p>
            </div>

            <div className="feature-card reveal-up delay-4">
              <p>اختبارات ومتابعة مستمرة</p>
            </div>

            <div className="feature-card reveal-up delay-5">
              <p>شرح مبسط ومنظم</p>
            </div>
          </div>
        </section>

        <section className="subscription-section">
          <div className="subscription-card reveal-up delay-1">
            <h2>مميزات الاشتراك</h2>

            <div className="subscription-list">
              <div className="subscription-item reveal-up delay-2">
                <h3>تنظيم الدروس والوحدات</h3>

                <p>
                  محتوى مرتب ومقسم بطريقة سهلة تساعدك تذاكر بدون تشتت.
                </p>
              </div>

              <div className="subscription-item reveal-up delay-3">
                <h3>شرح مبسط وواضح</h3>

                <p>
                  فيديوهات وشرح سلس يخليك تفهم القواعد والتطبيقات بسهولة.
                </p>
              </div>

              <div className="subscription-item reveal-up delay-4">
                <h3>اختبارات دورية</h3>

                <p>
                  تقييم مستمر بعد كل جزء علشان تعرف مستواك وتتطور بسرعة.
                </p>
              </div>

              <div className="subscription-item reveal-up delay-5">
                <h3>مراجعات ومحتوى احترافي</h3>

                <p>
                  مراجعات منظمة ومحتوى يساعدك تدخل الامتحان بثقة.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openRegisterPage}
              className="subscription-btn"
            >
              اشترك الآن
            </button>
          </div>
        </section>

        <section className="stages-section">
          <div className="stages-heading reveal-up delay-1">
            <h2>اختر مرحلتك الدراسية</h2>

            <p>
              اختر الصف المناسب وابدأ رحلتك مع الشرح والاختبارات والمراجعات.
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
                  دروس منظمة، تدريبات، اختبارات ومراجعات تساعدك على التفوق.
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
                  شرح مبسط، تدريبات متنوعة واختبارات تساعدك تتابع مستواك.
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
                  مراجعات شاملة، اختبارات ونماذج امتحانات تساعدك تحقق هدفك.
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
      </div>
    );
  }

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
            الموقع الإلكتروني
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