import { ArrowLeft, CheckCircle, Clock, FileText, Receipt } from "lucide-react";
import { useState } from "react";
import type { Booking } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  booking: Booking;
  onBack: () => void;
  onInvoice: (booking: Booking) => void;
  onUpdated: (booking: Booking) => void;
}

export default function BookingDetail({
  booking,
  onBack,
  onInvoice,
  onUpdated,
}: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [b, setB] = useState<Booking>(booking);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [saving, setSaving] = useState(false);

  const discountAmount =
    discountType === "percent" ? (b.totalAmount * discount) / 100 : discount;
  const finalAmount = Math.max(0, b.totalAmount - discountAmount);
  const balanceDue = Math.max(0, finalAmount - b.advancePaid);

  const updateStatus = async (status: string) => {
    if (!actor) return;
    setSaving(true);
    try {
      const updated: Booking = { ...b, status };
      await actor.updateBooking(b.id, updated);
      setB(updated);
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const applyDiscount = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      const updated: Booking = {
        ...b,
        discount,
        discountType,
        finalAmount,
        balanceDue,
        status: "completed",
      };
      await actor.updateBooking(b.id, updated);
      setB(updated);
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-green-100 text-green-700";
    if (s === "ongoing") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const statusLabel = (s: string) => {
    if (s === "completed") return t.completed;
    if (s === "ongoing") return t.ongoing;
    return t.pending;
  };

  const inputClass =
    "border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

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
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.details}
        </h1>
        <button
          type="button"
          onClick={() => onInvoice(b)}
          className="ml-auto flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-xl text-sm"
        >
          <FileText size={16} />
          {t.invoice}
        </button>
      </div>

      {/* Customer Info */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-2">
        <div className="flex justify-between">
          <span className="font-bold text-gray-900 dark:text-white text-lg">
            {b.customerName}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}
          >
            {statusLabel(b.status)}
          </span>
        </div>
        <p className="text-gray-500 text-sm">📞 {b.mobile}</p>
        <p className="text-gray-500 text-sm">👨‍🌾 {b.workType}</p>
        <p className="text-gray-500 text-sm">
          📅 {new Date(Number(b.date)).toLocaleString()}
        </p>
      </div>

      {/* Work Details */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-2">
        <h3 className="font-bold text-gray-800 dark:text-white">
          {t.workType}
        </h3>
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
          <span className="text-gray-500">{t.advancePaid}</span>
          <span>₹{b.advancePaid.toLocaleString()}</span>
        </div>
        <div
          className={`flex justify-between text-sm font-semibold ${b.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
        >
          <span>{t.balanceDue}</span>
          <span>₹{b.balanceDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Transaction History */}
      <div
        className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3"
        data-ocid="booking_detail.transactions.panel"
      >
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-green-600" />
          <h3 className="font-bold text-gray-800 dark:text-white">
            {t.transactionHistory}
          </h3>
        </div>
        {transactions.length === 0 ? (
          <p
            className="text-sm text-gray-400 text-center py-2"
            data-ocid="booking_detail.transactions.empty_state"
          >
            {t.noTransactions}
          </p>
        ) : (
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
                  className={`flex-shrink-0 ${
                    tx.type === "balance_due"
                      ? "text-orange-500"
                      : "text-green-600"
                  }`}
                >
                  {tx.type === "balance_due" ? (
                    <Clock size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "balance_due"
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {tx.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tx.mode.toUpperCase()} • {tx.date}
                  </p>
                </div>
                <p
                  className={`font-bold text-sm ${
                    tx.type === "balance_due"
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-green-700 dark:text-green-400"
                  }`}
                >
                  ₹{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Actions */}
      {b.status !== "completed" && (
        <div className="flex gap-3">
          {b.status === "pending" && (
            <button
              type="button"
              onClick={() => updateStatus("ongoing")}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl"
            >
              {t.markOngoing}
            </button>
          )}
          {b.status === "ongoing" && (
            <button
              type="button"
              onClick={() => updateStatus("completed")}
              disabled={saving}
              className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl"
            >
              {t.markComplete}
            </button>
          )}
        </div>
      )}

      {/* Discount Section - show when completing */}
      {b.status === "ongoing" && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-orange-800 dark:text-orange-300">
            {t.applyDiscount}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDiscountType("percent")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${
                discountType === "percent"
                  ? "border-orange-500 bg-orange-100 text-orange-700"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              {t.percent} (%)
            </button>
            <button
              type="button"
              onClick={() => setDiscountType("fixed")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${
                discountType === "fixed"
                  ? "border-orange-500 bg-orange-100 text-orange-700"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              {t.fixed} (₹)
            </button>
          </div>
          <input
            className={`w-full ${inputClass}`}
            type="number"
            min="0"
            value={discount}
            onChange={(e) =>
              setDiscount(Number.parseFloat(e.target.value) || 0)
            }
            placeholder={discountType === "percent" ? "0%" : "\u20b90"}
          />
          {discount > 0 && (
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">{t.totalAmount}</span>
                <span>₹{b.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>{t.discount}</span>
                <span>- ₹{discountAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700">
                <span>{t.finalAmount}</span>
                <span>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={applyDiscount}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl"
          >
            {t.markComplete} & {t.save}
          </button>
        </div>
      )}
    </div>
  );
}
