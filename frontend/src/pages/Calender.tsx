"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../utils/api.ts";
import Swal from "sweetalert2";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ─── TYPES ────────────────────────────────────────────────────
interface Loan {
  id: number;
  loan_name: string;
  emi_amount: number;
  next_due_date: string; // ISO date string
  daysLeft: number;
  payer_name: string;
  payer_type: "self" | "parent" | "friend" | "other";
  payer_phone?: string;
  color: string;
  total_emis: number;
  remaining_emis: number;
  total_amount: number;
  interest_rate: number;
  start_date: string;
  payer_email?: string;
  notes?: string;
  is_active: boolean;
}

interface LoanResponse {
  count: number;
  loans: Loan[];
}

// ─── DUMMY DATA ───────────────────────────────────────────────
// const LOANS: Loan[] = [
//   { id: 1, name: "PayRubik",  emi: 4200, dueDay: 4,  daysLeft: 1,  payer: "Papa",     payerType: "other", payerPhone: "9876543210", color: "#7F77DD", remaining: 14 },
//   { id: 2, name: "KreditBee", emi: 2800, dueDay: 8,  daysLeft: 5,  payer: "Aap khud", payerType: "self",  color: "#1D9E75", remaining: 9  },
//   { id: 3, name: "Kist App",  emi: 1500, dueDay: 15, daysLeft: 12, payer: "Rahul",    payerType: "other", payerPhone: "9123456789", color: "#D85A30", remaining: 10 },
//   { id: 4, name: "MoneyTap",  emi: 3500, dueDay: 20, daysLeft: 17, payer: "Aap khud", payerType: "self",  color: "#378ADD", remaining: 6  },
// ];

const NAV = [
  { icon: "⊞", label: "Dashboard", active: false, href: "/dashboard" },
  { icon: "₹", label: "My Loan", active: false, href: "/my-loans" },
  { icon: "＋", label: "Add Loan", active: false, href: "/add-loan" },
  { icon: "📅", label: "Calendar", active: true, href: "/calendar" },
  { icon: "🕐", label: "History", active: false, href: "/history" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── HELPERS ─────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getDaysLabel(days: number) {
  if (days === 0) return "Today Due!";
  if (days === 1) return "Tomorrow Due!";
  return `${days} days later`;
}
function getBadgeClass(days: number) {
  if (days <= 1) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}
function getWALink(phone: string, name: string, emi: number, dueDate: string) {
  const formattedDate = new Date(dueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const msg = `Hi ${name}, your EMI of ₹${emi} is due on ${formattedDate}. Please make the payment.`;

  const encodedMsg = encodeURIComponent(msg);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile → Direct WhatsApp App
    return `whatsapp://send?phone=91${phone}&text=${encodedMsg}`;
  }

  // Desktop
  return `https://wa.me/91${phone}?text=${encodedMsg}`;
}

// ─── LOAN MINI PILL (inside calendar cell) ───────────────────
function LoanPill({ loan }: { loan: Loan }) {
  return (
    <div
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full truncate mt-0.5 text-white leading-tight shadow-sm"
      style={{ backgroundColor: loan.color }}
      title={`${loan.loan_name} — ₹${loan.emi_amount.toLocaleString("en-IN")}`}
    >
      {loan.loan_name}
    </div>
  );
}

// ─── LOAN DETAIL CARD ────────────────────────────────────────
function LoanDetailCard({
  loan,
  onPay,
}: {
  loan: Loan;
  onPay: (id: number) => void;
}) {
  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-sm"
      style={{
        borderColor: `${loan.color}30`,
        backgroundColor: `${loan.color}08`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: loan.color }}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {loan.loan_name}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Payer:{" "}
              <span className="font-medium text-gray-600">
                {loan.payer_name}
              </span>
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-gray-800">
            ₹{loan.emi_amount.toLocaleString("en-IN")}
          </p>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeClass(loan.daysLeft)}`}
          >
            {getDaysLabel(loan.daysLeft)}
          </span>
        </div>
      </div>

      {/* Remaining */}
      <p className="text-[11px] text-gray-400 mb-3">
        {loan.remaining_emis} installments left
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        {loan.payer_type !== "self" && loan.payer_phone && (
          <a
            href={getWALink(
              loan.payer_phone,
              loan.payer_name,
              // loan.loan_name,
              loan.emi_amount,
              loan.next_due_date,
            )}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            📱 WhatsApp
          </a>
        )}
        <button
          onClick={() => onPay(loan.id)}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          ✓ Paid Mark Karo
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    today.getDate(),
  );
  // const [loans, setLoans]               = useState<Loan[]>(LOANS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>({});
  const queryClient = useQueryClient();

  // For dynamic user data in frontend
  // const user = JSON.parse(localStorage.getItem("kist_user") || "{}");
  useEffect(() => {
    const storedUser = localStorage.getItem("kist_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Loan api
  const fetchLoans = async () => {
    const res = await API.get("/loans");
    return res.data;
  };

  const { data: loanData } = useQuery<LoanResponse>({
    queryKey: ["loans"],
    queryFn: fetchLoans,
  });

  const loans = loanData?.loans || [];
  // console.log(loans);

  // patch api for update on servers
  // const payMutation = useMutation({
  //   mutationFn: (id: number) => API.patch(`/dashboard/${id}/pay`),

  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["loans"] }); //Query Refresh after payment update
  //     queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  //   },
  // });

  const payMutation = useMutation({
  mutationFn: async (loan: Loan) => {

    // 1. loan update
    await API.patch(`/dashboard/${loan.id}/pay`);

    // 2. payment history save
    await API.post("/payments/add", {
      loan_id: loan.id,
      amount_paid: loan.emi_amount,
      paid_by: loan.payer_name,
      payment_date: new Date(),
      notes: "EMI Paid",
    });
  },

  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
  },
});

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function getLoansForDay(day: number) {
    return loans.filter((l) => new Date(l.next_due_date).getDate() === day);
  }

  // Calendar calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDay(currentYear, currentMonth);
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDay(null);
  };
  

  const handlePay = async (id: number) => {
    const loan = loans.find((l) => l.id === id);

    if (!loan) return;

    const result = await Swal.fire({
      title: "Mark as Paid?",
      text: `₹${loan.emi_amount.toLocaleString(
        "en-IN",
      )} EMI for ${loan.loan_name}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, Paid ✅",
      cancelButtonText: "Cancel",
      background: "#fff",
      // borderRadius: "16px",
      customClass: {
        popup: "rounded-3xl",
      },
    });

    if (!result.isConfirmed) return;

    payMutation.mutate(loan, {
      onSuccess: () => {
        Swal.fire({
          title: "Payment Updated 🎉",
          text: `${loan.loan_name} EMI marked as paid`,
          icon: "success",
          confirmButtonColor: "#7c3aed",
          timer: 1800,
          showConfirmButton: false,
        });
      },

      onError: () => {
        Swal.fire({
          title: "Something went wrong ❌",
          text: "Payment could not be updated",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      },
    });
  };

  // Selected day loans
  const selectedLoans = selectedDay ? getLoansForDay(selectedDay) : [];

  // Month summary: all due dates
  const totalMonthlyEmi = loans.reduce((s, l) => s + Number(l.emi_amount), 0);
  
  const dueDays = [
    ...new Set(loans.map((l) => new Date(l.next_due_date).getDate())),
  ].sort((a, b) => a - b); //small to large arrange

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── SIDEBAR OVERLAY ─────────────────────────────── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`
        fixed top-0 left-0 h-full z-40 w-56 bg-white border-r border-violet-100
        flex flex-col transition-transform duration-300
        ${isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
        lg:static lg:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-violet-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
              E
            </div>
            <div>
              <p className="font-bold text-violet-900 text-sm leading-tight">
                EMI Tracker
              </p>
              <p className="text-[10px] text-gray-400">Loan Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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

        {/* User + Logout */}
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

      {/* ── MAIN CONTENT ────────────────────────────────── */}
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
              <p className="text-[11px] text-gray-400">Due dates</p>
              <h1 className="text-base font-bold text-violet-900 leading-tight">
                Calendar View 📅
              </h1>
            </div>
          </div>

          {/* Month navigator — desktop top bar */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors text-sm font-bold"
            >
              ◀
            </button>
            <span className="text-sm font-bold text-gray-700 min-w-[140px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors text-sm font-bold"
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
              setSelectedDay(today.getDate());
            }}
            className="text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl font-semibold transition-colors"
          >
            Today
          </button>
        </header>

        {/* Body */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* Mobile month nav */}
          <div className="flex sm:hidden items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-50 text-sm font-bold"
            >
              ◀
            </button>
            <span className="text-sm font-bold text-gray-700">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-50 text-sm font-bold"
            >
              ▶
            </button>
          </div>

          {/* ── TWO COLUMN LAYOUT ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── LEFT: CALENDAR ────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-violet-50">
                  {DAYS_SHORT.map((d) => (
                    <div
                      key={d}
                      className="py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {/* Empty cells before month starts */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[80px] lg:min-h-[100px] border-b border-r border-violet-50/60 p-1.5 bg-gray-50/30"
                    />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayLoans = getLoansForDay(day);
                    const isSelected = selectedDay === day;
                    const todayCell = isToday(day);
                    const hasDue = dayLoans.length > 0;
                    const isUrgent = dayLoans.some((l) => l.daysLeft <= 3);

                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`
                          min-h-[80px] lg:min-h-[100px] border-b border-r border-violet-50/60
                          p-1.5 cursor-pointer transition-all duration-150 relative
                          ${isSelected ? "bg-violet-50 ring-2 ring-inset ring-violet-400" : "hover:bg-gray-50"}
                          ${(i + firstDayOfMonth + 1) % 7 === 0 ? "border-r-0" : ""}
                        `}
                      >
                        {/* Day number */}
                        <div className="flex items-start justify-between mb-1">
                          <span
                            className={`
                              w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold transition-all
                              ${
                                todayCell
                                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                  : isSelected
                                    ? "bg-violet-100 text-violet-700"
                                    : hasDue
                                      ? "text-gray-800"
                                      : "text-gray-400"
                              }
                            `}
                          >
                            {day}
                          </span>
                          {/* Urgent dot */}
                          {isUrgent && !todayCell && (
                            <span className="w-2 h-2 rounded-full bg-red-500 mt-1 mr-0.5 flex-shrink-0" />
                          )}
                        </div>

                        {/* Loan pills */}
                        <div className="space-y-0.5">
                          {dayLoans.slice(0, isMobile ? 1 : 2).map((loan) => (
                            <LoanPill key={loan.id} loan={loan} />
                          ))}
                          {dayLoans.length > (isMobile ? 1 : 2) && (
                            <div className="text-[9px] text-gray-400 font-medium pl-0.5">
                              +{dayLoans.length - (isMobile ? 1 : 2)} and more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-3 border-t border-violet-50 flex-wrap">
                  <span className="text-[11px] text-gray-400 font-medium">
                    Legend:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[9px] text-white font-bold">
                      {today.getDate()}
                    </div>
                    <span className="text-[11px] text-gray-500">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: "#7F77DD" }}
                    />
                    <span className="text-[11px] text-gray-500">Due date</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[11px] text-gray-500">
                      Urgent (3 days)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL ───────────────────────── */}
            <div className="space-y-4">
              {/* Selected day details */}
              <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-violet-50 flex items-center justify-between">
                  <h2 className="font-bold text-gray-800 text-sm">
                    {selectedDay
                      ? `Due on ${selectedDay} ${MONTHS[currentMonth]}`
                      : "Choose a day"}
                  </h2>
                  {selectedDay && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        selectedLoans.length > 0
                          ? "bg-violet-100 text-violet-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {selectedLoans.length} loan
                      {selectedLoans.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {!selectedDay && (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-2">📅</p>
                      <p className="text-sm text-gray-400">
                        Select a date from the calendar
                      </p>
                    </div>
                  )}

                  {selectedDay && selectedLoans.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-3xl mb-2">✅</p>
                      <p className="text-sm text-gray-400">
                        No installments for this day!
                      </p>
                    </div>
                  )}

                  {selectedDay && selectedLoans.length > 0 && (
                    <div className="space-y-3">
                      {selectedLoans.map((loan) => (
                        <LoanDetailCard
                          key={loan.id}
                          loan={loan}
                          onPay={handlePay}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Month summary */}
              <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-violet-50">
                  <h2 className="font-bold text-gray-800 text-sm">
                    {MONTHS[currentMonth]} Summary
                  </h2>
                </div>

                <div className="p-4 space-y-3">
                  {/* Total EMI */}
                  <div className="bg-violet-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-violet-400 font-medium">
                        Total EMI
                      </p>
                      <p className="text-xl font-bold text-violet-700">
                        ₹{totalMonthlyEmi.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className="text-2xl">💳</span>
                  </div>

                  {/* Due dates list */}
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Due Dates This Month
                    </p>
                    <div className="space-y-2">
                      {loans
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.next_due_date).getTime() -
                            new Date(b.next_due_date).getTime(),
                        )
                        .map((loan) => (
                          <div
                            key={loan.id}
                            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setSelectedDay(
                                  new Date(loan.next_due_date).getDate(),
                                )
                            }
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: loan.color }}
                            >
                              {/* {loan.next_due_date} */}
                              {loan.loan_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-700 truncate">
                                {loan.loan_name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                ₹{loan.emi_amount.toLocaleString("en-IN")} ·{" "}
                                {loan.payer_name}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getBadgeClass(loan.daysLeft)}`}
                            >
                              {getDaysLabel(loan.daysLeft)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* All due days strip */}
                  <div className="pt-2 border-t border-violet-50">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Due Dates
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {dueDays.map((day) => (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                            selectedDay === day
                              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                              : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick add */}
              <a
                href="/add-loan"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 hover:border-violet-400 transition-all text-sm font-semibold"
              >
                <span className="text-lg">＋</span> Add New Loan
              </a>
            </div>
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-violet-100">
        <ul className="flex">
          {NAV.map((item) => (
            <li key={item.label} className="flex-1">
              <a
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 ${
                  item.active ? "text-violet-700" : "text-gray-400"
                }`}
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
