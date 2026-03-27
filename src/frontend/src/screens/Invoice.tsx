import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Booking } from "../backend.d";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  booking: Booking;
  onBack: () => void;
}

export default function Invoice({ booking: b, onBack }: Props) {
  const { language } = useAppStore();
  const t = translations[language];
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const businessName =
    localStorage.getItem("businessName") || "KisanTractor Pro";
  const businessLogo = localStorage.getItem("businessLogo") || null;

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        .print-hidden { display: none !important; }
        body { background: white; margin: 0; }
        #invoice {
          box-shadow: none !important;
          border-radius: 0 !important;
          padding: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  const discountAmount = b.totalAmount - b.finalAmount;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 print-hidden">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100"
          data-ocid="invoice.back_button"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t.invoice}</h1>
        <button
          type="button"
          onClick={() => window.print()}
          data-ocid="invoice.pdf.button"
          className="ml-auto flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm"
        >
          <Download size={16} />
          PDF Download
        </button>
      </div>

      {/* Invoice Content */}
      <div id="invoice" className="bg-white rounded-xl shadow p-6 space-y-4">
        {/* Header */}
        <div className="text-center border-b pb-4 space-y-1">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt="logo"
              className="mx-auto mb-2"
              style={{ maxHeight: 64, objectFit: "contain" }}
            />
          ) : (
            <p className="text-2xl">🚜</p>
          )}
          <h2 className="text-xl font-bold text-green-700">{businessName}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {t.invoiceNo}: #{String(b.id).padStart(4, "0")}
          </p>
          <p className="text-xs text-gray-400">
            {t.date}: {new Date(Number(b.date)).toLocaleDateString()}
          </p>
        </div>

        {/* Customer */}
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-700">{t.customerName}:</p>
          <p className="text-base font-bold">{b.customerName}</p>
          <p className="text-sm text-gray-500">{b.mobile}</p>
        </div>

        {/* Work Table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border border-gray-200">
                {t.workType}
              </th>
              <th className="text-right p-2 border border-gray-200">
                {t.subtotal}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border border-gray-200 capitalize">
                {b.workType}
              </td>
              <td className="p-2 border border-gray-200 text-right">
                ₹{b.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.totalAmount}</span>
            <span>₹{b.totalAmount.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>{t.discount}</span>
              <span>- ₹{discountAmount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-green-700 border-t pt-2">
            <span>{t.finalAmount}</span>
            <span>₹{b.finalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.paymentMode}</span>
            <span className="uppercase">{b.paymentMode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t.advancePaid}</span>
            <span>₹{b.advancePaid.toLocaleString()}</span>
          </div>
          <div
            className={`flex justify-between font-bold ${
              b.balanceDue > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            <span>{t.balanceDue}</span>
            <span>₹{b.balanceDue.toLocaleString()}</span>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 border-t pt-3">
          {businessName} • {new Date().getFullYear()}
        </div>
      </div>

      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/${b.mobile}?text=${encodeURIComponent(
          `${t.invoice} #${String(b.id).padStart(4, "0")}\n${b.customerName}\n${t.finalAmount}: \u20b9${b.finalAmount}\n${t.balanceDue}: \u20b9${b.balanceDue}`,
        )}`}
        target="_blank"
        rel="noreferrer"
        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl print-hidden"
      >
        💬 {t.share} WhatsApp
      </a>
    </div>
  );
}
