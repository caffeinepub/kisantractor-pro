import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { registerOwner, useAppStore } from "../store";

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export default function RegisterScreen({ onSuccess, onBack }: Props) {
  const { language, setCurrentOwnerMobile, setAuthRole } = useAppStore();
  const isGu = language === "gu";

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    mobile?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!/^\d{10}$/.test(mobile.trim())) {
      newErrors.mobile = isGu
        ? "10 અંકનો મોબાઇલ નંબર દાખલ કરો"
        : "Enter valid 10-digit mobile number";
    }
    if (password.length < 4) {
      newErrors.password = isGu
        ? "પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ"
        : "Password must be at least 4 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirm = isGu
        ? "પાસવર્ડ મેળ ખાતો નથી"
        : "Passwords do not match";
    }
    return newErrors;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const result = registerOwner(mobile.trim(), password);
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
    setTimeout(() => {
      onSuccess();
    }, 1200);
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
          data-ocid="register.back_button"
          className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col items-center justify-center px-6 pb-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mb-4 shadow-lg">
          <UserPlus size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2 text-center">
          {isGu ? "નવું એકાઉન્ટ બનાવો" : "Create New Account"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          {isGu
            ? "દરેક માલિકનો ડેટા અલગ અને સુરક્ષિત"
            : "Each owner's data is separate and secure"}
        </p>

        <div className="w-full max-w-sm space-y-4">
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setErrors((p) => ({ ...p, mobile: undefined }));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={
                isGu ? "10 અંકનો મોબાઇલ નંબર" : "10-digit Mobile Number"
              }
              maxLength={10}
              data-ocid="register.mobile_input"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600 dark:focus:border-green-400"
            />
            {errors.mobile && (
              <p
                data-ocid="register.mobile_error_state"
                className="text-red-500 text-sm mt-1 px-1"
              >
                ❌ {errors.mobile}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={isGu ? "પાસવર્ડ" : "Password"}
                data-ocid="register.password_input"
                className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600 dark:focus:border-green-400"
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
              <p
                data-ocid="register.password_error_state"
                className="text-red-500 text-sm mt-1 px-1"
              >
                ❌ {errors.password}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => ({ ...p, confirm: undefined }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={isGu ? "પાસવર્ડ ફરી દાખલ કરો" : "Confirm Password"}
                data-ocid="register.confirm_password_input"
                className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:outline-none focus:border-green-600 dark:focus:border-green-400"
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
              <p
                data-ocid="register.confirm_error_state"
                className="text-red-500 text-sm mt-1 px-1"
              >
                ❌ {errors.confirm}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            data-ocid="register.submit_button"
            className="w-full py-5 rounded-2xl bg-green-700 hover:bg-green-800 active:bg-green-900 text-white text-xl font-bold shadow-lg transition-colors"
          >
            {isGu ? "એકાઉન્ટ બનાવો" : "Create Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
