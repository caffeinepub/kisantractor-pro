import { motion } from "motion/react";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onOwnerLogin: () => void;
}

export default function LoginScreen({ onOwnerLogin }: Props) {
  const { language } = useAppStore();
  const t = translations[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-6">
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-10"
      >
        <span className="text-7xl mb-4">🚜</span>
        <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 text-center leading-tight">
          {t.appName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base text-center">
          કિસાન ટ્રેક્ટર સર્વિસ મેનેજમેન્ટ
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-sm"
      >
        <button
          type="button"
          onClick={onOwnerLogin}
          data-ocid="login.owner_login.button"
          className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xl font-bold shadow-lg flex items-center justify-center gap-3 transition-colors"
        >
          <span className="text-2xl">👑</span>
          {t.ownerLogin}
        </button>
      </motion.div>

      <p className="mt-12 text-xs text-gray-400 dark:text-gray-600 text-center">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
