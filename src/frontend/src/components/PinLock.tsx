import { Delete, Lock, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Props {
  mode: "enter" | "setup";
  onUnlock?: () => void;
  onSetup?: (pin: string) => void;
  onCancel?: () => void;
  language: "gu" | "en";
}

export default function PinLock({
  mode,
  onUnlock,
  onSetup,
  onCancel,
  language,
}: Props) {
  const isGu = language === "gu";
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");

  const maxAttempts = 3;

  const handleDigit = (d: string) => {
    if (step === "enter" && pin.length < 4) {
      setPin((p) => p + d);
      setError("");
    } else if (step === "confirm" && confirmPin.length < 4) {
      setConfirmPin((p) => p + d);
      setError("");
    }
  };

  const handleDelete = () => {
    if (step === "enter") setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
    setError("");
  };

  const handleSubmit = () => {
    if (mode === "enter") {
      const stored = localStorage.getItem("kisanPin");
      if (pin === stored) {
        onUnlock?.();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");
        setError(
          isGu
            ? `ખોટો PIN. ${maxAttempts - newAttempts > 0 ? `${maxAttempts - newAttempts} વખત બાકી.` : ""}`
            : `Wrong PIN. ${maxAttempts - newAttempts > 0 ? `${maxAttempts - newAttempts} attempts left.` : ""}`,
        );
      }
    } else {
      // Setup mode
      if (step === "enter") {
        if (pin.length === 4) {
          setStep("confirm");
          setError("");
        }
      } else {
        if (pin === confirmPin) {
          onSetup?.(pin);
        } else {
          setConfirmPin("");
          setError(
            isGu
              ? "PIN મળ્યો નહીં. ફરી પ્રયાસ કરો."
              : "PINs don't match. Try again.",
          );
        }
      }
    }
  };

  const handleReset = () => {
    localStorage.removeItem("kisanPin");
    window.location.reload();
  };

  const currentPin = step === "enter" ? pin : confirmPin;
  const showReset = mode === "enter" && attempts >= maxAttempts;

  return (
    <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-8">
        {/* Icon + Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-xl">
            {mode === "enter"
              ? isGu
                ? "PIN દાખલ કરો"
                : "Enter PIN"
              : step === "enter"
                ? isGu
                  ? "નવો PIN બનાવો"
                  : "Create PIN"
                : isGu
                  ? "PIN ફરી દાખલ કરો"
                  : "Confirm PIN"}
          </h1>
          <p className="text-white/70 text-sm">
            {mode === "enter"
              ? isGu
                ? "KisanTractor Pro"
                : "KisanTractor Pro"
              : isGu
                ? "4 આંક નો PIN"
                : "4-digit PIN"}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 border-white transition-all ${
                i < currentPin.length ? "bg-white" : "bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-200 text-sm text-center bg-red-500/30 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (d) => {
              if (d === "") return <div key="empty" />;
              if (d === "del") {
                return (
                  <button
                    key="del"
                    type="button"
                    onClick={handleDelete}
                    className="h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center active:bg-white/40 transition-colors"
                  >
                    <Delete size={22} />
                  </button>
                );
              }
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigit(d)}
                  className="h-16 rounded-2xl bg-white/20 text-white font-bold text-2xl active:bg-white/40 transition-colors"
                >
                  {d}
                </button>
              );
            },
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={currentPin.length < 4}
          className="w-full py-4 bg-white text-primary font-bold rounded-2xl text-base disabled:opacity-40 transition-opacity"
        >
          {mode === "enter"
            ? isGu
              ? "ખોલો"
              : "Unlock"
            : step === "enter"
              ? isGu
                ? "આગળ"
                : "Next"
              : isGu
                ? "સાચવો"
                : "Save PIN"}
        </button>

        {/* Reset PIN */}
        {showReset && (
          <div className="text-center space-y-2">
            <p className="text-white/70 text-sm">
              {isGu ? "ઘણા ખોટા PIN. " : "Too many wrong attempts. "}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 mx-auto text-white font-bold underline text-sm"
            >
              <RefreshCw size={16} />
              {isGu ? "PIN રીસેટ કરો (ડેટા સુરક્ષિત)" : "Reset PIN (data safe)"}
            </button>
          </div>
        )}

        {/* Cancel for setup mode */}
        {mode === "setup" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-white/70 font-semibold py-2 text-sm"
          >
            {isGu ? "રદ" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
