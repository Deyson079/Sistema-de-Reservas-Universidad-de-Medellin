"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";
export function Compartir({ titulo, texto, className = "btn btn-contorno" }: { titulo: string; texto: string; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => {
      const data = { title: titulo, text: texto, url: location.href };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(`${texto} ${location.href}`); setOk(true); setTimeout(() => setOk(false), 2000); } } catch { /* cancelado */ }
    }}>{ok ? <Check className="i" /> : <Share2 className="i" />}{ok ? "Enlace copiado" : "Compartir"}</button>
  );
}
