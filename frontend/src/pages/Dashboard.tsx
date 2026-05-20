"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import API from "../utils/api.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

// ─── TYPES ──
interface LoanAPI {
  id: number;
  loan_name: string;
  total_amount: number;
  emi_amount: number;
  next_due_date: string;
  remaining_emis: number;
  interest_rate: number;
  payer_type: "self" | "parent" | "friend" | "other";
  payer_name: string;
  payer_phone: string;
  payer_email: string;
  notes: string;
  color: string;
  is_active: boolean;
  created_at: string;
  daysLeft: number; // ✅ ADD THIS
}

interface LoanResponse {
  count: number;
  loans: LoanAPI[];
}

// ─── HELPERS ─────────────────────────────────────────────────
function getDaysLabel(days: number) {
  if (days === 0) return "Today Due!";
  if (days === 1) return "Tomorrow Due!";
  return `${days} days left`;
}

function getBadgeClass(days: number) {
  if (days <= 1) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function getAlertClass(days: number) {
  if (days <= 1) return "bg-red-50 border border-red-200 text-red-800";
  return "bg-amber-50 border border-amber-200 text-amber-800";
}

// function getWALink(
//   phone: string,
//   name: string,
//   emi: number,
//   dueDay: number,
//   owner: string,
// ) {
// const msg = `${name}, your loan installment of ₹${emi.toLocaleString("en-IN")} is due on ${dueDay}. Please make the payment 🙏`;  return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
// }

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
// ─── STAT CARD ───────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-violet-100 p-4 flex items-start gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p
          className={`text-xl font-bold truncate ${valueClass || "text-gray-800"}`}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function Dashboard() {
  // const [loans, setLoans] = useState<Loan[]>(LOANS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>({});


// For dynamic user data in frontend
  // const user = JSON.parse(localStorage.getItem("kist_user") || "{}");
  useEffect(() => {
  const storedUser = localStorage.getItem("kist_user");

  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }
}, []);
  // Dashboard api
  const fetchDashboard = async () => {
    const res = await API.get("/dashboard");
    return res.data;
  };

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const dashboard = data;

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

  // patch api for update on servers
  // const payMutation = useMutation({
  //   mutationFn: (id: number) => API.patch(`/dashboard/${id}/pay`),

  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["loans"] });
  //     queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  //   },
  // });
  const payMutation = useMutation({
  mutationFn: async (loan: LoanAPI) => {

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

  const totalEmi = dashboard?.totalEmiThisMonth || 0;
  const totalPending = dashboard?.totalPending || 0;
  const urgentLoans = dashboard?.urgentLoansCount || 0;
  const sortedLoans = [...loans].sort((a, b) => a.daysLeft - b.daysLeft);

 const handlePay = async (id: number) => {
  const loan = loans.find((l) => l.id === id);

  if (!loan) return;

  const result = await Swal.fire({
    title: "Mark as Paid?",
    text: `₹${loan.emi_amount.toLocaleString(
      "en-IN"
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

  const NAV = [
    { icon: "⊞", label: "Dashboard", active: true, to: "/dashboard" },
    { icon: "₹", label: "My Loans", active: false, to: "/my-loans" },
    { icon: "＋", label: "Add Loan", active: false, to: "/add-loan" },
    { icon: "📅", label: "Calendar", active: false, to: "/calendar" },
    { icon: "🕐", label: "History", active: false, to: "/history" },
  ];

  const greeting =
    new Date().getHours() < 12
      ? "Good Morning"
      : new Date().getHours() < 17
        ? "Good Afternoon"
        : "Good Evening";

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              K
            </div>
            <div>
              <p className="font-bold text-violet-900 text-sm leading-tight">
                EMI Tracker
              </p>
              <p className="text-[10px] text-gray-400">Loan Manager</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive
                    ? "bg-violet-50 text-violet-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`
              }
            >
              <span className="text-base w-5 text-center leading-none">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
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

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex-1 min-w-0 lg:ml-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-violet-100 px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-violet-700 transition-colors"
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
              <p className="text-[11px] text-gray-400">{greeting},</p>
              <h1 className="text-base font-bold text-violet-900 leading-tight">
                {user.name} 👋
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Notification bell */}
            <div className="relative">
              <button className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base hover:bg-violet-50 transition-colors">
                🔔
              </button>
              {urgentLoans > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {urgentLoans}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* ── STAT CARDS ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard
              label="This Month EMI"
              value={`₹${totalEmi.toLocaleString("en-IN")}`}
              sub={`${loans.length} loans`}
              icon="💳"
              valueClass="text-violet-700"
            />
            <StatCard
              label="Total loans"
              value={`${dashboard?.totalLoans || 0}`}
              sub="Overall"
              icon="📊"
              valueClass="text-blue-700"
            />
            <StatCard
              label="Urgent"
              value={`${dashboard?.urgentLoansCount || 0}`}
              sub="Due in 7 days"
              icon="🔔"
              valueClass="text-red-600"
            />
            <StatCard
              label="Active Installments"
              value={`${dashboard?.upcomingLoansCount || 0}`}
              sub="ongoing installments"
              icon="✅"
              valueClass="text-green-700"
            />
          </div>

          {/* ── HERO BANNER ────────────────────────────────── */}
          <div className="relative bg-violet-700 rounded-2xl p-5 lg:p-6 mb-5 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 left-1/3 w-28 h-28 rounded-full bg-black/10" />

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-violet-300 text-xs mb-1">
                  Total Payable This Month
                </p>
                <p className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  ₹{totalEmi.toLocaleString("en-IN")}
                </p>
                <p className="text-violet-300 text-xs mt-2">
                  Next Due on :{" "}
                  {sortedLoans[0]?.next_due_date
                    ? new Date(sortedLoans[0].next_due_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "N/A"}{" "}
                  · {sortedLoans[0]?.loan_name}
                </p>
              </div>

              {/* Mini stats */}
              <div className="flex gap-3 sm:flex-col sm:gap-2">
                <div className="flex-1 sm:flex-none bg-white/10 rounded-xl px-4 py-2.5 text-center sm:text-left sm:flex sm:items-center sm:gap-3">
                  <p className="text-white font-bold text-lg sm:text-base">
                    ₹{((totalPending || 0) / 1000).toFixed(0)}k
                  </p>
                  <p className="text-violet-300 text-[10px]">Total Remaining</p>
                </div>
                <div className="flex-1 sm:flex-none bg-white/10 rounded-xl px-4 py-2.5 text-center sm:text-left sm:flex sm:items-center sm:gap-3">
                  <p className="text-white font-bold text-lg sm:text-base">
                    {/* {urgentLoans.length} */}
                    {urgentLoans > 0 && <span>{urgentLoans}</span>}
                  </p>
                  <p className="text-violet-300 text-[10px]">
                    Urgent Payments{" "}
                  </p>
                </div>
              </div>

              <a
                href="/add-loan"
                className="hidden lg:inline-flex items-center gap-2 bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-50 transition-colors flex-shrink-0"
              >
                <span className="text-lg leading-none">＋</span> Add Loan
              </a>
            </div>
          </div>

          {/* ── URGENT ALERTS ──────────────────────────────── */}
          {urgentLoans > 0 && (
            <div className="mb-5 space-y-2">
              {dashboard?.upcomingLoans?.map((loan) => (
                <div
                  key={loan.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm flex-wrap ${getAlertClass(loan.daysLeft)}`}
                >
                  <span className="text-base flex-shrink-0">
                    {loan.daysLeft <= 1 ? "🚨" : "⏰"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold">{loan.loan_name}</span>
                    {" — "}₹{loan.emi_amount.toLocaleString("en-IN")}{" "}
                    installment is due{" "}
                    <span className="font-bold">
                      {getDaysLabel(loan.daysLeft)}
                    </span>{" "}
                    due.
                    {loan.payer_type !== "self" && (
                      <span className="ml-1 opacity-75">
                        Payer: {loan.payer}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePay(loan.id)}
                    className="flex-shrink-0 bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? "Processing..." : "✓ Paid"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── LOANS TABLE / CARDS ────────────────────────── */}
          <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-violet-50">
              <h2 className="font-bold text-gray-800 text-base">
                Upcoming Installments
              </h2>

              <Link
                to="/my-loans"
                className="text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-semibold transition-colors"
              >
                View All →
              </Link>
            </div>

            {/* ── DESKTOP TABLE ──────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-violet-50">
                    {[
                      "Loan",
                      "Monthly EMI",
                      "Payer",
                      "Progress",
                      "Due",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {sortedLoans.map((loan) => {
                    const totalEmis = Math.round(
                      loan.total_amount / loan.emi_amount,
                    );

                    const paidEmis = totalEmis - loan.remaining_emis;
                    const progress = Math.round((paidEmis / totalEmis) * 100);

                    return (
                      <tr
                        key={loan.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Loan name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: loan.color }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {loan.loan_name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Due on{" "}
                                {new Date(
                                  loan.next_due_date,
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* EMI */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-gray-800">
                            ₹{loan.emi_amount.toLocaleString("en-IN")}
                          </span>
                        </td>

                        {/* Payer */}
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              loan.payer_type === "self"
                                ? "bg-teal-50 text-teal-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            {loan.payer_type}
                          </span>
                        </td>

                        {/* Progress */}
                        <td className="px-5 py-4 min-w-[130px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${progress}%`,
                                  backgroundColor: loan.color,
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {loan.remaining_emis} left
                            </span>
                          </div>
                        </td>

                        {/* Due badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getBadgeClass(loan.daysLeft)}`}
                          >
                            {getDaysLabel(loan.daysLeft)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {loan.payer_type !== "self" && (
                              <a
                                href={getWALink(
                                  // "9876543210",
                                  loan.payer_phone,
                                  loan.payer_name,
                                  loan.emi_amount,
                                  loan.next_due_date,
                                  // "Priya",
                                  // loan.payer_name
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                              >
                                📱 WhatsApp
                              </a>
                            )}
                            <button
                              onClick={() => handlePay(loan.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors whitespace-nowrap"
                            >
                              ✓ Paid
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS ─────────────────────────────── */}
            <div className="lg:hidden divide-y divide-violet-50">
              {sortedLoans.map((loan) => {
                const totalEmis = Math.round(
                  loan.total_amount / loan.emi_amount,
                );
                const paidEmis = totalEmis - loan.remaining_emis;
                const progress = Math.round((paidEmis / totalEmis) * 100);

                return (
                  <div key={loan.id} className="p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: loan.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">
                            {loan.loan_name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Due on {loan.next_due_date} · Payer:{" "}
                            {loan.payer_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-800 text-base">
                          ₹{loan.emi_amount.toLocaleString("en-IN")}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeClass(loan.daysLeft)}`}
                        >
                          {getDaysLabel(loan.daysLeft)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>
                          {Math.round(loan.total_amount / loan.emi_amount) -
                            loan.remaining_emis}{" "}
                          Paid
                        </span>
                        <span>{loan.remaining_emis} remaining</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: loan.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {loan.payer_type !== "self" && (
                        <a
                          href={getWALink(
                            // "9876543210",
                            loan.payer_phone,
                            loan.payer_name,
                            loan.emi_amount,
                            loan.next_due_date,
                            // "Priya",
                            // loan.payer_name
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-green-50 text-green-700"
                        >
                          📱 WhatsApp
                        </a>
                      )}
                      <button
                        onClick={() => handlePay(loan.id)}
                        className="flex-1 text-xs font-semibold py-2 rounded-xl bg-violet-600 text-white"
                      >
                        ✓ Mark as Paid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── QUICK ACTIONS (mobile) ──────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mt-4 lg:hidden">
            <a
              href="/add-loan"
              className="bg-violet-600 text-white rounded-2xl p-4 text-center hover:bg-violet-700 transition-colors"
            >
              <span className="text-2xl block mb-1">＋</span>
              <span className="text-sm font-semibold"> Add Loan </span>
            </a>
            <a
              href="/calendar"
              className="bg-white border border-violet-100 text-violet-700 rounded-2xl p-4 text-center hover:bg-violet-50 transition-colors"
            >
              <span className="text-2xl block mb-1">📅</span>
              <span className="text-sm font-semibold">Calendar</span>
            </a>
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────── */}
      {/* <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-violet-100">
        <ul className="flex">
          {NAV.map((item) => (
            <li key={item.label} className="flex-1">
              <a
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                  item.active ? "text-violet-700" : "text-gray-400"
                }`}
              >
                <div className={`w-8 h-0.5 rounded-full mb-1 ${item.active ? "bg-violet-600" : "bg-transparent"}`} />
                <span className="text-base leading-none">{item.icon}</span>
                <span className={`text-[10px] font-medium ${item.active ? "text-violet-700" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav> */}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-violet-100">
        <ul className="flex">
          {NAV.map((item) => (
            <li key={item.label} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${
                    isActive ? "text-violet-700" : "text-gray-400"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-8 h-0.5 rounded-full mb-1 ${
                        isActive ? "bg-violet-600" : "bg-transparent"
                      }`}
                    />
                    <span className="text-base leading-none">{item.icon}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isActive ? "text-violet-700" : "text-gray-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
