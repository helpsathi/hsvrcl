"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UsersThree, PaperPlaneRight, ChatCircleText, WarningCircle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { CommunityPostSkeleton } from "@/components/ui/Skeleton";
import { getRoleBadge } from "@/lib/roleBadge";

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const fetchPosts = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`/api/community?page=${pageNum}`);
      const data = await res.json();
      if (!data.enabled) {
        setEnabled(false);
      } else {
        if (pageNum === 1) {
          setPosts(data.posts || []);
        } else {
          setPosts(prev => [...prev, ...(data.posts || [])]);
        }
        setIsSubscribed(data.isSubscribed || false);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPosts([data.post, ...posts]);
      setContent("");
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) {
    return (
      <div className="w-full min-h-[80vh] flex items-center justify-center p-6 text-center max-w-lg mx-auto transition-colors">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-sm border border-slate-200 dark:border-slate-800">
            <UsersThree weight="fill" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Community Feed Offline</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            We are upgrading our global discussion forum with exciting new features. The space will return online shortly!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 space-y-6 animate-in fade-in transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UsersThree weight="fill" className="text-brand-500" /> HelpSathi Community Hub
          </h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Engage in peer mentoring, exchange technical knowledge, and seek expert guidance.</p>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-24 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-sm"></div>
      ) : user?.role === "STUDENT" && (
        !isSubscribed ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-5 rounded-3xl flex items-start gap-4 shadow-sm">
            <WarningCircle weight="fill" className="text-amber-500 text-2xl shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">Read-Only Access Mode</h4>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200/90 mt-1 leading-relaxed">
                As a free student, you have read-only access to community threads. To post new topics or reply to discussions, you need an active monthly subscription with any verified mentor.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 rounded-3xl flex items-start gap-4 shadow-sm">
            <ShieldCheck weight="fill" className="text-emerald-500 text-2xl shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-emerald-950 dark:text-white leading-snug">Active Subscriber Access</h4>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                Your subscription grants full posting, commenting, and topic creation privileges within the community.
              </p>
            </div>
          </div>
        )
      )}

      {error && (
        <div className="bg-danger/15 dark:bg-red-950/50 border border-danger/30 dark:border-red-800 text-danger dark:text-red-300 p-4 rounded-2xl text-sm font-black flex items-center gap-2.5 shadow-sm">
          <WarningCircle weight="bold" className="text-xl shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="w-full h-32 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800 shadow-sm"></div>
      ) : user && (user.role === "ADMIN" || user.adminSubRole || user.role === "MENTOR" || isSubscribed) && (
        <form onSubmit={handlePost} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl relative transition-colors">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask a question or share valuable insights with the community..."
            className="w-full bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[90px] font-semibold transition-all"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">
              {content.length} / 1000 characters
            </span>
            <button 
              type="submit" 
              disabled={submitting || !content.trim()}
              className="bg-brand-main dark:bg-brand-500 hover:opacity-95 text-brand-950 dark:text-slate-950 px-6 py-2.5 rounded-2xl font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center gap-2 text-sm active:scale-[0.99]"
            >
              {submitting ? "Publishing..." : "Publish Post"} <PaperPlaneRight weight="bold" className="text-base" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4 pb-12">
        {loading ? (
          <CommunityPostSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center p-12 text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 font-extrabold text-sm shadow-sm">
            No active posts found. Initiate a new discussion thread above!
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostItem key={post.id} post={post} user={user} isSubscribed={isSubscribed} />
            ))}
            
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchPosts(nextPage);
                  }}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Posts"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostItem({ post, user, isSubscribed }: { post: any; user: any; isSubscribed: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isAuthor = user && (user.id === post.authorId || user.userId === post.authorId);

  const toggleComments = async () => {
    if (!expanded) {
      setExpanded(true);
      setLoading(true);
      try {
        const res = await fetch(`/api/community/${post.id}/comments`);
        const data = await res.json();
        if (data.comments) setComments(data.comments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setExpanded(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/community/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments([...comments, data.comment]);
      setCommentContent("");
      post._count = { ...post._count, comments: (post._count?.comments || 0) + 1 };
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/community/${post.id}`, { method: "DELETE" });
      if (res.ok) setDeleted(true);
      else throw new Error("Failed to delete post");
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`/api/community/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        post.content = editContent;
        setIsEditing(false);
      } else throw new Error("Failed to edit post");
    } catch (err) {
      console.error(err);
    }
  };

  if (deleted) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex gap-4 sm:gap-5 transition-colors">
      <img 
        src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}`} 
        alt={post.author.name}
        className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-extrabold text-slate-900 dark:text-white text-base leading-none">{post.author.name}</span>
          {(() => {
            const badge = getRoleBadge(post.author);
            if (!badge) return null;
            return (
              <span className={`border text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${badge.colorClass}`}>
                {badge.label}
              </span>
            );
          })()}
          <span className="text-xs text-slate-400 dark:text-slate-500 font-extrabold">• {new Date(post.createdAt).toLocaleDateString()}</span>
          {post.editedAt && <span className="text-[10px] text-slate-400 font-bold ml-1">(edited)</span>}
        </div>
        
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 min-h-[80px]"
            />
            <div className="flex gap-2">
              <button onClick={handleEdit} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-bold hover:bg-brand-600">Save</button>
              <button onClick={() => { setIsEditing(false); setEditContent(post.content); }} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium mt-2">{post.content}</p>
        )}
        
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-3.5">
          <button 
            onClick={toggleComments}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-xs font-black"
          >
            <ChatCircleText weight="bold" className="text-lg" />
            {post._count?.comments || 0} Comments & Replies
          </button>
          
          {isAuthor && !isEditing && (
            <div className="flex items-center gap-3">
              <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors">Edit</button>
              <button onClick={handleDelete} disabled={isDeleting} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {loading ? (
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 animate-pulse">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">No comments yet. Be the first to reply!</div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`} 
                      alt={comment.author.name} 
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover" 
                    />
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{comment.author.name}</span>
                        {(() => {
                          const badge = getRoleBadge(comment.author);
                          if (!badge) return null;
                          return (
                            <span className={`border text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${badge.colorClass}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {(user?.role === "ADMIN" || user?.adminSubRole || user?.role === "MENTOR" || isSubscribed) ? (
              <form onSubmit={handleComment} className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={submitting || !commentContent.trim()} 
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-xl text-sm font-black disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  {submitting ? "..." : "Reply"} <PaperPlaneRight weight="bold" />
                </button>
              </form>
            ) : (
              <div className="mt-4 text-xs font-bold p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 rounded-xl flex items-center gap-2">
                <ShieldCheck weight="fill" className="text-lg" />
                Subscribe to a mentor to join the conversation and post replies.
              </div>
            )}
            {error && <div className="text-xs font-bold text-red-500 mt-2">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
