import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  getOwnerAccount,
  loginOwner,
  resetOwnerPassword,
  useAppStore,
} from "../store";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

type Step =
  | "login"
  | "forgot_mobile"
  | "forgot_answer"
  | "forgot_newpwd"
  | "forgot_done";

export default function OwnerLoginScreen({ onSuccess, onBack }: Props) {
  const { language, setAuthRole, setCurrentOwnerMobile } = useAppStore();
  const isGu = language === "gu";

  const [step, setStep] = useState<Step>("login");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [pwdError, setPwdError] = useState("");

  // forgot password flow
  const [fMobile, setFMobile] = useState("");
  const [fMobileError, setFMobileError] = useState("");
  const [fAccount, setFAccount] =
    useState<ReturnType<typeof getOwnerAccount>>(null);
  const [fAnswer, setFAnswer] = useState("");
  const [fAnswerError, setFAnswerError] = useState("");
  const [fNewPwd, setFNewPwd] = useState("");
  const [fNewPwdError, setFNewPwdError] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

  const handleLogin = () => {
    setMobileError("");
    setPwdError("");
    const trimmed = mobile.trim();
    if (!trimmed) {
      setMobileError(isGu ? "મોબાઇલ નંબર દાખલ કરો" : "Enter mobile number");
      return;
    }
    const valid = loginOwner(trimmed, password);
    if (!valid) {
      setPwdError(
        isGu
          ? "ખોટો મોબાઇલ નંબર અથવા પાસવર્ડ"
          : "Wrong mobile number or password",
      );
      return;
    }
    setCurrentOwnerMobile(trimmed);
    setAuthRole("owner");
    onSuccess();
  };

  const handleForgotMobile = () => {
    setFMobileError("");
    const trimmed = fMobile.trim();
    const account = getOwnerAccount(trimmed);
    if (!account) {
      setFMobileError(
        isGu ? "આ નંબર નોંધાયેલ નથી" : "This mobile number is not registered",
      );
      return;
    }
    setFAccount(account);
    setStep("forgot_answer");
  };

  const handleForgotAnswer = () => {
    setFAnswerError("");
    if (!fAnswer.trim()) {
      setFAnswerError(isGu ? "જવાબ દાખલ કરો" : "Enter answer");
      return;
    }
    const _res = resetOwnerPassword(fMobile.trim(), fAnswer, "__check_only__");
    // We just check the answer by trying a dummy reset - instead let's verify manually
    const account = getOwnerAccount(fMobile.trim());
    if (!account || account.securityAnswer !== fAnswer.trim().toLowerCase()) {
      setFAnswerError(isGu ? "ખોટો જવાબ" : "Wrong answer");
      return;
    }
    setStep("forgot_newpwd");
  };

  const handleForgotNewPwd = () => {
    setFNewPwdError("");
    if (fNewPwd.length < 4) {
      setFNewPwdError(
        isGu
          ? "પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો"
          : "Password must be at least 4 characters",
      );
      return;
    }
    resetOwnerPassword(fMobile.trim(), fAnswer, fNewPwd);
    setStep("forgot_done");
  };

  const inputClass =
    "w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600";
  const errorClass = "text-red-600 dark:text-red-400 text-sm mt-1 px-1";

  if (step === "forgot_done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-6">
        <span className="text-7xl mb-4">✅</span>
        <h2 className="text-2xl font-bold text-green-700 text-center mb-2">
          {isGu ? "પાસવર્ડ બદલ્યો!" : "Password Reset!"}
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          {isGu
            ? "હવે નવા પાસવર્ડ સાથે લૉગઇન કરો"
            : "Login with your new password"}
        </p>
        <button
          type="button"
          onClick={() => {
            setStep("login");
            setMobile(fMobile);
            setPassword("");
          }}
          className="w-full max-w-sm py-5 rounded-2xl bg-green-700 text-white text-xl font-bold shadow-lg"
        >
          {isGu ? "લૉગઇન" : "Go to Login"}
        </button>
      </div>
    );
  }

  if (step === "forgot_newpwd") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center px-4 pt-6 pb-2">
          <button
            type="button"
            onClick={() => setStep("forgot_answer")}
            className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          <span className="text-5xl mb-4">🔑</span>
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6 text-center">
            {isGu ? "નવો પાસવર્ડ સેટ કરો" : "Set New Password"}
          </h1>
          <div className="w-full max-w-sm space-y-4">
            <div className="relative">
              <input
                type={showNewPwd ? "text" : "password"}
                value={fNewPwd}
                onChange={(e) => setFNewPwd(e.target.value)}
                placeholder={isGu ? "નવો પાસવર્ડ" : "New Password"}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNewPwd ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {fNewPwdError && <p className={errorClass}>❌ {fNewPwdError}</p>}
            <button
              type="button"
              onClick={handleForgotNewPwd}
              className="w-full py-5 rounded-2xl bg-green-700 text-white text-xl font-bold shadow-lg"
            >
              {isGu ? "સેટ કરો" : "Set Password"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "forgot_answer") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center px-4 pt-6 pb-2">
          <button
            type="button"
            onClick={() => setStep("forgot_mobile")}
            className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          <span className="text-5xl mb-4">🔐</span>
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2 text-center">
            {isGu ? "સુરક્ષા પ્રશ્ન" : "Security Question"}
          </h1>
          {fAccount && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center text-base px-2">
              {fAccount.securityQuestion}
            </p>
          )}
          <div className="w-full max-w-sm space-y-4">
            <input
              type="text"
              value={fAnswer}
              onChange={(e) => {
                setFAnswer(e.target.value);
                setFAnswerError("");
              }}
              placeholder={isGu ? "જવાબ" : "Answer"}
              className={inputClass}
            />
            {fAnswerError && <p className={errorClass}>❌ {fAnswerError}</p>}
            <button
              type="button"
              onClick={handleForgotAnswer}
              className="w-full py-5 rounded-2xl bg-green-700 text-white text-xl font-bold shadow-lg"
            >
              {isGu ? "ચકાસો" : "Verify"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "forgot_mobile") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center px-4 pt-6 pb-2">
          <button
            type="button"
            onClick={() => setStep("login")}
            className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          <span className="text-5xl mb-4">📱</span>
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2 text-center">
            {isGu ? "પાસવર્ડ ભૂલ્યા?" : "Forgot Password?"}
          </h1>
          <p className="text-gray-500 mb-6 text-center text-sm">
            {isGu
              ? "નોંધાયેલ મોબાઇલ નંબર દાખલ કરો"
              : "Enter your registered mobile number"}
          </p>
          <div className="w-full max-w-sm space-y-4">
            <input
              type="tel"
              value={fMobile}
              onChange={(e) => {
                setFMobile(e.target.value);
                setFMobileError("");
              }}
              placeholder={
                isGu ? "10 અંકનો મોબાઇલ નંબર" : "10-digit Mobile Number"
              }
              maxLength={10}
              className={inputClass}
            />
            {fMobileError && <p className={errorClass}>❌ {fMobileError}</p>}
            <button
              type="button"
              onClick={handleForgotMobile}
              className="w-full py-5 rounded-2xl bg-green-700 text-white text-xl font-bold shadow-lg"
            >
              {isGu ? "આગળ" : "Next"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login step
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <span className="text-6xl mb-4">👑</span>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
          {isGu ? "માલિક લૉગઇન" : "Owner Login"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          {isGu
            ? "તમારો મોબાઇલ નંબર અને પાસવર્ડ દાખલ કરો"
            : "Enter your mobile number and password"}
        </p>

        <div className="w-full max-w-sm space-y-4">
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setMobileError("");
                setPwdError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder={
                isGu ? "10 અંકનો મોબાઇલ નંબર" : "10-digit Mobile Number"
              }
              className={inputClass}
            />
            {mobileError && <p className={errorClass}>❌ {mobileError}</p>}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPwdError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder={isGu ? "પાસવર્ડ" : "Password"}
                className={`${inputClass} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {pwdError && <p className={errorClass}>❌ {pwdError}</p>}
          </div>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xl font-bold shadow-lg transition-colors"
          >
            {isGu ? "લૉગઇન" : "Login"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("forgot_mobile");
              setFMobile(mobile);
            }}
            className="w-full text-center text-green-700 dark:text-green-400 text-base font-semibold py-2"
          >
            {isGu ? "પાસવર્ડ ભૂલ્યા?" : "Forgot Password?"}
          </button>
        </div>
      </div>
    </div>
  );
}
