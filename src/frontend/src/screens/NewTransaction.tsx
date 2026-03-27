import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  Mic,
  MicOff,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Driver, Party, Tractor } from "../backend.d";
import VoiceReview from "../components/VoiceReview";
import { useActor } from "../hooks/useActor";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { parseVoiceTransaction } from "../utils/parseVoiceTransaction";

interface Props {
  onBack: () => void;
  onSaved: () => void;
  prefill?: {
    partyName?: string;
    mobile?: string;
    workType?: string;
    bookingId?: bigint;
  };
  onBookingCompleted?: (bookingId: bigint) => void;
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

export default function NewTransaction({
  onBack,
  onSaved,
  prefill,
  onBookingCompleted,
}: Props) {
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
  const [partialPayment, setPartialPayment] = useState(0);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [cashSplit, setCashSplit] = useState(0);
  const [upiSplit, setUpiSplit] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false);
  const [parsedVoice, setParsedVoice] = useState<ReturnType<
    typeof parseVoiceTransaction
  > | null>(null);
  const [savedTx, setSavedTx] = useState<SavedTxInfo | null>(null);
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedTractorId, setSelectedTractorId] = useState<bigint | null>(
    null,
  );
  const [selectedDriverId, setSelectedDriverId] = useState<bigint | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const voiceLang = language === "gu" ? "gu-IN" : "en-IN";
  const {
    isListening,
    startListening,
    stopListening,
    isSupported: voiceSupported,
  } = useVoiceInput({
    language: voiceLang,
    onResult: (transcript) => {
      const parsedServices = services.map((s) => ({
        name: s,
        perHour: serviceRates[s]?.perHour,
        perMinute: serviceRates[s]?.perMinute,
      }));
      const parsed = parseVoiceTransaction(transcript, parties, parsedServices);
      setParsedVoice(parsed);
      setVoiceReviewOpen(true);
    },
  });

  const loadParties = useCallback(async () => {
    if (!actor) return;
    const [allParties, allTractors, allDrivers] = await Promise.all([
      actor.getAllParties(),
      actor.getAllTractors(),
      actor.getAllDrivers(),
    ]);
    setParties(allParties);
    setTractors(allTractors);
    setDrivers(allDrivers);
  }, [actor]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // Apply prefill
  useEffect(() => {
    if (!prefill) return;
    if (prefill.partyName) setPartySearch(prefill.partyName);
    if (prefill.mobile) setMobileNumber(prefill.mobile);
    if (prefill.workType) setWorkType(prefill.workType);
  }, [prefill]);

  // Select prefilled party from list
  useEffect(() => {
    if (prefill?.partyName && parties.length > 0) {
      const found = parties.find(
        (p) => p.name.toLowerCase() === prefill.partyName?.toLowerCase(),
      );
      if (found) {
        setSelectedParty(found);
        setPartySearch(found.name);
        if (found.phone) setMobileNumber(found.phone);
      }
    }
  }, [prefill, parties]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectParty = (party: Party) => {
    setSelectedParty(party);
    setPartySearch(party.name);
    if (party.phone) setMobileNumber(party.phone);
    setShowDropdown(false);
    setShowAddNew(false);
  };

  const handleClearParty = () => {
    setSelectedParty(null);
    setPartySearch("");
    setMobileNumber("");
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
      const allParties = await actor.getAllParties();
      setParties(allParties);
      const created = allParties.find((p) => p.name === newPartyName.trim());
      if (created) handleSelectParty(created);
      setShowAddNew(false);
      setNewPartyName("");
      setNewPartyPhone("");
    } catch (e) {
      console.error(e);
    }
    setAddingParty(false);
  };

  const handleMicClick = () => {
    if (!voiceSupported) {
      alert(t.voiceNotSupported);
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleVoiceConfirm = (data: {
    partyName: string;
    partyId?: string;
    serviceName: string;
    hours: number;
    minutes: number;
    amount: number;
  }) => {
    if (data.partyName) {
      setPartySearch(data.partyName);
      const found = parties.find(
        (p) => p.name.toLowerCase() === data.partyName?.toLowerCase(),
      );
      if (found) {
        setSelectedParty(found);
        if (found.phone) setMobileNumber(found.phone);
      }
    }
    if (data.serviceName) setWorkType(data.serviceName);
    if (data.hours !== undefined) setDurationHours(data.hours);
    if (data.minutes !== undefined) setDurationMinutes(data.minutes);
    setVoiceReviewOpen(false);
    setParsedVoice(null);
  };

  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()),
  );

  const rates = serviceRates[workType];
  const computedAmount = rates
    ? durationHours * (rates.perHour ?? 0) +
      durationMinutes * (rates.perMinute ?? 0)
    : 0;
  const hasRate = !!(rates && (rates.perHour || rates.perMinute));
  const finalAmount = manualAmount ? Number(manualAmount) : computedAmount;
  const bakiAmount = Math.max(0, finalAmount - discountAmount - advanceAmount);
  const udharAmount = Math.max(
    0,
    finalAmount - discountAmount - partialPayment,
  );

  const customerName = selectedParty?.name || partySearch.trim();
  const mobile = selectedParty?.phone || mobileNumber.trim();

  const handleSave = async () => {
    if (!actor) return;
    if (txType === "balance" && !customerName) {
      alert(
        language === "gu"
          ? "બાકી વ્યવહાર માટે પાર્ટી જરૂરી છે"
          : "Party is required for balance transactions",
      );
      return;
    }

    if (finalAmount <= 0) {
      alert(language === "gu" ? "રકમ દાખલ કરો" : "Please enter an amount");
      return;
    }

    setSaving(true);
    try {
      let effectivePaymentMode: string;
      let effectiveAdvancePaid: number;
      let effectiveBalanceDue: number;

      if (txType === "balance") {
        effectivePaymentMode = "udhar";
        effectiveAdvancePaid = partialPayment;
        effectiveBalanceDue = udharAmount;
      } else {
        effectivePaymentMode =
          paymentMode === "split"
            ? `cash:${cashSplit}|upi:${upiSplit}`
            : paymentMode;
        effectiveAdvancePaid = advanceAmount;
        effectiveBalanceDue = bakiAmount;
      }

      await actor.createBooking({
        id: BigInt(0),
        customerName,
        mobile,
        village: "",
        workType,
        date: BigInt(new Date(date).getTime()),
        tractorId: selectedTractorId ?? BigInt(0),
        driverId: selectedDriverId ?? BigInt(0),
        status: txType === "advance" ? "pending" : "completed",
        hoursWorked: durationHours,
        acresWorked: 0,
        rateType: "hourly",
        baseRate: rates?.perHour ?? 0,
        totalAmount: finalAmount,
        discount: discountAmount,
        discountType: "amount",
        finalAmount: finalAmount - discountAmount,
        paymentMode: effectivePaymentMode,
        advancePaid: effectiveAdvancePaid,
        balanceDue: effectiveBalanceDue,
        notes: "",
        createdAt: BigInt(Date.now()),
      });

      // Store photo
      if (photoBase64) {
        try {
          const photos = JSON.parse(
            localStorage.getItem("kisanPhotos") || "[]",
          ) as Array<{ key: string; photo: string; date: string }>;
          photos.unshift({
            key: `${customerName}-${workType}-${new Date(date).toLocaleDateString()}`,
            photo: photoBase64,
            date: new Date(date).toLocaleDateString(),
          });
          localStorage.setItem(
            "kisanPhotos",
            JSON.stringify(photos.slice(0, 50)),
          );
        } catch {
          /* ignore */
        }
      }

      setSavedTx({
        customerName,
        mobile,
        workType,
        totalAmount: finalAmount,
        discountAmount,
        advanceAmount: effectiveAdvancePaid,
        bakiAmount: effectiveBalanceDue,
        txType,
        paymentMode: effectivePaymentMode,
        date,
      });

      // Auto-create payment reminder for baki transactions
      if (txType === "balance" && udharAmount > 0 && customerName) {
        try {
          const reminder = {
            id: String(Date.now()),
            partyName: customerName,
            mobile: mobile || "",
            amount: udharAmount,
            dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
            note: `${workType} - Auto reminder`,
            isDone: false,
          };
          const existing = JSON.parse(
            localStorage.getItem("kisan_payment_reminders") || "[]",
          );
          localStorage.setItem(
            "kisan_payment_reminders",
            JSON.stringify([reminder, ...existing]),
          );
        } catch {
          /* ignore */
        }
      }

      // Mark booking as completed if this transaction came from a booking
      if (prefill?.bookingId) {
        try {
          const existingBooking = await actor.getBooking(prefill.bookingId);
          await actor.updateBooking(prefill.bookingId, {
            ...existingBooking,
            status: "completed",
          });
          if (onBookingCompleted) onBookingCompleted(prefill.bookingId);
        } catch (err) {
          console.error("Failed to mark booking as completed:", err);
        }
      }
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
        tx.advanceAmount > 0 ? `ભર્યા: ₹${tx.advanceAmount.toFixed(0)}` : null,
        `ઉધાર (બાકી): ₹${tx.bakiAmount.toFixed(0)}`,
        "",
        tx.paymentMode !== "udhar"
          ? tx.paymentMode.startsWith("cash:")
            ? `ચૂકવણી: સ્પલિટ (${tx.paymentMode.replace("|", " + ").replace("cash:", "💵₹").replace("upi:", "📱₹")})`
            : `ચૂકવણી: ${tx.paymentMode.toUpperCase()}`
          : "પ્રકાર: ઉધાર",
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
      tx.advanceAmount > 0 ? `Paid Now: ₹${tx.advanceAmount.toFixed(0)}` : null,
      `Balance (Udhar): ₹${tx.bakiAmount.toFixed(0)}`,
      "",
      tx.paymentMode !== "udhar"
        ? `Payment: ${tx.paymentMode.toUpperCase()}`
        : "Type: Udhar",
    ].filter(Boolean);
    return lines.join("\n");
  };

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  // Voice Review Modal - shown as overlay via props

  // WhatsApp Share Success Screen
  if (savedTx) {
    const waMsg = buildWhatsAppMessage(savedTx);
    const waUrl = savedTx.mobile
      ? `https://wa.me/${savedTx.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(waMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
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
              <span className="text-muted-foreground">
                {savedTx.txType === "balance"
                  ? language === "gu"
                    ? "આ વખત ભર્યા"
                    : "Paid Now"
                  : t.advanceAmount}
              </span>
              <span className="font-semibold text-blue-500">
                ₹{savedTx.advanceAmount.toFixed(0)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-bold text-orange-600">
              {language === "gu" ? "ઉધાર (બાકી)" : "Udhar (Balance)"}
            </span>
            <span className="font-bold text-orange-600">
              ₹{savedTx.bakiAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {savedTx.mobile && (
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
        )}

        <button
          type="button"
          onClick={onSaved}
          className="w-full border border-border text-foreground font-semibold py-3 rounded-2xl text-sm"
          data-ocid="new_transaction.skip_whatsapp.button"
        >
          {language === "gu" ? "અત્યારે નહીં" : "Done"}
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
        <h1 className="text-xl font-bold text-foreground flex-1">
          {t.newTransaction}
        </h1>
        <button
          type="button"
          onClick={handleMicClick}
          data-ocid="new_transaction.voice_input.button"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
            isListening
              ? "bg-red-500 text-white animate-pulse shadow-lg"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
          title={t.voiceInput}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span className="hidden sm:inline">
            {isListening
              ? language === "gu"
                ? "સાંભળી રહ્યો..."
                : "Listening..."
              : language === "gu"
                ? "વોઇસ"
                : "Voice"}
          </span>
        </button>
      </div>

      {/* Transaction Type */}
      <div>
        <p className={labelClass}>{t.transactionType}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setTxType("advance");
              setPartialPayment(0);
            }}
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
            onClick={() => {
              setTxType("balance");
              setPartialPayment(0);
            }}
            data-ocid="new_transaction.balance.toggle"
            className={`flex-1 py-4 rounded-xl text-sm font-bold border-2 transition-all ${
              txType === "balance"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                : "border-border text-muted-foreground bg-background"
            }`}
          >
            📒 {t.balanceType}
          </button>
        </div>
      </div>

      {/* Advance type info banner */}
      {txType === "advance" && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-2.5 text-xs text-blue-700 dark:text-blue-300">
          💡{" "}
          {language === "gu"
            ? "રોકડ: Party ની વિગત ભરવી જરૂરી નથી. ખાલી રહેવા દો તો Cash/UPI Entry સેવ થશે."
            : "Rokad: Party details are optional. Leave blank to save as Cash/UPI Entry."}
        </div>
      )}

      {/* Balance type info banner */}
      {txType === "balance" && (
        <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 px-4 py-2.5 text-xs text-orange-700 dark:text-orange-300">
          📒{" "}
          {language === "gu"
            ? 'Baki: ઉધાર એન્ટ્રી. Party ની વિગત જરૂરી છે. જે રકમ ભરે તે "આ વખત ભરવું" માં નાખો.'
            : "Baki: Udhar entry. Party details required. Enter partial payment if party is paying some amount now."}
        </div>
      )}

      {/* Party Search Dropdown */}
      <div ref={dropdownRef}>
        <p className={labelClass}>
          {t.customerName}{" "}
          {txType === "advance" ? (
            <span className="text-muted-foreground font-normal text-xs">
              ({language === "gu" ? "વૈકલ્પિક" : "optional"})
            </span>
          ) : (
            <span className="text-red-500">*</span>
          )}
        </p>
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
                txType === "advance"
                  ? language === "gu"
                    ? "ગ્રાહક શોધો (વૈકલ્પિક)"
                    : "Search party (optional)"
                  : language === "gu"
                    ? "ગ્રાહક શોધો..."
                    : "Search party..."
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
                  {language === "gu" ? "કોઈ પાર્ટી મળી નહી" : "No party found"}
                </div>
              )}
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
        <p className={labelClass}>
          {t.mobile}{" "}
          {txType === "advance" ? (
            <span className="text-muted-foreground font-normal text-xs">
              ({language === "gu" ? "વૈકલ્પિક" : "optional"})
            </span>
          ) : (
            <span className="text-red-500">*</span>
          )}
        </p>
        <input
          type="tel"
          className={inputClass}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          placeholder={
            txType === "advance"
              ? language === "gu"
                ? "મોબાઇલ નંબર (વૈકલ્પિક)"
                : "Mobile number (optional)"
              : language === "gu"
                ? "મોબાઇલ નંબર *"
                : "Mobile number *"
          }
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

      {/* Tractor Optional */}
      <div>
        <p className={labelClass}>
          {language === "gu" ? "Tractor (Optional)" : "Tractor (Optional)"}
        </p>
        <select
          className={inputClass}
          value={selectedTractorId !== null ? selectedTractorId.toString() : ""}
          onChange={(e) =>
            setSelectedTractorId(e.target.value ? BigInt(e.target.value) : null)
          }
          data-ocid="new_transaction.tractor.select"
        >
          <option value="">
            {language === "gu"
              ? "-- Tractor pasand karo (optional) --"
              : "-- Select Tractor (Optional) --"}
          </option>
          {tractors.map((tr) => (
            <option key={tr.id.toString()} value={tr.id.toString()}>
              {tr.name} ({tr.number})
            </option>
          ))}
        </select>
      </div>

      {/* Driver Optional */}
      <div>
        <p className={labelClass}>
          {language === "gu" ? "Driver (Optional)" : "Driver (Optional)"}
        </p>
        <select
          className={inputClass}
          value={selectedDriverId !== null ? selectedDriverId.toString() : ""}
          onChange={(e) =>
            setSelectedDriverId(e.target.value ? BigInt(e.target.value) : null)
          }
          data-ocid="new_transaction.driver.select"
        >
          <option value="">
            {language === "gu"
              ? "-- Driver pasand karo (optional) --"
              : "-- Select Driver (Optional) --"}
          </option>
          {drivers.map((dr) => (
            <option key={dr.id.toString()} value={dr.id.toString()}>
              {dr.name} ({dr.phone})
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

      {/* Advance Amount -- only for advance type */}
      {txType === "advance" && (
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
      )}

      {/* Partial Payment -- only for balance type */}
      {txType === "balance" && (
        <div>
          <p className={labelClass}>
            {language === "gu" ? "આ વખત ભરવું" : "Paying Now (Partial)"}{" "}
            <span className="text-muted-foreground font-normal text-xs">
              ({language === "gu" ? "વૈકલ્પિક" : "optional"})
            </span>
          </p>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={partialPayment || ""}
            onChange={(e) =>
              setPartialPayment(Math.max(0, Number(e.target.value)))
            }
            placeholder="0"
            data-ocid="new_transaction.partial_payment.input"
          />
        </div>
      )}

      {/* Summary for advance type */}
      {finalAmount > 0 && txType === "advance" && (
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

      {/* Udhar Summary for balance type */}
      {finalAmount > 0 && txType === "balance" && (
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
            {partialPayment > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === "gu" ? "આ વખત ભર્યા" : "Paying Now"}
                </span>
                <span className="font-semibold text-blue-600">
                  -₹{partialPayment.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
              <span className="font-bold text-orange-700 dark:text-orange-400">
                📒 {language === "gu" ? "ઉધાર (બાકી)" : "Udhar (Balance Due)"}
              </span>
              <span className="font-bold text-orange-700 dark:text-orange-400">
                ₹{udharAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Photo Attach (Optional) */}
      <div>
        <p className={labelClass}>
          {language === "gu" ? "Photo (વૈકલ્પિક)" : "Photo (Optional)"}
        </p>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            id="tx-photo-input"
            data-ocid="new_transaction.photo.upload_button"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 600 * 1024) {
                alert(
                  language === "gu"
                    ? "Photo moti chhe (max 500KB)"
                    : "Photo too large (max 500KB)",
                );
                return;
              }
              const reader = new FileReader();
              reader.onload = (ev) =>
                setPhotoBase64(ev.target?.result as string);
              reader.readAsDataURL(file);
            }}
          />
          <label
            htmlFor="tx-photo-input"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm cursor-pointer hover:bg-muted"
          >
            📷{" "}
            {photoBase64
              ? language === "gu"
                ? "Photo badlo"
                : "Change Photo"
              : language === "gu"
                ? "Camera/Gallery thi photo"
                : "Take/Choose Photo"}
          </label>
          {photoBase64 && (
            <div className="relative">
              <img
                src={photoBase64}
                alt="Preview"
                className="w-full max-h-40 object-cover rounded-xl border border-border"
              />
              <button
                type="button"
                onClick={() => setPhotoBase64(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                X
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Mode -- ONLY for advance type */}
      {txType === "advance" && (
        <div>
          <p className={labelClass}>{t.paymentMode}</p>
          <div className="flex gap-2">
            {(["cash", "upi", "split"] as const).map((pm) => (
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
                {pm === "cash"
                  ? `💵 ${t.cash}`
                  : pm === "upi"
                    ? `📱 ${t.upi}`
                    : `🔀 ${language === "gu" ? "સ્પલિટ" : "Split"}`}
              </button>
            ))}
          </div>
          {/* Split inputs */}
          {paymentMode === "split" && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {language === "gu" ? "💵 કેશ રકમ" : "💵 Cash Amount"}
                  </p>
                  <input
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    type="number"
                    min={0}
                    value={cashSplit || ""}
                    placeholder="0"
                    onChange={(e) => setCashSplit(Number(e.target.value) || 0)}
                    data-ocid="new_transaction.cash_split.input"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {language === "gu" ? "📱 UPI રકમ" : "📱 UPI Amount"}
                  </p>
                  <input
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    type="number"
                    min={0}
                    value={upiSplit || ""}
                    placeholder="0"
                    onChange={(e) => setUpiSplit(Number(e.target.value) || 0)}
                    data-ocid="new_transaction.upi_split.input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div>
        <p className={labelClass}>{t.dateTime}</p>
        <input
          type="datetime-local"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-ocid="new_transaction.date.input"
        />
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        data-ocid="new_transaction.submit_button"
        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl text-base shadow-lg disabled:opacity-50"
      >
        {saving ? t.loading : t.save}
      </button>

      {/* Voice Review Modal */}
      <VoiceReview
        open={voiceReviewOpen}
        parsed={parsedVoice}
        parties={parties}
        services={services}
        serviceRates={serviceRates}
        language={language}
        onConfirm={handleVoiceConfirm}
        onClose={() => {
          setVoiceReviewOpen(false);
          setParsedVoice(null);
        }}
      />
    </div>
  );
}
