'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, Search, Plus, User, LogOut, ArrowLeft, MapPin, Edit3 } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  placeName: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' });
        const authData = await authRes.json();
        setIsLoggedIn(authData.loggedIn);

        if (authData.loggedIn) {
          // Fetch nickname
          const nickRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nickname/me`, { credentials: 'include' });
          const nickData = await nickRes.json();
          setNickname(nickData.nickname);

          // Try to fetch user's own posts
          setPostsLoading(true);
          try {
            const postsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/posts/me`, {
              withCredentials: true,
            });
            setMyPosts(postsRes.data.posts || []);
          } catch {
            // /posts/me might not exist yet — that's OK
            setMyPosts([]);
          }
          setPostsLoading(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST', credentials: 'include'
    });
    setIsLoggedIn(false);
    setNickname(null);
    router.push('/');
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="feed-header">
          <span className="brand">profile</span>
        </div>
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <div className="profile-page">
          <div className="feed-header">
            <button className="back-btn" onClick={() => router.back()}>
              <ArrowLeft size={14} />
              back
            </button>
            <span className="brand" style={{ fontSize: '15px' }}>profile</span>
          </div>

          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div className="profile-avatar" style={{ opacity: 0.5 }}>
              <User size={32} />
            </div>
            <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '20px' }}>
              Log in to see your profile
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              className="fab"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              Login with Google
            </a>
          </div>
        </div>

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
          <Link href="/profile" className="nav-item active">
            <User size={20} />
            <span>profile</span>
          </Link>
        </nav>
      </>
    );
  }

  const totalUpvotes = myPosts.reduce((sum, p) => sum + p.upvotes, 0);

  return (
    <>
      <div className="profile-page">
        <div className="feed-header">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={14} />
            back
          </button>
          <span className="brand" style={{ fontSize: '15px' }}>profile</span>
        </div>

        <div style={{ paddingTop: '20px' }}>
          {/* Avatar */}
          <div className="profile-avatar">
            <User size={32} />
          </div>

          {/* Nickname */}
          <div className="profile-nickname">{nickname || 'anon'}</div>
          <div className="profile-subtitle">
            your alias · only visible to you
          </div>

          {/* Stats */}
          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-value">{myPosts.length}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{totalUpvotes}</div>
              <div className="profile-stat-label">Upvotes</div>
            </div>
          </div>

          {/* Edit nickname */}
          <div className="profile-section">
            <Link
              href="/nickname"
              className="profile-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <Edit3 size={16} color="#8b5cf6" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Change Nickname</div>
                <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                  Currently: {nickname || 'not set'}
                </div>
              </div>
            </Link>
          </div>

          {/* My Posts */}
          <div className="profile-section">
            <div className="profile-section-title">My Posts</div>
            {postsLoading && (
              <>
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </>
            )}
            {!postsLoading && myPosts.length === 0 && (
              <div className="profile-card">
                <p className="profile-empty">
                  You haven't posted anything yet.
                  <br />
                  <Link href="/post/new" style={{ color: '#8b5cf6', textDecoration: 'none' }}>
                    Share the truth →
                  </Link>
                </p>
              </div>
            )}
            {myPosts.map(post => (
              <div
                key={post._id}
                className="post-card"
                onClick={() => router.push(`/place/${encodeURIComponent(post.placeName)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="post-place">
                  <MapPin size={10} />
                  {post.placeName}
                </div>
                <p className="post-content">{post.content}</p>
                <div className="post-footer">
                  <span className="v-btn">▲ {post.upvotes}</span>
                  <span className="v-btn">▼ {post.downvotes}</span>
                  <span className="post-time">{timeAgo(post.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="profile-section">
            <button className="profile-logout-btn" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

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
        <Link href="/profile" className="nav-item active">
          <User size={20} />
          <span>profile</span>
        </Link>
      </nav>
    </>
  );
}
