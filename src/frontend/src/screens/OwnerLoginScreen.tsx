import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export default function OwnerLoginScreen({ onSuccess, onBack }: Props) {
  const { language, ownerPassword, setAuthRole } = useAppStore();
  const t = translations[language];
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (password === ownerPassword) {
      setAuthRole("owner");
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          data-ocid="owner_login.back_button"
          className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <span className="text-6xl mb-4">👑</span>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-8">
          {t.ownerLogin}
        </h1>

        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t.enterPassword}
              data-ocid="owner_login.input"
              className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600 dark:focus:border-green-400"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {error && (
            <p
              data-ocid="owner_login.error_state"
              className="text-red-600 dark:text-red-400 text-base font-semibold text-center"
            >
              ❌ {t.wrongPassword}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            data-ocid="owner_login.submit_button"
            className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xl font-bold shadow-lg transition-colors"
          >
            {t.ownerLogin}
          </button>
        </div>
      </div>
    </div>
  );
}
