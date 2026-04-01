'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check } from 'lucide-react';

export default function NicknamePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateNickname();
  }, []);

  const generateNickname = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nickname/generate`);
      const data = await res.json();
      setNickname(data.nickname);
    } catch {}
    setGenerating(false);
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.5s ease-out;
      pointer-events: none;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleSubmit = async () => {
    if (!nickname.trim()) { setError('Enter a nickname'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nickname/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/');
    } catch {
      setError('Failed to set nickname. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page" style={{ maxWidth: '400px', paddingTop: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#e5e7eb',
          marginBottom: '8px',
          letterSpacing: '-0.5px',
        }}>
          pick your alias
        </h1>
        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
          Only you will know this is you.<br />
          Everyone else sees "anon".
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <input
          className="place-search-input"
          style={{
            marginBottom: 0,
            paddingRight: '48px',
            textAlign: 'center',
            fontSize: '16px',
            letterSpacing: '0.5px',
          }}
          type="text"
          placeholder="your_alias_here"
          value={nickname}
          onChange={e => {
            setNickname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
            setError('');
          }}
          maxLength={20}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={generateNickname}
          disabled={generating}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'opacity 0.2s',
            opacity: generating ? 0.5 : 1,
          }}
          title="Generate new nickname"
        >
          <RefreshCw
            size={16}
            style={{ animation: generating ? 'spin 0.5s linear infinite' : 'none' }}
          />
        </button>
      </div>

      <p style={{ fontSize: '11px', color: '#2d2d45', textAlign: 'center', marginBottom: '20px' }}>
        3-20 characters · letters, numbers, underscore only
      </p>

      {error && <p className="error" style={{ textAlign: 'center' }}>{error}</p>}

      <button
        className="submit-btn"
        onClick={(e) => { handleRipple(e); handleSubmit(); }}
        disabled={loading}
      >
        {loading ? 'Saving...' : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check size={16} />
            Confirm Alias
          </span>
        )}
      </button>

      <div className="truth-line" style={{ marginTop: '24px' }}>
        your identity stays hidden · always
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ripple {
          to { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}