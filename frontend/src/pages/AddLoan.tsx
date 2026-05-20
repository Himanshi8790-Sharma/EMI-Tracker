"use client";

import { useState, useEffect } from "react";
import API from "../utils/api.ts";
import { useMutation } from "@tanstack/react-query";
import Swal from "sweetalert2";

type PayerType =
  | "self"
  | "parent"
  | "friend"
  | "other";

interface FormData {
  loan_name: string;
  total_amount: string;
  emi_amount: string;
  total_emis: string;
  remaining_emis: string;
  interest_rate: string;
  start_date: string;
  next_due_date: string;
  payer_type: PayerType;
  payer_name: string;
  payer_phone: string;
  payer_email: string;
  color: string;
  notes: string;
}

interface FormErrors {
  loan_name?: string;
  total_amount?: string;
  emi_amount?: string;
  total_emis?: string;
  next_due_date?: string;
  remaining_emis?: string;
  interest_rate?: string;
  payer_name?: string;
  payer_phone?: string;
  payer_email?: string;
  start_date?: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────
const PAYER_OPTIONS: { key: PayerType; label: string; icon: string }[] = [
  { key: "self", label: "Me", icon: "🙋" },
  { key: "parent", label: "Parent", icon: "👨" },
  { key: "friend", label: "Friend", icon: "🤝" },
  { key: "other", label: "Other", icon: "👤" },
];

const COLORS = [
  { hex: "#7F77DD", name: "Purple" },
  { hex: "#1D9E75", name: "Teal" },
  { hex: "#D85A30", name: "Orange" },
  { hex: "#378ADD", name: "Blue" },
  { hex: "#BA7517", name: "Amber" },
  { hex: "#D4537E", name: "Pink" },
  { hex: "#639922", name: "Green" },
  { hex: "#8B5CF6", name: "Violet" },
];

const NAV = [
  { icon: "⊞", label: "Dashboard", active: false, href: "/dashboard" },
  { icon: "₹", label: "My Loans", active: false, href: "/my-loans" },
  { icon: "＋", label: "Add Loan", active: true, href: "/add-loan" },
  { icon: "📅", label: "Calendar", active: false, href: "/calendar" },
  { icon: "🕐", label: "History", active: false, href: "/history" },
];

// ─── INPUT FIELD ──────────────────────────────────────────────
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  error,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div
        className={`flex items-center border rounded-xl transition-all duration-150 ${
          error
            ? "border-red-300 bg-red-50"
            : focused
              ? "border-violet-400 bg-white ring-2 ring-violet-100"
              : "border-gray-200 bg-gray-50 hover:border-gray-300"
        }`}
      >
        {prefix && (
          <span className="pl-3.5 pr-1 text-sm text-violet-500 font-semibold flex-shrink-0 select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-3 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-300 min-w-0"
          style={{ paddingLeft: prefix ? "4px" : undefined }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  sub,
  children,
}: {
  icon: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-5 lg:p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-violet-50">
        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AddLoan() {
  const [form, setForm] = useState<FormData>({
    loan_name: "",
    total_amount: "",
    emi_amount: "",
    total_emis: "",
    start_date: "",
    next_due_date: "",
    remaining_emis: "",
    interest_rate: "",
    payer_type: "self",
    payer_name: "",
    payer_phone: "",
    payer_email: "",
    color: "#7F77DD",
    notes: "",
  });
  const [user, setUser] = useState<any>({});

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedLoan, setSavedLoan] = useState<FormData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // For dynamic user data in frontend
  // const user = JSON.parse(localStorage.getItem("kist_user") || "{}");
  useEffect(() => {
  const storedUser = localStorage.getItem("kist_user");

  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);

  const addLoan = async (loanData: FormData) => {
    console.log("SENDING DATA:", loanData);

    const res = await API.post("/loans/add", loanData);
    return res.data;
  };

  const addLoanMutation = useMutation({
    mutationFn: addLoan,
    onSuccess: (data) => {
      console.log(data);

      Swal.fire({
        icon: "success",
        title: "Loan Added 🎉",
        text: data.message,
      });
      setSavedLoan(form);
      setSubmitted(true);

      // Form reset
      setForm({
        loan_name: "",
        total_amount: "",
        emi_amount: "",
        next_due_date: "",
        remaining_emis: "",
        interest_rate: "",
        total_emis: "",
        start_date: "",
        payer_type: "self",
        payer_name: "",
        payer_phone: "",
        payer_email: "",
        color: "#7F77DD",
        notes: "",
      });
    },
    onError: (err: any) => {
       console.log("FULL ERROR:", err);
  console.log("ERROR DATA:", err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Failed ❌",
        text: err.response?.data?.message || "Something went wrong",
      });
    },
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const set = (key: keyof FormData) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Live preview calculations
  const emi = parseFloat(form.emi_amount) || 0;
  const remaining = parseInt(form.remaining_emis) || 0;
  const totalPayable = emi * remaining;
  const totalEmis = form.total_amount
    ? Math.round(parseFloat(form.total_amount) / emi)
    : remaining;
  const paidEmis = Math.max(0, totalEmis - remaining);
  const progressPct =
    totalEmis > 0 ? Math.round((paidEmis / totalEmis) * 100) : 0;

  // Validate
  const validate = (): boolean => {
    const e: FormErrors = {};

    const emi = Number(form.emi_amount);
    const remaining = Number(form.remaining_emis);

    if (!form.loan_name.trim()) e.loan_name = "Loan name is required";

    if (!form.emi_amount || emi <= 0) e.emi_amount = "Monthly EMI is required";

    // if (
    //   !form.next_due_date ||
    //   parseInt(form.next_due_date) < 1 ||
    //   parseInt(form.next_due_date) > 31
    // )
    //   e.next_due_date = "Enter a valid date between 1 and 31";
    if (!form.next_due_date) {
  e.next_due_date = "Select due date";
}

    if (!form.remaining_emis || remaining <= 0)
      e.remaining_emis = "Enter remaining EMIs";

    if (!form.total_emis || Number(form.total_emis) <= 0)
  e.total_emis = "Enter total EMIs";

if (!form.start_date)
  e.start_date = "Select start date";

    if (
      form.payer_phone &&
      !/^\d{10}$/.test(form.payer_phone.replace(/\s/g, ""))
    )
      e.payer_phone = "Enter a valid 10-digit phone number";

    if (form.payer_email && !/\S+@\S+\.\S+/.test(form.payer_email))
      e.payer_email = "Enter a valid email address";

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
    if (!validate()) return;
    addLoanMutation.mutate(form);
  };

  // ─── SUCCESS STATE ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-violet-100 p-8 text-center max-w-sm w-full shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">
            {" "}
            🎉
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {" "}
            Loan Added Successfully!
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            {" "}
            <span className="font-semibold text-violet-700">
              {" "}
              {savedLoan?.loan_name}{" "}
            </span>{" "}
            has been saved successfully.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            {" "}
            ₹{emi.toLocaleString("en-IN")}every month · Due on{" "}
            {savedLoan?.next_due_date}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setForm({
                  loan_name: "",
                  total_amount: "",
                  emi_amount: "",
                  next_due_date: "",
                  remaining_emis: "",
                  interest_rate: "",
                  total_emis: "",
                  start_date: "",
                  payer_type: "self",
                  payer_name: "",
                  payer_phone: "",
                  payer_email: "",
                  color: "#7F77DD",
                  notes: "",
                });
                setSubmitted(false);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
            >
              + Add Another Loan
            </button>
            <a
              href="/dashboard"
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors text-center"
            >
              Dashboard →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── SIDEBAR OVERLAY ────────────────────────────────── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`
        fixed top-0 left-0 h-full z-40 w-56 bg-white border-r border-violet-100
        flex flex-col transition-transform duration-300
        ${isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
        lg:static lg:translate-x-0
      `}
      >
        <div className="px-5 py-4 border-b border-violet-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <div>
              <p className="font-bold text-violet-900 text-sm">EMI Tracker</p>
              <p className="text-[10px] text-gray-400">Loan Manager</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                item.active
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
       <div className="px-4 py-4 border-t border-violet-50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm flex-shrink-0">
  🌸
</div>
            <div className="min-w-0">
              <p className=" text-md font-semibold text-gray-800 truncate">
                {user.name || "Priya Sharma"}
              </p>
              <p className=" text-[10px] text-gray-400 truncate">
                {user.email || "priya@gmail.com"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("kist_token");
              localStorage.removeItem("kist_user");
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-violet-100 px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-violet-700"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 4h14M2 9h14M2 14h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div>
              <p className="text-[11px] text-gray-400">New</p>
              <h1 className="text-base font-bold text-violet-900 leading-tight">
                Add Loan ➕
              </h1>
            </div>
          </div>
          <a
            href="/my-loans"
            className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            ← Return
          </a>
        </header>

        {/* Body */}
        <main className="p-4 lg:p-6 pb-28 lg:pb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl">
              {/* ── LEFT: FORM (2 cols on desktop) ─────────── */}
              <div className="lg:col-span-2 space-y-5">
                {/* Section 1: Loan Details */}
                <SectionCard
                  icon="💳"
                  title="Loan Details"
                  sub=" Fill Basic information "
                >
                  <InputField
                    label="Loan / App Name"
                    value={form.loan_name}
                    onChange={set("loan_name")}
                    placeholder="e.g. PayRubik, KreditBee"
                    error={errors.loan_name}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Total Loan Amount"
                      value={form.total_amount}
                      onChange={set("total_amount")}
                      placeholder="60,000"
                      type="number"
                      prefix="₹"
                      hint="Optional "
                      error={errors.total_amount}
                    />
                    <InputField
                      label="Monthly EMI"
                      value={form.emi_amount}
                      onChange={set("emi_amount")}
                      placeholder="4,200"
                      type="number"
                      prefix="₹"
                      error={errors.emi_amount}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Next Due Date"
                      value={form.next_due_date}
                      onChange={set("next_due_date")}
                      // placeholder="1 – 31"
                      type="date"
                      error={errors.next_due_date}
                      required
                      // hint="Monthly EMI due date"
                    />
                    <InputField
                      label="Remaining EMIs"
                      value={form.remaining_emis}
                      onChange={set("remaining_emis")}
                      placeholder="14"
                      type="number"
                      error={errors.remaining_emis}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Total EMIs"
                      value={form.total_emis}
                      onChange={set("total_emis")}
                      placeholder="24"
                      type="number"
                      error={errors.total_emis}
                      required
                    />

                    <InputField
                      label="Start Date"
                      value={form.start_date}
                      onChange={set("start_date")}
                      type="date"
                      error={errors.start_date}
                      required
                    />
                  </div>

                  <InputField
                    label="Interest Rate % "
                    value={form.interest_rate}
                    onChange={set("interest_rate")}
                    placeholder="24"
                    type="number"
                    error={errors.interest_rate}
                    hint="Optional"
                  />

                  {/* EMI Summary preview */}
                  {emi > 0 && remaining > 0 && (
                    <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                      <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-3">
                        📊 Summary
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[11px] text-violet-400 mb-0.5">
                            Monthly EMI
                          </p>
                          <p className="text-base font-bold text-violet-800">
                            ₹
                            ₹
{emi.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-violet-400 mb-0.5">
                            {" "}
                            Total Payable
                          </p>
                          <p className="text-base font-bold text-violet-800">
                            ₹{totalPayable.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-violet-400 mb-0.5">
                            Remaining EMIs
                          </p>
                          <p className="text-base font-bold text-violet-800">
                            {remaining}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </SectionCard>

                {/* Section 2: Payer */}
                <SectionCard
                  icon="👤"
                  title="Who Will Pay? (Payer)"
                  sub="Who will pay the installment — you or someone else"
                >
                  {/* Payer chips */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2.5">
                      Choose Payer
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {PAYER_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, payer_type: opt.key }))
                          }
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                            form.payer_type === opt.key
                              ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                          }`}
                        >
                          <span>{opt.icon}</span>
                          {opt.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extra fields — sirf tab jab payer "Main" nahi */}
                  {form.payer_type !== "self" && (
                    <div className="space-y-4 pt-2 border-t border-violet-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField
                          label={`${form.payer_type} Name`}
                          value={form.payer_name}
                          onChange={set("payer_name")}
                          placeholder="e.g. Himuu Sharma"
                        />
                        <InputField
                          label="Phone Number (WhatsApp Reminder)"
                          value={form.payer_phone}
                          onChange={set("payer_phone")}
                          placeholder="9876543210"
                          type="tel"
                          prefix="📱"
                          error={errors.payer_phone}
                          hint="WhatsApp reminder will be sent here"
                        />
                      </div>
                      <InputField
                        label="Email Address (optional)"
                        value={form.payer_email}
                        onChange={set("payer_email")}
                        placeholder="himuu@gmail.com"
                        type="email"
                        error={errors.payer_email}
                        hint="For email reminders"
                      />

                      {/* WhatsApp message preview */}
                      {form.payer_phone && form.loan_name && emi > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-green-700 mb-2">
                            📱 WhatsApp Reminder Preview:
                          </p>
                          <p className="text-xs text-green-600 italic leading-relaxed">
                            "Hello {form.payer_name || form.payer_type}! The EMI
                            of ₹{emi.toLocaleString("en-IN")} for{" "}
                            {form.loan_name} is due on{" "}
                            {form.next_due_date || "?"}. Please pay it 🙏"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </SectionCard>

                {/* Section 3: Color + Note */}
                <SectionCard
                  icon="🎨"
                  title="Color & Note"
                  sub="Choose a color to identify your loan easily"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2.5">
                      Card Color
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() =>
                            setForm((f) => ({ ...f, color: c.hex }))
                          }
                          className="w-9 h-9 rounded-full transition-all duration-150 flex-shrink-0"
                          style={{
                            backgroundColor: c.hex,
                            border:
                              form.color === c.hex
                                ? `3px solid ${c.hex}`
                                : "3px solid transparent",
                            outline:
                              form.color === c.hex ? `2px solid white` : "none",
                            outlineOffset: "2px",
                            boxShadow:
                              form.color === c.hex
                                ? `0 0 0 4px ${c.hex}40`
                                : "none",
                            transform:
                              form.color === c.hex ? "scale(1.15)" : "scale(1)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <InputField
                    label="Note (Optional)"
                    value={form.notes}
                    onChange={set("notes")}
                    placeholder="Any important note... e.g. Urgent loan, pay first"
                  />
                </SectionCard>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={addLoanMutation.isPending}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all
                    bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300
                    shadow-lg shadow-violet-200 hover:shadow-violet-300
                    disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {addLoanMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="white"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Saving loan...
                    </span>
                  ) : (
                    "💾 Save Loan ✓"
                  )}
                </button>
              </div>

              {/* ── RIGHT: LIVE PREVIEW (desktop only) ──────── */}
              <div className="hidden lg:block">
                <div className="sticky top-20 space-y-4">
                  {/* Loan card preview */}
                  <div className="bg-white rounded-2xl border border-violet-100 p-5">
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-4">
                      👁 Live Preview
                    </p>

                    <div
                      className="rounded-xl p-4 border-2 transition-all"
                      style={{
                        borderColor: `${form.color}30`,
                        backgroundColor: `${form.color}08`,
                      }}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: form.color }}
                          />
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {form.loan_name || "Loan Name"}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {form.next_due_date
                                ? `Due on ${form.next_due_date}`
                                : "Due date —"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-lg font-bold"
                            style={{ color: form.color }}
                          >
                            ₹{emi > 0 ? emi.toLocaleString("en-IN") : "—"}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
                            {form.next_due_date
                              ? `${form.next_due_date} ko`
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Payer */}
                      <div className="mb-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            form.payer_type === "self"
                              ? "bg-teal-50 text-teal-700"
                              : "bg-violet-50 text-violet-700"
                          }`}
                        >
                          {form.payer_type === "self"
                            ? "👤 Me"
                            : `👤 ${form.payer_name || form.payer_type}`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{paidEmis} paid</span>
                          <span>{remaining} remaining</span>
                        </div>
                        <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: form.color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      {form.notes && (
                        <p className="text-[11px] text-gray-400 italic mt-2">
                          💬 {form.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tips card */}
                  <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3">
                      💡 Tips
                    </p>
                    <div className="space-y-2.5">
                      {[
                        "Add payer's phone number to send WhatsApp reminders automatically",
                        "Enter the exact due date mentioned in the loan app",
                        "Add correct remaining EMIs for accurate progress tracking",
                        "Choose different colors to identify loans easily",
                      ].map((tip, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-violet-400 text-xs mt-0.5 flex-shrink-0">
                            →
                          </span>

                          <p className="text-xs text-violet-600 leading-relaxed">
                            {tip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-violet-100">
        <ul className="flex">
          {NAV.map((item) => (
            <li key={item.label} className="flex-1">
              <a
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 ${item.active ? "text-violet-700" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-0.5 rounded-full mb-1 ${item.active ? "bg-violet-600" : "bg-transparent"}`}
                />
                <span className="text-base leading-none">{item.icon}</span>
                <span
                  className={`text-[10px] font-medium ${item.active ? "text-violet-700" : "text-gray-400"}`}
                >
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
