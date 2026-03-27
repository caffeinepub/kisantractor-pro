import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CreditRecord } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { getCache, setCache } from "../utils/dataCache";

export default function Credits() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [credits, setCredits] = useState<CreditRecord[]>(() =>
    getCache<CreditRecord>("credits"),
  );
  const [loading, setLoading] = useState(
    () => getCache<CreditRecord>("credits").length === 0,
  );
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<bigint | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    village: "",
    totalDue: 0,
    notes: "",
  });

  const load = useCallback(async () => {
    if (!actor) return;
    const data = await actor.getAllCreditRecords();
    setCache("credits", data);
    setCredits(data);
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const addCredit = async () => {
    if (!actor || !form.customerName) return;
    await actor.createCreditRecord({
      id: BigInt(0),
      customerName: form.customerName,
      mobile: form.mobile,
      village: form.village,
      totalDue: form.totalDue,
      amountPaid: 0,
      lastPaymentDate: BigInt(Date.now()),
      notes: form.notes,
    });
    setForm({
      customerName: "",
      mobile: "",
      village: "",
      totalDue: 0,
      notes: "",
    });
    setShowForm(false);
    load();
  };

  const recordPayment = async (credit: CreditRecord) => {
    if (!actor || payAmount <= 0) return;
    const updated: CreditRecord = {
      ...credit,
      amountPaid: credit.amountPaid + payAmount,
      lastPaymentDate: BigInt(Date.now()),
    };
    await actor.updateCreditRecord(credit.id, updated);
    setPayingId(null);
    setPayAmount(0);
    load();
  };

  const totalPending = credits.reduce(
    (s, c) => s + Math.max(0, c.totalDue - c.amountPaid),
    0,
  );
  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.udhar}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-teal-600 text-white px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {t.addCreditRecord}
        </button>
      </div>
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
        <p className="text-sm text-orange-600">{t.totalDue}</p>
        <p className="text-2xl font-bold text-orange-700">
          ₹{totalPending.toLocaleString()}
        </p>
      </div>
      {showForm && (
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
          <input
            className={inputClass}
            placeholder={t.customerName}
            value={form.customerName}
            onChange={(e) =>
              setForm((f) => ({ ...f, customerName: e.target.value }))
            }
          />
          <input
            className={inputClass}
            placeholder={t.mobile}
            type="tel"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder={t.village}
            value={form.village}
            onChange={(e) =>
              setForm((f) => ({ ...f, village: e.target.value }))
            }
          />
          <input
            className={inputClass}
            type="number"
            placeholder={`${t.totalDue} (₹)`}
            value={form.totalDue || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                totalDue: Number.parseFloat(e.target.value) || 0,
              }))
            }
          />
          <textarea
            className={inputClass}
            placeholder={t.notes}
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addCredit}
              className="flex-1 bg-teal-600 text-white font-bold py-3 rounded-xl"
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
      <div className="space-y-3">
        {credits.map((c) => {
          const balance = c.totalDue - c.amountPaid;
          return (
            <div
              key={Number(c.id)}
              className="bg-white dark:bg-gray-700 rounded-xl shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {c.customerName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {c.village} • {c.mobile}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{t.totalDue}</p>
                  <p className="font-bold text-red-600">
                    ₹{balance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                <span>
                  {t.amountPaid}: ₹{c.amountPaid.toLocaleString()}
                </span>
                <span>•</span>
                <span>
                  {t.totalAmount}: ₹{c.totalDue.toLocaleString()}
                </span>
              </div>
              {payingId === c.id ? (
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm dark:bg-gray-600 dark:text-white"
                    type="number"
                    placeholder="Amount"
                    value={payAmount || ""}
                    onChange={(e) =>
                      setPayAmount(Number.parseFloat(e.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => recordPayment(c)}
                    className="bg-green-700 text-white px-3 py-2 rounded-xl text-sm"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayingId(null)}
                    className="border border-gray-300 px-3 py-2 rounded-xl text-sm text-gray-600"
                  >
                    {t.cancel}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPayingId(c.id)}
                  className="mt-2 w-full border border-green-600 text-green-700 font-semibold py-2 rounded-xl text-sm"
                >
                  + {t.addPayment}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
