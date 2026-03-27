import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { registerOwner, useAppStore } from "../store";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

const SECURITY_QUESTIONS_EN = [
  "What is your mother's name?",
  "What was your first school?",
  "What is your favourite colour?",
  "What was the name of your first pet?",
  "What is your father's name?",
];
const SECURITY_QUESTIONS_GU = [
  "તમારી માતાનું નામ શું છે?",
  "તમારી પહેલી શાળા કઈ હતી?",
  "તમારો મનગમતો રંગ કયો છે?",
  "તમારા પ્રથમ પ્રાણીનું નામ શું હતું?",
  "તમારા પિતાનું નામ શું છે?",
];

export default function RegisterScreen({ onSuccess, onBack }: Props) {
  const { language, setCurrentOwnerMobile, setAuthRole } = useAppStore();
  const isGu = language === "gu";
  const questions = isGu ? SECURITY_QUESTIONS_GU : SECURITY_QUESTIONS_EN;

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(questions[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = isGu ? "નામ દાખલ કરો" : "Enter your name";
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      errs.mobile = isGu
        ? "10 અંકનો મોબાઇલ નંબર દાખલ કરો"
        : "Enter valid 10-digit mobile number";
    }
    if (password.length < 4) {
      errs.password = isGu
        ? "પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો"
        : "Password must be at least 4 characters";
    }
    if (password !== confirmPassword) {
      errs.confirm = isGu ? "પાસવર્ડ મેળ ખાતો નથી" : "Passwords do not match";
    }
    if (!securityAnswer.trim()) {
      errs.answer = isGu ? "જવાબ દાખલ કરો" : "Enter security answer";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const result = registerOwner(
      mobile.trim(),
      password,
      name.trim(),
      securityQuestion,
      securityAnswer,
    );
    if (!result.success) {
      setErrors({
        mobile: isGu
          ? "આ નંબર પહેલેથી નોંધાયેલ છે"
          : "This mobile number is already registered",
      });
      return;
    }

    setCurrentOwnerMobile(mobile.trim());
    setAuthRole("owner");
    setSuccess(true);
    setTimeout(() => onSuccess(), 1200);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex flex-col items-center"
        >
          <span className="text-7xl mb-4">✅</span>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 text-center">
            {isGu ? "એકાઉન્ટ બન્યું!" : "Account Created!"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isGu ? "લૉગઇન થઈ રહ્યું છે..." : "Logging you in..."}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex items-center px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center px-6 pb-10 overflow-y-auto"
      >
        <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mb-4 shadow-lg mt-4">
          <UserPlus size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-1 text-center">
          {isGu ? "નવું એકાઉન્ટ બનાવો" : "Create New Account"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          {isGu
            ? "દરેક માલિકનો ડેટા અલગ અને સુરક્ષિત"
            : "Each owner's data is separate and secure"}
        </p>

        <div className="w-full max-w-sm space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({
                  ...p,
                  name: undefined as unknown as string,
                }));
              }}
              placeholder={isGu ? "પૂરું નામ" : "Full Name"}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 px-1">❌ {errors.name}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setErrors((p) => ({
                  ...p,
                  mobile: undefined as unknown as string,
                }));
              }}
              placeholder={
                isGu ? "10 અંકનો મોબાઇલ નંબર" : "10-digit Mobile Number"
              }
              maxLength={10}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600"
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1 px-1">
                ❌ {errors.mobile}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({
                    ...p,
                    password: undefined as unknown as string,
                  }));
                }}
                placeholder={isGu ? "પાસવર્ડ" : "Password"}
                className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 px-1">
                ❌ {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => ({
                    ...p,
                    confirm: undefined as unknown as string,
                  }));
                }}
                placeholder={isGu ? "પાસવર્ડ ફરી દાખલ કરો" : "Confirm Password"}
                className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirm ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {errors.confirm && (
              <p className="text-red-500 text-sm mt-1 px-1">
                ❌ {errors.confirm}
              </p>
            )}
          </div>

          {/* Security Question */}
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1 px-1">
              {isGu
                ? "સુરક્ષા પ્રશ્ન (પાસવર્ડ ભૂલ્યા ત્યારે કામ આવશે)"
                : "Security Question (for password reset)"}
            </p>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:border-green-600"
            >
              {questions.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Security Answer */}
          <div>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => {
                setSecurityAnswer(e.target.value);
                setErrors((p) => ({
                  ...p,
                  answer: undefined as unknown as string,
                }));
              }}
              placeholder={isGu ? "જવાબ" : "Answer"}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600"
            />
            {errors.answer && (
              <p className="text-red-500 text-sm mt-1 px-1">
                ❌ {errors.answer}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xl font-bold shadow-lg transition-colors"
          >
            {isGu ? "એકાઉન્ટ બનાવો" : "Create Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
