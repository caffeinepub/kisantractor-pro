import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { Driver, Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

export default function NewBooking({ onBack, onSaved }: Props) {
  const { actor } = useActor();
  const { language, services, serviceRates } = useAppStore();
  const t = translations[language];
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    village: "",
    workType: services[0] ?? "Ploughing",
    date: new Date().toISOString().slice(0, 16),
    tractorId: "",
    driverId: "",
    paymentMode: "cash",
    notes: "",
  });

  useEffect(() => {
    if (!actor) return;
    Promise.all([actor.getAllTractors(), actor.getAllDrivers()]).then(
      ([tr, dr]) => {
        setTractors(tr.filter((t) => t.status === "available"));
        setDrivers(dr);
      },
    );
  }, [actor]);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const rates = serviceRates[form.workType];
  const computedAmount = rates
    ? durationHours * rates.perHour + durationMinutes * rates.perMinute
    : 0;
  const hasRate = !!rates;

  const handleSubmit = async () => {
    if (!actor) return;
    if (!form.customerName || !form.mobile || !form.village) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await actor.createBooking({
        id: BigInt(0),
        customerName: form.customerName,
        mobile: form.mobile,
        village: form.village,
        workType: form.workType,
        date: BigInt(new Date(form.date).getTime()),
        tractorId: form.tractorId ? BigInt(form.tractorId) : BigInt(0),
        driverId: form.driverId ? BigInt(form.driverId) : BigInt(0),
        status: "pending",
        hoursWorked: durationHours,
        acresWorked: 0,
        rateType: "hourly",
        baseRate: rates?.perHour ?? 0,
        totalAmount: computedAmount,
        discount: 0,
        discountType: "percent",
        finalAmount: computedAmount > 0 ? computedAmount : 0,
        paymentMode: form.paymentMode,
        advancePaid: 0,
        balanceDue: computedAmount > 0 ? computedAmount : 0,
        notes: form.notes,
        createdAt: BigInt(Date.now()),
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("Error saving booking");
    }
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-3 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelClass =
    "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t.newBooking}
        </h1>
      </div>

      <div className="space-y-4">
        <div>
          <p className={labelClass}>{t.customerName} *</p>
          <input
            className={inputClass}
            value={form.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            data-ocid="new_booking.customer_name.input"
          />
        </div>
        <div>
          <p className={labelClass}>{t.mobile} *</p>
          <input
            className={inputClass}
            type="tel"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            data-ocid="new_booking.mobile.input"
          />
        </div>
        <div>
          <p className={labelClass}>{t.village} *</p>
          <input
            className={inputClass}
            value={form.village}
            onChange={(e) => set("village", e.target.value)}
            data-ocid="new_booking.village.input"
          />
        </div>
        <div>
          <p className={labelClass}>{t.workType}</p>
          <select
            className={inputClass}
            value={form.workType}
            onChange={(e) => set("workType", e.target.value)}
            data-ocid="new_booking.work_type.select"
          >
            {services.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </div>

        {/* Duration inputs */}
        <div>
          <p className={labelClass}>{t.duration}</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t.hours}
              </p>
              <input
                id="duration-hours"
                type="number"
                min="0"
                value={durationHours}
                onChange={(e) =>
                  setDurationHours(Math.max(0, Number(e.target.value)))
                }
                className={inputClass}
                data-ocid="new_booking.hours.input"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t.minutes}
              </p>
              <input
                id="duration-minutes"
                type="number"
                min="0"
                max="59"
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(
                    Math.min(59, Math.max(0, Number(e.target.value))),
                  )
                }
                className={inputClass}
                data-ocid="new_booking.minutes.input"
              />
            </div>
          </div>
        </div>

        {/* Calculated amount display */}
        <div
          className={`rounded-xl px-4 py-3 ${
            hasRate
              ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
              : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
          }`}
          data-ocid="new_booking.calc_amount.panel"
        >
          {hasRate ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                {t.calcAmount}
              </span>
              <span className="text-lg font-bold text-green-800 dark:text-green-300">
                ₹{computedAmount.toFixed(2)}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
              ⚠️ {t.rateNotSet} — {form.workType}
            </p>
          )}
        </div>

        <div>
          <p className={labelClass}>{t.dateTime}</p>
          <input
            className={inputClass}
            type="datetime-local"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            data-ocid="new_booking.date.input"
          />
        </div>
        <div>
          <p className={labelClass}>{t.selectTractor}</p>
          <select
            className={inputClass}
            value={form.tractorId}
            onChange={(e) => set("tractorId", e.target.value)}
            data-ocid="new_booking.tractor.select"
          >
            <option value="">-- {t.selectTractor} --</option>
            {tractors.map((tr) => (
              <option key={Number(tr.id)} value={String(tr.id)}>
                {tr.name} ({tr.number})
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={labelClass}>{t.selectDriver}</p>
          <select
            className={inputClass}
            value={form.driverId}
            onChange={(e) => set("driverId", e.target.value)}
            data-ocid="new_booking.driver.select"
          >
            <option value="">-- {t.selectDriver} --</option>
            {drivers.map((dr) => (
              <option key={Number(dr.id)} value={String(dr.id)}>
                {dr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Mode */}
        <div>
          <p className={labelClass}>{t.paymentMode}</p>
          <div className="flex gap-3">
            {["cash", "upi"].map((pm) => (
              <button
                type="button"
                key={pm}
                onClick={() => set("paymentMode", pm)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition ${
                  form.paymentMode === pm
                    ? "border-green-600 bg-green-50 dark:bg-green-900 text-green-700"
                    : "border-gray-300 text-gray-600 dark:text-gray-300 dark:border-gray-500"
                }`}
              >
                {pm === "cash" ? t.cash : t.upi}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={labelClass}>{t.notes}</p>
          <textarea
            className={inputClass}
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            data-ocid="new_booking.notes.textarea"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-4 rounded-xl text-lg shadow"
          data-ocid="new_booking.submit.button"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
}
