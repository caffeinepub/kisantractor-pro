import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
}

export default function ServiceManagement({ onBack }: Props) {
  const { language, services, setServices, serviceRates, setServiceRate } =
    useAppStore();
  const t = translations[language];
  const [newService, setNewService] = useState("");
  const [expandedService, setExpandedService] = useState<string | null>(null);

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

  const inputClass =
    "flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:border-green-600";

  const rateInputClass =
    "w-full px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-green-500";

  // suppress unused warning
  void onBack;

  return (
    <div className="p-4 space-y-5">
      {/* Services list card */}
      <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
        <h2 className="font-bold text-gray-800 dark:text-white">
          {t.manageServices}
        </h2>
        {services.length === 0 ? (
          <p
            data-ocid="service_mgmt.services.empty_state"
            className="text-gray-400 dark:text-gray-500 text-sm text-center py-2"
          >
            {t.noServices}
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((svc, i) => (
              <div key={svc} data-ocid={`service_mgmt.services.item.${i + 1}`}>
                {/* Service chip row */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedService(expandedService === svc ? null : svc)
                    }
                    className="flex-1 flex items-center justify-between bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl px-3 py-2 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                    data-ocid={`service_mgmt.services.toggle.${i + 1}`}
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
                    data-ocid={`service_mgmt.services.delete_button.${i + 1}`}
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
                          data-ocid={`service_mgmt.services.per_hour.${i + 1}`}
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
                          data-ocid={`service_mgmt.services.per_minute.${i + 1}`}
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

        {/* Add new service */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddService()}
            placeholder={t.serviceName}
            data-ocid="service_mgmt.services.input"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleAddService}
            data-ocid="service_mgmt.services.add_button"
            className="px-5 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold text-sm transition-colors"
          >
            {t.add}
          </button>
        </div>
      </div>
    </div>
  );
}
