"use client";
import { Printer } from "lucide-react";
export function Imprimir() {
  return <button className="btn btn-primario" onClick={() => window.print()}><Printer className="i" />Imprimir o guardar como PDF</button>;
}
