import { CheckCircle, Clock, Pencil, Share2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Booking } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

type TxEntry = {
  key: string;
  bookingId: string;
  customerName: string;
  village: string;
  workType: string;
  date: bigint;
  dateStr: string;
  type: "advance" | "balance";
  amount: number;
  mode: string;
  mobile: string;
  totalAmount: number;
  discount: number;
  advancePaid: number;
};

type Filter = "all" | "advance" | "balance";

const formatDate = (ts: bigint) => new Date(Number(ts)).toLocaleDateString();

const ANONYMOUS_NAMES = ["Cash Entry", "UPI Entry", "કેશ એન્ટ્રી", "UPI એન્ટ્રી"];

interface Props {
  onNewTransaction: () => void;
}

function shareOnWhatsApp(tx: TxEntry) {
  const typeLabel = tx.type === "advance" ? "Advance" : "Balance (Baki)";
  const separator = "----------------------------";
  const lines = [
    "\uD83D\uDE9C KisanTractor Pro - Invoice",
    separator,
    `Party: ${tx.customerName}`,
    `Service: ${tx.workType}`,
    `Date: ${tx.dateStr}`,
    `Type: ${typeLabel}`,
    `Total Amount: \u20B9${tx.totalAmount}`,
    tx.discount > 0 ? `Discount: \u20B9${tx.discount}` : null,
    `Advance Paid: \u20B9${tx.advancePaid}`,
    `Balance Due: \u20B9${Math.max(0, tx.totalAmount - tx.discount - tx.advancePaid)}`,
    tx.mode !== "udhar"
      ? `Payment Mode: ${tx.mode.toUpperCase()}`
      : "Type: Udhar",
    separator,
    `Amount: \u20B9${tx.amount}`,
  ]
    .filter(Boolean)
    .join("\n");

  const phone = tx.mobile ? tx.mobile.replace(/\D/g, "") : "";
  const url = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(lines)}`
    : `https://wa.me/?text=${encodeURIComponent(lines)}`;
  window.open(url, "_blank");
}

function PaymentModeBadge({ mode }: { mode: string }) {
  if (mode.startsWith("cash:")) {
    // Split format: cash:500|upi:300
    const parts = mode.split("|");
    const cashAmt = parts[0]?.replace("cash:", "") ?? "0";
    const upiAmt = parts[1]?.replace("upi:", "") ?? "0";
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        💵₹{cashAmt} + 📱₹{upiAmt}
      </span>
    );
  }
  if (mode === "upi") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        📱 UPI
      </span>
    );
  }
  if (mode === "udhar") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
        📒 Udhar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
      💵 Cash
    </span>
  );
}

export default function Transactions({
  onNewTransaction: _onNewTransaction,
}: Props) {
  const { actor, isFetching } = useActor();
  const { language } = useAppStore();
  const t = translations[language];

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMode, setEditMode] = useState("cash");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const all = await actor.getAllBookings();
      setBookings(all.sort((a, b) => Number(b.date) - Number(a.date)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!isFetching) load();
  }, [load, isFetching]);

  const allTransactions: TxEntry[] = [];
  for (const bk of bookings) {
    const bkId = String(bk.id);
    if (bk.advancePaid > 0) {
      allTransactions.push({
        key: `${bkId}-advance`,
        bookingId: bkId,
        customerName: bk.customerName,
        village: bk.village,
        workType: bk.workType,
        date: bk.date,
        dateStr: formatDate(bk.date),
        type: "advance",
        amount: bk.advancePaid,
        mode: bk.paymentMode,
        mobile: bk.mobile,
        totalAmount: bk.totalAmount,
        discount: bk.discount,
        advancePaid: bk.advancePaid,
      });
    }
    if (bk.status === "completed" && bk.finalAmount > bk.advancePaid) {
      allTransactions.push({
        key: `${bkId}-balance`,
        bookingId: bkId,
        customerName: bk.customerName,
        village: bk.village,
        workType: bk.workType,
        date: bk.date,
        dateStr: formatDate(bk.date),
        type: "balance",
        amount: bk.finalAmount - bk.advancePaid,
        mode: bk.paymentMode,
        mobile: bk.mobile,
        totalAmount: bk.totalAmount,
        discount: bk.discount,
        advancePaid: bk.advancePaid,
      });
    }
  }

  allTransactions.sort((a, b) => Number(b.date) - Number(a.date));

  const filtered =
    filter === "all"
      ? allTransactions
      : allTransactions.filter((tx) => tx.type === filter);

  const totalAmount = filtered.reduce((s, tx) => s + tx.amount, 0);

  const filterTabs: { id: Filter; label: string }[] = [
    { id: "all", label: t.transactions },
    { id: "advance", label: t.advanceEntry },
    { id: "balance", label: t.balanceEntry },
  ];

  const bookingMap = new Map<string, Booking>();
  for (const bk of bookings) {
    bookingMap.set(String(bk.id), bk);
  }

  const handleDelete = async (tx: TxEntry) => {
    if (!actor) return;
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await actor.deleteBooking(BigInt(tx.bookingId));
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (tx: TxEntry) => {
    setEditingKey(tx.key);
    setEditAmount(String(tx.amount));
    setEditMode(tx.mode === "udhar" ? "cash" : tx.mode);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditAmount("");
    setEditMode("cash");
  };

  const handleSaveEdit = async (tx: TxEntry) => {
    if (!actor) return;
    const bk = bookingMap.get(tx.bookingId);
    if (!bk) return;
    const newAmt = Number(editAmount);
    if (Number.isNaN(newAmt) || newAmt < 0) return;
    setSaving(true);
    try {
      let updatedBooking: Booking;
      if (tx.type === "advance") {
        updatedBooking = { ...bk, advancePaid: newAmt, paymentMode: editMode };
      } else {
        updatedBooking = {
          ...bk,
          finalAmount: bk.advancePaid + newAmt,
          paymentMode: editMode,
        };
      }
      await actor.updateBooking(BigInt(tx.bookingId), updatedBooking);
      cancelEdit();
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "border border-border rounded-lg px-3 py-2 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full";

  return (
    <div className="pb-4">
      {/* Summary Bar */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{t.totalEarnings}</p>
          <p className="text-2xl font-bold text-primary">
            \u20B9{totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t.transactions}</p>
          <p className="text-lg font-bold text-foreground">{filtered.length}</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-4 pt-3 pb-2 flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            data-ocid={`transactions.${tab.id}.tab`}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              filter === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground bg-background"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-4 space-y-3" data-ocid="transactions.loading_state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 px-4"
          data-ocid="transactions.empty_state"
        >
          <p className="text-4xl mb-3">\uD83D\uDCCB</p>
          <p className="text-sm text-muted-foreground">{t.noTransactions}</p>
        </div>
      ) : (
        <div className="bg-card border-t border-border">
          {filtered.map((tx, idx) => {
            const isAnonymous = ANONYMOUS_NAMES.includes(tx.customerName);
            return (
              <div
                key={tx.key}
                className="border-b border-border"
                data-ocid={`transactions.item.${idx + 1}`}
              >
                <div className="flex items-center px-4 py-3.5 gap-3">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === "advance"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-500"
                        : "bg-orange-50 dark:bg-orange-900/30 text-orange-500"
                    }`}
                  >
                    {tx.type === "advance" ? (
                      <Clock size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isAnonymous
                          ? "italic text-muted-foreground font-normal"
                          : "font-bold text-foreground"
                      }`}
                    >
                      {tx.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 flex-wrap">
                      <span>{tx.workType}</span>
                      <span>•</span>
                      <PaymentModeBadge mode={tx.mode} />
                      <span>•</span>
                      <span>{tx.dateStr}</span>
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                        tx.type === "advance"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300"
                      }`}
                    >
                      {tx.type === "advance" ? t.advanceEntry : t.balanceEntry}
                    </span>
                  </div>

                  {/* Amount + Actions */}
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`font-bold text-sm ${
                        tx.type === "advance"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}
                    >
                      \u20B9{tx.amount.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => shareOnWhatsApp(tx)}
                      data-ocid={`transactions.share_button.${idx + 1}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      title="WhatsApp par share karo"
                    >
                      <Share2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(tx)}
                      data-ocid={`transactions.edit_button.${idx + 1}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      data-ocid={`transactions.delete_button.${idx + 1}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inline Edit */}
                {editingKey === tx.key && (
                  <div className="mx-4 mb-3 pt-2 border-t border-border space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.amount}
                        </p>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className={inputClass}
                          data-ocid="transactions.edit.input"
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t.paymentMode}
                        </p>
                        <select
                          value={editMode}
                          onChange={(e) => setEditMode(e.target.value)}
                          className={inputClass}
                          data-ocid="transactions.edit.select"
                        >
                          <option value="cash">{t.cash}</option>
                          <option value="upi">{t.upi}</option>
                          <option value="udhar">Udhar</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(tx)}
                        disabled={saving}
                        data-ocid="transactions.edit.save_button"
                        className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
                      >
                        {saving ? t.loading : t.save}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        data-ocid="transactions.edit.cancel_button"
                        className="flex-1 py-2 rounded-lg border border-border text-foreground text-sm font-bold"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
