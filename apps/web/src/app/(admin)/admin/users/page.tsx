"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MagnifyingGlass, 
  SealCheck, 
  XCircle, 
  CheckCircle, 
  Warning, 
  Trash, 
  Prohibit, 
  PencilSimple, 
  User, 
  Wallet, 
  SlidersHorizontal, 
  ShieldCheck, 
  Phone, 
  Envelope, 
  PlusCircle,
  MinusCircle,
  ArrowSquareOut,
  Info
} from "@phosphor-icons/react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/providers/ToastProvider";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { validatePhoneNumber } from "@/lib/phoneValidation";

interface MentorProfileData {
  id?: string;
  status: string;
  commissionRate?: number;
  perMinutePrice?: number;
  callPricePerMinute?: number;
  monthlyPrice?: number;
  freeTrial?: boolean;
  subscribedBookingFree?: boolean;
  isOnline?: boolean;
  experience?: number | string | null;
  bio?: string | null;
  categories?: string[];
  skills?: string[];
}

interface WalletData {
  id?: string;
  balance: number;
  lockedBalance?: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar: string | null;
  role: string;
  adminSubRole?: string | null;
  isBanned?: boolean;
  isSuspended?: boolean;
  isSuperAdmin?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  mentorProfile: MentorProfileData | null;
  wallet: WalletData | null;
}

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Quick Commission Modal State
  const [selectedCommissionUser, setSelectedCommissionUser] = useState<AdminUser | null>(null);
  const [commissionRate, setCommissionRate] = useState(20);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

  // Full Admin User Edit Modal State
  const [editUserModal, setEditUserModal] = useState<AdminUser | null>(null);
  const [editTab, setEditTab] = useState<"profile" | "role" | "mentor" | "wallet" | "moderation">("profile");
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
    isAdmin: boolean;
    adminSubRole: string;
    isBanned: boolean;
    isSuspended: boolean;
    mentorStatus: string;
    mentorCommissionRate: number;
    mentorPerMinutePrice: number;
    mentorCallPrice: number;
    mentorMonthlyPrice: number;
    mentorFreeTrial: boolean;
    mentorSubscribedBookingFree: boolean;
    mentorBio: string;
    mentorExperience: number;
    mentorCategories: string;
    mentorSkills: string;
    walletAdjustType: "CREDIT" | "DEBIT";
    walletAdjustAmount: string;
    walletAdjustNote: string;
  }>({
    name: "",
    email: "",
    phone: "",
    role: "STUDENT",
    isAdmin: false,
    adminSubRole: "",
    isBanned: false,
    isSuspended: false,
    mentorStatus: "APPROVED",
    mentorCommissionRate: 20,
    mentorPerMinutePrice: 15,
    mentorCallPrice: 15,
    mentorMonthlyPrice: 0,
    mentorFreeTrial: false,
    mentorSubscribedBookingFree: true,
    mentorBio: "",
    mentorExperience: 1,
    mentorCategories: "",
    mentorSkills: "",
    walletAdjustType: "CREDIT",
    walletAdjustAmount: "",
    walletAdjustNote: "",
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Moderation Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    action: "BAN" | "UNBAN" | "SUSPEND" | "UNSUSPEND" | "DELETE" | "RESTORE";
    reason: string;
  } | null>(null);
  const [isModActionLoading, setIsModActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `/api/admin/users?page=${page}&limit=${limit}`;
      if (filterRole !== "ALL") {
        url += `&role=${filterRole}`;
      }
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalUsers(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterRole, page, search]);

  const openEditModal = (user: AdminUser) => {
    setEditUserModal(user);
    setEditTab("profile");
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role === "ADMIN" ? (user.mentorProfile ? "MENTOR" : "STUDENT") : (user.role || "STUDENT"),
      isAdmin: user.role === "ADMIN" || !!user.adminSubRole,
      adminSubRole: user.adminSubRole || (user.role === "ADMIN" ? "ADMIN" : "SUPPORT"),
      isBanned: Boolean(user.isBanned),
      isSuspended: Boolean(user.isSuspended),
      mentorStatus: user.mentorProfile?.status || "APPROVED",
      mentorCommissionRate: user.mentorProfile?.commissionRate ?? 20,
      mentorPerMinutePrice: user.mentorProfile?.perMinutePrice ?? 15,
      mentorCallPrice: user.mentorProfile?.callPricePerMinute ?? 15,
      mentorMonthlyPrice: user.mentorProfile?.monthlyPrice ?? 0,
      mentorFreeTrial: Boolean(user.mentorProfile?.freeTrial),
      mentorSubscribedBookingFree: user.mentorProfile?.subscribedBookingFree !== false,
      mentorBio: user.mentorProfile?.bio || "",
      mentorExperience: user.mentorProfile?.experience ? Number(user.mentorProfile.experience) : 1,
      mentorCategories: Array.isArray(user.mentorProfile?.categories) ? user.mentorProfile.categories.join(", ") : "",
      mentorSkills: Array.isArray(user.mentorProfile?.skills) ? user.mentorProfile.skills.join(", ") : "",
      walletAdjustType: "CREDIT",
      walletAdjustAmount: "",
      walletAdjustNote: "",
    });
  };

  const handleSaveUser = async () => {
    if (!editUserModal) return;
    try {
      if (editForm.phone && editForm.phone.trim()) {
        const phoneValidation = validatePhoneNumber(editForm.phone);
        if (!phoneValidation.isValid) {
          toast.error(phoneValidation.error || "Please enter a valid mobile number.");
          return;
        }
      }

      setIsSavingUser(true);
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        role: editForm.isAdmin ? "ADMIN" : editForm.role,
        adminSubRole: editForm.isAdmin ? (editForm.adminSubRole || "SUPPORT") : null,
        isBanned: editForm.isBanned,
        isSuspended: editForm.isSuspended,
      };

      if (editForm.role === "MENTOR" || (!editForm.isAdmin && editForm.role === "MENTOR")) {
        payload.mentorProfile = {
          status: editForm.mentorStatus,
          commissionRate: Number(editForm.mentorCommissionRate),
          perMinutePrice: Number(editForm.mentorPerMinutePrice),
          callPricePerMinute: Number(editForm.mentorCallPrice),
          monthlyPrice: Number(editForm.mentorMonthlyPrice),
          freeTrial: editForm.mentorFreeTrial,
          subscribedBookingFree: editForm.mentorSubscribedBookingFree,
          bio: editForm.mentorBio?.trim() || null,
          experience: Number(editForm.mentorExperience) || 0,
          categories: editForm.mentorCategories
            ? editForm.mentorCategories.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
          skills: editForm.mentorSkills
            ? editForm.mentorSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
        };
      }

      if (editForm.walletAdjustAmount && Number(editForm.walletAdjustAmount) > 0) {
        payload.walletAdjustment = {
          action: editForm.walletAdjustType,
          amount: Number(editForm.walletAdjustAmount),
          note: editForm.walletAdjustNote || "Admin Adjustment",
        };
      }

      const res = await fetch(`/api/admin/users/${editUserModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUsers(users.map((u) => (u.id === editUserModal.id ? { ...u, ...data.user } : u)));
        toast.success("User account details updated successfully! 🚀");
        setEditUserModal(null);
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save changes");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleCommissionUpdate = async () => {
    if (!selectedCommissionUser) return;
    try {
      setIsUpdatingCommission(true);
      const res = await fetch("/api/admin/mentors/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedCommissionUser.id, commissionRate }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(
          users.map((u) => {
            if (u.id === selectedCommissionUser.id) {
              return {
                ...u,
                mentorProfile: u.mentorProfile
                  ? { ...u.mentorProfile, commissionRate: data.commissionRate }
                  : { status: "APPROVED", commissionRate: data.commissionRate },
              };
            }
            return u;
          })
        );
        setSelectedCommissionUser(null);
        toast.success("Commission rate updated successfully");
      } else {
        toast.error(data.error || "Failed to update commission rate");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const handleUserAction = async (userId: string, action: string, reason?: string) => {
    try {
      setIsModActionLoading(true);
      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason: reason || `Admin action: ${action}` }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMenuOpen(null);
        setConfirmModal(null);
        toast.success(`User ${action.toLowerCase()} completed`);
        fetchUsers();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to perform user action");
    } finally {
      setIsModActionLoading(false);
    }
  };

  const filteredUsers = users;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Click outside backdrop for action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setActionMenuOpen(null)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete control over user profiles, mentor pricing, commission rates, and wallet balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-main w-64 md:w-80 shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
            {["ALL", "STUDENT", "MENTOR", "ADMIN"].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setFilterRole(role);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterRole === role
                    ? "bg-brand-main text-brand-950 dark:text-slate-950 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden min-h-[380px] flex flex-col justify-between">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Wallet Balance</th>
                <th className="py-4 px-6">Commission</th>
                <th className="py-4 px-6">Joined</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <AdminLoader message="Loading users list..." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No users matching the filters found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isBottomRow = idx >= filteredUsers.length - 2 && filteredUsers.length > 2;
                  const commissionValue = user.mentorProfile?.commissionRate ?? 20;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={user.avatar} name={user.name} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                              {(user.role === "ADMIN" || user.adminSubRole) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase">
                                  {user.adminSubRole || "ADMIN"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            {user.phone && <p className="text-[11px] text-slate-400">📞 {user.phone}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            user.role === "ADMIN"
                              ? "bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                              : user.role === "MENTOR"
                              ? "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                              : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {user.deletedAt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            <Trash weight="bold" /> Deleted
                          </span>
                        ) : user.isBanned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                            <Prohibit weight="bold" /> Banned
                          </span>
                        ) : user.isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                            <Warning weight="bold" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle weight="bold" /> Active
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        ₹{user.wallet?.balance?.toFixed(2) || "0.00"}
                      </td>

                      <td className="py-4 px-6">
                        {user.role === "MENTOR" || user.mentorProfile ? (
                          <button
                            onClick={() => {
                              setSelectedCommissionUser(user);
                              setCommissionRate(user.mentorProfile?.commissionRate ?? 20);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-brand-main/10 text-brand-700 dark:text-brand-300 hover:bg-brand-main/20 border border-brand-main/30 transition"
                            title="Click to quickly edit platform commission"
                          >
                            <span>{commissionValue}%</span>
                            <PencilSimple weight="bold" className="w-3 h-3 text-brand-main" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-main hover:text-brand-950 dark:hover:bg-brand-main dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <PencilSimple weight="bold" /> Edit
                          </button>

                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                              }}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 font-bold transition-colors relative z-20"
                            >
                              •••
                            </button>

                            {actionMenuOpen === user.id && (
                              <div
                                className={`absolute right-0 ${
                                  isBottomRow ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
                                } w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-30 p-1.5 animate-in fade-in zoom-in-95`}
                              >
                                {user.deletedAt ? (
                                  <div className="w-full text-left px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-600 flex items-center gap-2 cursor-not-allowed">
                                    <Prohibit weight="bold" /> Data Erased (Inactive)
                                  </div>
                                ) : user.isSuperAdmin ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        openEditModal(user);
                                        setActionMenuOpen(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                      <SlidersHorizontal weight="bold" /> Edit Profile & Wallet
                                    </button>
                                    <div className="mx-1 my-1 px-3 py-2 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 rounded-xl flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/50">
                                      <ShieldCheck weight="fill" className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                      <span>Protected Super Admin</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        openEditModal(user);
                                        setActionMenuOpen(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                      <SlidersHorizontal weight="bold" /> Full Edit & Controls
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user.id,
                                          userName: user.name,
                                          action: user.isBanned ? "UNBAN" : "BAN",
                                          reason: "",
                                        });
                                        setActionMenuOpen(null);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
                                        user.isBanned ? "text-emerald-600 hover:bg-emerald-50" : "text-red-600 hover:bg-red-50"
                                      }`}
                                    >
                                      <Prohibit weight="bold" /> {user.isBanned ? "Lift Ban" : "Ban User"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user.id,
                                          userName: user.name,
                                          action: user.isSuspended ? "UNSUSPEND" : "SUSPEND",
                                          reason: "",
                                        });
                                        setActionMenuOpen(null);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
                                        user.isSuspended ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                                      }`}
                                    >
                                      <Warning weight="bold" /> {user.isSuspended ? "Unsuspend" : "Suspend User"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          userId: user.id,
                                          userName: user.name,
                                          action: "DELETE",
                                          reason: "",
                                        });
                                        setActionMenuOpen(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                      <Trash weight="bold" /> Delete User
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Quick Commission Modal */}
      {selectedCommissionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedCommissionUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XCircle weight="fill" className="text-2xl" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Edit Commission Rate</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Update platform fee percentage for <span className="font-bold text-slate-900 dark:text-white">{selectedCommissionUser.name}</span>.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-6 border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Platform Commission</label>
                <span className="text-2xl font-black text-brand-main">{commissionRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full accent-brand-main h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
                <span>10% (Min)</span>
                <span>Mentor keeps {100 - commissionRate}%</span>
                <span>80% (Max)</span>
              </div>
            </div>

            <button
              onClick={handleCommissionUpdate}
              disabled={isUpdatingCommission}
              className="w-full bg-brand-main text-brand-950 dark:text-slate-950 py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUpdatingCommission ? "Updating..." : "Save Commission Rate"} <CheckCircle weight="bold" className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Admin User Power Edit Modal */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar src={editUserModal.avatar} name={editUserModal.name} size="lg" />
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {editForm.name || "User"}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-main/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-main/20">
                      ID: {editUserModal.id.slice(0, 8)}...
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editForm.email} • Joined {new Date(editUserModal.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditUserModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <XCircle weight="fill" className="text-2xl" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setEditTab("profile")}
                className={`px-3.5 py-2.5 rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 ${
                  editTab === "profile"
                    ? "border-brand-main text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <User weight="bold" className="w-4 h-4" /> Profile Info
              </button>
              <button
                onClick={() => setEditTab("role")}
                className={`px-3.5 py-2.5 rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 ${
                  editTab === "role"
                    ? "border-brand-main text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShieldCheck weight="bold" className="w-4 h-4" /> Roles & Admin
              </button>

              {/* Conditional: Only show Mentor Settings if role is MENTOR */}
              {editForm.role === "MENTOR" && (
                <button
                  onClick={() => setEditTab("mentor")}
                  className={`px-3.5 py-2.5 rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 ${
                    editTab === "mentor"
                      ? "border-brand-main text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <SlidersHorizontal weight="bold" className="w-4 h-4" /> Mentor Settings
                </button>
              )}

              <button
                onClick={() => setEditTab("wallet")}
                className={`px-3.5 py-2.5 rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 ${
                  editTab === "wallet"
                    ? "border-brand-main text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Wallet weight="bold" className="w-4 h-4" /> Wallet & Funds
              </button>
              <button
                onClick={() => setEditTab("moderation")}
                className={`px-3.5 py-2.5 rounded-t-xl flex items-center gap-1.5 transition-all border-b-2 ${
                  editTab === "moderation"
                    ? "border-brand-main text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Prohibit weight="bold" className="w-4 h-4" /> Moderation
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Tab 1: Profile Info */}
              {editTab === "profile" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-main focus:outline-none text-slate-900 dark:text-white"
                        placeholder="User name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-main focus:outline-none text-slate-900 dark:text-white"
                        placeholder="user@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-main focus:outline-none text-slate-900 dark:text-white"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Role & Permissions */}
              {editTab === "role" && (
                <div className="space-y-5">
                  {editUserModal.isSuperAdmin ? (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-start gap-3">
                      <ShieldCheck weight="fill" className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                          Protected System Super Admin
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                          This account is designated as the root platform Super Admin. Role and administrative privileges cannot be demoted or modified.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mentor Application Status Indicator */}
                      {editUserModal.mentorProfile ? (
                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">
                              {editUserModal.mentorProfile.status === "APPROVED" ? "🟢" : editUserModal.mentorProfile.status === "PENDING" ? "🟡" : "🔴"}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                Mentor Application: {editUserModal.mentorProfile.status}
                              </p>
                              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                {editUserModal.mentorProfile.status === "APPROVED"
                                  ? "Active verified mentor"
                                  : editUserModal.mentorProfile.status === "PENDING"
                                  ? "Application submitted — awaiting administrative review"
                                  : "Application rejected or hidden"}
                              </p>
                            </div>
                          </div>
                          {editUserModal.mentorProfile.status === "PENDING" && (
                            <Link
                              href="/admin/applications"
                              target="_blank"
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm shrink-0"
                            >
                              Review Application <ArrowSquareOut weight="bold" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5">
                          <Info weight="fill" className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              No Mentor Application Submitted
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300">
                              This user registered as a student and has not submitted a mentor onboarding application. Switching them to Mentor will create a profile. You can configure their profile in the &quot;Mentor Settings&quot; tab.
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Primary User Role
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          {["STUDENT", "MENTOR"].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, role: r })}
                              className={`p-3 rounded-2xl border text-sm font-bold flex flex-col items-center gap-1 transition ${
                                editForm.role === r
                                  ? "bg-brand-main/10 border-brand-main text-brand-600 dark:text-brand-400 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        {editForm.role === "STUDENT" && editUserModal.mentorProfile && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            ℹ️ Setting role to Student will unlist their mentor profile and pause upcoming mentor bookings.
                          </p>
                        )}
                        {editForm.role === "MENTOR" && !editUserModal.mentorProfile && (
                          <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1">
                            ✨ Mentor Settings tab unlocked! Please add their professional details and pricing.
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                              Grant Admin Privileges
                            </label>
                            <p className="text-[11px] text-slate-500">
                              Enables administrative panel access and assigned management tools
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, isAdmin: !editForm.isAdmin })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editForm.isAdmin ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>

                      {editForm.isAdmin && (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-2">
                          <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            Admin Sub-Role (Delegated Powers)
                          </label>
                          <select
                            value={editForm.adminSubRole}
                            onChange={(e) => setEditForm({ ...editForm, adminSubRole: e.target.value })}
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="SUPER_ADMIN">Super Admin (All Powers)</option>
                            <option value="ADMIN">Admin (Standard)</option>
                            <option value="SUPPORT">Support Team (Users, Applications, Chats, Calls, Tickets)</option>
                            <option value="MODERATOR">Moderator (Community, Reviews, Offers, Categories)</option>
                          </select>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400">
                            Support Team can manage support tickets, review applications, and assist users. Super Admin can manage finances and platform settings.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Mentor Settings */}
              {editTab === "mentor" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Application / Profile Status
                      </label>
                      <select
                        value={editForm.mentorStatus}
                        onChange={(e) => setEditForm({ ...editForm, mentorStatus: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      >
                        <option value="APPROVED">APPROVED (Active Public Mentor)</option>
                        <option value="PENDING">PENDING (In Review / Onboarding)</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="SUSPENDED">SUSPENDED (Unlisted / Paused)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Commission Rate
                        </label>
                        <span className="text-xs font-black text-brand-main">{editForm.mentorCommissionRate}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={editForm.mentorCommissionRate}
                        onChange={(e) => setEditForm({ ...editForm, mentorCommissionRate: Number(e.target.value) })}
                        className="w-full accent-brand-main h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                    </div>
                  </div>

                  {/* Bio / Summary */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Professional Bio &amp; Summary
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.mentorBio}
                      onChange={(e) => setEditForm({ ...editForm, mentorBio: e.target.value })}
                      placeholder="Brief description of mentor expertise, academic background, and coaching experience..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  {/* Categories, Skills & Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Categories (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.mentorCategories}
                        onChange={(e) => setEditForm({ ...editForm, mentorCategories: e.target.value })}
                        placeholder="Engineering, Medical, Study Abroad"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editForm.mentorSkills}
                        onChange={(e) => setEditForm({ ...editForm, mentorSkills: e.target.value })}
                        placeholder="Career Guidance, Coding, Resume"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={editForm.mentorExperience}
                        onChange={(e) => setEditForm({ ...editForm, mentorExperience: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Chat (₹/min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.mentorPerMinutePrice}
                        onChange={(e) => setEditForm({ ...editForm, mentorPerMinutePrice: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Call (₹/min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.mentorCallPrice}
                        onChange={(e) => setEditForm({ ...editForm, mentorCallPrice: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Monthly (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.mentorMonthlyPrice}
                        onChange={(e) => setEditForm({ ...editForm, mentorMonthlyPrice: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Enable Free Trial</p>
                        <p className="text-[11px] text-slate-500">Allow students to take a 5-minute complimentary intro</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editForm.mentorFreeTrial}
                        onChange={(e) => setEditForm({ ...editForm, mentorFreeTrial: e.target.checked })}
                        className="w-5 h-5 accent-brand-main rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Subscribers Free Bookings</p>
                        <p className="text-[11px] text-slate-500">Active monthly subscribers get unlimited free call bookings</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={editForm.mentorSubscribedBookingFree}
                        onChange={(e) => setEditForm({ ...editForm, mentorSubscribedBookingFree: e.target.checked })}
                        className="w-5 h-5 accent-brand-main rounded"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Wallet & Finances */}
              {editTab === "wallet" && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        Current Available Balance
                      </p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{editUserModal.wallet?.balance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <Wallet className="w-10 h-10 text-emerald-500/40" weight="duotone" />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Adjust Wallet Balance (Direct Credit / Debit)
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, walletAdjustType: "CREDIT" })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                          editForm.walletAdjustType === "CREDIT"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600"
                        }`}
                      >
                        <PlusCircle weight="bold" /> Credit Balance (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, walletAdjustType: "DEBIT" })}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                          editForm.walletAdjustType === "DEBIT"
                            ? "bg-red-500 text-white border-red-600 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600"
                        }`}
                      >
                        <MinusCircle weight="bold" /> Debit Balance (-)
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Adjustment Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 500"
                        value={editForm.walletAdjustAmount}
                        onChange={(e) => setEditForm({ ...editForm, walletAdjustAmount: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Reason / Audit Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Promotional grant or disputed refund"
                        value={editForm.walletAdjustNote}
                        onChange={(e) => setEditForm({ ...editForm, walletAdjustNote: e.target.value })}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Moderation & Restrictions */}
              {editTab === "moderation" && (
                <div className="space-y-4">
                  {editUserModal.isSuperAdmin ? (
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex items-start gap-3">
                      <ShieldCheck weight="fill" className="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                          Moderation Restrictions Disabled
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                          The root Super Admin account is protected against account bans and suspensions to prevent administrative lockout.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <Prohibit weight="bold" /> Ban Account
                          </p>
                          <p className="text-xs text-slate-500">
                            Completely blocks user from authenticating into HelpSathi
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editForm.isBanned}
                          onChange={(e) => setEditForm({ ...editForm, isBanned: e.target.checked })}
                          className="w-5 h-5 accent-red-600 rounded"
                        />
                      </label>

                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Warning weight="bold" /> Suspend Account
                            </p>
                            <p className="text-xs text-slate-500">
                              Temporarily restricts chat and call bookings while under policy review
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={editForm.isSuspended}
                            onChange={(e) => setEditForm({ ...editForm, isSuspended: e.target.checked })}
                            className="w-5 h-5 accent-amber-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <button
                onClick={() => setEditUserModal(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={isSavingUser}
                className="px-6 py-2.5 bg-brand-main text-brand-950 dark:text-slate-950 rounded-xl font-extrabold text-sm shadow-md hover:bg-brand-400 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingUser ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Save All Changes</span>
                    <CheckCircle weight="bold" className="text-lg" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setConfirmModal(null)}
              disabled={isModActionLoading}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <XCircle weight="fill" className="text-2xl" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-2xl ${
                  ["BAN", "DELETE", "SUSPEND"].includes(confirmModal.action)
                    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {["BAN", "DELETE", "SUSPEND"].includes(confirmModal.action) ? (
                  <Warning weight="fill" className="text-2xl" />
                ) : (
                  <CheckCircle weight="fill" className="text-2xl" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                  Confirm {confirmModal.action.charAt(0) + confirmModal.action.slice(1).toLowerCase()}
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Target Account: <span className="text-slate-900 dark:text-white font-bold">{confirmModal.userName}</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              {confirmModal.action === "DELETE" &&
                "You are about to erase this account's personal data and release their login credentials. Any active consultations will be automatically cancelled. This action is irreversible, but allows the user to join afresh in the future."}
              {confirmModal.action === "BAN" &&
                "Banning this user will permanently prevent them from logging in or using HelpSathi services until the ban is lifted by an administrator."}
              {confirmModal.action === "SUSPEND" &&
                "Suspending this user will temporarily pause their access to platform consultations and account dashboard."}
              {["UNBAN", "UNSUSPEND", "RESTORE"].includes(confirmModal.action) &&
                `You are about to restore full platform privileges for this user (${confirmModal.action.toLowerCase()}).`}
            </p>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Moderation Reason / Admin Notes{" "}
                {["BAN", "SUSPEND", "DELETE"].includes(confirmModal.action) ? (
                  <span className="text-red-500">*</span>
                ) : (
                  "(Optional)"
                )}
              </label>
              <textarea
                placeholder="Enter policy violation reason or admin notes (visible in audit logs & notification email)..."
                value={confirmModal.reason}
                onChange={(e) => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                disabled={isModActionLoading}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-main min-h-[80px] text-slate-900 dark:text-white resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={isModActionLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(confirmModal.userId, confirmModal.action, confirmModal.reason)}
                disabled={
                  isModActionLoading ||
                  (["BAN", "SUSPEND", "DELETE"].includes(confirmModal.action) && !confirmModal.reason.trim())
                }
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 ${
                  ["BAN", "DELETE", "SUSPEND"].includes(confirmModal.action)
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                }`}
              >
                {isModActionLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>Confirm {confirmModal.action.charAt(0) + confirmModal.action.slice(1).toLowerCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
