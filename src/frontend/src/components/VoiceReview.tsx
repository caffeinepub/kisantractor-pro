import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ParsedVoiceTransaction } from "../utils/parseVoiceTransaction";

interface Party {
  id: bigint;
  name: string;
  phone?: string;
}

interface VoiceReviewProps {
  open: boolean;
  parsed: ParsedVoiceTransaction | null;
  parties: Party[];
  services: string[];
  serviceRates: Record<string, { perHour: number; perMinute: number }>;
  language: "gu" | "en";
  onConfirm: (data: {
    partyName: string;
    partyId?: string;
    serviceName: string;
    hours: number;
    minutes: number;
    amount: number;
  }) => void;
  onClose: () => void;
}

export default function VoiceReview({
  open,
  parsed,
  parties,
  services,
  serviceRates,
  language,
  onConfirm,
  onClose,
}: VoiceReviewProps) {
  const isGu = language === "gu";

  const [partySearch, setPartySearch] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | undefined>();
  const [serviceName, setServiceName] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [manualAmount, setManualAmount] = useState("");
  const [showPartyList, setShowPartyList] = useState(false);

  useEffect(() => {
    if (open && parsed) {
      setPartySearch(parsed.partyName ?? "");
      setSelectedPartyId(parsed.partyId);
      setServiceName(parsed.serviceName ?? services[0] ?? "");
      setHours(parsed.hours ?? 0);
      setMinutes(parsed.minutes ?? 0);
      setManualAmount("");
      setShowPartyList(false);
    }
  }, [open, parsed, services]);

  const selectedParty = parties.find(
    (p) => p.id.toString() === selectedPartyId,
  );

  const rates = serviceRates[serviceName];
  const computedAmount = rates
    ? hours * rates.perHour + minutes * rates.perMinute
    : 0;
  const finalAmount =
    manualAmount !== "" ? Number(manualAmount) : computedAmount;

  const filteredParties = parties.filter((p) =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()),
  );

  const handleConfirm = () => {
    const name = selectedParty?.name ?? partySearch.trim();
    if (!name) return;
    onConfirm({
      partyName: name,
      partyId: selectedPartyId,
      serviceName,
      hours,
      minutes,
      amount: finalAmount,
    });
  };

  if (!open) return null;

  const inputCls =
    "w-full border border-border rounded-xl px-3 py-3 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm";
  const labelCls = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      data-ocid="voice_review.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={-1}
        aria-label="Close"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-background rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto pb-safe">
        {/* Handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎤</span>
              <h2 className="text-lg font-bold text-foreground">
                {isGu ? "વૉઇસ ઇનપુટ તપાસો" : "Review Voice Input"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted"
              data-ocid="voice_review.close_button"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Confidence badge */}
          {parsed?.confidence === "low" && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              ⚠️{" "}
              {isGu
                ? "ઓછી ચોકસાઈ — કૃપા કરી ખેતરો ચકાસો"
                : "Low confidence — please verify the fields below"}
            </div>
          )}

          {/* Party */}
          <div className="relative">
            <p className={labelCls}>
              {isGu ? "ગ્રાહક (પાર્ટી)" : "Customer (Party)"}
            </p>
            <input
              className={inputCls}
              value={partySearch}
              onChange={(e) => {
                setPartySearch(e.target.value);
                setSelectedPartyId(undefined);
                setShowPartyList(true);
              }}
              onFocus={() => setShowPartyList(true)}
              placeholder={isGu ? "ગ્રાહક શોધો..." : "Search party..."}
              data-ocid="voice_review.party_search.input"
            />
            {selectedParty && (
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={12} /> {selectedParty.name}
                </span>
              </div>
            )}
            {showPartyList && filteredParties.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {filteredParties.slice(0, 6).map((p) => (
                  <button
                    key={p.id.toString()}
                    type="button"
                    onClick={() => {
                      setPartySearch(p.name);
                      setSelectedPartyId(p.id.toString());
                      setShowPartyList(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted text-left text-sm border-b border-border last:border-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-foreground">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service */}
          <div>
            <p className={labelCls}>{isGu ? "સેવાનો પ્રકાર" : "Service Type"}</p>
            <select
              className={inputCls}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              data-ocid="voice_review.service.select"
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
            <p className={labelCls}>{isGu ? "સમય" : "Duration"}</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  {isGu ? "કલાક" : "Hours"}
                </p>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) =>
                    setHours(Math.max(0, Number(e.target.value)))
                  }
                  className={inputCls}
                  data-ocid="voice_review.hours.input"
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  {isGu ? "મિનિટ" : "Minutes"}
                </p>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(
                      Math.min(59, Math.max(0, Number(e.target.value))),
                    )
                  }
                  className={inputCls}
                  data-ocid="voice_review.minutes.input"
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className={labelCls}>
              {isGu ? "રકમ" : "Amount"}
              {rates && computedAmount > 0 && (
                <span className="text-muted-foreground font-normal text-xs ml-1">
                  ({isGu ? "ગણાયેલ" : "calculated"}: ₹{computedAmount.toFixed(0)}
                  )
                </span>
              )}
            </p>
            <input
              type="number"
              min="0"
              value={manualAmount !== "" ? manualAmount : finalAmount || ""}
              onChange={(e) => setManualAmount(e.target.value)}
              className={inputCls}
              placeholder="0"
              data-ocid="voice_review.amount.input"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border text-foreground font-bold py-3.5 rounded-xl text-sm"
              data-ocid="voice_review.cancel_button"
            >
              {isGu ? "રદ" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!partySearch.trim()}
              className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              data-ocid="voice_review.confirm_button"
            >
              <CheckCircle2 size={16} />
              {isGu ? "ફૉર્મ ભરો" : "Fill Form"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
