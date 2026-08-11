"use client";

import { useState, useEffect } from "react";
import { UsersThree, Trash } from "@phosphor-icons/react/dist/ssr";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { useToast } from "@/components/providers/ToastProvider";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function AdminCommunityPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Fetch config
      const confRes = await fetch("/api/admin/config");
      if (confRes.ok) {
        const confData = await confRes.json();
        const commConfig = confData.configs?.find((c: any) => c.key?.toLowerCase() === "community_enabled");
        setIsEnabled(commConfig ? commConfig.value === "true" : true);
      }

      // 2. Fetch all posts
      const postRes = await fetch("/api/community");
      if (postRes.ok) {
        const postData = await postRes.json();
        setPosts(postData.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCommunity = async () => {
    setActionLoading(true);
    const nextState = !isEnabled;
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "community_enabled",
          value: String(nextState)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update config");
      setIsEnabled(nextState);
      toast.success(`Community has been ${nextState ? 'enabled' : 'disabled'} successfully.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update community status");
    } finally {
      setActionLoading(false);
    }
  };

  const deletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/community/${deletePostId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }
      setPosts(posts.filter(p => p.id !== deletePostId));
      toast.success("Post deleted successfully");
      setDeletePostId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UsersThree weight="fill" className="text-brand-main" /> Community Moderation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage platform community posts and settings.</p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Community Feature</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Enable/disable for all users</p>
          </div>
          <button 
            onClick={toggleCommunity}
            disabled={actionLoading}
            className={`w-12 h-6 rounded-full relative transition-colors ${isEnabled ? 'bg-success' : 'bg-slate-300'} disabled:opacity-50`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isEnabled ? 'left-[26px]' : 'left-0.5'}`}></div>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <h2 className="font-bold text-slate-800 dark:text-slate-200">Recent Posts</h2>
        </div>
        
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="py-8">
              <AdminLoader message="Loading posts..." />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center p-12 text-slate-700 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
              No active posts found.
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex gap-4">
                <img 
                  src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}`} 
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{post.author.name}</span>
                      <span className="text-xs text-slate-400 font-semibold">{post.author.role}</span>
                      <span className="text-xs text-slate-400 font-semibold">• {new Date(post.createdAt).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => deletePost(post.id)}
                      disabled={actionLoading}
                      className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-50"
                    >
                      <Trash weight="bold" /> Delete
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  
                  <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>{post._count.comments} Comments</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deletePostId}
        onClose={() => setDeletePostId(null)}
        onConfirm={confirmDeletePost}
        title="Delete Community Post"
        message="Are you sure you want to delete this community post? All associated comments and discussions will also be removed."
        confirmText="Delete Post"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
}
