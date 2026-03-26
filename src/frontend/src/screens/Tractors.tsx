import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

export default function TractorScreen() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    const data = await actor.getAllTractors();
    setTractors(data);
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const addTractor = async () => {
    if (!actor || !name || !number) return;
    await actor.createTractor({
      id: BigInt(0),
      name,
      number,
      status: "available",
      addedAt: BigInt(Date.now()),
    });
    setName("");
    setNumber("");
    setShowForm(false);
    load();
  };

  const deleteTractor = async (id: bigint) => {
    if (!actor) return;
    if (!confirm("Delete this tractor?")) return;
    await actor.deleteTractor(id);
    load();
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.tractors}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {t.addTractor}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800 dark:text-white">
            {t.addTractor}
          </h3>
          <input
            className={inputClass}
            placeholder={t.tractorName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder={t.tractorNumber}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addTractor}
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
      {!loading && tractors.length === 0 && (
        <p className="text-center text-gray-400 py-8">{t.noTractors}</p>
      )}

      <div className="space-y-3">
        {tractors.map((tr) => (
          <div
            key={Number(tr.id)}
            className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                🚜 {tr.name}
              </p>
              <p className="text-sm text-gray-500">{tr.number}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  tr.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {tr.status === "available" ? t.available : t.busy}
              </span>
              <button
                type="button"
                onClick={() => deleteTractor(tr.id)}
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
