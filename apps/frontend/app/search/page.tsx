'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Home, Search, Plus, MapPin, ChevronRight } from 'lucide-react';

interface Post {
  _id: string;
  content: string;
  placeName: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/search?q=${query}`,
        { withCredentials: true }
      );
      setPosts(res.data.posts);
      setSearched(true);
    } catch {
      setPosts([]);
      setSearched(true);
    }
    setLoading(false);
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
          <span className="brand">search</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none'
            }} />
            <input
              className="place-search-input"
              style={{ marginBottom: 0, paddingLeft: '36px' }}
              type="text"
              placeholder="Search a place..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="fab" onClick={handleSearch}>Go</button>
        </div>

        {loading && (
          <>
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </>
        )}

        {searched && posts.length === 0 && !loading && (
          <p className="end-message">No posts found for this place.</p>
        )}

        {posts.map(post => (
          <div key={post._id} className="post-card"
            onClick={() => router.push(`/place/${encodeURIComponent(post.placeName)}`)}>
            <div className="post-place">
              <MapPin size={10} />
              {post.placeName}
              <ChevronRight size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
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

      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <Home size={20} />
          <span>feed</span>
        </Link>
        <Link href="/search" className="nav-item active">
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