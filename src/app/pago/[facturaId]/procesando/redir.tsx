"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function Redirigir({ a, ms = 2600 }: { a: string; ms?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setTimeout(() => r.replace(a), ms); return () => clearTimeout(t); }, [a, ms, r]);
  return null;
}
