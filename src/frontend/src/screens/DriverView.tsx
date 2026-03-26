import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { Booking } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

export default function DriverView() {
  const { language, loggedInDriverId, setAuthRole, setLoggedInDriverId } =
    useAppStore();
  const t = translations[language];
  const { actor } = useActor();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || loggedInDriverId == null) return;
    actor
      .getDriverBookings(loggedInDriverId)
      .then((b) => {
        setBookings(b);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, loggedInDriverId]);

  const handleLogout = () => {
    setAuthRole(null);
    setLoggedInDriverId(null);
  };

  const statusColor = (status: string) => {
    if (status === "completed")
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (status === "ongoing")
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  };

  const formatDate = (ts: bigint) => {
    return new Date(Number(ts)).toLocaleDateString("gu-IN");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-orange-500 dark:bg-orange-700 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚜</span>
            <span className="font-bold text-white text-lg">{t.myBookings}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="driver_view.logout.button"
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div
              data-ocid="driver_view.loading_state"
              className="flex items-center justify-center py-16"
            >
              <span className="text-gray-400 dark:text-gray-500 text-lg animate-pulse">
                {t.loading}
              </span>
            </div>
          )}

          {!loading && bookings.length === 0 && (
            <div
              data-ocid="driver_view.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <span className="text-5xl mb-3">📋</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t.noBookings}
              </p>
            </div>
          )}

          {bookings.map((b, i) => (
            <div
              key={b.id.toString()}
              data-ocid={`driver_view.item.${i + 1}`}
              className="bg-white dark:bg-gray-700 rounded-2xl shadow p-4 border border-gray-100 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-base">
                    {b.customerName}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {b.village}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(b.status)}`}
                >
                  {b.status === "completed"
                    ? t.completed
                    : b.status === "ongoing"
                      ? t.ongoing
                      : t.pending}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>🌾 {b.workType}</span>
                <span>📅 {formatDate(b.date)}</span>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
