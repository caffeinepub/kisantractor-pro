import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  IndianRupee,
  PhoneCall,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Screen } from "../App";
import type {
  Booking,
  CreditRecord,
  MaintenanceReminder,
  Tractor,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBookingTap: (booking: Booking) => void;
  onNavigate: (screen: Screen) => void;
}

function LiveClock({ language }: { language: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-2xl font-bold text-foreground tabular-nums">
      {time.toLocaleTimeString(language === "gu" ? "gu-IN" : "en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </p>
  );
}

export default function Dashboard({ onBookingTap, onNavigate }: Props) {
  const { actor } = useActor();
  const { language, services } = useAppStore();
  const t = translations[language];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [pendingCredits, setPendingCredits] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const load = useCallback(async () => {
    if (!actor) return;
    try {
      const [allBookings, earnings, allTractors, upcomingRem, credits] =
        await Promise.all([
          actor.getAllBookings(),
          actor.getTodayEarnings(BigInt(todayTs)),
          actor.getAllTractors(),
          actor.getUpcomingReminders(BigInt(Date.now())),
          actor.getPendingCredits(),
        ]);
      setBookings(allBookings);
      setTodayEarnings(earnings);
      setTractors(allTractors);
      setReminders(upcomingRem.slice(0, 3));
      setPendingCredits(
        credits.filter((c) => c.totalDue - c.amountPaid > 0).slice(0, 5),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [actor, todayTs]);

  useEffect(() => {
    load();
  }, [load]);

  const todayBookings = bookings.filter((b) => {
    const d = new Date(Number(b.date));
    d.setHours(0, 0, 0, 0);
    return d.getTime() === todayTs;
  });

  const activeTractors = tractors.filter((tr) => tr.status === "busy").length;
  const pendingPayments = bookings.filter((b) => b.balanceDue > 0);
  const pendingTotal = pendingPayments.reduce((s, b) => s + b.balanceDue, 0);

  // Month earnings
  const now = new Date();
  const monthEarnings = bookings
    .filter((b) => {
      const d = new Date(Number(b.date));
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, b) => s + b.finalAmount, 0);

  // Today cash vs UPI
  const todayCash = todayBookings
    .filter((b) => b.paymentMode === "cash")
    .reduce((s, b) => s + b.finalAmount, 0);

  const todayUPI = todayBookings
    .filter((b) => b.paymentMode === "upi")
    .reduce((s, b) => s + b.finalAmount, 0);

  // Overall (all-time) cash vs UPI
  const totalCash = bookings
    .filter((b) => b.paymentMode === "cash")
    .reduce((s, b) => s + b.finalAmount, 0);

  const totalUPI = bookings
    .filter((b) => b.paymentMode === "upi")
    .reduce((s, b) => s + b.finalAmount, 0);

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-accent text-accent-foreground";
    if (status === "ongoing")
      return "text-blue-600 bg-blue-50 dark:bg-blue-900/30";
    return "text-orange-600 bg-orange-50 dark:bg-orange-900/30";
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return t.completed;
    if (status === "ongoing") return t.ongoing;
    return t.pending;
  };

  if (loading)
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="pb-4">
      {/* Date + Live Clock */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-lg font-semibold text-foreground">
          {new Date().toLocaleDateString(
            language === "gu" ? "gu-IN" : "en-IN",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
            },
          )}
        </p>
        <LiveClock language={language} />
      </div>

      {/* Summary Cards - Horizontal Scroll */}
      <div className="px-4 overflow-x-auto">
        <div className="flex gap-3 pb-1" style={{ minWidth: "max-content" }}>
          {/* Today's Earnings */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowDownCircle size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                {t.todayEarnings}
              </span>
            </div>
            <p className="text-xl font-bold text-primary">
              ₹{todayEarnings.toLocaleString()}
            </p>
          </div>

          {/* Month Earnings */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <IndianRupee size={16} style={{ color: "oklch(0.65 0.19 47)" }} />
              <span className="text-xs text-muted-foreground font-medium">
                {language === "gu" ? "આ મહિને" : "This Month"}
              </span>
            </div>
            <p
              className="text-xl font-bold"
              style={{ color: "oklch(0.65 0.19 47)" }}
            >
              ₹{monthEarnings.toLocaleString()}
            </p>
          </div>

          {/* Pending Udhar */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle size={16} className="text-destructive" />
              <span className="text-xs text-muted-foreground font-medium">
                {t.pendingPayments}
              </span>
            </div>
            <p className="text-xl font-bold text-destructive">
              ₹{pendingTotal.toLocaleString()}
            </p>
          </div>

          {/* Active Tractors */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 130 }}
          >
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">
                {t.activeTractors}
              </span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {activeTractors}/{tractors.length}
            </p>
          </div>

          {/* Today Cash */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">💵</span>
              <span className="text-xs text-muted-foreground font-medium">
                {language === "gu" ? "આજ Cash આવ્યા" : "Aaj Cash Aaya"}
              </span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ₹{todayCash.toLocaleString()}
            </p>
          </div>

          {/* Today UPI */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">📱</span>
              <span className="text-xs text-muted-foreground font-medium">
                {language === "gu" ? "આજ UPI આવ્યા" : "Aaj UPI Aaya"}
              </span>
            </div>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹{todayUPI.toLocaleString()}
            </p>
          </div>

          {/* Total Cash (All-time) */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">🏦</span>
              <span className="text-xs text-muted-foreground font-medium">
                {language === "gu" ? "કુલ Cash" : "Kul Cash Aaya"}
              </span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              ₹{totalCash.toLocaleString()}
            </p>
          </div>

          {/* Total UPI (All-time) */}
          <div
            className="bg-card rounded-xl shadow-card border border-border p-4 flex flex-col gap-2"
            style={{ minWidth: 140 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-base leading-none">💳</span>
              <span className="text-xs text-muted-foreground font-medium">
                {language === "gu" ? "કુલ UPI" : "Kul UPI Aaya"}
              </span>
            </div>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
              ₹{totalUPI.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Maintenance Reminders */}
      {reminders.length > 0 && (
        <div className="mx-4 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={15} className="text-orange-500" />
            <span className="text-orange-700 dark:text-orange-300 font-semibold text-sm">
              {t.upcomingReminders}
            </span>
          </div>
          {reminders.map((r) => (
            <p
              key={Number(r.id)}
              className="text-orange-600 dark:text-orange-400 text-xs"
            >
              • {r.description} ({r.reminderType})
            </p>
          ))}
        </div>
      )}

      {/* ---- HORIZONTAL CARD ROW ---- */}
      <div className="px-4 mt-5">
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {/* Card 1: Pending Due Payments */}
          <div
            className="bg-card rounded-xl border border-border shadow-card flex flex-col flex-shrink-0"
            style={{ minWidth: 260, scrollSnapAlign: "start" }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                {language === "gu" ? "👥 પાર્ટી" : "👥 Party"}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("credits")}
                className="text-xs text-primary font-semibold"
              >
                {language === "gu" ? "બધું જુઓ" : "View All"}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 192 }}>
              {pendingCredits.length === 0 ? (
                <div
                  className="py-6 text-center"
                  data-ocid="dashboard.empty_state"
                >
                  <p className="text-xs text-muted-foreground px-3">
                    {language === "gu"
                      ? "કોઈ પેન્ડિંગ ઉધાર નથી"
                      : "No pending due payments"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingCredits.map((c) => {
                    const due = c.totalDue - c.amountPaid;
                    return (
                      <div
                        key={Number(c.id)}
                        className="flex items-center justify-between px-4 py-2.5"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-bold text-foreground text-xs truncate">
                            {c.customerName}
                          </p>
                          {c.mobile ? (
                            <p className="text-xs text-muted-foreground">
                              {c.mobile}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-sm font-bold text-destructive">
                            ₹{due.toLocaleString()}
                          </span>
                          {c.mobile ? (
                            <a
                              href={`tel:${c.mobile}`}
                              className="flex items-center gap-0.5 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full"
                            >
                              <PhoneCall size={9} />
                              {t.call}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Today's Work */}
          <div
            className="bg-card rounded-xl border border-border shadow-card flex flex-col flex-shrink-0"
            style={{ minWidth: 260, scrollSnapAlign: "start" }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                {language === "gu" ? "🚜 આજનું કામ" : "🚜 Today's Work"}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("bookings")}
                className="text-xs text-primary font-semibold"
              >
                {language === "gu" ? "બધું જુઓ" : "View All"}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 192 }}>
              {todayBookings.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted-foreground px-3">
                    {t.noBookings}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {todayBookings.map((b, idx) => (
                    <div
                      key={Number(b.id)}
                      className="flex items-center justify-between px-4 py-2.5"
                      data-ocid={`dashboard.item.${idx + 1}`}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left min-w-0 mr-2"
                        onClick={() => onBookingTap(b)}
                      >
                        <p className="font-bold text-foreground text-xs truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.workType}
                        </p>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block font-medium ${statusColor(b.status)}`}
                        >
                          {statusLabel(b.status)}
                        </span>
                      </button>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="font-bold text-primary text-xs">
                          ₹{b.finalAmount.toLocaleString()}
                        </p>
                        <a
                          href={`tel:${b.mobile}`}
                          className="flex items-center gap-0.5 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full"
                        >
                          <PhoneCall size={9} />
                          {t.call}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Services */}
          <div
            className="bg-card rounded-xl border border-border shadow-card flex flex-col flex-shrink-0"
            style={{ minWidth: 240, scrollSnapAlign: "start" }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                {language === "gu" ? "⚙️ સેવાઓ" : "⚙️ Services"}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="text-xs text-primary font-semibold"
              >
                {language === "gu" ? "મેનેજ કરો" : "Manage"}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 192 }}>
              {services.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted-foreground px-3">
                    {language === "gu"
                      ? "કોઈ સેવા ઉમેરવામાં નથી"
                      : "No services added yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {services.map((svc) => (
                    <div
                      key={svc}
                      className="flex items-center gap-2.5 px-4 py-2.5"
                    >
                      <span className="text-base">🔧</span>
                      <span className="text-xs font-medium text-foreground">
                        {svc}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-6 pb-2">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
