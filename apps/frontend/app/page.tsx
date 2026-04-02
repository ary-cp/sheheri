'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, Search, Plus, MapPin, ChevronRight, LogIn, User, LogOut, ChevronDown, X } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  placeName: string;
  googlePlaceId: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

interface LocationOption {
  display_name: string;
  lat: string;
  lon: string;
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

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('detecting location...');
  const [locationReady, setLocationReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [locDropdownOpen, setLocDropdownOpen] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState('');
  const [locSuggestions, setLocSuggestions] = useState<LocationOption[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);
  const locDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auth check
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setIsLoggedIn(data.loggedIn);
        if (data.loggedIn) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/nickname/me`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => setNickname(d.nickname));
        }
      })
      .catch(() => {});
  }, []);

  // Geolocation - non-blocking
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('posts near you');
        setLocationReady(true);
      },
      () => {
        // Location denied — still allow the app to work
        setLocationLabel('all posts');
        setLocationReady(true);
      }
    );
    // If geolocation takes too long, just proceed without it
    const timeout = setTimeout(() => {
      setLocationReady(prev => {
        if (!prev) {
          setLocationLabel('all posts');
          return true;
        }
        return prev;
      });
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Fetch posts once location is resolved (or timed out)
  useEffect(() => {
    if (!locationReady) return;
    fetchPosts(1, true);
  }, [locationReady, location]);

  const fetchPosts = async (p: number, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      let allPosts: Post[] = [];

      if (location) {
        // Try nearby endpoint first
        try {
          const nearbyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/nearby`, {
            params: { lat: location.lat, lng: location.lng, page: p },
            withCredentials: true,
          });
          allPosts = nearbyRes.data.posts || [];
          setHasMore(nearbyRes.data.hasMore);
        } catch {
          // If nearby fails, fall back to search with empty query
          const fallbackRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/search`, {
            params: { q: '', page: p },
            withCredentials: true,
          });
          allPosts = fallbackRes.data.posts || [];
          setHasMore(false);
        }
      } else {
        // No location — fetch all posts via search
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/search`, {
            params: { q: '', page: p },
            withCredentials: true,
          });
          allPosts = res.data.posts || [];
          setHasMore(res.data.hasMore || false);
        } catch {
          allPosts = [];
          setHasMore(false);
        }
      }

      if (reset || p === 1) {
        setPosts(allPosts);
      } else {
        setPosts(prev => [...prev, ...allPosts]);
      }
      setPage(p);
    } catch {}
    setLoading(false);
    setInitialLoad(false);
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
    setProfileMenuOpen(false);
  };

  // Location search for dropdown
  useEffect(() => {
    if (locSearchQuery.length < 2) {
      setLocSuggestions([]);
      return;
    }
    if (locDebounceRef.current) clearTimeout(locDebounceRef.current);
    locDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locSearchQuery)}&format=json&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'Sheheri/1.0' } }
        );
        const data = await response.json();
        setLocSuggestions(data);
      } catch {
        setLocSuggestions([]);
      }
    }, 400);
  }, [locSearchQuery]);

  const handleSelectLocation = (opt: LocationOption) => {
    setLocation({ lat: parseFloat(opt.lat), lng: parseFloat(opt.lon) });
    setLocationLabel(opt.display_name.split(',')[0]);
    setLocDropdownOpen(false);
    setLocSearchQuery('');
    setLocSuggestions([]);
    setPosts([]);
    setPage(1);
    setHasMore(true);
  };

  const handleClearLocation = () => {
    setLocation(null);
    setLocationLabel('all posts');
    setLocDropdownOpen(false);
    setPosts([]);
    setPage(1);
    setHasMore(true);
  };

  const handleUseMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('posts near you');
        setLocDropdownOpen(false);
        setPosts([]);
        setPage(1);
        setHasMore(true);
      },
      () => {
        alert('Could not get your location. Please allow location access.');
      }
    );
  };

  return (
    <>
      <main className="feed-page">
        <div className="feed-header">
          <span className="brand">sheheri</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isLoggedIn && (
              <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`} style={loginBtnStyle}>
                <LogIn size={13} />
                Login
              </a>
            )}
            <Link href="/post/new" className="fab">+ post</Link>
          </div>
        </div>

        {/* Location selector */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            className="loc-selector"
            onClick={() => setLocDropdownOpen(!locDropdownOpen)}
          >
            <MapPin size={10} />
            {locationLabel}
            <ChevronDown size={10} style={{ opacity: 0.6 }} />
          </div>

          {locDropdownOpen && (
            <>
              <div className="dropup-overlay" onClick={() => setLocDropdownOpen(false)} />
              <div className="loc-dropdown">
                <input
                  type="text"
                  placeholder="Search a city or place..."
                  value={locSearchQuery}
                  onChange={e => setLocSearchQuery(e.target.value)}
                  autoFocus
                />
                <div
                  className="loc-option"
                  onClick={handleUseMyLocation}
                  style={{ color: '#a78bfa', fontWeight: 500 }}
                >
                  <MapPin size={12} />
                  Use my location
                </div>
                <div
                  className="loc-option"
                  onClick={handleClearLocation}
                  style={{ color: '#9ca3af' }}
                >
                  <X size={12} />
                  Show all posts
                </div>
                {locSuggestions.map((s, i) => (
                  <div key={i} className="loc-option" onClick={() => handleSelectLocation(s)}>
                    <MapPin size={10} color="#8b5cf6" />
                    {s.display_name.split(',').slice(0, 3).join(',')}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {posts.map((post, i) => (
          <div key={post._id} ref={i === posts.length - 1 ? lastPostRef : undefined}>
            <PostCard post={post} />
          </div>
        ))}

        {(loading || initialLoad) && (
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="end-message">You've seen everything{location ? ' nearby' : ''}!</p>
        )}

        {!loading && !initialLoad && posts.length === 0 && (
          <p className="end-message">No posts yet — be the first one!</p>
        )}
      </main>

      {/* Profile dropup overlay */}
      {profileMenuOpen && (
        <div className="dropup-overlay" onClick={() => setProfileMenuOpen(false)} />
      )}

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
        <div className="nav-profile-wrapper">
          <button
            className="nav-item"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <User size={20} />
            <span>profile</span>
          </button>
          <div className={`dropup-menu ${profileMenuOpen ? 'open' : ''}`}>
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  className="dropup-item"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <User size={14} />
                  Profile
                </Link>
                <button className="dropup-item danger" onClick={handleLogout}>
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`} className="dropup-item">
                <LogIn size={14} />
                Login
              </a>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}