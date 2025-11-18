// frontend/src/pages/Friends.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import API from "../utils/api";
import getAvatar from "../utils/avatar";

/**
 * Friends.jsx (Option B - cleaned & optimized)
 *
 * Endpoints used (unchanged):
 * GET  /api/social/feed/:userId
 * GET  /api/social/feed/summary/:userId
 * GET  /api/social/suggestions/:userId
 * GET  /api/social/friends/:userId
 * GET  /api/social/requests/:userId
 * POST /api/social/request
 * POST /api/social/accept
 * POST /api/social/reject
 * POST /api/social/feed/comment
 *
 * Notes:
 * - Comment input state lives inside FeedCard to avoid losing focus on parent re-renders.
 * - Parent exposes postComment(feedId, text) which the child calls.
 */

export default function Friends() {
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const storedName = typeof window !== "undefined" ? (localStorage.getItem("userName") || localStorage.getItem("userEmail")) : null;
  const userName = storedName || "User";

  // Tabs: 'feed' | 'find' | 'requests' | 'friends'
  const [activeTab, setActiveTab] = useState("feed");

  // Feed state
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [summary, setSummary] = useState("");

  // People / social
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requestsObj, setRequestsObj] = useState({ incoming: [], outgoing: [] });
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [sendingRequestIds, setSendingRequestIds] = useState(new Set());

  // UI
  const [toasts, setToasts] = useState([]);

  // Avoid duplicate posting
  const commentSendingRef = useRef(new Set());

  // Helper: push toast
  const pushToast = useCallback((text, ttl = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  // ------------- Loaders -------------
  const loadFeed = useCallback(async () => {
    if (!userId) return;
    setLoadingFeed(true);
    try {
      const [feedRes, summaryRes] = await Promise.all([
        API.get(`/social/feed/${userId}`),
        API.get(`/social/feed/summary/${userId}`),
      ]);
      setFeed(Array.isArray(feedRes.data) ? feedRes.data : []);
      setSummary(summaryRes?.data?.summary || "");
    } catch (err) {
      console.error("loadFeed error:", err);
      pushToast("Failed to load feed");
      setFeed([]);
    } finally {
      setLoadingFeed(false);
    }
  }, [userId, pushToast]);

  const loadPeople = useCallback(async () => {
    if (!userId) return;
    setLoadingPeople(true);
    try {
      const [suggRes, friendsRes, reqRes] = await Promise.allSettled([
        API.get(`/social/suggestions/${userId}`),
        API.get(`/social/friends/${userId}`),
        API.get(`/social/requests/${userId}`),
      ]);

      const suggData = suggRes.status === "fulfilled" ? (suggRes.value?.data || []) : [];
      const friendsData = friendsRes.status === "fulfilled" ? (friendsRes.value?.data || []) : [];
      const reqData = reqRes.status === "fulfilled" ? (reqRes.value?.data || { incoming: [], outgoing: [] }) : { incoming: [], outgoing: [] };

      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setRequestsObj(reqData || { incoming: [], outgoing: [] });

      // client-side filter: hide connected / pending / self
      const hideSet = new Set();
      (friendsData || []).forEach((f) => hideSet.add(String(f._id)));
      (reqData.outgoing || []).forEach((r) => { if (r.friend && r.friend._id) hideSet.add(String(r.friend._id)); });
      (reqData.incoming || []).forEach((r) => { if (r.user && r.user._id) hideSet.add(String(r.user._id)); });
      hideSet.add(String(userId));

      setSuggestions((suggData || []).filter((s) => !hideSet.has(String(s.user._id))));
    } catch (err) {
      console.error("loadPeople error:", err);
      pushToast("Failed to load people");
    } finally {
      setLoadingPeople(false);
    }
  }, [userId, pushToast]);

  useEffect(() => {
    if (!userId) return;
    loadFeed();
    loadPeople();
  }, [userId, loadFeed, loadPeople]);

  // ------------- Social actions -------------
  const sendRequest = async (toUserId, displayName) => {
    if (!userId) {
      pushToast("Log in to connect");
      return;
    }
    const tid = String(toUserId);
    setSendingRequestIds((s) => new Set(s).add(tid));
    try {
      await API.post("/social/request", { fromUserId: userId, toUserId: tid });
      pushToast(`Request sent to ${displayName || tid}`);
      // Remove from suggestions immediately (optimistic)
      setSuggestions((prev) => prev.filter((p) => String(p.user._id) !== tid));
      // refresh lists
      await loadPeople();
    } catch (err) {
      console.error("sendRequest error:", err);
      pushToast("Could not send request");
    } finally {
      setSendingRequestIds((s) => {
        const copy = new Set(s);
        copy.delete(tid);
        return copy;
      });
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await API.post("/social/accept", { requestId, userId });
      pushToast("Friend added");
      await Promise.all([loadPeople(), loadFeed()]);
    } catch (err) {
      console.error("acceptRequest error:", err);
      pushToast("Could not accept request");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await API.post("/social/reject", { requestId, userId });
      pushToast("Request rejected");
      await loadPeople();
    } catch (err) {
      console.error("rejectRequest error:", err);
      pushToast("Could not reject request");
    }
  };

  // ------------- Comments (parent) -------------
  /**
   * postComment:
   * - called by FeedCard children
   * - does optimistic append in child first (child passes text)
   * - parent will replace temp comment when server responds with saved comment
   *
   * contract: returns saved comment object or throws
   */
  const postComment = async (feedId, text, tempId) => {
    if (!userId) throw new Error("Not logged in");
    const feedKey = String(feedId);

    // Avoid sending duplicates for same feed/text
    const dedupeKey = `${feedKey}::${text}`;
    if (commentSendingRef.current.has(dedupeKey)) {
      throw new Error("Already sending");
    }
    commentSendingRef.current.add(dedupeKey);

    try {
      const res = await API.post("/social/feed/comment", { feedId, userId, text });
      if (res?.data?.success && res?.data?.comment) {
        const saved = res.data.comment;
        // Replace temp comment with saved one (if temp exists) and avoid duplication
        setFeed((prev) =>
          prev.map((f) => {
            if (String(f._id) !== feedKey) return f;
            const withoutTemp = (f.comments || []).filter((c) => c._id !== tempId);
            // avoid adding if saved already present
            const exists = withoutTemp.some((c) => String(c._id) === String(saved._id));
            return { ...f, comments: exists ? withoutTemp : [...withoutTemp, saved] };
          })
        );
        return saved;
      } else {
        // if response not as expected, refresh entire feed
        await loadFeed();
        throw new Error("Unexpected server response");
      }
    } catch (err) {
      console.error("postComment error:", err);
      // try refresh to show persisted comment if server stored it
      await loadFeed();
      throw err;
    } finally {
      commentSendingRef.current.delete(dedupeKey);
    }
  };

  // ------------- helpers -------------
  const avatarFor = (u) => getAvatar(u?.name || u?._id || "user");

  // ------------- Components -------------
  /**
   * FeedCard: isolated local comment state so typing never gets interrupted.
   * Props:
   *  - item (feed item)
   *  - onPostComment(feedId, text, tempId) => returns saved comment (async)
   */
  function FeedCard({ item, onPostComment }) {
    const [localComment, setLocalComment] = useState("");
    const [sending, setSending] = useState(false);
    const inputRef = useRef(null);

    // Keep an input slot for every feed item (prevents missing input)
    useEffect(() => {
      // don't clear local comment if user is typing — only clear when send confirms
    }, []);

    const handleSend = async () => {
      const text = (localComment || "").trim();
      if (!text) return;
      if (!userId) {
        pushToast("Log in to comment");
        return;
      }
      // create temp comment optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempComment = {
        _id: tempId,
        user: { _id: userId, name: userName },
        text,
        createdAt: new Date().toISOString(),
      };

      // append locally to feed (optimistic)
      setSending(true);
      setLocalComment("");
      setFeed((prev) => prev.map((f) => (String(f._id) === String(item._id) ? { ...f, comments: [...(f.comments || []), tempComment] } : f)));

      try {
        const saved = await onPostComment(item._id, text, tempId);
        pushToast("Comment posted");
        // keep focus in input after sending
        if (inputRef.current) inputRef.current.focus();
      } catch (err) {
        pushToast("Failed to post comment");
      } finally {
        setSending(false);
      }
    };

    return (
      <article className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <img src={avatarFor(item.owner)} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.owner?.name || "Unknown"}</div>
                <div className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-600 text-white font-semibold text-sm">{item.payload?.mood || "Mood"}</div>
            </div>

            {item.payload?.caption && <p className="mt-3 text-gray-700">{item.payload.caption}</p>}

            <div className="mt-3 space-y-2">
              {(item.comments || []).map((c) => (
                <div key={c._id} className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-600"><strong>{c.user?.name || 'Unknown'}</strong> · {new Date(c.createdAt).toLocaleTimeString()}</div>
                  <div className="text-sm text-gray-800">{c.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                ref={inputRef}
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Write a comment and press Enter"
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={sending || !(localComment || "").trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded"
              >
                {sending ? "..." : "Comment"}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ------------- Render -------------
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="bg-black/80 text-white px-4 py-2 rounded shadow">{t.text}</div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <aside className="hidden lg:block w-56">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white p-4 rounded shadow border">
              <div className="text-xs text-gray-500">Social</div>
              <div className="mt-3 space-y-2">
                <button onClick={() => setActiveTab('feed')} className={`w-full text-left px-3 py-2 rounded ${activeTab==='feed' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}>Feed</button>
                <button onClick={() => { setActiveTab('find'); loadPeople(); }} className={`w-full text-left px-3 py-2 rounded ${activeTab==='find' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}>Find</button>
                <button onClick={() => { setActiveTab('requests'); loadPeople(); }} className={`w-full text-left px-3 py-2 rounded ${activeTab==='requests' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}>Requests</button>
                <button onClick={() => { setActiveTab('friends'); loadPeople(); }} className={`w-full text-left px-3 py-2 rounded ${activeTab==='friends' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}>Friends</button>
              </div>

              <div className="mt-4 text-xs text-gray-400">Signed in as</div>
              <div className="font-semibold">{userName}</div>
            </div>
          </div>
        </aside>

        {/* Center */}
        <main className="flex-1">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Friends</h1>
              <p className="text-sm text-gray-500">Feed & social — connect with people who share your moods.</p>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">{summary}</div>
          </div>

          {/* Mobile tabs */}
          <div className="flex gap-2 mb-4 lg:hidden">
            <button onClick={() => setActiveTab('feed')} className={`px-3 py-1 rounded ${activeTab==='feed' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Feed</button>
            <button onClick={() => { setActiveTab('find'); loadPeople(); }} className={`px-3 py-1 rounded ${activeTab==='find' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Find</button>
            <button onClick={() => { setActiveTab('requests'); loadPeople(); }} className={`px-3 py-1 rounded ${activeTab==='requests' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Requests</button>
            <button onClick={() => { setActiveTab('friends'); loadPeople(); }} className={`px-3 py-1 rounded ${activeTab==='friends' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Friends</button>
          </div>

          {/* Content */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {loadingFeed ? (
                <div className="bg-white p-8 rounded shadow text-center text-gray-400">Loading feed…</div>
              ) : feed.length === 0 ? (
                <div className="bg-white p-12 rounded shadow text-center text-gray-500">
                  <div className="text-4xl">📭</div>
                  <div className="mt-2 font-medium">No activity yet</div>
                  <div className="text-sm text-gray-400">Share a mood from the dashboard to appear here.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {feed.map((item) => (
                    <FeedCard key={item._id} item={item} onPostComment={postComment} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'find' && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Find People</h2>
              {loadingPeople ? <div className="text-gray-500">Loading…</div> : (
                suggestions.length === 0 ? (
                  <div className="bg-white p-8 rounded shadow text-center text-gray-400">No suggestions right now.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((s) => (
                      <div key={s.user._id} className="bg-white p-4 rounded shadow flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={getAvatar(s.user.name)} alt="" className="w-12 h-12 rounded-full object-cover" />
                          <div>
                            <div className="font-semibold">{s.user.name}</div>
                            <div className="text-xs text-gray-500">{s.user.email}</div>
                            <div className="text-xs text-gray-400">Shared: {(s.sharedMoods||[]).slice(0,3).join(', ')}</div>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => sendRequest(s.user._id, s.user.name)}
                            disabled={sendingRequestIds.has(String(s.user._id))}
                            className="px-3 py-1 rounded bg-indigo-600 text-white"
                          >
                            {sendingRequestIds.has(String(s.user._id)) ? '...' : 'Connect'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Incoming</h3>
                {(requestsObj.incoming || []).length === 0 ? <div className="text-gray-500">No incoming</div> : (
                  requestsObj.incoming.map((r) => (
                    <div key={r._id} className="bg-white p-3 rounded shadow flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img src={getAvatar(r.user?.name)} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                          <div className="font-semibold">{r.user?.name}</div>
                          <div className="text-xs text-gray-500">{r.user?.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => acceptRequest(r._id)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
                        <button onClick={() => rejectRequest(r._id)} className="px-3 py-1 bg-gray-200 rounded">Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Outgoing</h3>
                {(requestsObj.outgoing || []).length === 0 ? <div className="text-gray-500">No outgoing</div> : (
                  requestsObj.outgoing.map((r) => (
                    <div key={r._id} className="bg-white p-3 rounded shadow flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img src={getAvatar(r.friend?.name)} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                          <div className="font-semibold">{r.friend?.name}</div>
                          <div className="text-xs text-gray-500">{r.friend?.email}</div>
                        </div>
                      </div>
                      <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Your Friends ({friends.length})</h2>
              {friends.length === 0 ? <div className="text-gray-500">No friends yet.</div> : (
                friends.map((f) => (
                  <div key={f._id} className="bg-white p-3 rounded shadow mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={getAvatar(f.name)} className="w-12 h-12 rounded-full" alt="" />
                      <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-xs text-gray-500">{f.email}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">Connected</div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="w-80 hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white p-4 rounded shadow">
              <div className="font-semibold">Friend Insights</div>
              <div className="text-sm text-gray-600 mt-2">{summary || 'No recent friend activity.'}</div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Suggestions</div>
                <div className="text-xs text-gray-400">Top picks</div>
              </div>
              {loadingPeople ? <div className="text-gray-500">Loading…</div> : (
                (suggestions.slice(0,5) || []).map((s) => (
                  <div key={s.user._id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <img src={getAvatar(s.user.name)} className="w-10 h-10 rounded-full" alt="" />
                      <div>
                        <div className="font-medium">{s.user.name}</div>
                        <div className="text-xs text-gray-400">{s.user.email}</div>
                      </div>
                    </div>
                    <button onClick={() => sendRequest(s.user._id, s.user.name)} className="px-2 py-1 bg-indigo-600 text-white rounded">Add</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
