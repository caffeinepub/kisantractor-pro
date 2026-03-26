import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onNewBooking: () => void;
  onBookingTap: (booking: Booking) => void;
}

const STATUS_TABS = ["all", "pending", "ongoing", "completed"] as const;

export default function Bookings({ onNewBooking, onBookingTap }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "ongoing" | "completed"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor) return;
    actor
      .getAllBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actor]);

  const filtered =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeTab);

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "ongoing") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return t.completed;
    if (status === "ongoing") return t.ongoing;
    return t.pending;
  };

  const tabLabel = (tab: string) => {
    if (tab === "all") return "All";
    return statusLabel(tab);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.bookings}
        </h1>
        <button
          type="button"
          onClick={onNewBooking}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {t.newBooking}
        </button>
      </div>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        {STATUS_TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 shadow"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>
      {loading && <p className="text-center text-gray-400 py-4">{t.loading}</p>}
      <div className="space-y-3">
        {filtered.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-8">{t.noBookings}</p>
        )}
        {filtered.map((b) => (
          <button
            type="button"
            key={Number(b.id)}
            onClick={() => onBookingTap(b)}
            className="w-full text-left bg-white dark:bg-gray-700 rounded-xl shadow p-4 active:scale-95 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {b.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  {b.village} • {b.workType}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(Number(b.date)).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}
                >
                  {statusLabel(b.status)}
                </span>
                <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-1">
                  ₹{b.finalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
