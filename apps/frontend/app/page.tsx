'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, Search, Plus, MapPin, ChevronRight, LogIn, LogOut } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  placeName: string;
  googlePlaceId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [votes, setVotes] = useState({ up: post.upvotes, down: post.downvotes });
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [reported, setReported] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/votes/${post._id}`,
        { value },
        { withCredentials: true }
      );
      setVotes({ up: res.data.post.upvotes, down: res.data.post.downvotes });
      setUserVote(userVote === value ? null : value);
    } catch {}
  };

  const handleReport = async () => {
    if (reported) return;
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/${post._id}/report`,
      {},
      { withCredentials: true }
    );
    setReported(true);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="post-card">
      <div
        className="post-place"
        onClick={() => router.push(`/place/${encodeURIComponent(post.placeName)}`)}
        style={{ cursor: 'pointer' }}
      >
        <MapPin size={10} />
        {post.placeName}
        <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
      </div>
      <p className="post-content">{post.content}</p>
      <div className="post-footer">
        <div className="vote-row">
          <button className={`v-btn up ${userVote === 1 ? 'voted' : ''}`} onClick={() => handleVote(1)}>▲ {votes.up}</button>
          <button className={`v-btn down ${userVote === -1 ? 'voted' : ''}`} onClick={() => handleVote(-1)}>▼ {votes.down}</button>
        </div>
        <span className="post-time">{timeAgo(post.createdAt)}</span>
        <span className="anon-tag">anon</span>
        <button className="report-btn" onClick={handleReport}>
          {reported ? '✓ reported' : '⚑ report'}
        </button>
      </div>
    </div>
  );
}

const loginBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  background: 'none',
  border: '0.5px solid #1f1f30',
  borderRadius: '20px',
  padding: '7px 14px',
  fontSize: '12px',
  color: '#9ca3af',
  textDecoration: 'none',
  transition: 'all 0.2s',
};

const nicknameBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#8b5cf6',
  background: 'rgba(139,92,246,0.08)',
  border: '0.5px solid rgba(139,92,246,0.2)',
  borderRadius: '20px',
  padding: '5px 10px',
};

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError(true)
    );
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setIsLoggedIn(data.loggedIn);
        if (data.loggedIn) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/nickname/me`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => setNickname(d.nickname));
        }
      });
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchPosts(1);
  }, [location]);

  const fetchPosts = async (p: number) => {
    if (!location || loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/nearby`, {
        params: { lat: location.lat, lng: location.lng, page: p },
        withCredentials: true,
      });
      if (p === 1) setPosts(res.data.posts);
      else setPosts(prev => [...prev, ...res.data.posts]);
      setHasMore(res.data.hasMore);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchPosts(page + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, page]);

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST', credentials: 'include'
    });
    setIsLoggedIn(false);
    setNickname(null);
  };

  if (locError) return (
    <div className="error-state">
      <p>Location access needed for Sheheri to work</p>
      <br />
      <button className="fab" onClick={() => window.location.reload()}>Try Again</button>
    </div>
  );

  return (
    <>
      <main className="feed-page">
        <div className="feed-header">
          <span className="brand">sheheri</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isLoggedIn ? (
              <a href="http://localhost:5000/api/auth/google" style={loginBtnStyle}>
                <LogIn size={13} />
                Login
              </a>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={nicknameBadgeStyle}>{nickname || 'anon'}</span>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                  <LogOut size={14} />
                </button>
              </div>
            )}
            <Link href="/post/new" className="fab">+ post</Link>
          </div>
        </div>

        <div className="loc-tag">
          <MapPin size={10} />
          {location ? 'posts near you' : 'getting location...'}
        </div>

        {posts.map((post, i) => (
          <div key={post._id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
            <PostCard post={post} />
          </div>
        ))}

        {loading && (
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="end-message">You've seen everything nearby!</p>
        )}

        {!loading && posts.length === 0 && location && (
          <p className="end-message">No posts nearby yet — be the first one!</p>
        )}
      </main>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
          <Home size={20} />
          <span>feed</span>
        </Link>
        <Link href="/search" className="nav-item">
          <Search size={20} />
          <span>search</span>
        </Link>
        <button className="nav-item" onClick={() => router.push('/post/new')}>
          <Plus size={20} />
          <span>post</span>
        </button>
      </nav>
    </>
  );
}