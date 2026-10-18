import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

/**
 * A brief loading veil shown while the experience spins up and audio
 * initialises. It fades out once the store reports assets ready + started.
 */
export default function LoadingScreen() {
  const phase = useStore((s) => s.phase);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') {
      setVisible(false);
      return;
    }
    setVisible(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8 + Math.random() * 16);
        if (next >= 100) clearInterval(iv);
        return next;
      });
    }, 90);
    return () => clearInterval(iv);
  }, [phase]);

  if (!visible) return null;

  return (
    <div className="loading">
      <div className="loading__inner">
        <div className="loading__om">ॐ</div>
        <div className="loading__title">श्री राम विजय — रावण वध</div>
        <div className="loading__bar">
          <div className="loading__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading__pct">{Math.round(progress)}%</div>
        <div className="loading__hint">Lighting the diyas…</div>
      </div>
    </div>
  );
}
