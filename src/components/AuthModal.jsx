import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import {
  loginWithPassword,
  registerUser,
  normalizePhone,
  getRegisteredUsers,
  saveRegisteredUsers,
  setCurrentUser,
  resetUserPassword,
} from "../utils/authStorage";
import {
  sendFirebaseOTP,
  resetRecaptcha,
  isFirebaseConfigured,
} from "../firebase";

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "password",
  title = "Customer Login",
  subtitle = "Log in with your Mobile Number & Password to view your personal order history.",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // OTP State
  const [otpPhone, setOtpPhone] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState("phone");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpTimer, setOtpTimer] = useState(30);

  // Forgot Password State (OTP + reCAPTCHA verified reset)
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotStep, setForgotStep] = useState("phone");
  const [forgotConfirmationResult, setForgotConfirmationResult] =
    useState(null);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotTimer, setForgotTimer] = useState(30);

  // Password Login State - Start empty so no user data is pre-populated
  const [pwdIdentifier, setPwdIdentifier] = useState("");
  const [pwdPassword, setPwdPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register State - Start empty
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Complete reset of all fields so credentials/PINs are never leaked or left pre-filled after logout
  const resetAllFields = () => {
    setPwdIdentifier("");
    setPwdPassword("");
    setShowPassword(false);

    setRegName("");
    setRegPhone("");
    setRegCity("");
    setRegPassword("");
    setShowRegPassword(false);

    setOtpPhone("");
    setOtpName("");
    setOtpCode("");
    setOtpStep("phone");
    setConfirmationResult(null);
    window.__obLastConfirmationResult = null;

    setForgotPhone("");
    setForgotOtp("");
    setForgotStep("phone");
    setForgotConfirmationResult(null);
    window.__obLastForgotConfirmationResult = null;
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setShowForgotPassword(false);

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
  };

  // Reset fields every time the modal is opened or closed
  useEffect(() => {
    resetAllFields();
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Immediately clear all input fields whenever user logs out from anywhere in the app
  useEffect(() => {
    const handleAuthChange = (e) => {
      if (!e?.detail?.user) {
        resetAllFields();
        setActiveTab("password");
      }
    };
    window.addEventListener("user_auth_change", handleAuthChange);
    return () =>
      window.removeEventListener("user_auth_change", handleAuthChange);
  }, []);

  // Countdown for "Resend OTP" button
  useEffect(() => {
    if (otpStep !== "verify" || otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpStep, otpTimer]);

  // Countdown for forgot-password "Resend OTP" button
  useEffect(() => {
    if (forgotStep !== "verify" || forgotTimer <= 0) return;
    const t = setTimeout(() => setForgotTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [forgotStep, forgotTimer]);

  if (!isOpen) return null;

  // Handle Request OTP - sends a REAL SMS via Firebase Phone Auth
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFirebaseConfigured) {
      setErrorMsg(
        "Mobile OTP login is not set up yet. Please add your Firebase keys to the .env file (see .env.example).",
      );
      return;
    }

    const clean = normalizePhone(otpPhone);
    if (clean.length !== 10) {
      setErrorMsg(
        "Please enter a valid 10-digit Indian mobile number (e.g. 98765 XXXXX).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendFirebaseOTP(clean, "ob-recaptcha-container");
      setConfirmationResult(result);
      window.__obLastConfirmationResult = result;
      setOtpStep("verify");
      setOtpTimer(30);
    } catch (err) {
      resetRecaptcha("ob-recaptcha-container");
      const code = err?.code || "";
      if (code === "auth/invalid-phone-number") {
        setErrorMsg(
          "That mobile number looks invalid. Please double-check and try again.",
        );
      } else if (code === "auth/too-many-requests") {
        setErrorMsg(
          "Too many attempts. Please wait a while before requesting another OTP.",
        );
      } else {
        setErrorMsg(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Verify OTP - confirms the REAL code the user received via SMS
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeConfirmation =
      confirmationResult || window.__obLastConfirmationResult;

    if (!activeConfirmation) {
      setErrorMsg(
        "Verification session expired. Please request the OTP again.",
      );
      setOtpStep("phone");
      return;
    }
    const cleanOtp = otpCode.replace(/\D/g, "").trim();
    if (cleanOtp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP code sent to your phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activeConfirmation.confirm(cleanOtp);

      // Phone number is now verified by Firebase. Link it to (or create) the
      // local customer profile used for orders / order history on this site.
      const norm = normalizePhone(otpPhone);
      const users = getRegisteredUsers();
      let user = users.find((u) => normalizePhone(u.phone) === norm);

      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          fullName: otpName.trim() || `Customer +91 ${norm.slice(0, 5)}...`,
          phone: norm,
          createdAt: new Date().toISOString().split("T")[0],
        };
        users.push(user);
        saveRegisteredUsers(users);
      } else if (otpName.trim() && user.fullName.startsWith("Customer +91")) {
        user.fullName = otpName.trim();
        saveRegisteredUsers(users);
      }

      resetAllFields();
      setCurrentUser(user);
      setSuccessMsg(`Welcome, ${user.fullName}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
      }, 600);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-verification-code") {
        setErrorMsg("Incorrect OTP. Please check the code and try again.");
      } else if (
        code === "auth/invalid-verification-id" ||
        code === "auth/missing-verification-id"
      ) {
        setErrorMsg(
          "Verification session has expired or is invalid. Please request a new OTP.",
        );
        setOtpStep("phone");
      } else if (
        code === "auth/code-expired" ||
        code === "auth/session-expired"
      ) {
        setErrorMsg("This OTP has expired. Please request a new one.");
      } else {
        setErrorMsg(err?.message || "Could not verify OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== Forgot Password Flow (OTP + reCAPTCHA verified) =====

  // Step 1: send a real SMS OTP to confirm the person owns this phone number
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isFirebaseConfigured) {
      setErrorMsg(
        "OTP verification is not set up yet. Please add your Firebase keys to the .env file (see .env.example).",
      );
      return;
    }

    const clean = normalizePhone(forgotPhone);
    if (clean.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    // Confirm an account actually exists for this number before sending an OTP
    const users = getRegisteredUsers();
    const exists = users.some((u) => normalizePhone(u.phone) === clean);
    if (!exists) {
      setErrorMsg(
        "No account found with this mobile number. Please sign up instead.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendFirebaseOTP(
        clean,
        "ob-recaptcha-forgot-container",
      );
      setForgotConfirmationResult(result);
      window.__obLastForgotConfirmationResult = result;
      setForgotStep("verify");
      setForgotTimer(30);
    } catch (err) {
      resetRecaptcha("ob-recaptcha-forgot-container");
      const code = err?.code || "";
      if (code === "auth/invalid-phone-number") {
        setErrorMsg(
          "That mobile number looks invalid. Please double-check and try again.",
        );
      } else if (code === "auth/too-many-requests") {
        setErrorMsg(
          "Too many attempts. Please wait a while before requesting another OTP.",
        );
      } else {
        setErrorMsg(err.message || "Failed to send OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: verify the OTP code the person received via SMS
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const activeForgot =
      forgotConfirmationResult || window.__obLastForgotConfirmationResult;

    if (!activeForgot) {
      setErrorMsg(
        "Verification session expired. Please request the OTP again.",
      );
      setForgotStep("phone");
      return;
    }
    const cleanOtp = forgotOtp.replace(/\D/g, "").trim();
    if (cleanOtp.length < 6) {
      setErrorMsg("Please enter the 6-digit OTP code sent to your phone.");
      return;
    }

    setIsSubmitting(true);
    try {
      await activeForgot.confirm(cleanOtp);
      // Phone ownership confirmed — allow setting a new password now.
      setForgotStep("reset");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-verification-code") {
        setErrorMsg("Incorrect OTP. Please check the code and try again.");
      } else if (
        code === "auth/invalid-verification-id" ||
        code === "auth/missing-verification-id"
      ) {
        setErrorMsg(
          "Verification session has expired or is invalid. Please request a new OTP.",
        );
        setForgotStep("phone");
      } else if (
        code === "auth/code-expired" ||
        code === "auth/session-expired"
      ) {
        setErrorMsg("This OTP has expired. Please request a new one.");
      } else {
        setErrorMsg(err?.message || "Could not verify OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: save the new password/PIN, now that the phone number is OTP-verified
  const handleForgotResetPassword = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!forgotNewPassword.trim() || forgotNewPassword.trim().length < 4) {
      setErrorMsg("New password/PIN must be at least 4 characters.");
      return;
    }
    if (forgotNewPassword.trim() !== forgotConfirmPassword.trim()) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = resetUserPassword(forgotPhone, forgotNewPassword);
      setIsSubmitting(false);
      if (res.success && res.user) {
        setSuccessMsg(`Password updated! Welcome back, ${res.user.fullName}.`);
        resetAllFields();
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          onClose();
        }, 700);
      } else {
        setErrorMsg(res.error || "Could not reset password. Please try again.");
      }
    }, 450);
  };

  const handlePasswordLogin = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!pwdIdentifier.trim() || !pwdPassword.trim()) {
      setErrorMsg(
        "Please enter both your registered Mobile / Email and PIN / Password.",
      );
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const res = loginWithPassword(pwdIdentifier, pwdPassword);
      setIsSubmitting(false);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
        resetAllFields();
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || "Invalid credentials.");
      }
    }, 450);
  };

  // Handle New Registration
  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg("Please enter your full name and mobile number.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const res = registerUser({
        fullName: regName,
        phone: regPhone,
        city: regCity,
        password: regPassword,
      });
      setIsSubmitting(false);
      if (res.success && res.user) {
        setSuccessMsg(`Account created! Welcome, ${res.user.fullName}!`);
        resetAllFields();
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user);
          onClose();
        }, 600);
      } else {
        setErrorMsg(res.error || "Registration failed.");
      }
    }, 500);
  };

  return (
    <div
      id="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="auth-modal-card"
        className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto p-5 sm:p-7"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 pb-3 border-b border-[#E8DFD3]">
          <div className="w-12 h-12 rounded-2xl bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#1C2C20]">
            {title}
          </h2>
          <p className="text-xs text-[#696053] mt-1 max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 mb-4 bg-[#EDE5D8] p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("password");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "password"
                ? "bg-white text-[#1C2C20] shadow-xs font-bold"
                : "text-[#635A4D] hover:text-[#1C2C20]"
            }`}
          >
            🔑 Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "register"
                ? "bg-white text-[#1C2C20] shadow-xs font-bold"
                : "text-[#635A4D] hover:text-[#1C2C20]"
            }`}
          >
            ✨ Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("otp");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center ${
              activeTab === "otp"
                ? "bg-white text-[#1C2C20] shadow-xs font-bold"
                : "text-[#635A4D] hover:text-[#1C2C20]"
            }`}
          >
            📱 Mobile OTP
          </button>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#166534] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: MOBILE OTP LOGIN */}
        {activeTab === "otp" && (
          <div>
            {otpStep === "phone" ? (
              <form onSubmit={handleSendOTP} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#38332A] mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[#6B6356] font-mono border-r border-[#DDD3C2] pr-2">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="98765 XXXXX (10 digits)"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="w-full pl-20 pr-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-[#7A7265] mt-1">
                    Enter the mobile number you used while ordering your soaps.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#524B40] mb-1">
                    Your Name (Optional if new)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nikita, Priya"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  />
                </div>

                <div className="p-2.5 bg-[#FAF6EE] rounded-xl border border-[#E9E1D2] text-[11px] flex items-start gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-[#263E2E] mt-0.5 shrink-0" />
                  <span className="text-[#4A433A]">
                    We'll send a real SMS with a 6-digit verification code to
                    this number. Standard SMS charges may apply from your
                    carrier.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Sending Code...</span>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* OTP Verification Step */
              <form
                onSubmit={handleVerifyOTP}
                className="space-y-4 animate-fade-in"
              >
                {/* Real SMS sent confirmation */}
                <div className="p-3 bg-[#E5EFE6] border border-[#86EFAC] rounded-xl">
                  <p className="text-xs text-[#1C2C20] flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-[#166534] mt-0.5 shrink-0" />
                    <span>
                      We've sent a 6-digit code via SMS to{" "}
                      <strong className="font-mono">
                        +91 {normalizePhone(otpPhone)}
                      </strong>
                      . It may take a few seconds to arrive.
                    </span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#38332A]">
                      Enter 6-Digit OTP *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("phone");
                        setOtpCode("");
                        setConfirmationResult(null);
                      }}
                      className="text-[11px] text-[#263E2E] hover:underline"
                    >
                      Change Number (+91 {normalizePhone(otpPhone)})
                    </button>
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="000000"
                    className="w-full py-3 px-4 bg-white border border-[#DDD3C2] rounded-xl text-center text-lg tracking-[0.5em] font-mono font-bold text-[#1C2C20] focus:outline-none focus:border-[#263E2E]"
                    autoFocus
                  />

                  <div className="flex items-center justify-center gap-1.5 mt-1.5">
                    {otpTimer > 0 ? (
                      <span className="text-[10px] text-[#7A7265] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Resend code in {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSendOTP(e)}
                        className="text-[11px] text-[#263E2E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-[#E3B873]" />
                  <span>Verify OTP &amp; Unlock Order History</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: MOBILE & PASSWORD / PIN LOGIN */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                Registered Mobile Number or Email *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. 98251 44320 or email"
                value={pwdIdentifier}
                onChange={(e) => setPwdIdentifier(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#38332A]">
                  PIN or Password *
                </label>
                <span className="text-[10px] text-[#7A7265]">
                  Default demo PIN: 1234
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Enter 4-digit PIN or password"
                  value={pwdPassword}
                  onChange={(e) => setPwdPassword(e.target.value)}
                  className="w-full px-3 pr-10 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7265] hover:text-[#1C2C20]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setForgotPhone(pwdIdentifier);
                    setForgotStep("phone");
                    setForgotOtp("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setActiveTab("forgot");
                  }}
                  className="text-[11px] text-[#263E2E] hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-[#FAF6EE] rounded-xl border border-[#E9E1D2] text-[11px] space-y-1">
              <span className="font-semibold text-[#263E2E] block text-[10px] uppercase">
                💡 Demo Credentials:
              </span>
              <p className="text-[11px] text-[#4A433A]">
                Pooja Patel: <strong>9825144320</strong> • PIN:{" "}
                <strong>1234</strong>
              </p>
              <p className="text-[11px] text-[#4A433A]">
                Aarav Sharma: <strong>9876543210</strong> • PIN:{" "}
                <strong>1234</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E3B873]" />
              <span>Log In to View Orders</span>
            </button>
          </form>
        )}

        {/* TAB 3: SIGN UP */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Priya Sharma"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                autoComplete="off"
                placeholder="e.g. 98765 XXXXX (10-digit number)"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-[#38332A] mb-1">
                  City
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#38332A] mb-1">
                  Set 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E3B873]" />
              <span>Create Account &amp; Log In</span>
            </button>
          </form>
        )}

        {/* TAB 4: FORGOT PASSWORD (OTP + reCAPTCHA verified reset) */}
        {activeTab === "forgot" && forgotStep === "phone" && (
          <form
            onSubmit={handleForgotSendOtp}
            className="space-y-3.5 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setActiveTab("password");
              }}
              className="text-[11px] text-[#263E2E] hover:underline font-semibold cursor-pointer"
            >
              ← Back to Login
            </button>

            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                Registered Mobile Number *
              </label>
              <input
                type="tel"
                required
                autoComplete="off"
                placeholder="e.g. 98765 XXXXX"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                autoFocus
              />
            </div>

            <div className="p-2.5 bg-[#FAF6EE] rounded-xl border border-[#E9E1D2] text-[11px] flex items-start gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#263E2E] mt-0.5 shrink-0" />
              <span className="text-[#4A433A]">
                We'll verify it's really you with a 6-digit SMS code before
                letting you set a new password.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Sending Code...</span>
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === "forgot" && forgotStep === "verify" && (
          <form
            onSubmit={handleForgotVerifyOtp}
            className="space-y-4 animate-fade-in"
          >
            <div className="p-3 bg-[#E5EFE6] border border-[#86EFAC] rounded-xl">
              <p className="text-xs text-[#1C2C20] flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-[#166534] mt-0.5 shrink-0" />
                <span>
                  We've sent a 6-digit code via SMS to{" "}
                  <strong className="font-mono">
                    +91 {normalizePhone(forgotPhone)}
                  </strong>
                  .
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#38332A]">
                  Enter 6-Digit OTP *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep("phone");
                    setForgotOtp("");
                    setForgotConfirmationResult(null);
                  }}
                  className="text-[11px] text-[#263E2E] hover:underline"
                >
                  Change Number
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                value={forgotOtp}
                onChange={(e) =>
                  setForgotOtp(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="000000"
                className="w-full py-3 px-4 bg-white border border-[#DDD3C2] rounded-xl text-center text-lg tracking-[0.5em] font-mono font-bold text-[#1C2C20] focus:outline-none focus:border-[#263E2E]"
                autoFocus
              />

              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                {forgotTimer > 0 ? (
                  <span className="text-[10px] text-[#7A7265] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Resend code in {forgotTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleForgotSendOtp(e)}
                    className="text-[11px] text-[#263E2E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend OTP
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-[#E3B873]" />
              <span>Verify OTP</span>
            </button>
          </form>
        )}

        {activeTab === "forgot" && forgotStep === "reset" && (
          <form
            onSubmit={handleForgotResetPassword}
            className="space-y-3.5 animate-fade-in"
          >
            <div className="p-3 bg-[#E5EFE6] border border-[#86EFAC] rounded-xl">
              <p className="text-xs text-[#1C2C20] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Phone number verified. Please set a new password.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                New Password / PIN *
              </label>
              <div className="relative">
                <input
                  type={showForgotPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="At least 4 characters"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-3 pr-10 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7265] hover:text-[#1C2C20]"
                >
                  {showForgotPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#38332A] mb-1">
                Confirm New Password *
              </label>
              <input
                type={showForgotPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#DDD3C2] rounded-xl text-xs text-[#2C2926] focus:outline-none focus:border-[#263E2E]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#263E2E] hover:bg-[#1A2E20] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E3B873]" />
              <span>Save New Password &amp; Log In</span>
            </button>
          </form>
        )}

        {/* Permanent invisible reCAPTCHA mount points for Firebase Phone Auth */}
        <div
          id="ob-recaptcha-permanent-container"
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 0,
            height: 0,
            overflow: "hidden",
          }}
        >
          <div id="ob-recaptcha-container" />
          <div id="ob-recaptcha-forgot-container" />
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#E8DFD3] space-y-2 text-center text-[10px] text-[#7A7265]">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#263E2E]" />
            <span>Encrypted Session • Personal Order Privacy Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
