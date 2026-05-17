'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [Html5Qrcode, setHtml5Qrcode] = useState<any>(null);

  useEffect(() => {
    import('html5-qrcode').then((mod) => {
      setHtml5Qrcode(() => mod.Html5Qrcode);
    });
  }, []);

  const startScan = async () => {
    if (!Html5Qrcode) return;
    setError('');
    setSuccess('');
    setScanning(true);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          // Stop scanning
          await scanner.stop();
          setScanning(false);

          // Process scan
          try {
            const res = await fetch('/api/cards/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ card_code: decodedText }),
            });

            const data = await res.json();

            if (!res.ok) {
              setError(data.error || 'Scan failed');
              return;
            }

            setSuccess(`"${data.card.product_name}" added to your vault! +${data.card.points_value} points`);
            router.refresh();
          } catch {
            setError('Failed to process scan');
          }
        },
        () => {
          // Scan failure - ignore
        }
      );
    } catch (err: any) {
      setScanning(false);
      setError(err.message || 'Camera access denied or not available');
    }
  };

  const stopScan = () => {
    setScanning(false);
    // Reload to reset scanner state
    window.location.reload();
  };

  return (
    <div className="xm-container py-6 space-y-6">
      <h1 className="text-xl font-bold">Scan Card</h1>
      <p className="text-sm text-gray-500">Point camera at XM metal card QR code</p>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 text-green-400 text-sm">
          <p className="font-semibold mb-1">Card Scanned!</p>
          <p>{success}</p>
          <button
            onClick={() => router.push('/vault')}
            className="text-xm-gold text-xs mt-2"
          >
            View in Vault →
          </button>
        </div>
      )}

      <div className="relative">
        <div
          id="qr-reader"
          className="rounded-2xl overflow-hidden"
          style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
        />

        {!scanning && !success && (
          <div className="text-center py-8">
            <div className="w-48 h-48 mx-auto rounded-2xl bg-xm-card border-2 border-dashed border-gray-700 flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-xs text-gray-500">QR scanner will appear here</p>
              </div>
            </div>
            <button onClick={startScan} className="xm-btn-primary text-sm">
              Start Scanner
            </button>
          </div>
        )}

        {scanning && (
          <button onClick={stopScan} className="xm-btn-secondary w-full mt-4 text-sm">
            Stop Scanner
          </button>
        )}
      </div>

      {/* Manual entry for testing */}
      <div className="xm-card">
        <p className="text-xs text-gray-500 mb-2">Test Card Codes (tap to simulate scan)</p>
        <div className="space-y-2">
          {['XM-CARD-0001', 'XM-CARD-0002', 'XM-CARD-0003'].map((code) => (
            <button
              key={code}
              onClick={async () => {
                try {
                  const res = await fetch('/api/cards/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ card_code: code }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setSuccess(`"${data.card.product_name}" added! +${data.card.points_value} pts`);
                    router.refresh();
                  } else {
                    setError(data.error);
                  }
                } catch {
                  setError('Scan failed');
                }
              }}
              className="xm-btn-secondary w-full text-xs py-2"
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
