import { CalendarDays, CheckCircle2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { getCache, setCache } from "../utils/dataCache";

interface Props {
  onNewBooking: () => void;
  onBookingTap: (booking: Booking) => void;
  onComplete: (booking: Booking) => void;
}

const STATUS_TABS = ["all", "pending", "ongoing", "completed"] as const;

export default function Bookings({
  onNewBooking,
  onBookingTap,
  onComplete,
}: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [bookings, setBookings] = useState<Booking[]>(() =>
    getCache<Booking>("bookings"),
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "ongoing" | "completed"
  >("all");
  const [loading, setLoading] = useState(
    () => getCache<Booking>("bookings").length === 0,
  );

  useEffect(() => {
    if (!actor) return;
    actor
      .getAllBookings()
      .then((data) => {
        setCache("bookings", data);
        setBookings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actor]);

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const statusColor = (status: string) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
    if (status === "ongoing")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400";
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return t.completed;
    if (status === "ongoing") return t.ongoing;
    return t.pending;
  };

  const tabLabel = (tab: string) => {
    if (tab === "all") return language === "gu" ? "બધી" : "All";
    return statusLabel(tab);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={22} className="text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {language === "gu" ? "બુકિંગ" : "Bookings"}
          </h1>
        </div>
        <button
          type="button"
          onClick={onNewBooking}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold"
          data-ocid="bookings.new_booking.button"
        >
          <Plus size={16} />
          {t.newBooking}
        </button>
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {STATUS_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-ocid={`bookings.${tab}.tab`}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "bg-background text-primary shadow"
                : "text-muted-foreground"
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {loading && (
        <p
          className="text-center text-muted-foreground py-4"
          data-ocid="bookings.loading_state"
        >
          {t.loading}
        </p>
      )}

      <div className="space-y-3" data-ocid="bookings.list">
        {filtered.length === 0 && !loading && (
          <div
            className="text-center py-12 space-y-3"
            data-ocid="bookings.empty_state"
          >
            <CalendarDays size={40} className="text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">{t.noBookings}</p>
          </div>
        )}
        {filtered.map((b, idx) => (
          <div
            key={Number(b.id)}
            className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
            data-ocid={`bookings.item.${idx + 1}`}
          >
            <button
              type="button"
              onClick={() => onBookingTap(b)}
              className="w-full text-left p-4 active:bg-muted/50 transition"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate">
                    {b.customerName ||
                      (language === "gu" ? "અજ્ઞાત" : "Unknown")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {b.workType}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(b.status)}`}
                  >
                    {statusLabel(b.status)}
                  </span>
                </div>
              </div>
            </button>

            {(b.status === "pending" || b.status === "ongoing") && (
              <div className="px-4 pb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(b);
                  }}
                  data-ocid={`bookings.complete.button.${idx + 1}`}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-transform"
                >
                  <CheckCircle2 size={16} />
                  {language === "gu"
                    ? "Complete કરો (Transaction)"
                    : "Complete Karo (Transaction)"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
