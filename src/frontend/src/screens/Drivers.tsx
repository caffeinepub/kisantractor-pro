import {
  Calendar,
  CheckCircle,
  Clock,
  IndianRupee,
  PhoneCall,
  Plus,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Driver } from "../backend.d";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

interface DriverRate {
  rateType: "hourly" | "daily";
  rate: number;
}
interface DriverAttendanceEntry {
  id: string;
  driverId: string;
  date: string; // YYYY-MM-DD
  type: "present" | "absent" | "hours";
  hours?: number;
}
interface DriverPayoutEntry {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  note?: string;
}

function getDriverRates(): Record<string, DriverRate> {
  try {
    return JSON.parse(localStorage.getItem("kisan_driver_rates") || "{}");
  } catch {
    return {};
  }
}
function saveDriverRates(r: Record<string, DriverRate>) {
  localStorage.setItem("kisan_driver_rates", JSON.stringify(r));
}
function getAttendance(): DriverAttendanceEntry[] {
  try {
    return JSON.parse(localStorage.getItem("kisan_driver_attendance") || "[]");
  } catch {
    return [];
  }
}
function saveAttendance(a: DriverAttendanceEntry[]) {
  localStorage.setItem("kisan_driver_attendance", JSON.stringify(a));
}
function getPayouts(): DriverPayoutEntry[] {
  try {
    return JSON.parse(localStorage.getItem("kisan_driver_payouts") || "[]");
  } catch {
    return [];
  }
}
function savePayouts(p: DriverPayoutEntry[]) {
  localStorage.setItem("kisan_driver_payouts", JSON.stringify(p));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Drivers() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // rates
  const [rates, setRates] =
    useState<Record<string, DriverRate>>(getDriverRates);

  // attendance
  const [attDriverId, setAttDriverId] = useState("");
  const [attDate, setAttDate] = useState(todayStr);
  const [attType, setAttType] = useState<"present" | "absent" | "hours">(
    "present",
  );
  const [attHours, setAttHours] = useState("8");
  const [attendance, setAttendance] =
    useState<DriverAttendanceEntry[]>(getAttendance);

  // payout
  const [payDriverId, setPayDriverId] = useState("");
  const [payouts, setPayouts] = useState<DriverPayoutEntry[]>(getPayouts);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState(todayStr);

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

  const updateRate = (driverId: string, patch: Partial<DriverRate>) => {
    const current = rates[driverId] || { rateType: "daily", rate: 0 };
    const updated = { ...rates, [driverId]: { ...current, ...patch } };
    setRates(updated);
    saveDriverRates(updated);
  };

  const markAttendance = () => {
    if (!attDriverId) {
      toast.error("Driver select karo");
      return;
    }
    // Check duplicate for present/absent
    if (attType !== "hours") {
      const dup = attendance.find(
        (a) =>
          a.driverId === attDriverId &&
          a.date === attDate &&
          a.type !== "hours",
      );
      if (dup) {
        // remove old and replace
        const filtered = attendance.filter(
          (a) =>
            !(
              a.driverId === attDriverId &&
              a.date === attDate &&
              a.type !== "hours"
            ),
        );
        const entry: DriverAttendanceEntry = {
          id: crypto.randomUUID(),
          driverId: attDriverId,
          date: attDate,
          type: attType,
        };
        const next = [entry, ...filtered];
        setAttendance(next);
        saveAttendance(next);
        toast.success("Attendance update thayo");
        return;
      }
    }
    const entry: DriverAttendanceEntry = {
      id: crypto.randomUUID(),
      driverId: attDriverId,
      date: attDate,
      type: attType,
      hours: attType === "hours" ? Number.parseFloat(attHours) || 0 : undefined,
    };
    const next = [entry, ...attendance];
    setAttendance(next);
    saveAttendance(next);
    toast.success("Attendance save thayo!");
  };

  const deleteAttendance = (id: string) => {
    const next = attendance.filter((a) => a.id !== id);
    setAttendance(next);
    saveAttendance(next);
  };

  // Payout calc
  const calcEarned = (driverId: string) => {
    const r = rates[driverId];
    if (!r || !r.rate) return 0;
    const entries = attendance.filter((a) => a.driverId === driverId);
    if (r.rateType === "hourly") {
      const totalHrs = entries.reduce((sum, a) => {
        if (a.type === "hours") return sum + (a.hours || 0);
        if (a.type === "present") return sum + 8; // assume 8hr day if hourly
        return sum;
      }, 0);
      return totalHrs * r.rate;
    }
    const days = entries.filter((a) => a.type === "present").length;
    return days * r.rate;
  };

  const calcPaid = (driverId: string) =>
    payouts
      .filter((p) => p.driverId === driverId)
      .reduce((s, p) => s + p.amount, 0);

  const savePayout = () => {
    if (!payDriverId) {
      toast.error("Driver select karo");
      return;
    }
    const amt = Number.parseFloat(payAmount);
    if (!amt || amt <= 0) {
      toast.error("Amount enter karo");
      return;
    }
    const entry: DriverPayoutEntry = {
      id: crypto.randomUUID(),
      driverId: payDriverId,
      amount: amt,
      date: payDate,
      note: payNote || undefined,
    };
    const next = [entry, ...payouts];
    setPayouts(next);
    savePayouts(next);
    setShowPayForm(false);
    setPayAmount("");
    setPayNote("");
    setPayDate(todayStr());
    toast.success("Payout record thayo!");
  };

  const deletePayout = (id: string) => {
    const next = payouts.filter((p) => p.id !== id);
    setPayouts(next);
    savePayouts(next);
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";

  const driverName = (id: string) =>
    drivers.find((d) => d.id.toString() === id)?.name || id;

  // Recent attendance for selected driver (last 30 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recentAtt = attendance
    .filter((a) => a.driverId === attDriverId && new Date(a.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));

  const recentPay = payouts
    .filter((p) => p.driverId === payDriverId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="drivers">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="drivers" data-ocid="drivers.tab">
            ડ્રાઇવર
          </TabsTrigger>
          <TabsTrigger value="attendance" data-ocid="attendance.tab">
            હાજરી
          </TabsTrigger>
          <TabsTrigger value="payout" data-ocid="payout.tab">
            ચૂકવણી
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Drivers ── */}
        <TabsContent value="drivers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.drivers}
            </h1>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
              data-ocid="drivers.open_modal_button"
            >
              <Plus size={16} />
              {t.addDriver}
            </button>
          </div>

          {showForm && (
            <div
              className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3"
              data-ocid="drivers.dialog"
            >
              <input
                className={inputClass}
                placeholder={t.driverName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="drivers.input"
              />
              <input
                className={inputClass}
                placeholder={t.phone}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-ocid="drivers.input"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addDriver}
                  className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl"
                  data-ocid="drivers.submit_button"
                >
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
                  data-ocid="drivers.cancel_button"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          {loading && <p className="text-center text-gray-400">{t.loading}</p>}
          {!loading && drivers.length === 0 && (
            <p
              className="text-center text-gray-400 py-8"
              data-ocid="drivers.empty_state"
            >
              {t.noDrivers}
            </p>
          )}

          <div className="space-y-3">
            {drivers.map((dr, idx) => {
              const key = dr.id.toString();
              const r = rates[key] || { rateType: "daily" as const, rate: 0 };
              return (
                <div
                  key={Number(dr.id)}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3"
                  data-ocid={`drivers.item.${idx + 1}`}
                >
                  <div className="flex items-center justify-between">
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
                        data-ocid={`drivers.delete_button.${idx + 1}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Rate setting */}
                  <div className="border-t border-gray-100 dark:border-gray-600 pt-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      ⚙️ Payment Rate
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            updateRate(key, { rateType: "hourly" })
                          }
                          className={`px-3 py-2 font-medium transition-colors ${
                            r.rateType === "hourly"
                              ? "bg-green-700 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <Clock size={12} className="inline mr-1" />
                          કલાક
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRate(key, { rateType: "daily" })}
                          className={`px-3 py-2 font-medium transition-colors ${
                            r.rateType === "daily"
                              ? "bg-green-700 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          <Calendar size={12} className="inline mr-1" />
                          દિવસ
                        </button>
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-7 pr-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0"
                          value={r.rate || ""}
                          onChange={(e) =>
                            updateRate(key, {
                              rate: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        /{r.rateType === "hourly" ? "hr" : "day"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Tab 2: Attendance ── */}
        <TabsContent value="attendance" className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            હાજરી (Attendance)
          </h2>

          <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
            <select
              className={inputClass}
              value={attDriverId}
              onChange={(e) => setAttDriverId(e.target.value)}
              data-ocid="attendance.select"
            >
              <option value="">-- Driver Select Karo --</option>
              {drivers.map((d) => (
                <option key={Number(d.id)} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              className={inputClass}
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              data-ocid="attendance.input"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAttType("present")}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  attType === "present"
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
                data-ocid="attendance.button"
              >
                <CheckCircle size={16} />
                હાજર
              </button>
              <button
                type="button"
                onClick={() => setAttType("absent")}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  attType === "absent"
                    ? "bg-red-500 text-white"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}
                data-ocid="attendance.button"
              >
                <XCircle size={16} />
                ગેરહાજર
              </button>
              <button
                type="button"
                onClick={() => setAttType("hours")}
                className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  attType === "hours"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
                data-ocid="attendance.button"
              >
                <Timer size={16} />
                કલાક
              </button>
            </div>

            {attType === "hours" && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="att-hours"
                  className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                >
                  કલાક (Hours):
                </label>
                <input
                  id="att-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  className={inputClass}
                  value={attHours}
                  onChange={(e) => setAttHours(e.target.value)}
                  data-ocid="attendance.input"
                />
              </div>
            )}

            <button
              type="button"
              onClick={markAttendance}
              className="w-full bg-green-700 text-white font-bold py-3 rounded-xl"
              data-ocid="attendance.submit_button"
            >
              ✅ Save Karo
            </button>
          </div>

          {/* Recent attendance list */}
          {attDriverId && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                છેલ્લા 30 દિવસ ({driverName(attDriverId)})
              </p>
              {recentAtt.length === 0 && (
                <p
                  className="text-center text-gray-400 py-4 text-sm"
                  data-ocid="attendance.empty_state"
                >
                  કોઈ records નથી
                </p>
              )}
              {recentAtt.map((a, idx) => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-3 flex items-center justify-between"
                  data-ocid={`attendance.item.${idx + 1}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {a.date}
                    </p>
                    <p
                      className={`text-xs font-semibold mt-0.5 ${
                        a.type === "present"
                          ? "text-green-600"
                          : a.type === "absent"
                            ? "text-red-500"
                            : "text-blue-600"
                      }`}
                    >
                      {a.type === "present"
                        ? "✅ હાજર"
                        : a.type === "absent"
                          ? "❌ ગેરહાજર"
                          : `⏱ ${a.hours} hr`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAttendance(a.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    data-ocid={`attendance.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab 3: Payout ── */}
        <TabsContent value="payout" className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ચૂકવણી (Payout)
          </h2>

          <select
            className={inputClass}
            value={payDriverId}
            onChange={(e) => {
              setPayDriverId(e.target.value);
              setShowPayForm(false);
            }}
            data-ocid="payout.select"
          >
            <option value="">-- Driver Select Karo --</option>
            {drivers.map((d) => (
              <option key={Number(d.id)} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>

          {payDriverId &&
            (() => {
              const earned = calcEarned(payDriverId);
              const paid = calcPaid(payDriverId);
              const pending = earned - paid;
              const r = rates[payDriverId];
              return (
                <>
                  {/* Summary Card */}
                  <div className="bg-white dark:bg-gray-700 rounded-xl shadow p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-500">
                      {r
                        ? `Rate: ₹${r.rate}/${r.rateType === "hourly" ? "hr" : "day"}`
                        : "⚠️ Rate set nahi hai -- Drivers tab mein set karo"}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Total Earned
                        </p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                          ₹{earned.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Total Paid
                        </p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                          ₹{paid.toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`rounded-xl p-3 text-center ${pending > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-600"}`}
                      >
                        <p
                          className={`text-xs font-medium ${pending > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"}`}
                        >
                          Pending
                        </p>
                        <p
                          className={`text-lg font-bold ${pending > 0 ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-200"}`}
                        >
                          ₹{pending.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!showPayForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowPayForm(true);
                          setPayAmount(pending > 0 ? pending.toString() : "");
                          setPayDate(todayStr());
                        }}
                        className="w-full bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                        data-ocid="payout.open_modal_button"
                      >
                        <IndianRupee size={16} />
                        પૈસા આપો (Pay Driver)
                      </button>
                    ) : (
                      <div
                        className="space-y-3 border-t border-gray-100 dark:border-gray-600 pt-3"
                        data-ocid="payout.dialog"
                      >
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          New Payout
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pl-7 pr-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Amount"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            data-ocid="payout.input"
                          />
                        </div>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="Note (optional)"
                          value={payNote}
                          onChange={(e) => setPayNote(e.target.value)}
                          data-ocid="payout.input"
                        />
                        <input
                          type="date"
                          className={inputClass}
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          data-ocid="payout.input"
                        />
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={savePayout}
                            className="flex-1 bg-green-700 text-white font-bold py-3 rounded-xl"
                            data-ocid="payout.submit_button"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowPayForm(false)}
                            className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl"
                            data-ocid="payout.cancel_button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payout history */}
                  {recentPay.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Payout History
                      </p>
                      {recentPay.map((p, idx) => (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-gray-700 rounded-xl shadow-sm p-3 flex items-center justify-between"
                          data-ocid={`payout.item.${idx + 1}`}
                        >
                          <div>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">
                              ₹{p.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {p.date}
                              {p.note ? ` · ${p.note}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deletePayout(p.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            data-ocid={`payout.delete_button.${idx + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
