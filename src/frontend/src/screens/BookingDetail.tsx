import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import type { Booking } from "../backend.d";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  booking: Booking;
  onBack: () => void;
  onInvoice: (booking: Booking) => void;
  onUpdated: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
}

export default function BookingDetail({
  booking,
  onBack,
  onInvoice,
  onComplete,
}: Props) {
  const { language } = useAppStore();
  const t = translations[language];
  const [b] = useState<Booking>(booking);

  const statusColor = (s: string) => {
    if (s === "completed")
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    if (s === "ongoing")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
  };

  const statusLabel = (s: string) => {
    if (s === "completed") return t.completed;
    if (s === "ongoing") return t.ongoing;
    return t.pending;
  };

  // Compute transaction entries
  const bookingDate = new Date(Number(b.date)).toLocaleDateString();
  type TxEntry = {
    key: string;
    type: "advance" | "balance_received" | "balance_due";
    label: string;
    amount: number;
    mode: string;
    date: string;
  };
  const transactions: TxEntry[] = [];
  if (b.advancePaid > 0) {
    transactions.push({
      key: "advance",
      type: "advance",
      label: t.advanceEntry,
      amount: b.advancePaid,
      mode: b.paymentMode,
      date: bookingDate,
    });
  }
  if (b.balanceDue <= 0 && b.finalAmount > 0 && b.advancePaid < b.finalAmount) {
    transactions.push({
      key: "balance_received",
      type: "balance_received",
      label: t.paymentReceived,
      amount: b.finalAmount - b.advancePaid,
      mode: b.paymentMode,
      date: bookingDate,
    });
  } else if (b.balanceDue > 0) {
    transactions.push({
      key: "balance_due",
      type: "balance_due",
      label: t.balanceDue,
      amount: b.balanceDue,
      mode: b.paymentMode,
      date: bookingDate,
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t.details}</h1>
        <button
          type="button"
          onClick={() => onInvoice(b)}
          className="ml-auto flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-xl text-sm"
          data-ocid="booking_detail.invoice.button"
        >
          <FileText size={16} />
          {t.invoice}
        </button>
      </div>

      {/* Customer Info */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-2">
        <div className="flex justify-between">
          <span className="font-bold text-foreground text-lg">
            {b.customerName}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}
          >
            {statusLabel(b.status)}
          </span>
        </div>
        {b.mobile && (
          <p className="text-muted-foreground text-sm">📞 {b.mobile}</p>
        )}
        <p className="text-muted-foreground text-sm">👨‍🌾 {b.workType}</p>
        <p className="text-muted-foreground text-sm">
          📅{" "}
          {new Date(Number(b.date)).toLocaleString(
            language === "gu" ? "gu-IN" : "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}
        </p>
      </div>

      {/* Work Details (if amount exists) */}
      {b.totalAmount > 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-2">
          <h3 className="font-bold text-foreground">{t.workType}</h3>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>{t.totalAmount}</span>
            <span>₹{b.totalAmount.toLocaleString()}</span>
          </div>
          {b.discount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>{t.discount}</span>
              <span>- ₹{(b.totalAmount - b.finalAmount).toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-green-700 dark:text-green-400">
            <span>{t.finalAmount}</span>
            <span>₹{b.finalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.advancePaid}</span>
            <span>₹{b.advancePaid.toLocaleString()}</span>
          </div>
          <div
            className={`flex justify-between text-sm font-semibold ${b.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
          >
            <span>{t.balanceDue}</span>
            <span>₹{b.balanceDue.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div
          className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-3"
          data-ocid="booking_detail.transactions.panel"
        >
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-green-600" />
            <h3 className="font-bold text-foreground">
              {t.transactionHistory}
            </h3>
          </div>
          <div className="space-y-2">
            {transactions.map((tx, idx) => (
              <div
                key={tx.key}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  tx.type === "balance_due"
                    ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                }`}
                data-ocid={`booking_detail.transactions.item.${idx + 1}`}
              >
                <div
                  className={`flex-shrink-0 ${tx.type === "balance_due" ? "text-orange-500" : "text-green-600"}`}
                >
                  {tx.type === "balance_due" ? (
                    <Clock size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${tx.type === "balance_due" ? "text-orange-700 dark:text-orange-300" : "text-green-700 dark:text-green-300"}`}
                  >
                    {tx.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.mode.toUpperCase()} • {tx.date}
                  </p>
                </div>
                <p
                  className={`font-bold text-sm ${tx.type === "balance_due" ? "text-orange-600 dark:text-orange-400" : "text-green-700 dark:text-green-400"}`}
                >
                  ₹{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Karo Button */}
      {b.status !== "completed" && (
        <button
          type="button"
          onClick={() => onComplete(b)}
          data-ocid="booking_detail.complete.button"
          className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-base shadow-md active:scale-95 transition-transform"
        >
          <CheckCircle2 size={22} />
          {language === "gu"
            ? "Complete કરો (Transaction બનાવો)"
            : "Complete Karo (Transaction Banao)"}
        </button>
      )}

      {b.status === "completed" && (
        <div className="flex items-center justify-center gap-2 py-4 text-green-600">
          <CheckCircle2 size={22} />
          <span className="font-semibold">
            {language === "gu"
              ? "આ બુકિંગ Complete થઈ ગઈ"
              : "This booking is completed"}
          </span>
        </div>
      )}
    </div>
  );
}
