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
  next_due_date: string;
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

type FilterType = "all" | "urgent" | "self" | "parent" | "friend" | "other";
type TabType = "active" | "completed";

// ─── HELPERS ─────────────────────────────────────────────────
function getDaysLabel(days: number) {
  if (days === 0) return "Due Today!";
  if (days === 1) return "Tomorrow Due!";
  return `${days} days left`;
}

function getBadgeClass(days: number) {
  if (days <= 1) return "bg-red-100 text-red-700";
  if (days <= 7) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function getProgress(loan: Loan) {
  // const total = Math.round(loan.total_amount / loan.emi_amount);
  const total = loan.total_emis;
  const paid = total - loan.remaining_emis;
  return { paid, total, pct: Math.round((paid / total) * 100) };
}

// function getWALink(phone: string, payerName: string, loanName: string, emi: number, dueDay: number) {
//   const msg = `Namaste ${payerName}! ${loanName} ki ₹${emi.toLocaleString("en-IN")} kist ${dueDay} tarikh ko due hai. Please bhar dena 🙏`;
//   return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
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

// ─── NAV ITEMS ────────────────────────────────────────────────
const NAV = [
  { icon: "⊞", label: "Dashboard", active: false, href: "/dashboard" },
  { icon: "₹", label: "My Loans", active: true, href: "/my-loans" },
  { icon: "＋", label: "Add Loan", active: false, href: "/add-loan" },
  { icon: "📅", label: "Calendar", active: false, href: "/calendar" },
  { icon: "🕐", label: "History", active: false, href: "/history" },
];

// ─── LOAN CARD (mobile) ───────────────────────────────────────
function LoanCard({
  loan,
  onPay,
  onDelete,
  onEdit,
}: {
  loan: Loan;
  onPay: (id: number) => void;
  onDelete: (id: number, loan_name: string) => void;
  onEdit: (loan: Loan) => void;
}) {
  const { paid, total, pct } = getProgress(loan);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-4 mb-3">
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
              {loan.next_due_date} Date · {loan.interest_rate}% p.a.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-gray-800 text-base">
              ₹{loan.emi_amount.toLocaleString("en-IN")}
            </p>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getBadgeClass(loan.daysLeft)}`}
            >
              {getDaysLabel(loan.daysLeft)}
            </span>
          </div>
          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg leading-none"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[130px] overflow-hidden">
                {/* <a
                  href={`/add-loan?edit=${loan.id}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  ✏️ Edit Option
                </a> */}
                <button
                  onClick={() => {
                    onEdit(loan);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 w-full"
                >
                  ✏️ Edit Option
                </button>
                <button
                  onClick={() => {
                    onDelete(loan.id, loan.loan_name);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-500 hover:bg-red-50"
                >
                  🗑️ Delete Option
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payer */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${loan.payer_type === "self" ? "bg-teal-50 text-teal-700" : "bg-violet-50 text-violet-700"}`}
        >
          👤 {loan.payer_type}
        </span>
        <span className="text-xs text-gray-400">
          Total: ₹{loan.total_amount.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>
            {paid}/{total} installments paid
          </span>
          <span className="font-medium" style={{ color: loan.color }}>
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: loan.color }}
          />
        </div>
      </div>

      {/* Notes */}
      {loan.notes && (
        <p className="text-[11px] text-gray-400 italic mb-3">💬 {loan.notes}</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {loan.payer_type !== "self" && loan.payer_phone && (
          <a
            href={getWALink(
              loan.payer_phone,
              loan.payer_name,
              loan.emi_amount,
              loan.next_due_date,
            )}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            📱 WhatsApp
          </a>
        )}
        <button
          onClick={() => onPay(loan.id)}
          disabled={loan.remaining_emis === 0}
          className="flex-1 text-xs font-semibold py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        >
          ✓ Mark Paid
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function Loan() {
  // const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [user, setUser] = useState<any>({});

  const [tab, setTab] = useState<TabType>("active");
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // For dynamic user data in frontend
  // const user = JSON.parse(localStorage.getItem("kist_user") || "{}");
  useEffect(() => {
    const storedUser = localStorage.getItem("kist_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const [editData, setEditData] = useState({
    loan_name: "",
    total_amount: 0,
    emi_amount: 0,
    total_emis: 0,
    remaining_emis: 0,
    interest_rate: 0,
    start_date: "",
    next_due_date: "",
    payer_type: "self",
    payer_name: "",
    payer_phone: "",
    payer_email: "",
    notes: "",
  });

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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editData }) =>
      API.put(`/loans/${id}`, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["loans"],
      });

      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      });

      Swal.fire({
        icon: "success",
        title: "Updated 🎉",
        text: "Loan updated successfully",
        timer: 1800,
        showConfirmButton: false,
      });

      setOpenEdit(false);
    },

    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Update Failed ❌",
        text: "Something went wrong",
      });
    },
  });

  const handleSaveUpdate = () => {
    if (!selectedLoan) return;

    updateMutation.mutate({
      id: selectedLoan.id,
      data: editData,
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => API.delete(`/loans/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      Swal.fire({
        icon: "success",
        title: "Loan Deleted 🗑️",
        text: "Loan removed successfully",
        timer: 1800,
        showConfirmButton: false,
      });
    },

    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Delete Failed ❌",
        text: "Something went wrong",
      });
    },
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Filtered + searched loans

  const displayLoans = loans
    .filter((l) => (tab === "active" ? l.is_active : !l.is_active))
    .filter((l) => {
      if (filter === "urgent") return l.daysLeft <= 7;

      if (filter === "self")
  return ["self", "me"].includes(l.payer_type.toLowerCase());

if (filter === "parent")
  return ["parent", "father", "mother"].includes(
    l.payer_type.toLowerCase(),
  );
  // includes check karta hai ki value array ke andar hai ya nahi.

      // if (filter === "parent") return l.payer_type === "parent";
      if (filter === "friend") return l.payer_type === "friend";

      if (filter === "other") return l.payer_type === "other";

      return true;
    })
    .filter((l) => l.loan_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const activeLoans = loans.filter((l) => l.is_active);
  const totalEmi = activeLoans.reduce((s, l) => s + Number(l.emi_amount), 0);
  const totalPending = activeLoans.reduce(
    (s, l) => s + l.emi_amount * l.remaining_emis,
    0,
  );
  const urgentCount = activeLoans.filter((l) => l.daysLeft <= 7).length;

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

  // update api call
  // const handleUpdate = async (loan: Loan) => {
  //   const result = await Swal.fire({
  //     title: "Update Loan?",
  //     text: `Are you sure you want to update ${loan.loan_name}?`,
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#ef4444",
  //     cancelButtonColor: "#d1d5db",
  //     confirmButtonText: "Yes, Update ✏️",
  //   });

  //   if (!result.isConfirmed) return;
  //   updateMutation.mutate({
  //     id: loan.id,
  //     data: {
  //       loan_name: loan.loan_name,
  //       total_amount: loan.total_amount,
  //       emi_amount: loan.emi_amount,
  //       total_emis: loan.total_emis,
  //       interest_rate: loan.interest_rate,

  //       start_date: loan.start_date
  //         ? new Date(loan.start_date).toISOString().split("T")[0]
  //         : "",

  //       next_due_date: loan.next_due_date
  //         ? new Date(loan.next_due_date).toISOString().split("T")[0]
  //         : "",

  //       payer_type: loan.payer_type,
  //       payer_name: loan.payer_name || "",
  //       payer_phone: loan.payer_phone || "",
  //       payer_email: loan.payer_email || "",
  //       notes: loan.notes || "",
  //     },
  //   });
  // };

  // delete api call
  const handleDelete = async (id: number, loanName: string) => {
    const result = await Swal.fire({
      title: "Delete Loan?",
      text: `Are you sure you want to delete ${loanName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#d1d5db",
      confirmButtonText: "Yes, Delete",
    });

    if (!result.isConfirmed) return;

    deleteMutation.mutate(id);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── SIDEBAR OVERLAY ──────────────────────────────────── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
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

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Top Header */}
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
              <p className="text-[11px] text-gray-400">Manage Loan</p>
              <h1 className="text-base font-bold text-violet-900 leading-tight">
                My Loans ₹
              </h1>
            </div>
          </div>
          <a
            href="/add-loan"
            className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors"
          >
            <span className="text-base leading-none">＋</span>
            <span className="hidden sm:inline">New Loan</span>
          </a>
        </header>

        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* ── STAT CARDS ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              {
                label: "Total Loans",
                value: `${activeLoans.length}`,
                sub: "active",
                icon: "💳",
                cls: "text-violet-700",
              },
              {
                label: "Monthly EMI",
                value: `₹${totalEmi.toLocaleString("en-IN")}`,
                sub: "this month",
                icon: "📊",
                cls: "text-blue-700",
              },
              {
                label: "Total Pending",
                value: `₹${(totalPending / 1000).toFixed(0)}k`,
                sub: "overall",
                icon: "⏳",
                cls: "text-amber-600",
              },
              {
                label: "Urgent",
                value: `${urgentCount}`,
                sub: "due in 7 days",
                icon: "🔔",
                cls: "text-red-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-violet-100 p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-lg flex-shrink-0">
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">
                    {s.label}
                  </p>
                  <p className={`text-xl font-bold truncate ${s.cls}`}>
                    {s.value}
                  </p>
                  <p className="text-[11px] text-gray-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── TABS + FILTER + SEARCH ───────────────────────── */}
          <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden mb-5">
            {/* Tabs: Active / Completed */}
            <div className="flex border-b border-violet-50">
              {(["active", "completed"] as TabType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all capitalize ${
                    tab === t
                      ? "text-violet-700 border-b-2 border-violet-600 bg-violet-50/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t === "active"
                    ? `✅ Active (${loans.filter((l) => l.is_active).length})`
                    : `🏁 Completed (${loans.filter((l) => !l.is_active).length})`}
                </button>
              ))}
            </div>

            {/* Filter chips + Search */}
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              {/* Filter chips */}
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "urgent", label: "🔴 Urgent" },
                    { key: "self", label: "👤 Self" },
                    { key: "parent", label: "👪 Parent" },
                    { key: "friend", label: "👫 Friend" },
                    { key: "other", label: "👥 Other" },
                  ] as { key: FilterType; label: string }[]
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      filter === f.key
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="sm:ml-auto relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search Loan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all w-full sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* ── NO RESULTS ───────────────────────────────────── */}
          {displayLoans.length === 0 && (
            <div className="bg-white rounded-2xl border border-violet-100 p-12 text-center">
              <p className="text-4xl mb-3">🎉</p>

              <p className="text-gray-500 text-sm">
                {tab === "completed"
                  ? "No completed loans yet"
                  : "No loans found"}
              </p>
              <a
                href="/add-loan"
                className="inline-block mt-4 bg-violet-600 text-white text-sm px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
              >
                + Add Loan
              </a>
            </div>
          )}

          {/* ── DESKTOP TABLE ────────────────────────────────── */}
          {displayLoans.length > 0 && (
            <div className="hidden lg:block bg-white rounded-2xl border border-violet-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-violet-50">
                <h2 className="font-bold text-gray-800 text-sm">
                  {displayLoans.length} loan{displayLoans.length > 1 ? "s" : ""}{" "}
                  available
                </h2>
                <p className="text-xs text-gray-400">
                  Sorted based on due date
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-violet-50">
                      {[
                        "Loan",
                        "Monthly EMI",
                        "Total Amount",
                        "Payer",
                        "Progress",
                        "Due",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {displayLoans.map((loan) => {
                      const { paid, total, pct } = getProgress(loan);
                      return (
                        <tr
                          key={loan.id}
                          className="hover:bg-gray-50/50 transition-colors group"
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
                                  {new Date(
                                    loan.next_due_date,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}{" "}
                                </p>
                                {loan.notes && (
                                  <p className="text-[10px] text-gray-300 italic mt-0.5">
                                    💬 {loan.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* EMI */}
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-gray-800">
                              ₹{loan.emi_amount.toLocaleString("en-IN")}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500">
                              ₹{loan.total_amount.toLocaleString("en-IN")}
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
                          <td className="px-5 py-4 min-w-[150px]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] text-gray-400">
                                {paid}/{total} Paid
                              </span>
                              <span
                                className="text-[11px] font-semibold ml-auto"
                                style={{ color: loan.color }}
                              >
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: loan.color,
                                }}
                              />
                            </div>
                          </td>

                          {/* Due */}
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
                              {loan.payer_type !== "self" &&
                                loan.payer_phone && (
                                  <a
                                    href={getWALink(
                                      loan.payer_phone,
                                      loan.payer_name,
                                      loan.emi_amount,
                                      loan.next_due_date,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors whitespace-nowrap"
                                  >
                                    📱 WA
                                  </a>
                                )}
                              {loan.is_active && (
                                <button
                                  onClick={() => handlePay(loan.id)}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                                >
                                  ✓ Paid
                                </button>
                              )}
                              {/* <a
                                href={`/add-loan?edit=${loan.id}`}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                              >
                                ✏️
                              </a> */}

                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);

                                  setEditData({
                                    loan_name: loan.loan_name,
                                    total_amount: loan.total_amount,
                                    emi_amount: loan.emi_amount,
                                    total_emis: loan.total_emis,
                                    remaining_emis: loan.remaining_emis,
                                    interest_rate: loan.interest_rate,
                                    start_date: loan.start_date?.split("T")[0],
                                    next_due_date:
                                      loan.next_due_date?.split("T")[0],
                                    payer_type: loan.payer_type,
                                    payer_name: loan.payer_name,
                                    payer_phone: loan.payer_phone || "",
                                    payer_email: loan.payer_email || "",
                                    notes: loan.notes || "",
                                  });

                                  setOpenEdit(true);
                                }}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                              >
                                ✏️
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(loan.id, loan.loan_name)
                                }
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-5 py-3 border-t border-violet-50 bg-gray-50/50 flex flex-wrap gap-4 justify-between">
                <p className="text-xs text-gray-400">
                  Total monthly:{" "}
                  <span className="font-bold text-violet-700">
                    ₹
                    {displayLoans
                      .reduce((s, l) => s + Number(l.emi_amount), 0)
                      .toLocaleString("en-IN")}
                  </span>
                </p>
                <p className="text-xs text-gray-400">
                  Total Pending:{" "}
                  <span className="font-bold text-gray-700">
                    ₹
                    {displayLoans
                      .reduce((s, l) => s + l.emi_amount * l.remaining_emis, 0)
                      .toLocaleString("en-IN")}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* ── MOBILE CARDS ─────────────────────────────────── */}
          {displayLoans.length > 0 && (
            <div className="lg:hidden">
              {displayLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onPay={handlePay}
                  onDelete={handleDelete}
                  onEdit={(loan) => {
                    setSelectedLoan(loan);

                    setEditData({
                      loan_name: loan.loan_name,
                      total_amount: loan.total_amount,
                      emi_amount: loan.emi_amount,
                      total_emis: loan.total_emis,
                      remaining_emis: loan.remaining_emis,
                      interest_rate: loan.interest_rate,
                      start_date: loan.start_date?.split("T")[0],
                      next_due_date: loan.next_due_date?.split("T")[0],
                      payer_type: loan.payer_type,
                      payer_name: loan.payer_name,
                      payer_phone: loan.payer_phone || "",
                      payer_email: loan.payer_email || "",
                      notes: loan.notes || "",
                    });

                    setOpenEdit(true);
                  }}
                />
              ))}
              {/* Mobile footer total */}
              <div className="bg-white rounded-2xl border border-violet-100 p-4 flex justify-between">
                <div>
                  <p className="text-xs text-gray-400">Monthly Total</p>
                  <p className="text-base font-bold text-violet-700">
                    ₹
                    {displayLoans
                      .reduce((s, l) => s + l.emi_amount, 0)
                      .toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total Pending</p>
                  <p className="text-base font-bold text-gray-700">
                    ₹
                    {displayLoans
                      .reduce((s, l) => s + l.emi_amount * l.remaining_emis, 0)
                      .toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────── */}
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

      {openEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Edit Loan</h2>

              <button
                onClick={() => setOpenEdit(false)}
                className="text-gray-400 hover:text-red-500 text-xl"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Loan Name"
              value={editData.loan_name}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  loan_name: e.target.value,
                })
              }
              className="w-full border rounded-xl px-4 py-2"
            />

            <input
              type="number"
              placeholder="EMI Amount"
              value={editData.emi_amount}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  emi_amount: Number(e.target.value),
                })
              }
              className="w-full border rounded-xl px-4 py-2"
            />

            <input
              type="date"
              value={editData.next_due_date?.split("T")[0]}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  next_due_date: e.target.value,
                })
              }
              className="w-full border rounded-xl px-4 py-2"
            />

            <textarea
              placeholder="Notes"
              value={editData.notes}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  notes: e.target.value,
                })
              }
              className="w-full border rounded-xl px-4 py-2"
            />

            <button
              onClick={handleSaveUpdate}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
