import { Fuel, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { getCache, setCache } from "../utils/dataCache";

interface FuelEntry {
  id: string;
  tractorId: string;
  date: string;
  liters: number;
  amount: number;
}

function loadFuelLog(): FuelEntry[] {
  try {
    return JSON.parse(localStorage.getItem("kisanFuelLog") || "[]");
  } catch {
    return [];
  }
}

function saveFuelLog(log: FuelEntry[]) {
  localStorage.setItem("kisanFuelLog", JSON.stringify(log));
}

export default function TractorScreen() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const isGu = language === "gu";
  const [tractors, setTractors] = useState<Tractor[]>(() =>
    getCache<Tractor>("tractors"),
  );
  const [loading, setLoading] = useState(
    () => getCache<Tractor>("tractors").length === 0,
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"tractors" | "fuel">("tractors");

  // Fuel log state
  const [fuelLog, setFuelLog] = useState<FuelEntry[]>(() => loadFuelLog());
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelTractorId, setFuelTractorId] = useState("");
  const [fuelDate, setFuelDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelAmount, setFuelAmount] = useState("");

  const load = useCallback(async () => {
    if (!actor) return;
    const data = await actor.getAllTractors();
    setCache("tractors", data);
    setTractors(data);
    setLoading(false);
    if (!fuelTractorId && data.length > 0) {
      setFuelTractorId(String(data[0].id));
    }
  }, [actor, fuelTractorId]);

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
    if (!confirm(isGu ? "આ ટ્રેક્ટર કાઢવુ?" : "Delete this tractor?")) return;
    await actor.deleteTractor(id);
    load();
  };

  const addFuelEntry = () => {
    const liters = Number(fuelLiters);
    const amount = Number(fuelAmount);
    if (!fuelTractorId || !fuelDate || !liters || !amount) return;
    const entry: FuelEntry = {
      id: String(Date.now()),
      tractorId: fuelTractorId,
      date: fuelDate,
      liters,
      amount,
    };
    const updated = [entry, ...fuelLog];
    setFuelLog(updated);
    saveFuelLog(updated);
    setFuelLiters("");
    setFuelAmount("");
    setShowFuelForm(false);
  };

  const deleteFuelEntry = (id: string) => {
    const updated = fuelLog.filter((e) => e.id !== id);
    setFuelLog(updated);
    saveFuelLog(updated);
  };

  const getTractorName = (id: string) =>
    tractors.find((t) => String(t.id) === id)?.name ?? id;

  // Fuel summary per tractor
  const fuelSummary = tractors.map((tr) => {
    const entries = fuelLog.filter((e) => e.tractorId === String(tr.id));
    const totalLiters = entries.reduce((s, e) => s + e.liters, 0);
    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    return { tr, totalLiters, totalAmount, entries };
  });

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.tractors}
        </h1>
        {activeTab === "tractors" && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          >
            <Plus size={16} />
            {t.addTractor}
          </button>
        )}
        {activeTab === "fuel" && (
          <button
            type="button"
            onClick={() => setShowFuelForm(!showFuelForm)}
            data-ocid="tractors.fuel.open_modal_button"
            className="flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-semibold"
          >
            <Plus size={16} />
            {isGu ? "તેલ નોંધ" : "Add Fuel"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setActiveTab("tractors")}
          data-ocid="tractors.tractors.tab"
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "tractors"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground"
          }`}
        >
          🚜 {isGu ? "ટ્રેક્ટર" : "Tractors"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fuel")}
          data-ocid="tractors.fuel.tab"
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "fuel"
              ? "bg-orange-600 text-white"
              : "bg-card text-foreground"
          }`}
        >
          <Fuel size={15} />
          {isGu ? "ઇંધણ લોગ" : "Fuel Log"}
        </button>
      </div>

      {/* Tractors Tab */}
      {activeTab === "tractors" && (
        <>
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
            {tractors.map((tr) => {
              const summary = fuelSummary.find(
                (s) => String(s.tr.id) === String(tr.id),
              );
              return (
                <div
                  key={Number(tr.id)}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow p-4"
                >
                  <div className="flex items-center justify-between">
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
                  {summary && summary.totalAmount > 0 && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center gap-3">
                      <Fuel size={14} className="text-orange-500" />
                      <span className="text-xs text-muted-foreground">
                        {isGu ? "ઇંધણ" : "Fuel"}: {summary.totalLiters}L ·{" "}
                        <span className="font-semibold text-orange-600">
                          ₹{summary.totalAmount.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Fuel Log Tab */}
      {activeTab === "fuel" && (
        <div className="space-y-4">
          {showFuelForm && (
            <div
              className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3"
              data-ocid="tractors.fuel.dialog"
            >
              <h3 className="font-bold text-gray-800 dark:text-white">
                {isGu ? "ઇંધણ વિગત" : "Fuel Entry"}
              </h3>
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  {t.selectTractor}
                </span>
                <select
                  className={inputClass}
                  value={fuelTractorId}
                  onChange={(e) => setFuelTractorId(e.target.value)}
                  data-ocid="tractors.fuel_tractor.select"
                >
                  {tractors.map((tr) => (
                    <option key={String(tr.id)} value={String(tr.id)}>
                      {tr.name} ({tr.number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">
                  {t.date}
                </span>
                <input
                  type="date"
                  className={inputClass}
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  data-ocid="tractors.fuel_date.input"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">
                    {isGu ? "લીટર" : "Liters"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    data-ocid="tractors.fuel_liters.input"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-500 block mb-1">
                    {isGu ? "રકમ (₹)" : "Amount (₹)"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                    value={fuelAmount}
                    onChange={(e) => setFuelAmount(e.target.value)}
                    data-ocid="tractors.fuel_amount.input"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addFuelEntry}
                  data-ocid="tractors.fuel.confirm_button"
                  className="flex-1 bg-orange-600 text-white font-bold py-3 rounded-xl"
                >
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFuelForm(false)}
                  data-ocid="tractors.fuel.cancel_button"
                  className="flex-1 border border-gray-300 font-bold py-3 rounded-xl text-gray-600"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Fuel Summary per tractor */}
          {fuelSummary.filter((s) => s.totalAmount > 0).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {fuelSummary
                .filter((s) => s.totalAmount > 0)
                .map((s) => (
                  <div
                    key={String(s.tr.id)}
                    className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-3"
                  >
                    <p className="font-bold text-orange-800 dark:text-orange-300 text-sm">
                      {s.tr.name}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {s.totalLiters}L
                    </p>
                    <p className="font-bold text-orange-700 dark:text-orange-300">
                      ₹{s.totalAmount.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          )}

          {/* Fuel log list */}
          {fuelLog.length === 0 ? (
            <div
              className="text-center py-10 text-gray-400"
              data-ocid="tractors.fuel.empty_state"
            >
              <Fuel size={40} className="mx-auto mb-3 opacity-30" />
              <p>{isGu ? "કોઈ ઇંધણ નોંધ નથી" : "No fuel entries"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fuelLog.map((entry, i) => (
                <div
                  key={entry.id}
                  data-ocid={`tractors.fuel.item.${i + 1}`}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      🚜 {getTractorName(entry.tractorId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.date} · {entry.liters}L
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-orange-600">
                      ₹{entry.amount.toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteFuelEntry(entry.id)}
                      className="text-red-400 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
