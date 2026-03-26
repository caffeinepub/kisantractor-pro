import { PhoneCall, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Driver } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

export default function Drivers() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    const data = await actor.getAllDrivers();
    setDrivers(data);
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const addDriver = async () => {
    if (!actor || !name || !phone) return;
    await actor.createDriver({
      id: BigInt(0),
      name,
      phone,
      totalJobs: BigInt(0),
      addedAt: BigInt(Date.now()),
    });
    setName("");
    setPhone("");
    setShowForm(false);
    load();
  };

  const deleteDriver = async (id: bigint) => {
    if (!actor) return;
    if (!confirm("Delete this driver?")) return;
    await actor.deleteDriver(id);
    load();
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.drivers}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {t.addDriver}
        </button>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
          <input
            className={inputClass}
            placeholder={t.driverName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder={t.phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addDriver}
              className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
      {loading && <p className="text-center text-gray-400">{t.loading}</p>}
      {!loading && drivers.length === 0 && (
        <p className="text-center text-gray-400 py-8">{t.noDrivers}</p>
      )}
      <div className="space-y-3">
        {drivers.map((dr) => (
          <div
            key={Number(dr.id)}
            className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {dr.name}
              </p>
              <p className="text-sm text-gray-500">{dr.phone}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.totalJobs}: {Number(dr.totalJobs)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${dr.phone}`}
                className="p-2 bg-green-100 text-green-700 rounded-full"
              >
                <PhoneCall size={16} />
              </a>
              <button
                type="button"
                onClick={() => deleteDriver(dr.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
