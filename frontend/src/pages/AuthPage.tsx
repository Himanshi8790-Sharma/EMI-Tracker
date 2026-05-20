"use client";

import { useState } from "react";
import API from "../utils/api.ts";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

type Mode = "login" | "register";

// ─── INPUT FIELD ───
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  icon: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
      </label>
      <div
        className="flex items-center rounded-xl border-2 transition-all duration-200"
        style={{
          borderColor: error ? "#EF4444" : focused ? "#7F77DD" : "#E5E7EB",
          background: focused ? "#FAFAFE" : "#F9FAFB",
          boxShadow: focused ? "0 0 0 3px rgba(127,119,221,0.15)" : "none",
        }}
      >
        <span className="pl-3.5 text-base flex-shrink-0">{icon}</span>
        <input
          type={isPass && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-300"
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="pr-3.5 text-gray-400 hover:text-violet-500 transition-colors text-sm"
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}


// ─── MAIN PAGE ───────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [switching, setSwitching] = useState(false);
  const [visible, setVisible] = useState(true);

  // Login
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [lErr, setLErr] = useState<Record<string, string>>({});

  // Register
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    // phone: "",
    password: "",
    confirm: "",
  });
  const [rErr, setRErr] = useState<Record<string, string>>({});


  // Login API
  const loginMutation = useMutation({
    mutationFn: (data: typeof loginData) => API.post("/auth/login", data),
    onSuccess: (res) => {
      // console.log("API RESPONSE:", res.data);
      console.log("FULL RESPONSE:", res);
  console.log("DATA:", res.data);
  console.log("TOKEN:", res.data.token);


localStorage.setItem("kist_token", res.data.token);
      // localStorage.removeItem("token");
      setLoginData({ email: "", password: "" });
      Swal.fire({
        icon: "success",
        title: "Login Successful 🎉",
        text: "Welcome back!",
      });
      // For dynamic user data in frontend
        localStorage.setItem(
    "kist_user",
    JSON.stringify(res.data.user)
  );

      navigate("/dashboard"); // ✅ only once
    },
    onError: (err: any) => {
      Swal.fire({
        icon: "error",
        title: "Login Failed ❌",
        text: err.response?.data?.error || "Something went wrong",
      });
    },
  });

  // 🔥 SIGNUP API
  const signupMutation = useMutation({
    mutationFn: (data: typeof signupData) => API.post("/auth/register", data),

    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Account Created 🎉",
        text: "Now login to continue",
      })
      // .then(() => {
      //   setMode("login"); // 👈 best practice
      // });
      navigate("/dashboard"); // ✅ directly navigate to dashboard after signup (optional)
    },

    onError: (err: any) => {
      Swal.fire({
        icon: "error",
        title: "Signup Failed ❌",
        text: err.response?.data?.error || "Something went wrong",
      });
    },
  });

  const switchTo = (m: Mode) => {
    if (m === mode || switching) return;
    setSwitching(true);
    setVisible(false);
    setTimeout(() => {
      setMode(m);
      setVisible(true);
      setSwitching(false);
    }, 250);
  };

 const validateLogin = () => {
  const e: Record<string, string> = {};

  if (!loginData.email) e.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(loginData.email))
    e.email = "Please enter a valid email";

  if (!loginData.password) e.password = "Password is required";

  setLErr(e);
  return !Object.keys(e).length;
};

const validateReg = () => {
  const e: Record<string, string> = {};

  if (!signupData.name.trim()) e.name = "Name is required";

  if (!signupData.email) e.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(signupData.email))
    e.email = "Please enter a valid email";

  if (!signupData.password) e.password = "Password is required";
  else if (signupData.password.length < 6)
    e.password = "Password must be at least 6 characters";

  if (signupData.password !== signupData.confirm)
    e.confirm = "Passwords do not match";

  setRErr(e);
  return !Object.keys(e).length;
};

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!validateLogin()) return;
  //   // setLLoading(true);
  //   // await new Promise((r) => setTimeout(r, 1000));
  //   // setLLoading(false);
  //   // // TODO: authAPI.login(loginData) → window.location.href = '/dashboard'
  //   // alert("✅ Login ho gaya! Dashboard pe ja rahe hain...");
  //   loginMutation.mutate(loginData); //function call
  // };


const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateLogin()) return;

  loginMutation.mutate(loginData);
};

  const handleReg =  (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReg()) return;
    signupMutation.mutate(signupData); // 🔥 API call
  };

  return (
    <div
      className="min-h-screen flex bg-gray-50"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── LEFT PANEL — desktop only ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-center items-center px-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #5B54C8 0%, #7F77DD 45%, #9E78D8 100%)",
        }}
      >
        {/* Background circles */}
        <div className="absolute w-80 h-80 rounded-full opacity-10 bg-white -top-20 -left-20" />
        <div className="absolute w-60 h-60 rounded-full opacity-10 bg-white -bottom-16 -right-16" />
        <div className="absolute w-40 h-40 rounded-full opacity-5 bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Content */}
        <div className="relative text-center max-w-sm">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-3xl mx-auto mb-6 backdrop-blur-sm">
            💳
          </div>

          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
            Emi Tracker
          </h1>
          <p className="text-violet-200 text-sm leading-relaxed mb-10">
            Track all your loans and installments in one place — never miss a
            due date
          </p>

          {/* Feature list */}
          <div className="space-y-3 text-left">
            {[
              {
                icon: "📅",
                title: "Smart Reminders",
                sub: "Get alerts before due dates",
              },
              {
                icon: "📱",
                title: "WhatsApp Reminder",
                sub: "Send reminders to payer in one click",
              },
              {
                icon: "📊",
                title: "Dashboard",
                sub: "See all your loans at a glance",
              },
              {
                icon: "🔔",
                title: "Email Notifications",
                sub: "Automatic reminder system",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-sm flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{f.title}</p>
                  <p className="text-violet-300 text-[11px]">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-8 flex items-center justify-center gap-2 bg-white/10 border border-white/15 rounded-xl px-4 py-2.5">
            <span className="text-sm">🔒</span>
            <span className="text-violet-200 text-xs font-medium">
              100% Secure · Completely Free
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
              style={{
                background: "linear-gradient(135deg, #7F77DD, #9E78D8)",
                boxShadow: "0 8px 24px rgba(127,119,221,0.4)",
              }}
            >
              💳
            </div>
            <h1 className="text-2xl font-bold text-violet-900">EMI Tracker</h1>
            <p className="text-gray-400 text-xs mt-1">
              Loan installment manager
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
            {/* Tab switcher */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-7 gap-1">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchTo(m)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background:
                      mode === m
                        ? "linear-gradient(135deg, #7F77DD, #9E78D8)"
                        : "transparent",
                    color: mode === m ? "white" : "#9CA3AF",
                    boxShadow:
                      mode === m ? "0 4px 12px rgba(127,119,221,0.35)" : "none",
                  }}
                >
                  {m === "login" ? "Login " : "Register "}
                </button>
              ))}
            </div>

            {/* Form wrapper with fade */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.25s, transform 0.25s",
              }}
            >
              {/* ── LOGIN FORM ─────────────────────────── */}
              {mode === "login" && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Welcome Back 👋
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Login using your email and password
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field
                      label="Email Address"
                      type="email"
                      value={loginData.email}
                      onChange={(v) =>
                        setLoginData((f) => ({ ...f, email: v }))
                      } //old data copy and update email
                      placeholder="priya@gmail.com"
                      icon="✉️"
                      error={lErr.email}
                    />
                    <div>
                      <Field
                        label="Password"
                        type="password"
                        value={loginData.password}
                        onChange={(v) =>
                          setLoginData((f) => ({ ...f, password: v }))
                        }
                        placeholder="Enter your password"
                        icon="🔐"
                        error={lErr.password}
                      />
                      <div className="text-right mt-2">
                        <span className="text-xs text-violet-600 font-semibold cursor-pointer hover:underline"></span>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 mt-2"
                      style={{
                        background: "linear-gradient(135deg, #7F77DD, #9E78D8)",
                        boxShadow: "0 6px 20px rgba(127,119,221,0.4)",
                      }}
                      onMouseEnter={(e) => {
                        if (!loginMutation.isPending)
                          e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {/* {lLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8h4z"/>
                          </svg>
                          {loginMutation.isPending ? "Logging in..." : "Login  →"}
                        </span>
                      ) : "Login  →"} */}
                      {loginMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="white"
                              strokeWidth="4"
                            />
                          </svg>
                          Logging in...
                        </span>
                      ) : (
                        "Login →"
                      )}
                    </button>

                  
                    {/* Google */}
                    {/* <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-200"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                     Login with Google
                    </button> */}
                  </form>

                  <p className="text-center text-xs text-gray-400 mt-5">
                    Don’t have an account??{" "}
                    <span
                      onClick={() => switchTo("register")}
                      className="text-violet-600 font-semibold cursor-pointer hover:underline"
                    >
                      Register
                    </span>
                  </p>
                </>
              )}

              {/* ── REGISTER FORM ──────────────────────── */}
              {mode === "register" && (
                <>
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Create Account 🎉
                    </h2>
                  </div>

                  <form onSubmit={handleReg} className="space-y-4">
                    <Field
                      label="Your Name"
                      type="text"
                      value={signupData.name}
                      onChange={(v) =>
                        setSignupData((f) => ({ ...f, name: v }))
                      }
                      placeholder="Himu Sharma"
                      icon="😊"
                      error={rErr.name}
                    />
                    <Field
                      label="Email Address"
                      type="email"
                      value={signupData.email}
                      onChange={(v) =>
                        setSignupData((f) => ({ ...f, email: v }))
                      }
                      placeholder="priya@gmail.com"
                      icon="✉️"
                      error={rErr.email}
                    />
                    {/* <Field label="Phone Number (optional)" type="tel" value={signupData.phone} onChange={(v) => setSignupData((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" icon="📱" /> */}

                    <div>
                      <Field
                        label="Password"
                        type="password"
                        value={signupData.password}
                        onChange={(v) =>
                          setSignupData((f) => ({ ...f, password: v }))
                        }
                        placeholder="Create a strong password"
                        icon="🔐"
                        error={rErr.password}
                      />
                    </div>

                    <Field
                      label=" Confirm Password "
                      type="password"
                      value={signupData.confirm}
                      onChange={(v) =>
                        setSignupData((f) => ({ ...f, confirm: v }))
                      }
                      placeholder="Re-enter password"
                      icon="✅"
                      error={rErr.confirm}
                    />

                    {/* Terms */}
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      By creating an account,{" "}
                      <span className="text-violet-600 font-semibold cursor-pointer">
                        Terms of Service
                      </span>{" "}
                      you{" "}
                      <span className="text-violet-600 font-semibold cursor-pointer">
                        Privacy Policy
                      </span>{" "}
                      agree to our Terms of Service and Privacy Policy
                    </p>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={signupMutation.isPending}
                      className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #7F77DD, #9E78D8)",
                        boxShadow: "0 6px 20px rgba(127,119,221,0.4)",
                      }}
                      // button move up on hover (if not loading)
                      onMouseEnter={(e) => {
                        if (!signupMutation.isPending)
                          e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {signupMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="white"
                              strokeWidth="4"
                            />
                          </svg>
                          Creating account...
                        </span>
                      ) : (
                        "Sign Up →"
                      )}
                    </button>

                  </form>

                  <p className="text-center text-xs text-gray-400 mt-5">
                    Already have an account?{" "}
                    <span
                      onClick={() => switchTo("login")}
                      className="text-violet-600 font-semibold cursor-pointer hover:underline"
                    >
                      Login
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
