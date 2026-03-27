import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
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

export default function PartyDetail({ party, onBack }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];

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

  const formatDate = (ts: bigint) => {
    return new Date(Number(ts)).toLocaleDateString();
  };

  // Compute all transaction entries from bookings
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
        >
          <FileText size={16} />
          {language === "gu" ? "સ્ટેટમેન્ટ" : "Statement"}
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

          {/* Reminder Card */}
          {party.phone && stats && stats.udharBalance > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-3">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                {language === "gu" ? "ચૂકવણી રિમાઇન્ડર" : "Payment Reminder"}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
                {language === "gu"
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
