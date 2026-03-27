import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Expense, Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { getCache, setCache } from "../utils/dataCache";

function parseExpenseDescription(raw: string): {
  mode: "cash" | "upi" | null;
  description: string;
} {
  if (raw.startsWith("[cash]")) {
    return { mode: "cash", description: raw.slice(6).trim() };
  }
  if (raw.startsWith("[upi]")) {
    return { mode: "upi", description: raw.slice(5).trim() };
  }
  return { mode: null, description: raw };
}

export default function Expenses() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    getCache<Expense>("expenses"),
  );
  const [tractors, setTractors] = useState<Tractor[]>(() =>
    getCache<Tractor>("tractors"),
  );
  const [loading, setLoading] = useState(
    () => getCache<Expense>("expenses").length === 0,
  );
  const [showForm, setShowForm] = useState(false);
  const [netProfit, setNetProfit] = useState(0);
  const now = new Date();
  const [form, setForm] = useState({
    expenseType: "diesel",
    tractorId: "",
    amount: 0,
    description: "",
    date: now.toISOString().slice(0, 10),
    paymentMode: "cash" as "cash" | "upi",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: now is computed once at render
  const load = useCallback(async () => {
    if (!actor) return;
    const [exp, tr, profit] = await Promise.all([
      actor.getAllExpenses(),
      actor.getAllTractors(),
      actor.getNetProfit(BigInt(now.getMonth() + 1), BigInt(now.getFullYear())),
    ]);
    setCache("expenses", exp);
    setCache("tractors", tr);
    setExpenses(exp);
    setTractors(tr);
    setNetProfit(profit);
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const addExpense = async () => {
    if (!actor || !form.amount) return;
    const encodedDescription = `[${form.paymentMode}]${form.description ? ` ${form.description}` : ""}`;
    await actor.createExpense({
      id: BigInt(0),
      expenseType: form.expenseType,
      tractorId: form.tractorId ? BigInt(form.tractorId) : undefined,
      amount: form.amount,
      description: encodedDescription,
      date: BigInt(new Date(form.date).getTime()),
      createdAt: BigInt(Date.now()),
    });
    setForm({
      expenseType: "diesel",
      tractorId: "",
      amount: 0,
      description: "",
      date: now.toISOString().slice(0, 10),
      paymentMode: "cash",
    });
    setShowForm(false);
    load();
  };

  const deleteExpense = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteExpense(id);
    load();
  };
  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.expenses}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {t.addExpense}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-xs text-red-500 mb-1">{t.totalExpenses}</p>
          <p className="text-xl font-bold text-red-600">
            ₹{totalExpenses.toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-xl p-3 ${netProfit >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
        >
          <p className="text-xs text-gray-500 mb-1">{t.netProfit}</p>
          <p
            className={`text-xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-600"}`}
          >
            ₹{netProfit.toLocaleString()}
          </p>
        </div>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
          <h3 className="font-bold text-gray-800 dark:text-white">
            {t.addExpense}
          </h3>
          <select
            className={inputClass}
            value={form.expenseType}
            onChange={(e) =>
              setForm((f) => ({ ...f, expenseType: e.target.value }))
            }
          >
            <option value="diesel">{t.diesel}</option>
            <option value="maintenance">{t.maintenance}</option>
            <option value="other">{t.other}</option>
          </select>
          <select
            className={inputClass}
            value={form.tractorId}
            onChange={(e) =>
              setForm((f) => ({ ...f, tractorId: e.target.value }))
            }
          >
            <option value="">-- {t.selectTractor} --</option>
            {tractors.map((tr) => (
              <option key={Number(tr.id)} value={String(tr.id)}>
                {tr.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            type="number"
            placeholder={`${t.amount} (₹)`}
            value={form.amount || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                amount: Number.parseFloat(e.target.value) || 0,
              }))
            }
          />
          <input
            className={inputClass}
            placeholder={t.description}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <input
            className={inputClass}
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />

          {/* Payment Mode */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {language === "gu" ? "ચૂકવણી પ્રકાર" : "Payment Mode"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMode: "cash" }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  form.paymentMode === "cash"
                    ? "border-primary bg-accent text-primary"
                    : "border-gray-200 dark:border-gray-600 text-gray-500"
                }`}
                data-ocid="expenses.cash.toggle"
              >
                💵 {language === "gu" ? "કેશ" : "Cash"}
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, paymentMode: "upi" }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  form.paymentMode === "upi"
                    ? "border-primary bg-accent text-primary"
                    : "border-gray-200 dark:border-gray-600 text-gray-500"
                }`}
                data-ocid="expenses.upi.toggle"
              >
                📱 UPI
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addExpense}
              className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl"
              data-ocid="expenses.save.button"
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
              data-ocid="expenses.cancel.button"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
      {loading && <p className="text-center text-gray-400">{t.loading}</p>}
      <div className="space-y-3">
        {expenses.map((exp) => {
          const { mode, description } = parseExpenseDescription(
            exp.description ?? "",
          );
          return (
            <div
              key={Number(exp.id)}
              className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 dark:text-white capitalize">
                    {exp.expenseType}
                  </p>
                  {mode === "cash" && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                      💵 Cash
                    </span>
                  )}
                  {mode === "upi" && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                      📱 UPI
                    </span>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-gray-500">{description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(Number(exp.date)).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600">
                  ₹{exp.amount.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => deleteExpense(exp.id)}
                  className="text-red-400 hover:text-red-600"
                  data-ocid="expenses.delete_button"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
