'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Plus, MapPin, ArrowLeft, User, LogIn, LogOut } from 'lucide-react';

interface PlaceSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setIsLoggedIn(data.loggedIn))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (placeQuery.length < 3) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const viewbox = `${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeQuery)}&format=json&limit=8&countrycodes=in&viewbox=${viewbox}&bounded=0`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'Sheheri/1.0' } }
          );
          const data = await response.json();
          const sorted = data.sort((a: any, b: any) => {
            const distA = Math.abs(parseFloat(a.lat) - lat) + Math.abs(parseFloat(a.lon) - lng);
            const distB = Math.abs(parseFloat(b.lat) - lat) + Math.abs(parseFloat(b.lon) - lng);
            return distA - distB;
          });
          setSuggestions(sorted);
        }, async () => {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeQuery)}&format=json&limit=8&countrycodes=in`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'Sheheri/1.0' } }
          );
          const data = await response.json();
          setSuggestions(data);
        });
      } catch (e) {
        console.error('Nominatim error:', e);
      }
    }, 500);
  }, [placeQuery]);

  const handleSelectPlace = (place: PlaceSuggestion) => {
    setSelectedPlace(place);
    setPlaceName(place.display_name.split(',')[0]);
    setPlaceQuery(place.display_name.split(',')[0]);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Write something first'); return; }
    if (!placeName.trim()) { setError('Tag a place'); return; }

    setSubmitting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const lat = selectedPlace ? parseFloat(selectedPlace.lat) : pos.coords.latitude;
      const lng = selectedPlace ? parseFloat(selectedPlace.lon) : pos.coords.longitude;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content,
          placeName,
          googlePlaceId: 'osm_' + Date.now(),
          placeAddress: selectedPlace?.display_name || placeName,
          lat,
          lng,
        }),
      });
      router.push('/');
    } catch (e: any) {
      setError('Failed to post. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST', credentials: 'include'
    });
    setIsLoggedIn(false);
    setProfileMenuOpen(false);
  };

  return (
    <>
      <div className="create-post-page">
        <div className="create-header">
          <button className="back-btn" onClick={() => router.back()}>
            <ArrowLeft size={14} />
            back
          </button>
          <h2>share the truth</h2>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <MapPin size={14} style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', color: '#4b5563', pointerEvents: 'none',
            zIndex: 2,
          }} />
          <input
            className="place-search-input"
            style={{ marginBottom: 0, paddingLeft: '36px' }}
            type="text"
            placeholder="Search a place — cafe, college, street..."
            value={placeQuery}
            onChange={e => { setPlaceQuery(e.target.value); setSelectedPlace(null); }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0, right: 0,
              background: '#12121e',
              border: '0.5px solid #1f1f30',
              borderRadius: '12px',
              zIndex: 100,
              overflow: 'hidden',
              marginTop: '4px',
            }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectPlace(s)}
                  style={{
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#d1d5db',
                    cursor: 'pointer',
                    borderBottom: '0.5px solid #1f1f30',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1a1a2e')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <MapPin size={10} color="#8b5cf6" />
                  {s.display_name.split(',').slice(0, 3).join(',')}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPlace && (
          <div className="place-badge">
            <MapPin size={10} />
            {placeName}
          </div>
        )}

        <div className="truth-line">no names · no filters · just truth</div>

        <textarea
          placeholder="What really happens here? Be honest. Be anonymous."
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={1000}
          rows={6}
        />
        <span className={`char-count ${content.length > 900 ? 'danger' : content.length > 800 ? 'warn' : ''}`}>
          {content.length} / 1000
        </span>

        <div className="anon-row">
          <div className="anon-dot" />
          posting as anonymous
          <div className="anon-dot" />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Anonymously'}
        </button>
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
        <Link href="/post/new" className="nav-item active">
          <Plus size={20} />
          <span>post</span>
        </Link>
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