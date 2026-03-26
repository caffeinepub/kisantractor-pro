import { ArrowLeft, ChevronDown, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Party } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { translations } from "../i18n";
import { useAppStore } from "../store";

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

export default function PaymentIn({ onBack, onSaved }: Props) {
  const { actor } = useActor();
  const { language } = useAppStore();
  const t = translations[language];

  const [parties, setParties] = useState<Party[]>([]);
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addingParty, setAddingParty] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const netPayment = Math.max(0, paymentAmount - discountAmount);

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
    setShowDropdown(false);
    setShowAddNew(false);
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setPartySearch("");
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
    if (paymentAmount <= 0) {
      alert(
        language === "gu"
          ? "ચૂકવણી રકમ દાખલ કરો"
          : "Please enter payment amount",
      );
      return;
    }
    setSaving(true);
    try {
      await actor.createBooking({
        id: BigInt(0),
        customerName,
        mobile: selectedParty?.phone ?? "",
        village: "",
        workType: "Payment Received",
        date: BigInt(new Date(date).getTime()),
        tractorId: BigInt(0),
        driverId: BigInt(0),
        status: "completed",
        hoursWorked: 0,
        acresWorked: 0,
        rateType: "hourly",
        baseRate: 0,
        totalAmount: paymentAmount,
        discount: discountAmount,
        discountType: "amount",
        finalAmount: netPayment,
        paymentMode,
        advancePaid: netPayment,
        balanceDue: 0,
        notes: "Payment received",
        createdAt: BigInt(Date.now()),
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert(language === "gu" ? "સાચવવામાં ભૂલ" : "Error saving payment");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted"
          data-ocid="payment_in.back_button"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t.paymentIn}</h1>
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
              data-ocid="payment_in.party_search.input"
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
                data-ocid="payment_in.add_new_party.button"
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
              data-ocid="payment_in.new_party_name.input"
            />
            <input
              className={inputClass}
              placeholder={t.phone}
              type="tel"
              value={newPartyPhone}
              onChange={(e) => setNewPartyPhone(e.target.value)}
              data-ocid="payment_in.new_party_phone.input"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddNewParty}
                disabled={addingParty || !newPartyName.trim()}
                className="flex-1 bg-primary text-primary-foreground disabled:opacity-50 font-bold py-2.5 rounded-xl text-sm"
                data-ocid="payment_in.save_new_party.button"
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

      {/* Payment Amount */}
      <div>
        <p className={labelClass}>{t.paymentAmount} *</p>
        <input
          type="number"
          min="0"
          className={inputClass}
          value={paymentAmount || ""}
          onChange={(e) =>
            setPaymentAmount(Math.max(0, Number(e.target.value)))
          }
          placeholder="0"
          data-ocid="payment_in.amount.input"
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
          data-ocid="payment_in.discount.input"
        />
      </div>

      {/* Net Payment Summary */}
      {paymentAmount > 0 && (
        <div className="rounded-xl px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.paymentAmount}</span>
              <span className="font-semibold">₹{paymentAmount.toFixed(2)}</span>
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
            <div className="flex justify-between border-t border-green-200 dark:border-green-700 pt-1 mt-1">
              <span className="font-bold text-green-700 dark:text-green-400">
                {t.netPayment}
              </span>
              <span className="font-bold text-green-700 dark:text-green-400">
                ₹{netPayment.toFixed(2)}
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
              data-ocid={`payment_in.${pm}.toggle`}
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
          data-ocid="payment_in.date.input"
        />
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        data-ocid="payment_in.submit.button"
        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl text-lg shadow disabled:opacity-60"
      >
        {saving ? t.loading : t.save}
      </button>
    </div>
  );
}
