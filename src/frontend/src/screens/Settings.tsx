import { ArrowLeft, ChevronDown, ChevronUp, LogOut, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import type { Language } from "../i18n";
import { translations } from "../i18n";
import type { DriverRequest } from "../store";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function SettingsScreen({ onBack, onNavigate }: Props) {
  const { actor } = useActor();
  const {
    language,
    darkMode,
    setLanguage,
    setDarkMode,
    ownerPassword,
    setOwnerPassword,
    ownerMobile,
    setOwnerMobile,
    driverRequests,
    updateDriverRequest,
    setAuthRole,
    services,
    setServices,
    serviceRates,
    setServiceRate,
  } = useAppStore();
  const t = translations[language];
  const [saving, setSaving] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [mobileSaved, setMobileSaved] = useState(false);
  const [drivers, setDrivers] = useState<
    Array<{ id: bigint; name: string; phone: string }>
  >([]);
  const [newService, setNewService] = useState("");
  const [expandedService, setExpandedService] = useState<string | null>(null);

  useEffect(() => {
    if (!actor) return;
    actor.getSettings().then((s) => {
      if (s.language === "gu" || s.language === "en") {
        setLanguage(s.language as Language);
      }
      setDarkMode(s.darkMode);
    });
    actor
      .getAllDrivers()
      .then((d) =>
        setDrivers(
          d.map((dr) => ({ id: dr.id, name: dr.name, phone: dr.phone })),
        ),
      );
  }, [actor, setLanguage, setDarkMode]);

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
      alert("Settings saved!");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleSaveMobile = () => {
    if (!newMobile.trim()) return;
    setOwnerMobile(newMobile.trim());
    setNewMobile("");
    setMobileSaved(true);
    setTimeout(() => setMobileSaved(false), 2000);
  };

  const handleSavePassword = () => {
    if (!newPwd.trim()) return;
    setOwnerPassword(newPwd.trim());
    setNewPwd("");
    setPwdSaved(true);
    setTimeout(() => setPwdSaved(false), 2000);
  };

  const handleApprove = (req: DriverRequest) => {
    const matched = drivers.find((d) => d.phone === req.phone);
    updateDriverRequest(req.id, {
      status: "approved",
      driverId: matched ? matched.id : BigInt(0),
    });
  };

  const handleReject = (req: DriverRequest) => {
    updateDriverRequest(req.id, { status: "rejected" });
  };

  const handleAddService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) return;
    setServices([...services, trimmed]);
    setNewService("");
  };

  const handleRemoveService = (svc: string) => {
    setServices(services.filter((s) => s !== svc));
    if (expandedService === svc) setExpandedService(null);
  };

  const langOptions: { id: Language; label: string }[] = [
    { id: "gu", label: t.gujarati },
    { id: "en", label: t.english },
  ];

  const statusBadge = (status: DriverRequest["status"]) => {
    if (status === "approved")
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (status === "rejected")
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  };

  const statusLabel = (status: DriverRequest["status"]) => {
    if (status === "approved") return t.approve;
    if (status === "rejected") return t.reject;
    return t.pendingApproval;
  };

  const maskedMobile = (num: string) => {
    if (num.length < 4) return num;
    return `${num.slice(0, 2)}****${num.slice(-2)}`;
  };

  const inputClass =
    "flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:border-green-600";

  const rateInputClass =
    "w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500";

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          data-ocid="settings.back_button"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.settings}
        </h1>
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

      {/* Services Management */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.manageServices}
        </h2>
        {services.length === 0 ? (
          <p
            data-ocid="settings.services.empty_state"
            className="text-gray-400 dark:text-gray-500 text-sm text-center py-2"
          >
            {t.noServices}
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((svc, i) => (
              <div key={svc} data-ocid={`settings.services.item.${i + 1}`}>
                {/* Service chip row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedService(expandedService === svc ? null : svc)
                    }
                    className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                    data-ocid={`settings.services.toggle.${i + 1}`}
                  >
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                      {svc}
                    </span>
                    <div className="flex items-center gap-2">
                      {serviceRates[svc] ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ₹{serviceRates[svc].perHour}/hr
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {t.rateNotSet}
                        </span>
                      )}
                      {expandedService === svc ? (
                        <ChevronUp size={14} className="text-green-600" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(svc)}
                    data-ocid={`settings.services.delete_button.${i + 1}`}
                    className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 transition-colors text-xs font-bold flex-shrink-0"
                    aria-label={`Remove ${svc}`}
                  >
                    ✕
                  </button>
                </div>

                {/* Expanded rate inputs */}
                {expandedService === svc && (
                  <div className="mt-2 ml-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {svc} — {t.duration}
                    </p>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {t.perHourRate} (₹)
                        </p>
                        <input
                          type="number"
                          min="0"
                          id={`per-hour-${svc}`}
                          defaultValue={serviceRates[svc]?.perHour ?? ""}
                          onBlur={(e) => {
                            const val = Number(e.target.value) || 0;
                            setServiceRate(svc, {
                              perHour: val,
                              perMinute: serviceRates[svc]?.perMinute ?? 0,
                            });
                          }}
                          data-ocid={`settings.services.per_hour.${i + 1}`}
                          placeholder="0"
                          className={rateInputClass}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {t.perMinuteRate} (₹)
                        </p>
                        <input
                          type="number"
                          min="0"
                          id={`per-minute-${svc}`}
                          defaultValue={serviceRates[svc]?.perMinute ?? ""}
                          onBlur={(e) => {
                            const val = Number(e.target.value) || 0;
                            setServiceRate(svc, {
                              perHour: serviceRates[svc]?.perHour ?? 0,
                              perMinute: val,
                            });
                          }}
                          data-ocid={`settings.services.per_minute.${i + 1}`}
                          placeholder="0"
                          className={rateInputClass}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddService()}
            placeholder={t.serviceName}
            data-ocid="settings.services.input"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAddService}
            data-ocid="settings.services.add_button"
            className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition-colors"
          >
            {t.add}
          </button>
        </div>
      </div>

      {/* Owner Mobile Number */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.ownerMobile}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {language === "gu" ? "હાલનો નંબર: " : "Current number: "}
          <span className="font-mono tracking-widest">
            {ownerMobile
              ? maskedMobile(ownerMobile)
              : language === "gu"
                ? "સેટ નથી"
                : "Not set"}
          </span>
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={newMobile}
            onChange={(e) => setNewMobile(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveMobile()}
            placeholder={t.enterMobile}
            data-ocid="settings.mobile.input"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSaveMobile}
            data-ocid="settings.mobile.save_button"
            className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition-colors"
          >
            {t.save}
          </button>
        </div>
        {mobileSaved && (
          <p className="text-green-600 dark:text-green-400 text-sm font-semibold">
            ✅ {t.mobileSaved}
          </p>
        )}
      </div>

      {/* Owner Password */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.ownerPasswordSection}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {language === "gu" ? "હાલનો પાસવર્ડ: " : "Current password: "}
          <span className="font-mono tracking-widest">
            {ownerPassword.replace(/./g, "●")}
          </span>
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder={t.newPassword}
            data-ocid="settings.password.input"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSavePassword}
            data-ocid="settings.password.save_button"
            className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition-colors"
          >
            {t.save}
          </button>
        </div>
        {pwdSaved && (
          <p className="text-green-600 dark:text-green-400 text-sm font-semibold">
            ✅ {t.passwordChanged}
          </p>
        )}
      </div>

      {/* Driver Requests */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.driverRequests}
        </h2>
        {driverRequests.length === 0 ? (
          <p
            data-ocid="settings.driver_requests.empty_state"
            className="text-gray-400 dark:text-gray-500 text-sm text-center py-3"
          >
            {t.noData}
          </p>
        ) : (
          <div className="space-y-3">
            {driverRequests.map((req, i) => (
              <div
                key={req.id}
                data-ocid={`settings.driver_requests.item.${i + 1}`}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {req.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {req.phone}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${statusBadge(req.status)}`}
                  >
                    {statusLabel(req.status)}
                  </span>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      data-ocid={`settings.driver_requests.approve.${i + 1}`}
                      className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
                    >
                      ✅ {t.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req)}
                      data-ocid={`settings.driver_requests.reject.${i + 1}`}
                      className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
                    >
                      ❌ {t.reject}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

      {/* Manage Drivers */}
      <button
        type="button"
        onClick={() => onNavigate("drivers")}
        data-ocid="settings.manage_drivers.button"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 font-bold text-lg hover:bg-green-50 dark:hover:bg-green-900 transition-colors"
      >
        <Users size={20} />
        {t.manageDrivers}
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={() => setAuthRole(null)}
        data-ocid="settings.logout.button"
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold text-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
      >
        <LogOut size={20} />
        {t.logout}
      </button>
    </div>
  );
}
