"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ForumTopic {
  id: number;
  title: string;
  category: string;
  author: string;
  authorAddr: string;
  createdAt: string;
  lastActivity: string;
  replies: number;
  views: number;
  tags: string[];
  pinned?: boolean;
}

interface ForumPost {
  id: number;
  topicId: number;
  author: string;
  authorAddr: string;
  body: string;
  createdAt: string;
}

const CATEGORIES = [
  { key: "all", label: "All Topics", icon: "📋" },
  { key: "general", label: "General Discussion", icon: "💬" },
  { key: "bug", label: "Bug Reports", icon: "🐛" },
  { key: "feature", label: "Feature Requests", icon: "💡" },
  { key: "integration", label: "Integration Help", icon: "🔌" },
  { key: "showcase", label: "Project Showcase", icon: "🏆" },
];

const SEED_TOPICS: ForumTopic[] = [
  { id: 1, title: "LLaMA 3.1 70B latency spikes after 10K requests — root cause?", category: "bug", author: "CryptoDev42", authorAddr: "0x3C44...93BC", createdAt: "2 hours ago", lastActivity: "5 min ago", replies: 23, views: 1240, tags: ["llm", "performance"], pinned: true },
  { id: 2, title: "How to set up AIMS relay with self-hosted GPU cluster?", category: "integration", author: "GPUWhale", authorAddr: "0x7099...79C8", createdAt: "5 hours ago", lastActivity: "1 hour ago", replies: 8, views: 567, tags: ["relay", "self-hosted"] },
  { id: 3, title: "Feature Request: Batch inference with priority queue", category: "feature", author: "DataScientist99", authorAddr: "0x15d3...6A65", createdAt: "1 day ago", lastActivity: "3 hours ago", replies: 15, views: 890, tags: ["feature", "batch"] },
  { id: 4, title: "Stable Diffusion XL producing black images on A100", category: "bug", author: "PixelPusher", authorAddr: "0x90F7...b906", createdAt: "1 day ago", lastActivity: "8 hours ago", replies: 12, views: 723, tags: ["image-gen", "bug"] },
  { id: 5, title: "Showcase: Built a real-time translation pipeline with Whisper Large v3", category: "showcase", author: "LingoBuilder", authorAddr: "0xf39F...2266", createdAt: "2 days ago", lastActivity: "1 day ago", replies: 31, views: 2100, tags: ["showcase", "tts"] },
  { id: 6, title: "Best practices for securing AIMS API keys in production?", category: "general", author: "SecEng101", authorAddr: "0x1A2B...3C4D", createdAt: "2 days ago", lastActivity: "6 hours ago", replies: 19, views: 1560, tags: ["security", "api-keys"] },
  { id: 7, title: "Token Station deposit not reflecting — stuck for 2h", category: "bug", author: "TokenUser88", authorAddr: "0xE5F6...G7H8", createdAt: "3 days ago", lastActivity: "1 day ago", replies: 6, views: 345, tags: ["api-station", "deposit"] },
  { id: 8, title: "Code audit skill: how to price Solidity verification per line?", category: "general", author: "AuditDAO", authorAddr: "0x5FbD...3a1C", createdAt: "3 days ago", lastActivity: "2 days ago", replies: 14, views: 678, tags: ["pricing", "code-audit"] },
];

const SEED_POSTS: Record<number, ForumPost[]> = {
  1: [
    { id: 101, topicId: 1, author: "CryptoDev42", authorAddr: "0x3C44...93BC", body: "I've been running LLaMA 3.1 70B on the AIMS relay for about 2 weeks now. After crossing ~10K requests, I'm seeing consistent latency spikes — from ~300ms to 2-3 seconds per inference. Has anyone else experienced this? My setup is Mode 1 per-call, AIMS-specified hosting.\n\nRelevant details:\n- Model: llama-3.1-70b\n- Context window: 128K\n- Average prompt length: 2-4K tokens\n- Spikes happen regardless of time of day", createdAt: "2 hours ago" },
    { id: 102, topicId: 1, author: "MetaAILabs", authorAddr: "0x3C44...93BC", body: "This is a known issue with the current relay worker pool. The A100 GPUs have a warm-up phase after idle periods > 5 minutes. We're working on a keep-warm solution. In the meantime, you can reduce latency by:\n\n1. Keep a steady stream of requests (no long idle gaps)\n2. Use the Reserved SLA tier for dedicated workers\n3. Set `keep_alive: true` in your API calls\n\nThe fix should be deployed in the next relay update (ETA 2-3 days).", createdAt: "1 hour ago" },
    { id: 103, topicId: 1, author: "CryptoDev42", authorAddr: "0x3C44...93BC", body: "Thanks for the quick response! I'll try the `keep_alive` flag. Any ETA on the Reserved tier pricing for small developers? $500/month is a bit steep for our bootstrapped project.", createdAt: "30 min ago" },
    { id: 104, topicId: 1, author: "GPUWhale", authorAddr: "0x7099...79C8", body: "We've been running on Reserved tier for 2 months. Worth every penny if you need consistent latency. But I agree — a \"startup\" tier at maybe $100/month with a shared pool would be great for smaller teams.", createdAt: "5 min ago" },
  ],
  2: [
    { id: 201, topicId: 2, author: "GPUWhale", authorAddr: "0x7099...79C8", body: "I have a cluster of 4×A100 GPUs on-prem and want to connect them to AIMS relay. The docs mention self-hosted relay but the setup guide seems incomplete. Has anyone successfully done this?\n\nSpecific questions:\n1. Do I need a static IP?\n2. How is GPU health reported to AIMS?\n3. What's the minimum bandwidth requirement?", createdAt: "5 hours ago" },
    { id: 202, topicId: 2, author: "MetaAILabs", authorAddr: "0x3C44...93BC", body: "We run self-hosted for LLaMA 3.1 70B. Here's the quick guide:\n\n1. **Static IP**: Yes, required for relay registration\n2. **Health reporting**: The relay binary exposes a `/health` endpoint that AIMS polls every 30s\n3. **Bandwidth**: Minimum 100 Mbps, recommended 1 Gbps for multi-tenant workloads\n\nClone the repo: `git clone https://github.com/aims-v2/relay-worker` and follow the `SELF_HOSTED.md` guide. If you get stuck, DM me here and I'll help.", createdAt: "3 hours ago" },
  ],
};

function loadForumData(): { topics: ForumTopic[]; posts: Record<number, ForumPost[]> } {
  if (typeof window === "undefined") return { topics: SEED_TOPICS, posts: SEED_POSTS };
  const rawTopics = sessionStorage.getItem("aims_forum_topics");
  const rawPosts = sessionStorage.getItem("aims_forum_posts");
  return {
    topics: rawTopics ? JSON.parse(rawTopics) : SEED_TOPICS,
    posts: rawPosts ? JSON.parse(rawPosts) : SEED_POSTS,
  };
}

function saveForumData(topics: ForumTopic[], posts: Record<number, ForumPost[]>) {
  sessionStorage.setItem("aims_forum_topics", JSON.stringify(topics));
  sessionStorage.setItem("aims_forum_posts", JSON.stringify(posts));
}

export default function ForumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("ForumModal");
  const common = useTranslations("Common");

  const [view, setView] = useState<"list" | "topic" | "new">("list");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [topicPosts, setTopicPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(false);

  // ── Persistent forum data via sessionStorage ──
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [posts, setPosts] = useState<Record<number, ForumPost[]>>({});

  useEffect(() => {
    const data = loadForumData();
    setTopics(data.topics);
    setPosts(data.posts);
  }, [open]);

  const persist = (t2: ForumTopic[], p2: Record<number, ForumPost[]>) => {
    setTopics(t2);
    setPosts(p2);
    saveForumData(t2, p2);
  };

  const wallet = typeof window !== "undefined" ? sessionStorage.getItem("aims_wallet") : null;

  // New topic form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newBody, setNewBody] = useState("");
  const [newTags, setNewTags] = useState("");

  // Reply form
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const filteredTopics = topics.filter((topic) => {
    if (activeCategory !== "all" && topic.category !== activeCategory) return false;
    if (searchQuery && !topic.title.toLowerCase().includes(searchQuery.toLowerCase()) && !topic.tags.some((t) => t.includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const openTopic = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setTopicPosts(posts[topic.id] || []);
    setView("topic");
    setReplyBody("");
  };

  const backToList = () => {
    setView("list");
    setSelectedTopic(null);
    setTopicPosts([]);
  };

  const submitNewTopic = () => {
    if (!wallet) { setLoginPrompt(true); return; }
    if (!newTitle.trim() || !newBody.trim()) return;
    const topic: ForumTopic = {
      id: Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      author: "You",
      authorAddr: sessionStorage.getItem("aims_wallet")?.slice(0, 10) || "0x...",
      createdAt: "just now",
      lastActivity: "just now",
      replies: 0,
      views: 1,
      tags: newTags.split(",").map((t2) => t2.trim()).filter(Boolean),
    };
    const firstPost: ForumPost = {
      id: Date.now() + 1,
      topicId: topic.id,
      author: "You",
      authorAddr: sessionStorage.getItem("aims_wallet")?.slice(0, 10) || "0x...",
      body: newBody.trim(),
      createdAt: "just now",
    };
    const newTopics = [topic, ...topics];
    const newPosts = { ...posts, [topic.id]: [firstPost] };
    persist(newTopics, newPosts);
    setNewTitle("");
    setNewCategory("general");
    setNewBody("");
    setNewTags("");
    setView("topic");
    setSelectedTopic(topic);
    setTopicPosts(newPosts[topic.id]);
  };

  const submitReply = () => {
    if (!wallet) { setLoginPrompt(true); return; }
    if (!replyBody.trim() || !selectedTopic) return;
    const post: ForumPost = {
      id: Date.now(),
      topicId: selectedTopic.id,
      author: "You",
      authorAddr: sessionStorage.getItem("aims_wallet")?.slice(0, 10) || "0x...",
      body: replyBody.trim(),
      createdAt: "just now",
    };
    const existing = posts[selectedTopic.id] || [];
    const newPosts = { ...posts, [selectedTopic.id]: [...existing, post] };
    // Update topic reply count
    const newTopics = topics.map((t2) =>
      t2.id === selectedTopic.id ? { ...t2, replies: existing.length + 1, lastActivity: "just now" } : t2
    );
    persist(newTopics, newPosts);
    setTopicPosts([...existing, post]);
    setSelectedTopic((prev) => prev ? { ...prev, replies: existing.length + 1 } : null);
    setReplyBody("");
  };

  const catBadge = (cat: string) => {
    const colors: Record<string, string> = {
      bug: "badge-red",
      feature: "badge-yellow",
      integration: "badge-green",
      showcase: "badge-green",
      general: "badge-muted",
    };
    return colors[cat] || "badge-muted";
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />

      {/* Panel */}
      <div style={{ position: "relative", width: "100%", maxWidth: 1100, height: "100%", marginLeft: "auto", background: "var(--canvas-dark)", borderLeft: "1px solid var(--hairline-on-dark)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--hairline-on-dark)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t("forumTitle")}</h2>
            <span style={{ fontSize: 11, color: "var(--muted)", padding: "2px 8px", borderRadius: 4, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
              {topics.length} topics
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {view !== "list" && (
              <button className="btn-secondary" style={{ height: 34, fontSize: 12 }} onClick={backToList}>
                ← {t("backToTopics")}
              </button>
            )}
            {view === "list" && (
              <button className="btn-primary" style={{ height: 34, fontSize: 12 }} onClick={() => { if (!wallet) { setLoginPrompt(true); return; } setView("new"); }}>
                + {t("newTopic")}
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>✕</button>
          </div>
        </div>

        {loginPrompt && (
          <div style={{ padding: "10px 24px", background: "rgba(252,213,53,0.08)", borderBottom: "1px solid rgba(252,213,53,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--primary)" }}>{t("loginToPost")}</span>
            <button className="btn-secondary" style={{ height: 28, fontSize: 11 }} onClick={() => setLoginPrompt(false)}>{common("close")}</button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--hairline-on-dark)", padding: "16px 12px", overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 12, padding: "0 8px" }}>{t("categories")}</div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setView("list"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 6,
                  marginBottom: 2, border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeCategory === cat.key ? 600 : 400,
                  background: activeCategory === cat.key ? "rgba(252,213,53,0.08)" : "transparent",
                  color: activeCategory === cat.key ? "var(--primary)" : "var(--muted)",
                  textAlign: "left" as const,
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {view === "list" && (
              <>
                {/* Search */}
                <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--hairline-on-dark)", flexShrink: 0 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-dark"
                      placeholder={t("searchTopics")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingRight: 40, height: 38, fontSize: 13 }}
                      data-testid="forum-search"
                    />
                    <span style={{ position: "absolute", right: 12, top: 10, color: "var(--muted)" }}>⌕</span>
                  </div>
                </div>

                {/* Topic list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
                  {filteredTopics.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 13 }}>
                      {t("noTopicsFound")}
                    </div>
                  ) : (
                    filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => openTopic(topic)}
                        style={{
                          padding: "14px 0", borderBottom: "1px solid var(--hairline-on-dark)", cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        data-testid={`forum-topic-${topic.id}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          {topic.pinned && <span style={{ fontSize: 10, color: "var(--primary)" }}>📌</span>}
                          <span className={catBadge(topic.category)} style={{ fontSize: 10, padding: "1px 8px" }}>
                            {CATEGORIES.find((c) => c.key === topic.category)?.label || topic.category}
                          </span>
                          {topic.tags.map((tag) => (
                            <span key={tag} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(112,122,138,0.1)", color: "var(--muted)" }}>{tag}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{topic.title}</div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                          <span>{t("by")} <span style={{ color: "var(--body)", fontWeight: 500 }}>{topic.author}</span></span>
                          <span>{topic.replies} {t("replies")}</span>
                          <span>{topic.views.toLocaleString()} {t("views")}</span>
                          <span style={{ marginLeft: "auto" }}>{topic.lastActivity}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {view === "new" && (
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 20px" }}>{t("newTopic")}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("category")}</label>
                    <select className="input-dark" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ height: 42 }}>
                      {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("title")}</label>
                    <input className="input-dark" placeholder={t("titlePlaceholder")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ height: 42 }} data-testid="forum-new-title" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("tags")}</label>
                    <input className="input-dark" placeholder={t("tagsPlaceholder")} value={newTags} onChange={(e) => setNewTags(e.target.value)} style={{ height: 38, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>{t("body")}</label>
                    <textarea className="input-dark" rows={8} placeholder={t("bodyPlaceholder")} value={newBody} onChange={(e) => setNewBody(e.target.value)} style={{ resize: "vertical", height: "auto" }} data-testid="forum-new-body" />
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn-primary" style={{ height: 40, fontSize: 13 }} onClick={submitNewTopic} disabled={!newTitle.trim() || !newBody.trim()}>
                      {t("publishTopic")}
                    </button>
                    <button className="btn-secondary" style={{ height: 40, fontSize: 13 }} onClick={() => { setView("list"); setNewTitle(""); setNewBody(""); setNewTags(""); }}>
                      {common("cancel")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {view === "topic" && selectedTopic && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Topic header */}
                <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--hairline-on-dark)", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span className={catBadge(selectedTopic.category)} style={{ fontSize: 10, padding: "1px 8px" }}>
                      {CATEGORIES.find((c) => c.key === selectedTopic.category)?.label || selectedTopic.category}
                    </span>
                    {selectedTopic.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "rgba(112,122,138,0.1)", color: "var(--muted)" }}>{tag}</span>
                    ))}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>{selectedTopic.title}</h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                    <span>{t("postedBy")} <span style={{ color: "var(--body)", fontWeight: 500 }}>{selectedTopic.author}</span></span>
                    <span>·</span>
                    <span>{selectedTopic.replies} {t("replies")}</span>
                    <span>·</span>
                    <span>{selectedTopic.views.toLocaleString()} {t("views")}</span>
                  </div>
                </div>

                {/* Posts */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                  {topicPosts.map((post, i) => (
                    <div key={post.id} style={{ padding: "16px 0", borderBottom: i < topicPosts.length - 1 ? "1px solid var(--hairline-on-dark)" : "none" }}>
                      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                          background: "linear-gradient(135deg, var(--primary), #f0b90b)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 700, color: "var(--on-primary)",
                        }}>
                          {post.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{post.author}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{post.authorAddr}</div>
                        </div>
                        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>{post.createdAt}</div>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--body)", whiteSpace: "pre-wrap", paddingLeft: 52 }}>{post.body}</div>
                    </div>
                  ))}
                </div>

                {/* Reply form */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid var(--hairline-on-dark)", flexShrink: 0 }}>
                  {wallet ? (
                    <>
                      <textarea
                        className="input-dark"
                        rows={3}
                        placeholder={t("replyPlaceholder")}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        style={{ resize: "vertical", height: "auto", marginBottom: 10, fontSize: 13 }}
                        data-testid="forum-reply-input"
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="btn-primary"
                          style={{ height: 34, fontSize: 12 }}
                          onClick={submitReply}
                          disabled={!replyBody.trim()}
                          data-testid="forum-reply-submit"
                        >
                          {t("postReply")}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "12px 0", color: "var(--muted)", fontSize: 13 }}>
                      {t("loginToReply")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
