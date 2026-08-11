"use client";

import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/providers/ToastProvider";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Tag, CurrencyInr, Users, CheckCircle, Eye, X, ArrowsClockwise } from "@phosphor-icons/react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscountAmount?: number;
  minPurchaseAmount: number;
  totalLimit?: number;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  firstTimeOnly?: boolean;
  applicableCategories?: string[];
  applicableMentors?: string[];
  expiresAt: string | null;
  showOnDashboard?: boolean;
  createdAt: string;
  _count?: { usages: number };
}

interface CouponUsageItem {
  id: string;
  discountApplied: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

const initialForm = {
  code: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
  discountValue: "10",
  maxDiscountAmount: "",
  minPurchaseAmount: "0",
  totalLimit: "",
  perUserLimit: "1",
  firstTimeOnly: false,
  applicableCategories: "",
  applicableMentors: "",
  expiresAt: "",
  showOnDashboard: false,
};

export default function AdminCouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsages: 0,
    totalDiscountGiven: 0,
  });

  // Usage History Modal
  const [inspectCoupon, setInspectCoupon] = useState<Coupon | null>(null);
  const [inspectUsages, setInspectUsages] = useState<CouponUsageItem[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCoupons, setTotalCoupons] = useState(0);

  useEffect(() => {
    fetchCoupons();
  }, [page]);

  async function fetchCoupons() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/coupons?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCoupons(data.pagination.total || 0);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenUsages(c: Coupon) {
    setInspectCoupon(c);
    setLoadingUsages(true);
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`);
      const data = await res.json();
      if (res.ok && data.coupon) {
        setInspectUsages(data.coupon.usages || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load coupon usage details");
    } finally {
      setLoadingUsages(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(initialForm);
    setShowModal(true);
  }

  function handleEditClick(c: Coupon) {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : "",
      minPurchaseAmount: String(c.minPurchaseAmount || 0),
      totalLimit: c.totalLimit ? String(c.totalLimit) : "",
      perUserLimit: String(c.perUserLimit || 1),
      firstTimeOnly: Boolean(c.firstTimeOnly),
      applicableCategories: c.applicableCategories?.join(", ") || "",
      applicableMentors: c.applicableMentors?.join(", ") || "",
      expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
      showOnDashboard: Boolean(c.showOnDashboard),
    });
    setShowModal(true);
  }

  async function handleToggleActive(id: string) {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleActive: true }),
      });
      if (res.ok) {
        toast.success("Coupon status updated");
        fetchCoupons();
      } else {
        toast.error("Failed to change status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  function handleDelete(id: string) {
    setDeleteCouponId(id);
  }

  async function confirmDeleteCoupon() {
    if (!deleteCouponId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleteCouponId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Coupon deleted successfully");
        setDeleteCouponId(null);
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete coupon");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while deleting coupon");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        minPurchaseAmount: Number(formData.minPurchaseAmount || 0),
        totalLimit: formData.totalLimit ? Number(formData.totalLimit) : null,
        perUserLimit: Number(formData.perUserLimit || 1),
        firstTimeOnly: formData.firstTimeOnly,
        applicableCategories: formData.applicableCategories ? formData.applicableCategories.split(",").map(s => s.trim()).filter(Boolean) : [],
        applicableMentors: formData.applicableMentors ? formData.applicableMentors.split(",").map(s => s.trim()).filter(Boolean) : [],
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        showOnDashboard: formData.showOnDashboard,
      };

      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        toast.success(`Coupon ${editingId ? "updated" : "created"} successfully`);
        fetchCoupons();
      } else {
        toast.error(data.error || `Failed to ${editingId ? "update" : "create"} coupon`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Coupon Management & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, manage, and monitor promo codes and student discount redemption volume across subscriptions and wallet.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow"
        >
          + Create New Coupon
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Coupons</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3">
            {stats.activeCoupons} / {stats.totalCoupons}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Live published promo codes</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Redemptions</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Tag weight="fill" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-3">
            {stats.totalUsages.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Times coupons applied</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cumulative Discounts Given</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <CurrencyInr weight="bold" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-3">
            ₹{stats.totalDiscountGiven.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Total promotional discounts saved for students</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12">
          <AdminLoader message="Loading coupons..." />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-medium">
          No coupons created yet. Click "+ Create New Coupon" to add one.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-800 tracking-wider">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Purchase</th>
                <th className="p-4">Max Discount</th>
                <th className="p-4">Redemptions</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {c.code}
                    {c.firstTimeOnly && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">First Time</span>
                    )}
                  </td>
                  <td className="p-4">
                    {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </td>
                  <td className="p-4">₹{c.minPurchaseAmount}</td>
                  <td className="p-4">{c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : "No Cap"}</td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 dark:text-white">{c.usedCount}</span> {c.totalLimit ? `/ ${c.totalLimit}` : ""}
                  </td>
                  <td className="p-4">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        c.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenUsages(c)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg transition"
                      title="View redemptions"
                    >
                      <Eye weight="bold" /> Usages ({c.usedCount})
                    </button>
                    <button
                      onClick={() => handleToggleActive(c.id)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-500 underline"
                    >
                      {c.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleEditClick(c)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-500 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCoupons}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Usage Analytics Modal */}
      {inspectCoupon && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag weight="fill" className="text-emerald-500" />
                  Redemption History: <span className="font-mono text-emerald-600">{inspectCoupon.code}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed student usage events and discount amounts.
                </p>
              </div>
              <button
                onClick={() => setInspectCoupon(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <X weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {loadingUsages ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <ArrowsClockwise className="animate-spin text-2xl" />
                  <span>Loading usage breakdown...</span>
                </div>
              ) : inspectUsages.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No student redemptions recorded yet for this promo code.
                </div>
              ) : (
                <div className="space-y-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Discount Applied</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {inspectUsages.map((u) => (
                        <tr key={u.id}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900 dark:text-white">{u.user?.name || "Anonymous Student"}</div>
                            <div className="text-[11px] text-slate-500">{u.user?.email}</div>
                          </td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{u.discountApplied}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {new Date(u.createdAt).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectCoupon(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {editingId ? "Edit Coupon" : "Create New Coupon"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 20"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Total Limit (Optional)</label>
                  <input
                    type="number"
                    placeholder="Max total usages"
                    value={formData.totalLimit}
                    onChange={(e) => setFormData({ ...formData, totalLimit: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Per User Limit</label>
                  <input
                    type="number"
                    required
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Applicable Categories (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Technology, Career Guidance (Leave blank for all)"
                  value={formData.applicableCategories}
                  onChange={(e) => setFormData({ ...formData, applicableCategories: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Applicable Mentor Profile IDs (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Leave blank for all mentors"
                  value={formData.applicableMentors}
                  onChange={(e) => setFormData({ ...formData, applicableMentors: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="firstTimeOnly"
                    checked={formData.firstTimeOnly}
                    onChange={(e) => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="firstTimeOnly" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    First Time Users Only
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-normal">If checked, only users who have never used a coupon before can apply this.</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showOnDashboard"
                    checked={formData.showOnDashboard}
                    onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="showOnDashboard" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Show on Student Dashboard
                    <span className="block text-xs text-slate-500 dark:text-slate-400 font-normal">If checked, this coupon will be prominently displayed to users.</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition shadow"
                >
                  {creating ? "Saving..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteCouponId}
        onClose={() => setDeleteCouponId(null)}
        onConfirm={confirmDeleteCoupon}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? Users will no longer be able to apply this discount."
        confirmText="Delete Coupon"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
}

