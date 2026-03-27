import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Plus,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Booking, Party, PartyStats } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import MonthlyStatement from "./MonthlyStatement";

interface Props {
  party: Party;
  onBack: () => void;
}

type TxEntry = {
  key: string;
  bookingDate: string;
  workType: string;
  type: "advance" | "balance";
  amount: number;
  mode: string;
};

interface Installment {
  id: string;
  partyName: string;
  amount: number;
  date: string;
  mode: "cash" | "upi";
  note: string;
}

function loadInstallments(partyName: string): Installment[] {
  try {
    const all = JSON.parse(
      localStorage.getItem("kisanInstallments") || "[]",
    ) as Installment[];
    return all.filter((i) => i.partyName === partyName);
  } catch {
    return [];
  }
}

function saveInstallment(inst: Installment) {
  const all = JSON.parse(
    localStorage.getItem("kisanInstallments") || "[]",
  ) as Installment[];
  all.unshift(inst);
  localStorage.setItem("kisanInstallments", JSON.stringify(all));
}

function getCreditLimit(partyName: string): number | null {
  try {
    const limits = JSON.parse(
      localStorage.getItem("kisanCreditLimits") || "{}",
    ) as Record<string, number>;
    return limits[partyName] ?? null;
  } catch {
    return null;
  }
}

function setCreditLimit(partyName: string, limit: number | null) {
  const limits = JSON.parse(
    localStorage.getItem("kisanCreditLimits") || "{}",
  ) as Record<string, number>;
  if (limit === null) {
    delete limits[partyName];
  } else {
    limits[partyName] = limit;
  }
  localStorage.setItem("kisanCreditLimits", JSON.stringify(limits));
}

function getPartyEvents(partyName: string): {
  birthday?: string;
  anniversary?: string;
} {
  try {
    const events = JSON.parse(
      localStorage.getItem("kisanPartyEvents") || "{}",
    ) as Record<string, { birthday?: string; anniversary?: string }>;
    return events[partyName] ?? {};
  } catch {
    return {};
  }
}

function setPartyEvent(
  partyName: string,
  field: "birthday" | "anniversary",
  value: string,
) {
  const events = JSON.parse(
    localStorage.getItem("kisanPartyEvents") || "{}",
  ) as Record<string, { birthday?: string; anniversary?: string }>;
  if (!events[partyName]) events[partyName] = {};
  if (value) {
    events[partyName][field] = value;
  } else {
    delete events[partyName][field];
  }
  localStorage.setItem("kisanPartyEvents", JSON.stringify(events));
}

export default function PartyDetail({ party, onBack }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const isGu = language === "gu";

  const [stats, setStats] = useState<PartyStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatement, setShowStatement] = useState(false);

  const now = new Date();
  const [statementMonth, setStatementMonth] = useState(now.getMonth());
  const [statementYear, setStatementYear] = useState(now.getFullYear());

  const businessName =
    localStorage.getItem("businessName") || "KisanTractor Pro";
  const businessLogo = localStorage.getItem("businessLogo") || null;

  // Credit limit
  const [creditLimit, setCreditLimitState] = useState<number | null>(() =>
    getCreditLimit(party.name),
  );
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");

  // Installments
  const [installments, setInstallments] = useState<Installment[]>(() =>
    loadInstallments(party.name),
  );
  const [showInstallForm, setShowInstallForm] = useState(false);
  const [installAmount, setInstallAmount] = useState("");
  const [installMode, setInstallMode] = useState<"cash" | "upi">("cash");
  const [installNote, setInstallNote] = useState("");

  // Birthday / Anniversary
  const [partyEvents, setPartyEventsState] = useState(() =>
    getPartyEvents(party.name),
  );
  const [editingEvents, setEditingEvents] = useState(false);
  const [bdayInput, setBdayInput] = useState(partyEvents.birthday || "");
  const [annivInput, setAnnivInput] = useState(partyEvents.anniversary || "");

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const [partyStats, partyBookings] = await Promise.all([
        actor.getPartyStats(party.name),
        actor.getBookingsByCustomerName(party.name),
      ]);
      setStats(partyStats);
      setBookings(
        partyBookings.sort((a, b) => Number(b.date) - Number(a.date)),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor, party.name]);

  useEffect(() => {
    load();
  }, [load]);

  const statusColor = (status: string) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    if (status === "ongoing")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return t.completed;
    if (status === "ongoing") return t.ongoing;
    return t.pending;
  };

  const formatDate = (ts: bigint) => new Date(Number(ts)).toLocaleDateString();

  const allTransactions: TxEntry[] = [];
  for (const bk of bookings) {
    const bkId = String(bk.id);
    if (bk.advancePaid > 0) {
      allTransactions.push({
        key: `${bkId}-advance`,
        bookingDate: formatDate(bk.date),
        workType: bk.workType,
        type: "advance",
        amount: bk.advancePaid,
        mode: bk.paymentMode,
      });
    }
    if (
      bk.status === "completed" &&
      bk.balanceDue <= 0 &&
      bk.finalAmount > bk.advancePaid
    ) {
      allTransactions.push({
        key: `${bkId}-balance`,
        bookingDate: formatDate(bk.date),
        workType: bk.workType,
        type: "balance",
        amount: bk.finalAmount - bk.advancePaid,
        mode: bk.paymentMode,
      });
    }
  }

  const handleSaveCreditLimit = () => {
    const val = Number(limitInput);
    const limit =
      limitInput.trim() === "" ? null : Number.isNaN(val) ? null : val;
    setCreditLimit(party.name, limit);
    setCreditLimitState(limit);
    setEditingLimit(false);
    setLimitInput("");
  };

  const handleAddInstallment = () => {
    const amt = Number(installAmount);
    if (!amt || amt <= 0) return;
    const inst: Installment = {
      id: String(Date.now()),
      partyName: party.name,
      amount: amt,
      date: new Date().toLocaleDateString(),
      mode: installMode,
      note: installNote,
    };
    saveInstallment(inst);
    const updated = [inst, ...installments];
    setInstallments(updated);
    setInstallAmount("");
    setInstallNote("");
    setShowInstallForm(false);
    // Also create a payment reminder as done (it's been paid)
    try {
      const reminders = JSON.parse(
        localStorage.getItem("kisan_payment_reminders") || "[]",
      );
      const idx = reminders.findIndex(
        (r: { partyName: string; isDone: boolean }) =>
          r.partyName === party.name && !r.isDone,
      );
      if (idx !== -1) {
        reminders[idx].amount = Math.max(0, reminders[idx].amount - amt);
        if (reminders[idx].amount <= 0) reminders[idx].isDone = true;
        localStorage.setItem(
          "kisan_payment_reminders",
          JSON.stringify(reminders),
        );
      }
    } catch {
      /* ignore */
    }
  };

  const handleSaveEvents = () => {
    setPartyEvent(party.name, "birthday", bdayInput);
    setPartyEvent(party.name, "anniversary", annivInput);
    setPartyEventsState({
      birthday: bdayInput || undefined,
      anniversary: annivInput || undefined,
    });
    setEditingEvents(false);
  };

  const udharBalance = stats?.udharBalance ?? 0;
  const creditExceeded = creditLimit !== null && udharBalance > creditLimit;

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-2.5 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";

  if (showStatement) {
    return (
      <MonthlyStatement
        party={party}
        bookings={bookings}
        onBack={() => setShowStatement(false)}
        businessName={businessName}
        businessLogo={businessLogo}
        language={language}
        selectedMonth={statementMonth}
        selectedYear={statementYear}
        onMonthChange={(m, y) => {
          setStatementMonth(m);
          setStatementYear(y);
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          data-ocid="party_detail.back_button"
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {party.name}
          </h1>
          {party.phone && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {party.phone}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowStatement(true)}
          data-ocid="party_detail.statement.button"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-semibold"
        >
          <FileText size={16} />
          {isGu ? "સ્ટેટમેન્ટ" : "Statement"}
        </button>
      </div>

      {loading ? (
        <div
          className="text-center py-8 text-gray-400"
          data-ocid="party_detail.loading_state"
        >
          {t.loading}
        </div>
      ) : (
        <>
          {/* Credit limit warning */}
          {creditExceeded && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3">
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                ⚠️ {isGu ? "ક્રેડિટ લિમિટ નિકળી!" : "Credit Limit Exceeded!"}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {isGu
                  ? `ઉધાર ₹${udharBalance.toLocaleString()} > લિમિટ ₹${creditLimit?.toLocaleString()}`
                  : `Udhar ₹${udharBalance.toLocaleString()} > Limit ₹${creditLimit?.toLocaleString()}`}
              </p>
            </div>
          )}

          {/* Stats Summary */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500 rounded-xl p-3 text-center">
                <IndianRupee size={18} className="text-white mx-auto mb-1" />
                <p className="text-white text-xs mb-0.5">{t.totalEarnings}</p>
                <p className="text-white font-bold text-sm">
                  ₹{stats.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-500 rounded-xl p-3 text-center">
                <BookOpen size={18} className="text-white mx-auto mb-1" />
                <p className="text-white text-xs mb-0.5">{t.totalBookings}</p>
                <p className="text-white font-bold text-sm">
                  {Number(stats.totalJobs)}
                </p>
              </div>
              <div
                className={`rounded-xl p-3 text-center ${
                  stats.udharBalance > 0 ? "bg-orange-500" : "bg-gray-400"
                }`}
              >
                <TrendingUp size={18} className="text-white mx-auto mb-1" />
                <p className="text-white text-xs mb-0.5">{t.udharBalance}</p>
                <p className="text-white font-bold text-sm">
                  ₹{stats.udharBalance.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Credit Limit */}
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" />
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  {isGu ? "ક્રેડિટ લિમિટ" : "Credit Limit"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingLimit(!editingLimit);
                  setLimitInput(
                    creditLimit !== null ? String(creditLimit) : "",
                  );
                }}
                data-ocid="party_detail.credit_limit.edit_button"
                className="text-blue-600 text-xs font-semibold"
              >
                {editingLimit
                  ? isGu
                    ? "રદ"
                    : "Cancel"
                  : isGu
                    ? "સેટ કરો"
                    : "Set Limit"}
              </button>
            </div>
            {editingLimit ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder={
                    isGu
                      ? "લિમિટ ₹ (0 = કોઈ નહી)"
                      : "Limit ₹ (blank = no limit)"
                  }
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  data-ocid="party_detail.credit_limit.input"
                />
                <button
                  type="button"
                  onClick={handleSaveCreditLimit}
                  data-ocid="party_detail.credit_limit.save_button"
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm"
                >
                  {t.save}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {creditLimit !== null
                  ? `₹${creditLimit.toLocaleString()}`
                  : isGu
                    ? "લિમિટ સેટ નથી"
                    : "No limit set"}
              </p>
            )}
          </div>

          {/* Birthday / Anniversary */}
          <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                🎂 {isGu ? "જન્મદિન / વર્ષગાંઠ" : "Birthday / Anniversary"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingEvents(!editingEvents);
                  setBdayInput(partyEvents.birthday || "");
                  setAnnivInput(partyEvents.anniversary || "");
                }}
                data-ocid="party_detail.events.edit_button"
                className="text-blue-600 text-xs font-semibold"
              >
                {editingEvents
                  ? isGu
                    ? "રદ"
                    : "Cancel"
                  : isGu
                    ? "સેટ કરો"
                    : "Edit"}
              </button>
            </div>
            {editingEvents ? (
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {isGu ? "જન્મદિન (MM-DD)" : "Birthday (MM-DD)"}
                  </span>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM-DD"
                    value={bdayInput}
                    onChange={(e) => setBdayInput(e.target.value)}
                    className={inputClass}
                    data-ocid="party_detail.birthday.input"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {isGu ? "વર્ષગાંઠ (MM-DD)" : "Anniversary (MM-DD)"}
                  </span>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="MM-DD"
                    value={annivInput}
                    onChange={(e) => setAnnivInput(e.target.value)}
                    className={inputClass}
                    data-ocid="party_detail.anniversary.input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveEvents}
                  data-ocid="party_detail.events.save_button"
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm"
                >
                  {t.save}
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {partyEvents.birthday && (
                  <p>
                    🎂 {isGu ? "જન્મદિન" : "Birthday"}: {partyEvents.birthday}
                  </p>
                )}
                {partyEvents.anniversary && (
                  <p>
                    💍 {isGu ? "વર્ષગાંઠ" : "Anniversary"}:{" "}
                    {partyEvents.anniversary}
                  </p>
                )}
                {!partyEvents.birthday && !partyEvents.anniversary && (
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {isGu ? "કોઈ એવેન્ટ સેટ નથી" : "No events set"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Installment Payments */}
          {udharBalance > 0 && (
            <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  {isGu ? "હપ્તા ચૂકવણી" : "Installment Payments"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInstallForm((v) => !v)}
                  data-ocid="party_detail.installment.open_modal_button"
                  className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  <Plus size={14} />
                  {isGu ? "ઉમરો" : "Add"}
                </button>
              </div>
              {showInstallForm && (
                <div
                  className="space-y-2 bg-muted rounded-xl p-3"
                  data-ocid="party_detail.installment.dialog"
                >
                  <input
                    type="number"
                    min="0"
                    placeholder={isGu ? "રકમ (₹)" : "Amount (₹)"}
                    value={installAmount}
                    onChange={(e) => setInstallAmount(e.target.value)}
                    className={inputClass}
                    data-ocid="party_detail.installment.input"
                  />
                  <div className="flex gap-2">
                    {(["cash", "upi"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setInstallMode(m)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${
                          installMode === m
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {m === "cash" ? `💵 ${t.cash}` : `📱 ${t.upi}`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={isGu ? "નોંધ (વૈકલ્પિક)" : "Note (optional)"}
                    value={installNote}
                    onChange={(e) => setInstallNote(e.target.value)}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddInstallment}
                      data-ocid="party_detail.installment.confirm_button"
                      className="flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm"
                    >
                      {t.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInstallForm(false)}
                      data-ocid="party_detail.installment.cancel_button"
                      className="flex-1 border border-border text-foreground font-bold py-2.5 rounded-xl text-sm"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </div>
              )}
              {installments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    {isGu ? "ઇતિહાસ" : "History"}
                  </p>
                  {installments.map((inst, i) => (
                    <div
                      key={inst.id}
                      data-ocid={`party_detail.installment.item.${i + 1}`}
                      className="flex items-center justify-between border border-border rounded-xl px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          ₹{inst.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inst.date} · {inst.mode.toUpperCase()}
                        </p>
                        {inst.note && (
                          <p className="text-xs text-muted-foreground">
                            {inst.note}
                          </p>
                        )}
                      </div>
                      <CheckCircle size={18} className="text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment Reminder */}
          {party.phone && stats && stats.udharBalance > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-3">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                {isGu ? "ચૂકવણી રિમાઇન્ડર" : "Payment Reminder"}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
                {isGu
                  ? `બાકી: ₹${stats.udharBalance.toLocaleString()}`
                  : `Pending: ₹${stats.udharBalance.toLocaleString()}`}
              </p>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/91${party.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Namaskar ${party.name}! Aapka pending balance ₹${stats.udharBalance} hai. Kirpaya jald payment karein. - KisanTractor`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ocid="party_detail.whatsapp_reminder.button"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`sms:+91${party.phone.replace(/\D/g, "")}?body=${encodeURIComponent(
                    `Namaskar ${party.name}! Aapka pending balance ₹${stats.udharBalance} hai. Kirpaya jald payment karein. - KisanTractor`,
                  )}`}
                  data-ocid="party_detail.sms_reminder.button"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg"
                >
                  📱 SMS
                </a>
              </div>
            </div>
          )}

          {/* Booking History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-gray-500" />
              <h2 className="font-bold text-gray-800 dark:text-white">
                {t.partyHistory}
              </h2>
            </div>
            {bookings.length === 0 ? (
              <div
                className="text-center py-10 text-gray-400"
                data-ocid="party_detail.empty_state"
              >
                <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t.noBookings}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((bk, idx) => (
                  <div
                    key={Number(bk.id)}
                    className="bg-white dark:bg-gray-700 rounded-xl shadow p-3 flex items-center justify-between"
                    data-ocid={`party_detail.item.${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {bk.workType}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(bk.status)}`}
                        >
                          {statusLabel(bk.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(bk.date)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-green-700 dark:text-green-400 text-sm">
                        ₹{bk.finalAmount.toLocaleString()}
                      </p>
                      {bk.balanceDue > 0 && (
                        <p className="text-xs text-orange-500">
                          -{t.balanceDue}: ₹{bk.balanceDue.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Receipt size={16} className="text-green-600" />
              <h2 className="font-bold text-gray-800 dark:text-white">
                {t.transactionHistory}
              </h2>
            </div>
            {allTransactions.length === 0 ? (
              <div
                className="text-center py-6 text-gray-400"
                data-ocid="party_detail.transactions.empty_state"
              >
                <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t.noTransactions}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTransactions.map((tx, idx) => (
                  <div
                    key={tx.key}
                    className="bg-white dark:bg-gray-700 rounded-xl shadow p-3 flex items-center gap-3"
                    data-ocid={`party_detail.transactions.item.${idx + 1}`}
                  >
                    <div
                      className={
                        tx.type === "advance"
                          ? "text-blue-500"
                          : "text-green-600"
                      }
                    >
                      {tx.type === "advance" ? (
                        <Clock size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tx.workType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tx.type === "advance"
                          ? t.advanceEntry
                          : t.paymentReceived}{" "}
                        • {tx.mode.toUpperCase()} • {tx.bookingDate}
                      </p>
                    </div>
                    <p
                      className={`font-bold text-sm ${
                        tx.type === "advance"
                          ? "text-blue-600 dark:text-blue-400"
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
        </>
      )}
    </div>
  );
}
