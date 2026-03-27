import {
  ArrowLeft,
  ChevronDown,
  Mic,
  MicOff,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Party } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { translations } from "../i18n";
import { useAppStore } from "../store";
import { getCache, setCache } from "../utils/dataCache";
import { parseVoiceTransaction } from "../utils/parseVoiceTransaction";

interface Props {
  onBack: () => void;
  onSaved: () => void;
}

export default function NewBooking({ onBack, onSaved }: Props) {
  const { actor } = useActor();
  const { language, services, serviceRates } = useAppStore();
  const t = translations[language];

  const [parties, setParties] = useState<Party[]>(() =>
    getCache<Party>("parties"),
  );
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyPhone, setNewPartyPhone] = useState("");
  const [addingParty, setAddingParty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState("");

  const [workType, setWorkType] = useState(services[0] ?? "Ploughing");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().slice(0, 16),
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  const voiceLang = language === "gu" ? "gu-IN" : "en-IN";
  const { isListening, startListening, stopListening, isSupported } =
    useVoiceInput({
      language: voiceLang,
      onResult: (transcript) => {
        const voiceServices = services.map((s) => ({
          name: s,
          perHour: serviceRates?.[s]?.perHour,
          perMinute: serviceRates?.[s]?.perMinute,
        }));
        const parsed = parseVoiceTransaction(
          transcript,
          parties,
          voiceServices,
        );
        let filled: string[] = [];
        if (parsed.partyName) {
          setPartySearch(parsed.partyName);
          setSelectedParty(null);
          // Try to auto-select matching party
          const match = parties.find(
            (p) => p.name.toLowerCase() === parsed.partyName?.toLowerCase(),
          );
          if (match) {
            setSelectedParty(match);
            setMobileNumber(match.phone ?? "");
          }
          filled.push(parsed.partyName);
        }
        if (parsed.serviceName) {
          setWorkType(parsed.serviceName);
          filled.push(parsed.serviceName);
        }
        if (filled.length > 0) {
          setVoiceBanner(
            language === "gu"
              ? `🎤 Voice ભર્યું: ${filled.join(" - ")}`
              : `🎤 Voice filled: ${filled.join(" - ")}`,
          );
          setTimeout(() => setVoiceBanner(""), 3000);
        }
      },
    });

  const loadParties = useCallback(async () => {
    if (!actor) return;
    try {
      const all = await actor.getAllParties();
      setCache("parties", all);
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
    setSaving(true);
    try {
      await actor.createBooking({
        id: BigInt(0),
        customerName,
        mobile: mobileNumber.trim(),
        village: "",
        workType,
        date: BigInt(new Date(bookingDate).getTime()),
        tractorId: BigInt(0),
        driverId: BigInt(0),
        status: "pending",
        hoursWorked: 0,
        acresWorked: 0,
        rateType: "hourly",
        baseRate: 0,
        totalAmount: 0,
        discount: 0,
        discountType: "percent",
        finalAmount: 0,
        paymentMode: "cash",
        advancePaid: 0,
        balanceDue: 0,
        notes: "",
        createdAt: BigInt(Date.now()),
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert(language === "gu" ? "સાચવવામાં ભૂલ" : "Error saving booking");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft size={22} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">
          {t.newBooking}
        </h1>
        {isSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-2 rounded-full transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            title={isListening ? "Stop" : "Voice Input"}
            data-ocid="new_booking.voice.button"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
      </div>

      {voiceBanner && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-2.5 text-xs text-green-700 dark:text-green-300 font-medium">
          {voiceBanner}
        </div>
      )}

      {isListening && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-2.5 text-xs text-red-700 dark:text-red-300 text-center font-medium">
          {language === "gu" ? "🎤 સાંભળી રહ્યો છું..." : "🎤 Listening..."}
        </div>
      )}

      <div className="space-y-4">
        {/* Party Search */}
        <div>
          <p className={labelClass}>{t.customerName} *</p>
          <div className="relative" ref={dropdownRef}>
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-3 text-muted-foreground"
              />
              <input
                className={`${inputClass} pl-9 pr-9`}
                value={partySearch}
                onChange={(e) => {
                  setPartySearch(e.target.value);
                  setSelectedParty(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={
                  language === "gu" ? "Party શોધો..." : "Search party..."
                }
                data-ocid="new_booking.customer_name.input"
              />
              {partySearch && (
                <button
                  type="button"
                  onClick={handleClearParty}
                  className="absolute right-3 text-muted-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute z-50 w-full bg-card border border-border rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                {filteredParties.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {language === "gu" ? "Party મળી નહીં" : "No parties found"}
                  </div>
                )}
                {filteredParties.map((p) => (
                  <button
                    type="button"
                    key={Number(p.id)}
                    onClick={() => handleSelectParty(p)}
                    className="w-full text-left px-4 py-3 hover:bg-muted text-sm font-medium text-foreground border-b border-border last:border-0"
                  >
                    <span className="font-semibold">{p.name}</span>
                    {p.phone && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {p.phone}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowAddNew(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-primary font-semibold text-sm hover:bg-muted"
                >
                  <Plus size={16} />
                  {language === "gu" ? "નવી Party ઉમેરો" : "Add new party"}
                </button>
              </div>
            )}
          </div>

          {showAddNew && (
            <div className="mt-2 bg-muted/50 border border-border rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {language === "gu" ? "નવી Party" : "New Party"}
              </p>
              <input
                className={inputClass}
                placeholder={
                  language === "gu" ? "Party નું નામ *" : "Party name *"
                }
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
              />
              <input
                className={inputClass}
                type="tel"
                placeholder={language === "gu" ? "મોબાઇલ નંબર" : "Mobile number"}
                value={newPartyPhone}
                onChange={(e) => setNewPartyPhone(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddNewParty}
                  disabled={addingParty || !newPartyName.trim()}
                  className="flex-1 bg-primary text-primary-foreground font-semibold py-2 rounded-xl text-sm disabled:opacity-50"
                >
                  {addingParty ? "..." : language === "gu" ? "ઉમેરો" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddNew(false)}
                  className="px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground"
                >
                  {language === "gu" ? "રદ" : "Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile */}
        <div>
          <p className={labelClass}>{t.mobile}</p>
          <input
            className={inputClass}
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder={language === "gu" ? "10 અંકનો નંબર" : "10 digit number"}
            data-ocid="new_booking.mobile.input"
          />
        </div>

        {/* Service */}
        <div>
          <p className={labelClass}>{t.workType}</p>
          <div className="relative">
            <select
              className={`${inputClass} appearance-none pr-9`}
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              data-ocid="new_booking.work_type.select"
            >
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <p className={labelClass}>{t.dateTime}</p>
          <input
            className={inputClass}
            type="datetime-local"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            data-ocid="new_booking.date.input"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl text-base shadow disabled:opacity-50"
          data-ocid="new_booking.submit.button"
        >
          {saving ? "..." : language === "gu" ? "બુકિંગ સાચવો" : "Save Booking"}
        </button>
      </div>
    </div>
  );
}
