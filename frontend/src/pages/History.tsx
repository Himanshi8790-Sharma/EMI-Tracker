"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../utils/api";

// ─── TYPES ────────────────────────────────────────────────────
interface Payment {
  id: number;
  loanName: string;
  loanColor: string;
  amount_paid: number;
  paid_by: string;
  payerType: "self" | "parent" | "friend" | "other";
  payment_date: string; // "2026-05-04"
  notes?: string;
  status: "paid" | "missed";
}

interface PaymnetResponse {
  count: number;
  payments: Payment[];
}

type FilterMonth = "all" | string; // "2026-05" format
type FilterLoan = "all" | string;
type FilterPayer = "all" | "self" | "other";

// ─── DUMMY DATA ───────────────────────────────────────────────
// const ALL_PAYMENTS: Payment[] = [
//   { id: 1,  loanName: "PayRubik",  loanColor: "#7F77DD", amount: 4200, paidBy: "Papa",     payerType: "other", date: "2026-05-04", notes: "Time pe bhar diya" },
//   { id: 2,  loanName: "KreditBee", loanColor: "#1D9E75", amount: 2800, paidBy: "Aap khud", payerType: "self",  date: "2026-05-08" },
//   { id: 3,  loanName: "Kist App",  loanColor: "#D85A30", amount: 1500, paidBy: "Rahul",    payerType: "other", date: "2026-05-15" },
//   { id: 4,  loanName: "MoneyTap",  loanColor: "#378ADD", amount: 3500, paidBy: "Aap khud", payerType: "self",  date: "2026-05-20" },
//   { id: 5,  loanName: "PayRubik",  loanColor: "#7F77DD", amount: 4200, paidBy: "Papa",     payerType: "other", date: "2026-04-04" },
//   { id: 6,  loanName: "KreditBee", loanColor: "#1D9E75", amount: 2800, paidBy: "Aap khud", payerType: "self",  date: "2026-04-08", notes: "2 din late" },
//   { id: 7,  loanName: "Kist App",  loanColor: "#D85A30", amount: 1500, paidBy: "Rahul",    payerType: "other", date: "2026-04-15" },
//   { id: 8,  loanName: "MoneyTap",  loanColor: "#378ADD", amount: 3500, paidBy: "Aap khud", payerType: "self",  date: "2026-04-20" },
//   { id: 9,  loanName: "MoneyView", loanColor: "#639922", amount: 2000, paidBy: "Mummy",    payerType: "other", date: "2026-04-05", status: "missed" as const },
//   { id: 10, loanName: "PayRubik",  loanColor: "#7F77DD", amount: 4200, paidBy: "Papa",     payerType: "other", date: "2026-03-04" },
//   { id: 11, loanName: "KreditBee", loanColor: "#1D9E75", amount: 2800, paidBy: "Aap khud", payerType: "self",  date: "2026-03-08" },
//   { id: 12, loanName: "Kist App",  loanColor: "#D85A30", amount: 1500, paidBy: "Rahul",    payerType: "other", date: "2026-03-15" },
//   { id: 13, loanName: "MoneyTap",  loanColor: "#378ADD", amount: 3500, paidBy: "Aap khud", payerType: "self",  date: "2026-03-20" },
//   { id: 14, loanName: "MoneyView", loanColor: "#639922", amount: 2000, paidBy: "Mummy",    payerType: "other", date: "2026-03-05" },
// ].map((p) => ({ status: "paid" as const, ...p }));

const NAV = [
  { icon: "⊞", label: "Dashboard", active: false, href: "/dashboard" },
  { icon: "₹", label: "My Loan", active: false, href: "/my-loans" },
  { icon: "＋", label: "Add Loan", active: false, href: "/add-loan" },
  { icon: "📅", label: "Calendar", active: false, href: "/calendar" },
  { icon: "🕐", label: "History", active: true, href: "/history" },
];

const MONTHS_LABEL: Record<string, string> = {
  "2026-05": "May 2026",
  "2026-04": "April 2026",
  "2026-03": "March 2026",
};

// ─── HELPERS ──────────────────────────────────────────────────
function getMonth(date: string) {
  return date.slice(0, 7);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getUniqueLoanNames(payments: Payment[]) {
  return [...new Set(payments.map((p) => p.loanName))];
}

function getUniqueMonths(payments: Payment[]) {
  return [...new Set(payments.map((p) => getMonth(p.payment_date)))]
    .sort()
    .reverse();
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-violet-100 p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p
          className={`text-xl font-bold truncate ${valueColor || "text-gray-800"}`}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── PAYMENT ROW (desktop) ────────────────────────────────────
function PaymentRow({ payment }: { payment: Payment }) {
  const isPaid = payment.status === "paid";
  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">
      {/* Loan */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: payment.loanColor }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {payment.loanName}
            </p>
            {payment.notes && (
              <p className="text-[11px] text-gray-400 italic">
                {payment.notes}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className="px-5 py-3.5">
        <span
          className={`text-sm font-bold ${isPaid ? "text-green-600" : "text-red-500"}`}
        >
          {isPaid ? "+" : "-"}₹{payment.amount_paid.toLocaleString("en-IN")}
        </span>
      </td>

      {/* Paid by */}
      <td className="px-5 py-3.5">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            payment.payerType === "self"
              ? "bg-teal-50 text-teal-700"
              : "bg-violet-50 text-violet-700"
          }`}
        >
          {/* {payment.paid_by} */}
          {
  payment.payerType === "self"
    ? "Self"
    : payment.payerType === "parent"
      ? "Parent"
      : payment.payerType === "friend"
        ? "Friend"
        : "Other"
}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 text-sm text-gray-500">
        {formatDate(payment.payment_date)}
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isPaid ? "✓ Paid" : "✗ Missed"}
        </span>
      </td>
    </tr>
  );
}

// ─── PAYMENT CARD (mobile) ────────────────────────────────────
function PaymentCard({ payment }: { payment: Payment }) {
  const isPaid = payment.status === "paid";
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-violet-50 last:border-0">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}
      >
        {isPaid ? "✓" : "✗"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: payment.loanColor }}
          />
          <p className="text-sm font-semibold text-gray-800 truncate">
            {payment.loanName}
          </p>
        </div>
        <p className="text-[11px] text-gray-400">
          {formatDate(payment.payment_date)} · {payment.paid_by}
        </p>
        {payment.notes && (
          <p className="text-[11px] text-gray-400 italic mt-0.5">
            💬 {payment.notes}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-bold ${isPaid ? "text-green-600" : "text-red-500"}`}
        >
          {isPaid ? "+" : "-"}₹{payment.amount_paid.toLocaleString("en-IN")}
        </p>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isPaid ? "Paid" : "Missed"}
        </span>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function History() {
  const [filterMonth, setFilterMonth] = useState<FilterMonth>("all");
  const [filterLoan, setFilterLoan] = useState<FilterLoan>("all");
  const [filterPayer, setFilterPayer] = useState<FilterPayer>("all");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>({});

  // For dynamic user data in frontend
  // const user = JSON.parse(localStorage.getItem("kist_user") || "{}");
  useEffect(() => {
    const storedUser = localStorage.getItem("kist_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  // For fetching payments from backend

  const fetchPayments = async () => {
    const res = await API.get("/payments");
    return res.data;
  };

  const { data } = useQuery<PaymnetResponse>({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const ALL_PAYMENTS = data?.payments || [];

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Apply filters
  const filtered = ALL_PAYMENTS.filter((p) => {
    if (filterMonth !== "all" && getMonth(p.payment_date) !== filterMonth)
      return false;
    if (filterLoan !== "all" && p.loanName !== filterLoan) return false;
    if (filterPayer !== "all" && p.payerType !== filterPayer) return false;
    if (
      search &&
      !p.loanName.toLowerCase().includes(search.toLowerCase()) &&
      !p.paid_by.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  }).sort(
    (a, b) =>
      new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
  );

  // Stats
  const totalPaid = filtered
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount_paid), 0);
  const totalMissed = filtered
    .filter((p) => p.status === "missed")
    .reduce((s, p) => s + Number(p.amount_paid), 0);
  const paidCount = filtered.filter((p) => p.status === "paid").length;
  const missedCount = filtered.filter((p) => p.status === "missed").length;

  // Group by month
  const grouped = filtered.reduce<Record<string, Payment[]>>((acc, p) => {
    const m = getMonth(p.payment_date);
    if (!acc[m]) acc[m] = [];
    acc[m].push(p);
    return acc;
  }, {});

  const months = Object.keys(grouped).sort().reverse();
  const uniqueMonths = getUniqueMonths(ALL_PAYMENTS);
  const uniqueLoans = getUniqueLoanNames(ALL_PAYMENTS);

  // CSV export
  const exportCSV = () => {
    const rows = [
      ["Loan", "Amount", "Paid By", "Date", "Status", "Notes"],
      ...filtered.map((p) => [
        p.loanName,
        p.amount_paid,
        p.paid_by,
        p.payment_date,
        p.status,
        p.notes || "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payment-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── SIDEBAR OVERLAY ──────────────────────────────── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────── */}
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
              <p className="font-bold text-violet-900 text-sm leading-tight">
                EMI Tracker
              </p>
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

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
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
              <p className="text-[11px] text-gray-400">Saari payments</p>
              <h1 className="text-base font-bold text-violet-900 leading-tight">
                Payment History 🕐
              </h1>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            <span>⬇</span>
            <span className="hidden sm:inline">CSV Export</span>
          </button>
        </header>

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* ── STAT CARDS ─────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatCard
              icon="✅"
              label="Total Paid"
              value={`₹${totalPaid.toLocaleString("en-IN")}`}
              sub={`${paidCount} payments`}
              valueColor="text-green-600"
            />

            <StatCard
              icon="💳"
              label="Filtered Payments"
              value={`${filtered.length}`}
              sub="payments"
              valueColor="text-violet-700"
            />

            <StatCard
              icon="❌"
              label="Missed"
              value={`${missedCount}`}
              sub={
                missedCount > 0
                  ? `₹${totalMissed.toLocaleString("en-IN")}`
                  : "All good!"
              }
              valueColor={missedCount > 0 ? "text-red-500" : "text-green-600"}
            />

            <StatCard
              icon="📊"
              label="Average EMI"
              value={
                filtered.length > 0
                  ? `₹${Math.round(
                      totalPaid / Math.max(paidCount, 1),
                    ).toLocaleString("en-IN")}`
                  : "—"
              }
              sub="per payment"
              valueColor="text-blue-600"
            />
          </div>

          {/* ── FILTERS ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-5">
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[160px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search loan or payer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>

              {/* Month filter */}
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-gray-600 bg-white transition-all"
              >
                <option value="all">📅 Months</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>
                    {MONTHS_LABEL[m] || m}
                  </option>
                ))}
              </select>

              {/* Loan filter */}
              <select
                value={filterLoan}
                onChange={(e) => setFilterLoan(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 text-gray-600 bg-white transition-all"
              >
                <option value="all">💳 Loans</option>
                {uniqueLoans.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              {/* Payer filter */}
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "self", label: "👤 Self" },
                    { key: "parent", label: "👨‍👩‍👧 Parent" },
                    { key: "friend", label: "🤝 Friend" },
                    { key: "other", label: "👥 Other" },
                  ] as { key: FilterPayer; label: string }[]
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterPayer(f.key)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      filterPayer === f.key
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── NO RESULTS ──────────────────────────────── */}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-violet-100 p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500 text-sm font-medium">
                No payments found
              </p>

              <p className="text-gray-400 text-xs mt-1">
                Change filters or clear the search
              </p>
              <button
                onClick={() => {
                  setFilterMonth("all");
                  setFilterLoan("all");
                  setFilterPayer("all");
                  setSearch("");
                }}
                className="mt-4 text-xs text-violet-600 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* ── DESKTOP TABLE — grouped by month ────────── */}
          {filtered.length > 0 && (
            <div className="hidden lg:block space-y-5">
              {months.map((month) => (
                <div
                  key={month}
                  className="bg-white rounded-2xl border border-violet-100 overflow-hidden"
                >
                  {/* Month header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-violet-50 bg-violet-50/40">
                    <div className="flex items-center gap-3">
                      <h2 className="font-bold text-violet-800 text-sm">
                        {MONTHS_LABEL[month] || month}
                      </h2>
                      <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2.5 py-0.5 rounded-full">
                        {grouped[month].length} payments
                      </span>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      ₹
                      {grouped[month]
                        .filter((p) => p.status === "paid")
                        .reduce((s, p) => s + Number(p.amount_paid), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Table */}
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-violet-50">
                        {["Loan", "Amount", "Paid By", "Date", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-violet-50">
                      {grouped[month].map((p) => (
                        <PaymentRow key={p.id} payment={p} />
                      ))}
                    </tbody>
                  </table>

                  {/* Month footer */}
                  <div className="px-5 py-3 bg-gray-50/40 border-t border-violet-50 flex justify-between text-xs text-gray-400">
                    <span>
                      {grouped[month].filter((p) => p.status === "paid").length}{" "}
                      paid ·{" "}
                      {
                        grouped[month].filter((p) => p.status === "missed")
                          .length
                      }{" "}
                      missed
                    </span>
                    <span>
                      Total:{" "}
                      <span className="font-bold text-gray-600">
                        ₹
                        {grouped[month]
                          .reduce((s, p) => s + Number(p.amount_paid), 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MOBILE CARDS — grouped by month ─────────── */}
          {filtered.length > 0 && (
            <div className="lg:hidden space-y-4">
              {months.map((month) => (
                <div
                  key={month}
                  className="bg-white rounded-2xl border border-violet-100 overflow-hidden"
                >
                  {/* Month header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-violet-50 bg-violet-50/40">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-violet-800 text-sm">
                        {MONTHS_LABEL[month] || month}
                      </h2>
                      <span className="text-[10px] bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                        {grouped[month].length}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-green-600">
                      ₹
                      {grouped[month]
                        .filter((p) => p.status === "paid")
                        .reduce((s, p) => s +  Number(p.amount_paid), 0)
                        .toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="px-4">
                    {grouped[month].map((p) => (
                      <PaymentCard key={p.id} payment={p} />
                    ))}
                  </div>

                  {/* Mobile month footer */}
                  <div className="px-4 py-3 bg-gray-50/40 border-t border-violet-50 flex justify-between text-xs text-gray-400">
                    <span>
                      {grouped[month].filter((p) => p.status === "paid").length}{" "}
                      paid ·{" "}
                      {
                        grouped[month].filter((p) => p.status === "missed")
                          .length
                      }{" "}
                      missed
                    </span>
                    <span className="font-bold text-gray-600">
                      ₹
                      {grouped[month]
                        .reduce((s, p) => s + Number(p.amount_paid), 0)
                        .toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
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
