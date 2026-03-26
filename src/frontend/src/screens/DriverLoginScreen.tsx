import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export default function DriverLoginScreen({ onSuccess, onBack }: Props) {
  const {
    language,
    driverRequests,
    addDriverRequest,
    setAuthRole,
    setLoggedInDriverId,
  } = useAppStore();
  const t = translations[language];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{
    type: "info" | "error" | "success";
    text: string;
  } | null>(null);

  const handleSubmit = () => {
    const trimName = name.trim();
    const trimPhone = phone.trim();
    if (!trimName || !trimPhone) return;

    const existing = driverRequests.find(
      (r) =>
        r.name.toLowerCase() === trimName.toLowerCase() &&
        r.phone === trimPhone,
    );

    if (existing) {
      if (existing.status === "approved") {
        setAuthRole("driver");
        setLoggedInDriverId(existing.driverId ?? BigInt(0));
        onSuccess();
        return;
      }
      if (existing.status === "pending") {
        setMessage({ type: "info", text: t.requestSent });
        return;
      }
      if (existing.status === "rejected") {
        setMessage({ type: "error", text: t.requestRejected });
        return;
      }
    } else {
      addDriverRequest({
        id: Date.now().toString(),
        name: trimName,
        phone: trimPhone,
        status: "pending",
      });
      setMessage({ type: "success", text: t.requestSent });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          data-ocid="driver_login.back_button"
          className="p-2 rounded-full hover:bg-orange-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <span className="text-6xl mb-4">🚜</span>
        <h1 className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-8">
          {t.driverLogin}
        </h1>

        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setMessage(null);
            }}
            placeholder={t.driverName}
            data-ocid="driver_login.input"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-400"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setMessage(null);
            }}
            placeholder={t.phone}
            data-ocid="driver_login.input"
            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-400"
          />

          {message && (
            <div
              data-ocid={
                message.type === "error"
                  ? "driver_login.error_state"
                  : "driver_login.success_state"
              }
              className={`px-4 py-3 rounded-xl text-base font-semibold text-center ${
                message.type === "error"
                  ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                  : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
              }`}
            >
              {message.type === "error" ? "❌" : "✅"} {message.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            data-ocid="driver_login.submit_button"
            className="w-full py-5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xl font-bold shadow-lg transition-colors"
          >
            {t.driverLogin}
          </button>
        </div>
      </div>
    </div>
  );
}
