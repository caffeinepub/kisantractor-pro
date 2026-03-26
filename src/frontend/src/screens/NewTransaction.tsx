import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Party } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

interface SavedTxInfo {
  customerName: string;
  mobile: string;
  workType: string;
  totalAmount: number;
  discountAmount: number;
  advanceAmount: number;
  bakiAmount: number;
  txType: "advance" | "balance";
  paymentMode: string;
  date: string;
}

export default function NewTransaction({ onBack, onSaved }: Props) {
  const { actor } = useActor();
  const { language, services, serviceRates } = useAppStore();
  const t = translations[language];

  const [parties, setParties] = useState<Party[]>([]);
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addingParty, setAddingParty] = useState(false);

  const [workType, setWorkType] = useState(services[0] ?? "Ploughing");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [manualAmount, setManualAmount] = useState("");
  const [txType, setTxType] = useState<"advance" | "balance">("advance");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [savedTx, setSavedTx] = useState<SavedTxInfo | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const rates = serviceRates[workType];
  const computedAmount = rates
    ? durationHours * rates.perHour + durationMinutes * rates.perMinute
    : 0;
  const hasRate = !!rates && computedAmount > 0;
  const finalAmount =
    manualAmount !== "" ? Number(manualAmount) : computedAmount;
  const bakiAmount = Math.max(0, finalAmount - discountAmount - advanceAmount);

  const loadParties = useCallback(async () => {
    if (!actor) return;
    try {
      const all = await actor.getAllParties();
      setParties(all);
    } catch (e) {
      console.error(e);
    }
  }, [actor]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()),
  );

  const handleSelectParty = (party: Party) => {
    setSelectedParty(party);
    setPartySearch(party.name);
    setMobileNumber(party.phone ?? "");
    setShowDropdown(false);
    setShowAddNew(false);
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setPartySearch("");
    setMobileNumber("");
    setShowDropdown(false);
    setShowAddNew(false);
  };

  const handleAddNewParty = async () => {
    if (!actor || !newPartyName.trim()) return;
    setAddingParty(true);
    try {
      await actor.createParty({
        id: BigInt(0),
        name: newPartyName.trim(),
        phone: newPartyPhone.trim(),
        village: "",
        createdAt: BigInt(0),
      });
      await loadParties();
      // Auto-select the newly created party
      const refreshed = await actor.getAllParties();
      setParties(refreshed);
      const newP = refreshed.find((p) => p.name === newPartyName.trim());
      if (newP) handleSelectParty(newP);
      setShowAddNew(false);
      setNewPartyName("");
      setNewPartyPhone("");
    } catch (e) {
      console.error(e);
    } finally {
      setAddingParty(false);
    }
  };

  const handleSubmit = async () => {
    if (!actor) return;
    const customerName = selectedParty?.name ?? partySearch.trim();
    if (!customerName) {
      alert(
        language === "gu" ? "ગ્રાહકનું નામ જરૂરી છે" : "Customer name is required",
      );
      return;
    }
    if (!mobileNumber.trim()) {
      alert(
        language === "gu" ? "મોબાઇલ નંબર જરૂરી છે" : "Mobile number is required",
      );
      return;
    }
    if (finalAmount <= 0) {
      alert(language === "gu" ? "રકમ દાખલ કરો" : "Please enter an amount");
      return;
    }
    setSaving(true);
    try {
      await actor.createBooking({
        id: BigInt(0),
        customerName,
        mobile: mobileNumber.trim(),
        village: "",
        workType,
        date: BigInt(new Date(date).getTime()),
        tractorId: BigInt(0),
        driverId: BigInt(0),
        status: txType === "advance" ? "pending" : "completed",
        hoursWorked: durationHours,
        acresWorked: 0,
        rateType: "hourly",
        baseRate: rates?.perHour ?? 0,
        totalAmount: finalAmount,
        discount: discountAmount,
        discountType: "amount",
        finalAmount: finalAmount - discountAmount,
        paymentMode,
        advancePaid: advanceAmount,
        balanceDue: bakiAmount,
        notes: "",
        createdAt: BigInt(Date.now()),
      });
      // Show WhatsApp share popup instead of navigating away
      setSavedTx({
        customerName,
        mobile: mobileNumber.trim(),
        workType,
        totalAmount: finalAmount,
        discountAmount,
        advanceAmount,
        bakiAmount,
        txType,
        paymentMode,
        date,
      });
    } catch (e) {
      console.error(e);
      alert(language === "gu" ? "સાચવવામાં ભૂલ" : "Error saving transaction");
    } finally {
      setSaving(false);
    }
  };

  const buildWhatsAppMessage = (tx: SavedTxInfo) => {
    const dateStr = new Date(tx.date).toLocaleDateString();
    if (language === "gu") {
      const lines = [
        "🚜 *કિસાન ટ્રેક્ટર સેવા*",
        "",
        `ગ્રાહક: ${tx.customerName}`,
        `સેવા: ${tx.workType}`,
        `તારીખ: ${dateStr}`,
        "",
        `કુલ રકમ: ₹${tx.totalAmount.toFixed(0)}`,
        tx.discountAmount > 0 ? `છૂટ: -₹${tx.discountAmount.toFixed(0)}` : null,
        tx.advanceAmount > 0 ? `એડ્વાન્સ: ₹${tx.advanceAmount.toFixed(0)}` : null,
        `બાકી (ઉધાર): ₹${tx.bakiAmount.toFixed(0)}`,
        "",
        `ચૂકવણી: ${tx.paymentMode.toUpperCase()}`,
      ].filter(Boolean);
      return lines.join("\n");
    }
    const lines = [
      "🚜 *Kisan Tractor Service*",
      "",
      `Customer: ${tx.customerName}`,
      `Service: ${tx.workType}`,
      `Date: ${dateStr}`,
      "",
      `Total: ₹${tx.totalAmount.toFixed(0)}`,
      tx.discountAmount > 0
        ? `Discount: -₹${tx.discountAmount.toFixed(0)}`
        : null,
      tx.advanceAmount > 0 ? `Advance: ₹${tx.advanceAmount.toFixed(0)}` : null,
      `Balance (Udhar): ₹${tx.bakiAmount.toFixed(0)}`,
      "",
      `Payment: ${tx.paymentMode.toUpperCase()}`,
    ].filter(Boolean);
    return lines.join("\n");
  };

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  // WhatsApp Share Success Screen
  if (savedTx) {
    const waMsg = buildWhatsAppMessage(savedTx);
    const waUrl = `https://wa.me/${savedTx.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`;
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        {/* Success check */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <span className="text-4xl">✅</span>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            {language === "gu" ? "વ્યવહાર સચવાઈ ગયો!" : "Transaction Saved!"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {savedTx.customerName} · ₹{savedTx.totalAmount.toFixed(0)}
          </p>
        </div>

        {/* Invoice summary card */}
        <div className="w-full bg-card border border-border rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {language === "gu" ? "સેવા" : "Service"}
            </span>
            <span className="font-semibold">{savedTx.workType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.totalAmount}</span>
            <span className="font-semibold">
              ₹{savedTx.totalAmount.toFixed(0)}
            </span>
          </div>
          {savedTx.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.discountAmount}</span>
              <span className="font-semibold text-red-500">
                -₹{savedTx.discountAmount.toFixed(0)}
              </span>
            </div>
          )}
          {savedTx.advanceAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.advanceAmount}</span>
              <span className="font-semibold text-blue-500">
                ₹{savedTx.advanceAmount.toFixed(0)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-bold text-orange-600">{t.bakiAmount}</span>
            <span className="font-bold text-orange-600">
              ₹{savedTx.bakiAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* WhatsApp button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-4 rounded-2xl text-base shadow-lg"
          data-ocid="new_transaction.whatsapp_share.button"
        >
          <span className="text-xl">💬</span>
          {language === "gu"
            ? "WhatsApp પર Invoice મોકલો"
            : "Send Invoice on WhatsApp"}
        </a>

        {/* Skip button */}
        <button
          type="button"
          onClick={onSaved}
          className="w-full border border-border text-foreground font-semibold py-3 rounded-2xl text-sm"
          data-ocid="new_transaction.skip_whatsapp.button"
        >
          {language === "gu" ? "અત્યારે નહીં" : "Skip"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted"
          data-ocid="new_transaction.back_button"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">
          {t.newTransaction}
        </h1>
      </div>

      {/* Transaction Type */}
      <div>
        <p className={labelClass}>{t.transactionType}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTxType("advance")}
            data-ocid="new_transaction.advance.toggle"
            className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all ${
              txType === "advance"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-border text-muted-foreground bg-background"
            }`}
          >
            💰 {t.advanceType}
          </button>
          <button
            type="button"
            onClick={() => setTxType("balance")}
            data-ocid="new_transaction.balance.toggle"
            className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all ${
              txType === "balance"
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground bg-background"
            }`}
          >
            ✅ {t.balanceType}
          </button>
        </div>
      </div>

      {/* Party Search Dropdown */}
      <div ref={dropdownRef}>
        <p className={labelClass}>{t.customerName} *</p>
        <div className="relative">
          <div
            className={`flex items-center border rounded-xl px-3 py-3 bg-background gap-2 ${
              showDropdown
                ? "border-primary ring-2 ring-primary"
                : "border-border"
            }`}
          >
            <Search size={16} className="text-muted-foreground flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              value={partySearch}
              onChange={(e) => {
                setPartySearch(e.target.value);
                setSelectedParty(null);
                setShowDropdown(true);
                setShowAddNew(false);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={
                language === "gu" ? "ગ્રાહક શોધો..." : "Search party..."
              }
              data-ocid="new_transaction.party_search.input"
            />
            {partySearch ? (
              <button type="button" onClick={handleClearParty}>
                <X size={16} className="text-muted-foreground" />
              </button>
            ) : (
              <ChevronDown size={16} className="text-muted-foreground" />
            )}
          </div>

          {/* Selected party badge */}
          {selectedParty && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                ✓ {selectedParty.name}
                {selectedParty.phone && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {selectedParty.phone}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {filteredParties.length > 0 ? (
                filteredParties.map((party) => (
                  <button
                    key={Number(party.id)}
                    type="button"
                    onClick={() => handleSelectParty(party)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left border-b border-border last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-foreground">
                        {party.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {party.name}
                      </p>
                      {party.phone && (
                        <p className="text-xs text-muted-foreground">
                          {party.phone}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {language === "gu" ? "કોઈ પાર્ટી મળી નહીં" : "No party found"}
                </div>
              )}

              {/* Add new party option */}
              <button
                type="button"
                onClick={() => {
                  setNewPartyName(partySearch);
                  setShowAddNew(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 text-primary font-semibold text-sm border-t border-border"
                data-ocid="new_transaction.add_new_party.button"
              >
                <Plus size={16} />
                {language === "gu" ? "નવો પાર્ટી ઉમેરો" : "Add new party"}
              </button>
            </div>
          )}
        </div>

        {/* Inline Add New Party Form */}
        {showAddNew && (
          <div className="mt-3 bg-card border border-primary/30 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">
              {language === "gu" ? "નવો પાર્ટી" : "New Party"}
            </p>
            <input
              className={inputClass}
              placeholder={`${t.partyName} *`}
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              data-ocid="new_transaction.new_party_name.input"
            />
            <input
              className={inputClass}
              placeholder={t.phone}
              type="tel"
              value={newPartyPhone}
              onChange={(e) => setNewPartyPhone(e.target.value)}
              data-ocid="new_transaction.new_party_phone.input"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddNewParty}
                disabled={addingParty || !newPartyName.trim()}
                className="flex-1 bg-primary text-primary-foreground disabled:opacity-50 font-bold py-2.5 rounded-xl text-sm"
                data-ocid="new_transaction.save_new_party.button"
              >
                {addingParty ? t.loading : t.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddNew(false);
                  setNewPartyName("");
                  setNewPartyPhone("");
                }}
                className="flex-1 border border-border text-foreground font-bold py-2.5 rounded-xl text-sm"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Number */}
      <div>
        <p className={labelClass}>{t.mobile} *</p>
        <input
          type="tel"
          className={inputClass}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder={language === "gu" ? "મોબાઇલ નંબર *" : "Mobile number *"}
          data-ocid="new_transaction.mobile.input"
        />
      </div>

      {/* Service */}
      <div>
        <p className={labelClass}>{t.workType}</p>
        <select
          className={inputClass}
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          data-ocid="new_transaction.work_type.select"
        >
          {services.map((svc) => (
            <option key={svc} value={svc}>
              {svc}
            </option>
          ))}
        </select>
      </div>

      {/* Duration */}
      <div>
        <p className={labelClass}>{t.duration}</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{t.hours}</p>
            <input
              type="number"
              min="0"
              value={durationHours}
              onChange={(e) =>
                setDurationHours(Math.max(0, Number(e.target.value)))
              }
              className={inputClass}
              data-ocid="new_transaction.hours.input"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{t.minutes}</p>
            <input
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
              data-ocid="new_transaction.minutes.input"
            />
          </div>
        </div>
      </div>

      {/* Computed Amount */}
      <div
        className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
          hasRate
            ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
            : "bg-muted border border-border"
        }`}
        data-ocid="new_transaction.calc_amount.panel"
      >
        <Calculator
          size={18}
          className={hasRate ? "text-green-700" : "text-muted-foreground"}
        />
        {hasRate ? (
          <div className="flex items-center justify-between flex-1">
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              {t.calcAmount}
            </span>
            <span className="text-lg font-bold text-green-800 dark:text-green-300">
              ₹{computedAmount.toFixed(2)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {rates ? "₹0" : `⚠️ ${t.rateNotSet} — ${workType}`}
          </p>
        )}
      </div>

      {/* Manual Amount */}
      <div>
        <p className={labelClass}>
          {t.amount}{" "}
          <span className="text-muted-foreground font-normal text-xs">
            ({language === "gu" ? "ઓવરરાઇડ કરો" : "override calculated"})
          </span>
        </p>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={manualAmount}
          onChange={(e) => setManualAmount(e.target.value)}
          placeholder={hasRate ? String(computedAmount.toFixed(2)) : "0"}
          data-ocid="new_transaction.amount.input"
        />
      </div>

      {/* Discount */}
      <div>
        <p className={labelClass}>{t.discountAmount}</p>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={discountAmount || ""}
          onChange={(e) =>
            setDiscountAmount(Math.max(0, Number(e.target.value)))
          }
          placeholder="0"
          data-ocid="new_transaction.discount.input"
        />
      </div>

      {/* Advance Amount */}
      <div>
        <p className={labelClass}>{t.advanceAmount}</p>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={advanceAmount || ""}
          onChange={(e) =>
            setAdvanceAmount(Math.max(0, Number(e.target.value)))
          }
          placeholder="0"
          data-ocid="new_transaction.advance_amount.input"
        />
      </div>

      {/* Baki Summary */}
      {finalAmount > 0 && (
        <div className="rounded-xl px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.totalAmount}</span>
              <span className="font-semibold">₹{finalAmount.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t.discountAmount}
                </span>
                <span className="font-semibold text-red-600">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {advanceAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.advanceAmount}</span>
                <span className="font-semibold text-blue-600">
                  -₹{advanceAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
              <span className="font-bold text-orange-700 dark:text-orange-400">
                {t.bakiAmount} (
                {language === "gu" ? "ઉધારમાં ઉમેરાશે" : "added to udhar"})
              </span>
              <span className="font-bold text-orange-700 dark:text-orange-400">
                ₹{bakiAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Mode */}
      <div>
        <p className={labelClass}>{t.paymentMode}</p>
        <div className="flex gap-3">
          {["cash", "upi"].map((pm) => (
            <button
              type="button"
              key={pm}
              onClick={() => setPaymentMode(pm)}
              data-ocid={`new_transaction.${pm}.toggle`}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${
                paymentMode === pm
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground bg-background"
              }`}
            >
              {pm === "cash" ? `💵 ${t.cash}` : `📱 ${t.upi}`}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <p className={labelClass}>{t.dateTime}</p>
        <input
          className={inputClass}
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-ocid="new_transaction.date.input"
        />
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        data-ocid="new_transaction.submit.button"
        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-lg shadow disabled:opacity-60"
      >
        {saving ? t.loading : t.save}
      </button>
    </div>
  );
}
