"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, CurrencyInr, Bank } from "@phosphor-icons/react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/providers/ToastProvider";

interface Payout {
  id: string;
  amount: number;
  status: string;
  upiId: string;
  createdAt: string;
  mentor: {
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  adminNotes?: string | null;
  bankDetails?: any;
}

export default function AdminPayoutsPage() {
  const toast = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [rejectingPayout, setRejectingPayout] = useState<Payout | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const [viewingBankDetails, setViewingBankDetails] = useState<Payout | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayouts, setTotalPayouts] = useState(0);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const statusQuery = filter !== "ALL" ? `&status=${filter}` : "";
      const res = await fetch(`/api/admin/payouts?page=${page}&limit=${limit}${statusQuery}`);
      const data = await res.json();
      if (res.ok) {
        setPayouts(data.payouts || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalPayouts(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payouts", err);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [page, filter]);

  const handleAction = async (payout: Payout, status: "COMPLETED" | "REJECTED") => {
    if (status === "REJECTED") {
      setRejectingPayout(payout);
      setRejectReason("");
      return;
    }

    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", adminNotes: "Processed successfully by Admin." }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payout marked as completed");
        fetchPayouts();
      } else {
        toast.error(data.error || "Failed to update payout");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayout) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this payout request.");
      return;
    }
    setSubmittingReject(true);
    try {
      const res = await fetch(`/api/admin/payouts/${rejectingPayout.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", adminNotes: rejectReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setRejectingPayout(null);
        setRejectReason("");
        toast.success("Payout rejected");
        fetchPayouts();
      } else {
        toast.error(data.error || "Failed to reject payout");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredPayouts = payouts;

  const handleFilterChange = (newFilter: string) => {
    if (filter !== newFilter) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payout Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and process mentor withdrawal requests.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm flex items-center">
          <button 
            onClick={() => handleFilterChange("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === "PENDING" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Pending
          </button>
          <button 
            onClick={() => handleFilterChange("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === "COMPLETED" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Completed
          </button>
          <button 
            onClick={() => handleFilterChange("REJECTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === "REJECTED" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            Rejected
          </button>
          <button 
            onClick={() => handleFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === "ALL" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            All
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                <th className="p-4 pl-6">Mentor</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Destination (UPI)</th>
                <th className="p-4">Requested On</th>
                <th className="p-4">Status</th>
                <th className="p-4">Admin Remarks</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminLoader message="Loading payouts..." />
                  </td>
                </tr>
              ) : filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-700 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
                    No {filter !== "ALL" ? filter.toLowerCase() : ""} payouts found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 pl-6">
                      {payout.mentor ? (
                        <div className="flex items-center gap-3">
                          <img 
                            src={payout.mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(payout.mentor.name)}&background=random`} 
                            alt={payout.mentor.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{payout.mentor.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{payout.mentor.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Unknown Mentor</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                        <CurrencyInr weight="bold" className="text-slate-500 dark:text-slate-400" /> {payout.amount}
                      </span>
                    </td>
                    <td className="p-4">
                      {payout.upiId === "BANK_TRANSFER" ? (
                        <button 
                          onClick={() => setViewingBankDetails(payout)}
                          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          <Bank weight="fill" className="text-sm" /> Show Details
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-max">
                          <Bank weight="fill" className="text-brand-500" /> {payout.upiId || "N/A"}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                        payout.status === "COMPLETED" ? "bg-success/10 text-success" :
                        payout.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                        "bg-danger/10 text-danger"
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {payout.adminNotes ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold max-w-xs truncate" title={payout.adminNotes}>
                          {payout.adminNotes}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6">
                      {payout.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAction(payout, "COMPLETED")}
                            className="p-1.5 text-success hover:bg-success hover:text-white rounded-lg transition-colors border border-success"
                            title="Mark Completed"
                          >
                            <CheckCircle weight="bold" className="text-lg" />
                          </button>
                          <button 
                            onClick={() => handleAction(payout, "REJECTED")}
                            className="p-1.5 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors border border-danger"
                            title="Reject Request"
                          >
                            <XCircle weight="bold" className="text-lg" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="border-t border-slate-100 dark:border-slate-800 p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalPayouts}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {rejectingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Reject Payout Request</h4>
            <p className="text-xs font-bold text-slate-500 mb-4">Mentor: {rejectingPayout.mentor?.name} • Amount: ₹{rejectingPayout.amount}</p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Rejection Reason / Admin Note (Mandatory)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid bank/UPI IFSC code, account name mismatch, suspicious transaction profile..."
                  className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPayout(null)}
                  disabled={submittingReject}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition"
                >
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingBankDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Bank weight="fill" className="text-indigo-500" /> Bank Transfer Details
            </h4>
            <p className="text-xs font-bold text-slate-500 mb-6">Mentor: {viewingBankDetails.mentor?.name} • Amount: ₹{viewingBankDetails.amount}</p>
            
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
              <pre className="whitespace-pre-wrap text-sm font-mono text-slate-700 dark:text-slate-300">
                {typeof viewingBankDetails.bankDetails === 'object' && viewingBankDetails.bankDetails !== null
                  ? JSON.stringify(viewingBankDetails.bankDetails, null, 2)
                  : viewingBankDetails.bankDetails || "No bank details provided."}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setViewingBankDetails(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
