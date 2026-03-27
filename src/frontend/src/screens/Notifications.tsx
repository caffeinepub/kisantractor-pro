import { Bell, MessageCircle, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MaintenanceReminder, Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAppStore } from "../store";

interface PaymentReminder {
  id: string;
  partyName: string;
  mobile: string;
  amount: number;
  dueDate: number;
  note: string;
  isDone: boolean;
}

function loadPaymentReminders(): PaymentReminder[] {
  try {
    return JSON.parse(localStorage.getItem("kisan_payment_reminders") || "[]");
  } catch {
    return [];
  }
}

function savePaymentReminders(reminders: PaymentReminder[]) {
  localStorage.setItem("kisan_payment_reminders", JSON.stringify(reminders));
}

export default function Notifications() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const isGu = language === "gu";

  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>(
    () => loadPaymentReminders(),
  );
  const [maintenanceReminders, setMaintenanceReminders] = useState<
    MaintenanceReminder[]
  >([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [tab, setTab] = useState<"payment" | "maintenance">("payment");
  const [showForm, setShowForm] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const loadMaintenance = useCallback(async () => {
    if (!actor) return;
    const [rem, tr] = await Promise.all([
      actor.getAllMaintenanceReminders(),
      actor.getAllTractors(),
    ]);
    setMaintenanceReminders(rem.filter((r) => !r.isDone));
    setTractors(tr);
  }, [actor]);

  useEffect(() => {
    loadMaintenance();
  }, [loadMaintenance]);

  const addPaymentReminder = () => {
    if (!partyName || !amount || !dueDate) return;
    const newReminder: PaymentReminder = {
      id: String(Date.now()),
      partyName,
      mobile,
      amount: Number(amount),
      dueDate: new Date(dueDate).getTime(),
      note,
      isDone: false,
    };
    const updated = [newReminder, ...paymentReminders];
    setPaymentReminders(updated);
    savePaymentReminders(updated);
    setPartyName("");
    setMobile("");
    setAmount("");
    setDueDate("");
    setNote("");
    setShowForm(false);
  };

  const markPaymentDone = (id: string) => {
    const updated = paymentReminders.map((r) =>
      r.id === id ? { ...r, isDone: true } : r,
    );
    setPaymentReminders(updated);
    savePaymentReminders(updated);
  };

  const deletePaymentReminder = (id: string) => {
    const updated = paymentReminders.filter((r) => r.id !== id);
    setPaymentReminders(updated);
    savePaymentReminders(updated);
  };

  const getTractorName = (id: bigint) =>
    tractors.find((t) => t.id === id)?.name ?? `#${id}`;

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(isGu ? "gu-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const now = Date.now();
  const pendingPayments = paymentReminders.filter((r) => !r.isDone);
  const donePayments = paymentReminders.filter((r) => r.isDone);
  const overdueMain = maintenanceReminders.filter(
    (r) => Number(r.dueDate) < now,
  );
  const upcomingMain = maintenanceReminders.filter(
    (r) => Number(r.dueDate) >= now,
  );

  const totalBadge = pendingPayments.length + overdueMain.length;

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">
            {isGu ? "સૂચના" : "Notifications"}
          </h1>
          {totalBadge > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {totalBadge}
            </span>
          )}
        </div>
        {tab === "payment" && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold"
          >
            + {isGu ? "રિમાઇન્ડર" : "Reminder"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setTab("payment")}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === "payment"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground"
          }`}
        >
          <MessageCircle size={15} />
          {isGu ? "ચૂકવણી" : "Payment"}
          {pendingPayments.length > 0 && (
            <span
              className={`text-xs rounded-full px-1.5 font-bold ${
                tab === "payment"
                  ? "bg-white text-primary"
                  : "bg-red-500 text-white"
              }`}
            >
              {pendingPayments.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("maintenance")}
          className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            tab === "maintenance"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground"
          }`}
        >
          <Wrench size={15} />
          {isGu ? "સર્વિસ" : "Service"}
          {overdueMain.length > 0 && (
            <span
              className={`text-xs rounded-full px-1.5 font-bold ${
                tab === "maintenance"
                  ? "bg-white text-primary"
                  : "bg-red-500 text-white"
              }`}
            >
              {overdueMain.length}
            </span>
          )}
        </button>
      </div>

      {/* Payment Reminders Tab */}
      {tab === "payment" && (
        <div className="space-y-3">
          {showForm && (
            <div className="bg-card rounded-xl shadow p-4 space-y-3 border border-border">
              <input
                className={inputClass}
                placeholder={isGu ? "પાર્ટીનું નામ" : "Party Name"}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder={isGu ? "મોબાઇલ (વૈકલ્પિક)" : "Mobile (optional)"}
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder={isGu ? "ઉધાર રકમ (₹)" : "Pending Amount (₹)"}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div>
                <label
                  htmlFor="reminder-date"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  {isGu ? "ક્યારે યાદ અપાવવું?" : "Reminder Date"}
                </label>
                <input
                  id="reminder-date"
                  type="date"
                  className={inputClass}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <input
                className={inputClass}
                placeholder={isGu ? "નોંધ (વૈકલ્પિક)" : "Note (optional)"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addPaymentReminder}
                  className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl"
                >
                  {isGu ? "સાચવો" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-border text-foreground font-bold py-3 rounded-xl"
                >
                  {isGu ? "રદ" : "Cancel"}
                </button>
              </div>
            </div>
          )}

          {pendingPayments.map((r) => {
            const isOverdue = r.dueDate < now;
            const waMsg = encodeURIComponent(
              `🙏 ${isGu ? "નમસ્તે" : "Hello"} ${r.partyName}!\n${isGu ? "આપનો ઉધાર" : "Pending payment"}: ₹${r.amount}${r.note ? `\n${r.note}` : ""}\n${isGu ? "કૃપા કરીને ચૂકવો" : "Please clear your dues"} 🙏`,
            );
            return (
              <div
                key={r.id}
                className={`bg-card rounded-xl shadow p-4 border ${
                  isOverdue ? "border-red-200" : "border-orange-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{r.partyName}</p>
                    <p className="text-lg font-bold text-red-600">
                      ₹{r.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isGu ? "તારીખ" : "Due"}: {formatDate(r.dueDate)}
                      {isOverdue && (
                        <span className="ml-2 text-red-500 font-semibold">
                          ({isGu ? "ઓવરડ્યૂ" : "Overdue"})
                        </span>
                      )}
                    </p>
                    {r.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.mobile && (
                      <>
                        <a
                          href={`https://wa.me/91${r.mobile}?text=${waMsg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold"
                        >
                          WA
                        </a>
                        <a
                          href={`sms:+91${r.mobile}?body=${waMsg}`}
                          className="p-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                        >
                          SMS
                        </a>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => markPaymentDone(r.id)}
                      className="p-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePaymentReminder(r.id)}
                      className="text-red-400 p-1.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {donePayments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {isGu ? "✅ ચૂકવ્યા" : "✅ Done"}
              </p>
              {donePayments.map((r) => (
                <div
                  key={r.id}
                  className="bg-card rounded-xl p-3 border border-border opacity-60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {r.partyName}
                    </p>
                    <p className="text-sm text-green-600">
                      ₹{r.amount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deletePaymentReminder(r.id)}
                    className="text-red-400 p-1.5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingPayments.length === 0 && donePayments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>{isGu ? "કોઈ ચૂકવણી રિમાઇન્ડર નથી" : "No payment reminders"}</p>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Reminders Tab */}
      {tab === "maintenance" && (
        <div className="space-y-3">
          {overdueMain.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
                ⚠️ {isGu ? "ઓવરડ્યૂ" : "Overdue"}
              </p>
              {overdueMain.map((r) => (
                <MaintenanceCard
                  key={String(r.id)}
                  r={r}
                  tractorName={getTractorName(r.tractorId)}
                  formatDate={formatDate}
                  isGu={isGu}
                  variant="overdue"
                />
              ))}
            </div>
          )}
          {upcomingMain.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">
                🔔 {isGu ? "આગામી" : "Upcoming"}
              </p>
              {upcomingMain.map((r) => (
                <MaintenanceCard
                  key={String(r.id)}
                  r={r}
                  tractorName={getTractorName(r.tractorId)}
                  formatDate={formatDate}
                  isGu={isGu}
                  variant="upcoming"
                />
              ))}
            </div>
          )}
          {maintenanceReminders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench size={40} className="mx-auto mb-3 opacity-30" />
              <p>
                {isGu ? "કોઈ સર્વિસ રિમાઇન્ડર નથી" : "No maintenance reminders"}
              </p>
              <p className="text-sm mt-1">
                {isGu
                  ? "ટ્રેક્ટર સર્વિસ સ્ક્રીન પર ઉમેરો"
                  : "Add from Tractor Maintenance screen"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MaintenanceCard({
  r,
  tractorName,
  formatDate,
  isGu,
  variant,
}: {
  r: MaintenanceReminder;
  tractorName: string;
  formatDate: (ms: number) => string;
  isGu: boolean;
  variant: "overdue" | "upcoming";
}) {
  const waMsg = encodeURIComponent(
    `🚜 Tractor Service Due\nTractor: ${tractorName}\nService: ${r.reminderType}\nDue: ${formatDate(Number(r.dueDate))}${r.description ? `\nNote: ${r.description}` : ""}`,
  );
  return (
    <div
      className={`bg-card rounded-xl shadow p-4 border ${
        variant === "overdue" ? "border-red-200" : "border-orange-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground text-sm">
              🚜 {tractorName}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                variant === "overdue"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {r.reminderType}
            </span>
          </div>
          {r.description && (
            <p className="text-sm text-muted-foreground mb-1">
              {r.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {isGu ? "સર્વિસ" : "Due"}: {formatDate(Number(r.dueDate))}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <a
            href={`https://wa.me/?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold"
          >
            WA
          </a>
          <a
            href={`sms:?body=${waMsg}`}
            className="p-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
          >
            SMS
          </a>
        </div>
      </div>
    </div>
  );
}
