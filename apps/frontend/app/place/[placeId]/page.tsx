'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, Search, Plus, User, LogIn, LogOut } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  placeName: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export default function PlaceDetailPage() {
  const { placeId } = useParams();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [placeName, setPlaceName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setIsLoggedIn(data.loggedIn))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPlacePosts();
  }, [placeId]);

  const fetchPlacePosts = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/search?q=${placeId}`,
        { withCredentials: true }
      );
      setPosts(res.data.posts);
      if (res.data.posts.length > 0) {
        setPlaceName(res.data.posts[0].placeName);
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST', credentials: 'include'
    });
    setIsLoggedIn(false);
    setProfileMenuOpen(false);
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
    <>
      <div className="feed-page">
        <div className="feed-header">
          <button className="back-btn" onClick={() => router.back()}>← back</button>
          <span className="brand" style={{ fontSize: '15px' }}>
            {placeName || 'Place'}
          </span>
        </div>

        <div className="loc-tag" style={{ marginTop: '12px' }}>
          <div className="post-place-dot" />
          {posts.length} posts here
        </div>

        {loading && (
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        )}

        {!loading && posts.length === 0 && (
          <p className="end-message">No posts here yet — be the first!</p>
        )}

        {posts.map(post => (
          <div key={post._id} className="post-card">
            <div className="post-place">
              <div className="post-place-dot" />
              {post.placeName}
            </div>
            <p className="post-content">{post.content}</p>
            <div className="post-footer">
              <span className="v-btn">▲ {post.upvotes}</span>
              <span className="v-btn">▼ {post.downvotes}</span>
              <span className="post-time">{timeAgo(post.createdAt)}</span>
              <span className="anon-tag">anon</span>
            </div>
          </div>
        ))}
      </div>

      {profileMenuOpen && (
        <div className="dropup-overlay" onClick={() => setProfileMenuOpen(false)} />
      )}

      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
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