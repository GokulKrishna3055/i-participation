import { useEffect, useRef, useState } from "react";

// Camera QR scanner; the library is loaded only in the browser.
export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const id = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const [err, setErr] = useState<string | null>(null);
  const cb = useRef(onScan); cb.current = onScan;
  useEffect(() => {
    let scanner: { stop: () => Promise<void>; isScanning?: boolean } | null = null;
    let last = 0, stopped = false;
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (stopped) return;
      const s = new Html5Qrcode(id); scanner = s;
      try {
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => {
          const now = Date.now(); if (now - last < 2500) return; last = now; cb.current(text);
        }, () => {});
      } catch { setErr("Camera unavailable. Allow camera access or enter the code instead."); }
    });
    return () => { stopped = true; if (scanner?.isScanning !== false) scanner?.stop().catch(() => {}); };
  }, [id]);
  return <div><div id={id} className="mx-auto w-full max-w-xs overflow-hidden rounded-lg" />{err && <p role="alert" className="mt-2 text-sm text-destructive">{err}</p>}</div>;
}
