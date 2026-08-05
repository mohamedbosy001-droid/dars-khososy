import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";

import {
  FaCreditCard,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
} from "react-icons/fa";

import "./Invoices.css";

function Invoices({ currentStudent }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [invoicesError, setInvoicesError] =
    useState("");

  useEffect(() => {
    const studentUid =
      currentStudent?.uid ||
      auth.currentUser?.uid;

    if (!studentUid) {
      setInvoices([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    setInvoicesError("");

    const invoicesQuery = query(
      collection(db, "invoices"),
      where("studentId", "==", studentUid)
    );

    const unsubscribe = onSnapshot(
      invoicesQuery,
      (snapshot) => {
        const invoicesData =
          snapshot.docs.map((invoiceDocument) => ({
            id: invoiceDocument.id,
            ...invoiceDocument.data(),
          }));

        invoicesData.sort((first, second) => {
          const firstDate =
            first.createdAt?.seconds || 0;

          const secondDate =
            second.createdAt?.seconds || 0;

          return secondDate - firstDate;
        });

        setInvoices(invoicesData);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Error loading invoices:",
          error
        );

        setInvoicesError(
          "تعذر تحميل الفواتير حاليًا."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentStudent]);

  function getStatusDetails(status) {
    if (status === "paid") {
      return {
        text: "تم الدفع",
        className: "paid",
        icon: <FaCheckCircle />,
      };
    }

    if (
      status === "rejected" ||
      status === "cancelled"
    ) {
      return {
        text: "ملغية",
        className: "cancelled",
        icon: <FaTimesCircle />,
      };
    }

    return {
      text: "قيد المراجعة",
      className: "pending",
      icon: <FaClock />,
    };
  }

  function formatInvoiceDate(createdAt) {
    if (!createdAt) {
      return "غير محدد";
    }

    try {
      const date =
        typeof createdAt.toDate === "function"
          ? createdAt.toDate()
          : new Date(createdAt);

      return new Intl.DateTimeFormat(
        "ar-EG",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ).format(date);
    } catch {
      return "غير محدد";
    }
  }

  function formatPrice(amount) {
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount)) {
      return "غير محدد";
    }

    if (numericAmount === 0) {
      return "مجاني";
    }

    return `${numericAmount} جنيه`;
  }

  return (
    <section className="invoices-page">
      <div className="invoices-title">
        <FaCreditCard />
        <h1>الفواتير</h1>
      </div>

      {isLoading ? (
        <div className="empty-invoices">
          <FaClock className="invoice-icon" />

          <h2>جاري تحميل الفواتير...</h2>

          <p>
            انتظر لحظات حتى يتم تحميل بيانات
            الاشتراكات والمدفوعات.
          </p>
        </div>
      ) : invoicesError ? (
        <div className="empty-invoices">
          <FaTimesCircle className="invoice-icon" />

          <h2>حدث خطأ</h2>

          <p>{invoicesError}</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-invoices">
          <FaCreditCard className="invoice-icon" />

          <h2>لا توجد فواتير</h2>

          <p>
            ستظهر جميع فواتير الاشتراكات
            والمدفوعات هنا.
          </p>
        </div>
      ) : (
        <div className="invoices-list">
          {invoices.map((invoice) => {
            const statusDetails =
              getStatusDetails(invoice.status);

            return (
              <article
                className="invoice-card"
                key={invoice.id}
              >
                <div className="invoice-card-header">
                  <div className="invoice-card-icon">
                    <FaCreditCard />
                  </div>

                  <div className="invoice-card-heading">
                    <span>
                      فاتورة رقم{" "}
                      {invoice.invoiceNumber ||
                        invoice.id.slice(0, 8)}
                    </span>

                    <h2>
                      {invoice.itemTitle ||
                        invoice.courseTitle ||
                        invoice.lessonTitle ||
                        "اشتراك في المنصة"}
                    </h2>

                    <p>
                      {formatInvoiceDate(
                        invoice.createdAt
                      )}
                    </p>
                  </div>

                  <div
                    className={`invoice-status ${statusDetails.className}`}
                  >
                    {statusDetails.icon}
                    {statusDetails.text}
                  </div>
                </div>

                <div className="invoice-details">
                  <div className="invoice-detail-item">
                    <span>نوع الاشتراك</span>

                    <strong>
                      {invoice.type === "lesson"
                        ? "محاضرة منفردة"
                        : "كورس كامل"}
                    </strong>
                  </div>

                  <div className="invoice-detail-item">
                    <span>طريقة الدفع</span>

                    <strong>
                      {invoice.paymentMethod ||
                        "غير محددة"}
                    </strong>
                  </div>

                  <div className="invoice-detail-item">
                    <span>المبلغ</span>

                    <strong>
                      {formatPrice(invoice.amount)}
                    </strong>
                  </div>
                </div>

                {invoice.notes && (
                  <div className="invoice-notes">
                    <strong>ملاحظات:</strong>
                    <p>{invoice.notes}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Invoices;