import {
  Download,
  Lock,
  Settings,
  Shield,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import type { Language } from "../i18n";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onShowPinSetup: () => void;
}

export default function SettingsScreen({
  onBack,
  onNavigate,
  onShowPinSetup,
}: Props) {
  const { actor } = useActor();
  const { language, darkMode, setLanguage, setDarkMode } = useAppStore();
  const t = translations[language];
  const isGu = language === "gu";
  const [saving, setSaving] = useState(false);

  // Business logo state
  const [businessLogo, setBusinessLogo] = useState<string | null>(
    localStorage.getItem("businessLogo") || null,
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // PIN lock state
  const [pinEnabled, setPinEnabled] = useState(
    () => !!localStorage.getItem("kisanPin"),
  );
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePinInput, setDisablePinInput] = useState("");

  useEffect(() => {
    if (!actor) return;
    actor.getSettings().then((s) => {
      if (s.language === "gu" || s.language === "en") {
        setLanguage(s.language as Language);
      }
      setDarkMode(s.darkMode);
    });
  }, [actor, setLanguage, setDarkMode]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      localStorage.setItem("businessLogo", base64);
      setBusinessLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem("businessLogo");
    setBusinessLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const saveSettings = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.updateSettings({
        hourlyRate: 0,
        acreRate: 0,
        language,
        darkMode,
      });
      alert(isGu ? "સેટિંગ સચવાઈ ગઈ!" : "Settings saved!");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  // PIN management
  const handleEnablePin = () => {
    onShowPinSetup();
    setPinEnabled(true);
  };

  const handleDisablePin = () => {
    const stored = localStorage.getItem("kisanPin");
    if (disablePinInput === stored) {
      localStorage.removeItem("kisanPin");
      setPinEnabled(false);
      setShowDisableConfirm(false);
      setDisablePinInput("");
    } else {
      alert(isGu ? "ખોટો PIN" : "Wrong PIN");
      setDisablePinInput("");
    }
  };

  // Backup
  const handleBackup = () => {
    const backup: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("kisan")) {
        try {
          backup[key] = JSON.parse(localStorage.getItem(key) || "");
        } catch {
          backup[key] = localStorage.getItem(key);
        }
      }
    }
    backup.businessName = localStorage.getItem("businessName");
    backup.businessLogo = localStorage.getItem("businessLogo");

    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kisantractor-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = confirm(
      isGu
        ? "ÃÂ¥Ã§¤¤Ã: ÃÂ¥ÃÂ°Ã¥Ã¥Ã° ÃÂ¥ÃÂ¥ÃÂ²Ã ÃÂ¥ÃÂ²Ã¥Ã ÃÂ¥ÃÂ²ÃÂ¥ÃÂ¦ ÃÂ¥ÃÂ¥ÃÂ¥ÃÂ¥ÃÂ¸ÃÂ¥ÃÂ²ÃÂ¥. ÃÂ¥ÃÂ§ÃÂ¥ÃÂ¦ ÃÂ¥ÃÂ§ÃÂ¥ÃÂ²?"
        : "Warning: Restoring will overwrite all current data. Continue?",
    );
    if (!confirmed) {
      if (restoreInputRef.current) restoreInputRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        for (const [key, value] of Object.entries(data)) {
          if (value !== null && value !== undefined) {
            localStorage.setItem(
              key,
              typeof value === "string" ? value : JSON.stringify(value),
            );
          }
        }
        alert(isGu ? "ÃÂ°Ã¥ÃÂ¸ÃÂ°ÃÂ¥ÃÂ° ÃÂ¥ÃÂ°ÃÂ¥ÃÂ²!" : "Restore successful!");
        window.location.reload();
      } catch {
        alert(isGu ? "ÃÂ¥ÃÂ¨ÃÂ¥ÃÂ¨ÃÂ¥ÃÂ² ÃÂ¥ÃÂ°ÃÂ¥ÃÂ¥" : "Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const langOptions: { id: Language; label: string }[] = [
    { id: "gu", label: t.gujarati },
    { id: "en", label: t.english },
  ];

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          data-ocid="settings.back_button"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.settings}
        </h1>
      </div>

      {/* Business Logo */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {isGu ? "બિઝનેસ લોગો" : "Business Logo"}
        </h2>
        {businessLogo && (
          <div className="flex items-center gap-3">
            <img
              src={businessLogo}
              alt="Business Logo"
              className="rounded-lg border border-gray-200 dark:border-gray-600"
              style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              data-ocid="settings.logo.delete_button"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold"
            >
              <X size={14} />
              {isGu ? "દૂર કરો" : "Remove"}
            </button>
          </div>
        )}
        <div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            data-ocid="settings.logo.upload_button"
            className="hidden"
            id="logo-upload"
          />
          <label
            htmlFor="logo-upload"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/30 border-2 border-dashed border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold text-sm cursor-pointer w-full justify-center"
          >
            📷{" "}
            {businessLogo
              ? isGu
                ? "લોગો બદલો"
                : "Change Logo"
              : isGu
                ? "લોગો અપલોડ કરો"
                : "Upload Logo"}
          </label>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.language}
        </h2>
        <div className="flex gap-2">
          {langOptions.map((opt) => (
            <button
              type="button"
              key={opt.id}
              onClick={() => setLanguage(opt.id)}
              data-ocid={`settings.lang_${opt.id}.button`}
              className={`flex-1 py-3 rounded-xl text-base font-bold border-2 transition ${
                language === opt.id
                  ? "border-green-600 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dark Mode */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 dark:text-white">
            {t.darkMode}
          </h2>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            data-ocid="settings.dark_mode.toggle"
            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? "bg-green-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-7" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* PIN Lock */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-green-700 dark:text-green-400" />
          <h2 className="font-bold text-gray-800 dark:text-white">
            {isGu ? "PIN લોક" : "PIN Lock"}
          </h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {isGu
            ? "App ખોલકાડી 4 આંકનો PIN માંગશે"
            : "App will require a 4-digit PIN on startup"}
        </p>
        {!pinEnabled ? (
          <button
            type="button"
            onClick={handleEnablePin}
            data-ocid="settings.pin.enable.button"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-700 text-white font-bold text-sm"
          >
            <Lock size={16} />
            {isGu ? "PIN சেট કরો" : "Enable PIN Lock"}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Lock size={16} />
              <span className="text-sm font-semibold">
                {isGu ? "PIN ચાલુ છે" : "PIN Lock Active"}
              </span>
            </div>
            {!showDisableConfirm ? (
              <button
                type="button"
                onClick={() => setShowDisableConfirm(true)}
                data-ocid="settings.pin.disable.button"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-300 text-red-600 font-semibold text-sm"
              >
                {isGu ? "PIN હતાવો" : "Disable PIN"}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  maxLength={4}
                  placeholder={isGu ? "હાલનો PIN" : "Enter current PIN"}
                  value={disablePinInput}
                  onChange={(e) => setDisablePinInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  data-ocid="settings.pin.disable.input"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDisablePin}
                    data-ocid="settings.pin.confirm_disable.button"
                    className="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-sm"
                  >
                    {isGu ? "હતાવો" : "Remove"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableConfirm(false);
                      setDisablePinInput("");
                    }}
                    className="flex-1 border border-gray-300 font-bold py-2 rounded-xl text-sm"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowDisableConfirm(false);
                onShowPinSetup();
              }}
              className="text-sm text-blue-600 underline"
              data-ocid="settings.pin.change.button"
            >
              {isGu ? "PIN બદલો" : "Change PIN"}
            </button>
          </div>
        )}
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {isGu ? "ડેટા બેકઅપ / રીસ્ટોર" : "Data Backup / Restore"}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {isGu
            ? "બધો ડેટા JSON ફાઇલ તરીકે ડાઉનલોડ કરો. રીસ્ટોર કરવાથી ઈ ફાઇલ પાછો લોડ કરો."
            : "Download all data as JSON. Restore from a backup file."}
        </p>
        <button
          type="button"
          onClick={handleBackup}
          data-ocid="settings.backup.button"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm"
        >
          <Download size={16} />
          {isGu ? "બેકઅપ ડાઉનલોડ" : "Download Backup"}
        </button>
        <div>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json"
            onChange={handleRestoreFile}
            className="hidden"
            id="restore-upload"
            data-ocid="settings.restore.upload_button"
          />
          <label
            htmlFor="restore-upload"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-orange-400 dark:border-orange-700 text-orange-700 dark:text-orange-400 font-bold text-sm cursor-pointer"
          >
            <Upload size={16} />
            {isGu ? "બેકઅપથી રીસ્ટોર" : "Restore from Backup"}
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={saveSettings}
        disabled={saving}
        data-ocid="settings.save.button"
        className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl text-lg shadow"
      >
        {saving ? t.loading : t.save}
      </button>

      {/* Manage Services */}
      <button
        type="button"
        onClick={() => onNavigate("serviceManagement")}
        data-ocid="settings.manage_services.button"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-bold text-lg"
      >
        <Settings size={20} />
        {isGu ? "સેવા મેનેજ" : "Manage Services"}
      </button>

      {/* Manage Drivers */}
      <button
        type="button"
        onClick={() => onNavigate("drivers")}
        data-ocid="settings.manage_drivers.button"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-bold text-lg"
      >
        <Users size={20} />
        {t.manageDrivers}
      </button>
    </div>
  );
}
