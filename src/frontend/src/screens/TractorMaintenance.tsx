import { Bell, Check, Plus, Trash2, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { MaintenanceReminder, Tractor } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useAppStore } from "../store";

export default function TractorMaintenance() {
  const { actor } = useActor();
  const { language } = useAppStore();
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tractorId, setTractorId] = useState("");
  const [reminderType, setReminderType] = useState("Oil Change");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const isGu = language === "gu";

  const maintenanceTypes = [
    isGu ? "તેલ બદલો" : "Oil Change",
    isGu ? "ટાયર તપાસ" : "Tire Check",
    isGu ? "ફિલ્ટર" : "Filter",
    isGu ? "બ્રેક" : "Brake",
    isGu ? "સર્વિસ" : "Service",
    isGu ? "અન્ય" : "Other",
  ];

  const load = useCallback(async () => {
    if (!actor) return;
    const [rem, tr] = await Promise.all([
      actor.getAllMaintenanceReminders(),
      actor.getAllTractors(),
    ]);
    setReminders(rem.sort((a, b) => Number(b.createdAt) - Number(a.createdAt)));
    setTractors(tr);
    setLoading(false);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  const addReminder = async () => {
    if (!actor || !tractorId || !dueDate) return;
    await actor.createMaintenanceReminder({
      id: BigInt(0),
      tractorId: BigInt(tractorId),
      reminderType,
      description,
      dueDate: BigInt(new Date(dueDate).getTime()),
      isDone: false,
      createdAt: BigInt(Date.now()),
    });
    setTractorId("");
    setReminderType(isGu ? "તેલ બદલો" : "Oil Change");
    setDescription("");
    setDueDate("");
    setShowForm(false);
    load();
  };

  const markDone = async (r: MaintenanceReminder) => {
    if (!actor) return;
    await actor.updateMaintenanceReminder(r.id, { ...r, isDone: true });
    load();
  };

  const deleteReminder = async (id: bigint) => {
    if (!actor) return;
    await actor.deleteMaintenanceReminder(id);
    load();
  };

  const getTractorName = (id: bigint) =>
    tractors.find((t) => t.id === id)?.name ?? `#${id}`;

  const now = Date.now();
  const upcoming = reminders.filter(
    (r) => !r.isDone && Number(r.dueDate) >= now,
  );
  const overdue = reminders.filter((r) => !r.isDone && Number(r.dueDate) < now);
  const done = reminders.filter((r) => r.isDone);

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString(isGu ? "gu-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {isGu ? "ટ્રેક્ટર સર્વિસ" : "Tractor Maintenance"}
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus size={16} />
          {isGu ? "ઉમેરો" : "Add"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl shadow p-4 space-y-3 border border-border">
          <select
            className={inputClass}
            value={tractorId}
            onChange={(e) => setTractorId(e.target.value)}
          >
            <option value="">
              {isGu ? "ટ્રેક્ટર પસંદ કરો" : "Select Tractor"}
            </option>
            {tractors.map((t) => (
              <option key={String(t.id)} value={String(t.id)}>
                {t.name} ({t.number})
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={reminderType}
            onChange={(e) => setReminderType(e.target.value)}
          >
            {maintenanceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder={isGu ? "વિગત (વૈકલ્પિક)" : "Description (optional)"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <label
              htmlFor="due-date"
              className="text-sm text-muted-foreground mb-1 block"
            >
              {isGu ? "સર્વિસ ક્યારે કરવાની છે?" : "Due Date"}
            </label>
            <input
              id="due-date"
              type="date"
              className={inputClass}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addReminder}
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

      {loading && (
        <p className="text-center text-muted-foreground py-8">
          {isGu ? "લોડ થઈ રહ્યું છે..." : "Loading..."}
        </p>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-wide">
            {isGu ? "⚠️ ઓવરડ્યૂ" : "⚠️ Overdue"}
          </h2>
          {overdue.map((r) => (
            <ReminderCard
              key={String(r.id)}
              reminder={r}
              tractorName={getTractorName(r.tractorId)}
              onMarkDone={() => markDone(r)}
              onDelete={() => deleteReminder(r.id)}
              formatDate={formatDate}
              isGu={isGu}
              variant="overdue"
            />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-orange-500 uppercase tracking-wide">
            {isGu ? "🔔 આગામી" : "🔔 Upcoming"}
          </h2>
          {upcoming.map((r) => (
            <ReminderCard
              key={String(r.id)}
              reminder={r}
              tractorName={getTractorName(r.tractorId)}
              onMarkDone={() => markDone(r)}
              onDelete={() => deleteReminder(r.id)}
              formatDate={formatDate}
              isGu={isGu}
              variant="upcoming"
            />
          ))}
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-wide">
            {isGu ? "✅ પૂર્ણ" : "✅ Completed"}
          </h2>
          {done.map((r) => (
            <ReminderCard
              key={String(r.id)}
              reminder={r}
              tractorName={getTractorName(r.tractorId)}
              onMarkDone={() => markDone(r)}
              onDelete={() => deleteReminder(r.id)}
              formatDate={formatDate}
              isGu={isGu}
              variant="done"
            />
          ))}
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p>{isGu ? "કોઈ સર્વિસ રિમાઇન્ડર નથી" : "No maintenance reminders"}</p>
          <p className="text-sm mt-1">
            {isGu ? "ઉમેરો બટન દબાવો" : "Tap Add to create one"}
          </p>
        </div>
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  tractorName,
  onMarkDone,
  onDelete,
  formatDate,
  isGu,
  variant,
}: {
  reminder: MaintenanceReminder;
  tractorName: string;
  onMarkDone: () => void;
  onDelete: () => void;
  formatDate: (ms: number) => string;
  isGu: boolean;
  variant: "overdue" | "upcoming" | "done";
}) {
  const whatsappMsg = encodeURIComponent(
    `🚜 Tractor Service Reminder\nTractor: ${tractorName}\nService: ${reminder.reminderType}\nDue: ${formatDate(Number(reminder.dueDate))}${reminder.description ? `\nNote: ${reminder.description}` : ""}`,
  );

  return (
    <div
      className={`bg-card rounded-xl shadow p-4 border ${
        variant === "overdue"
          ? "border-red-200"
          : variant === "done"
            ? "border-green-100 opacity-70"
            : "border-orange-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-foreground text-sm">
              🚜 {tractorName}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                variant === "overdue"
                  ? "bg-red-100 text-red-700"
                  : variant === "done"
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {reminder.reminderType}
            </span>
          </div>
          {reminder.description && (
            <p className="text-sm text-muted-foreground mb-1">
              {reminder.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Bell size={11} />
            <span>
              {isGu ? "સર્વિસ" : "Due"}: {formatDate(Number(reminder.dueDate))}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!reminder.isDone && (
            <>
              <a
                href={`https://wa.me/?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold"
              >
                WA
              </a>
              <button
                type="button"
                onClick={onMarkDone}
                className="p-1.5 bg-primary/10 text-primary rounded-lg"
              >
                <Check size={15} />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 p-1.5"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
