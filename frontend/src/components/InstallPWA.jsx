import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function InstallPWA() {
  const t = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: t.dark ? '#1a1a2e' : '#fff',
      border: `1.5px solid ${t.accent}`,
      borderRadius: '16px', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      zIndex: 9998, minWidth: '280px', maxWidth: '340px',
      animation: 'slideUp 0.4s ease',
    }}>
      <span style={{ fontSize: '24px' }}>🌙</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: '800', color: t.text, margin: '0 0 2px 0' }}>Install Midnight Monk</p>
        <p style={{ fontSize: '11px', color: t.subText, margin: 0 }}>Add to home screen for quick access</p>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleInstall} style={{
          backgroundColor: t.accent, color: '#fff', border: 'none',
          borderRadius: '8px', padding: '7px 12px', fontSize: '12px',
          fontWeight: '700', cursor: 'pointer',
        }}>Install</button>
        <button onClick={() => setShowBanner(false)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: t.mutedText, fontSize: '16px', padding: '4px',
        }}>✕</button>
      </div>
    </div>
  );
}
