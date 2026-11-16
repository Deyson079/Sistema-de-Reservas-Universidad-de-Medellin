"use client";
// Componentes interactivos reutilizables
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Eye, EyeOff, Circle, CircleCheck, Upload, FileText, X, Check, Copy, CircleX, Info } from "lucide-react";

/* Botón de envío con estado de carga */
export function BotonEnviar({ children, className = "btn btn-primario", pendiente, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendiente?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`${className} ${pending ? "is-loading" : ""}`} aria-busy={pending} disabled={pending || rest.disabled} {...rest}>
      {pending && pendiente ? pendiente : children}
    </button>
  );
}

/* Contraseña con mostrar/ocultar y fortaleza */
export function CampoPassword({ name = "password", etiqueta = "Contraseña", fortaleza = false, error, autoComplete = "current-password", id }: { name?: string; etiqueta?: string; fortaleza?: boolean; error?: string; autoComplete?: string; id?: string }) {
  const [ver, setVer] = useState(false);
  const [v, setV] = useState("");
  const r = { len: v.length >= 8, may: /[A-ZÁÉÍÓÚÑ]/.test(v), num: /\d/.test(v), sim: /[^\wáéíóúñÁÉÍÓÚÑ\s]/.test(v) };
  const n = Object.values(r).filter(Boolean).length;
  const textos = ["Escribe una contraseña.", "Contraseña débil.", "Contraseña regular.", "Contraseña buena. Agrega un símbolo para hacerla fuerte.", "Contraseña fuerte."];
  const iid = id ?? name;
  return (
    <div className={`campo ${error ? "is-error" : ""}`}>
      <label htmlFor={iid}>{etiqueta}</label>
      <div className="control">
        <input id={iid} name={name} className="input" type={ver ? "text" : "password"} autoComplete={autoComplete} required value={v} onChange={(e) => setV(e.target.value)} aria-invalid={!!error} aria-describedby={`${iid}-a`} style={{ paddingRight: 48 }} />
        <button type="button" className="ojo" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {ver ? <EyeOff className="i" /> : <Eye className="i" />}
        </button>
      </div>
      {fortaleza && (
        <>
          <div className="fuerza" data-n={v ? n : 0} aria-hidden><i /><i /><i /><i /></div>
          <span className="campo-ayuda" id={`${iid}-a`} aria-live="polite">{error ? <><CircleX className="i" />{error}</> : textos[v ? n : 0]}</span>
          <ul className="reglas">
            {([["len", "8 caracteres o más"], ["may", "Una mayúscula"], ["num", "Un número"], ["sim", "Un símbolo (recomendado)"]] as const).map(([k, t]) => (
              <li key={k} className={r[k] ? "ok" : ""}>{r[k] ? <CircleCheck className="i" /> : <Circle className="i" />}{t}</li>
            ))}
          </ul>
        </>
      )}
      {!fortaleza && error && <span className="campo-ayuda" id={`${iid}-a`}><CircleX className="i" />{error}</span>}
    </div>
  );
}

/* Código de 6 casillas: autoavance, pegar, borrar hacia atrás. Envía el formulario al completarse. */
export function CodigoSeis({ name = "codigo", estado, autoEnviar = true }: { name?: string; estado?: "error" | "ok"; autoEnviar?: boolean }) {
  const [d, setD] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [shake, setShake] = useState(0);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => { if (estado === "error") { setShake((s) => s + 1); setD(Array(6).fill("")); refs.current[0]?.focus(); } }, [estado]);
  const poner = (nuevo: string[]) => {
    setD(nuevo);
    if (autoEnviar && nuevo.every(Boolean)) setTimeout(() => refs.current[0]?.form?.requestSubmit(), 60);
  };
  return (
    <div>
      <input type="hidden" name={name} value={d.join("")} />
      <div key={shake} className={`otp-grande ${estado === "error" ? "is-error" : estado === "ok" ? "is-ok" : ""}`} role="group" aria-label="Código de verificación de 6 dígitos">
        {d.map((v, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i === 3 && <span className="guion" aria-hidden />}
            <input
              ref={(el) => { refs.current[i] = el; }}
              inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1} aria-label={`Dígito ${i + 1}`}
              className={v ? "lleno" : ""} value={v}
              onChange={(e) => { const c = e.target.value.replace(/\D/g, "").slice(-1); const n = [...d]; n[i] = c; poner(n); if (c && i < 5) refs.current[i + 1]?.focus(); }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !d[i] && i > 0) { const n = [...d]; n[i - 1] = ""; setD(n); refs.current[i - 1]?.focus(); }
                if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
                if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
              }}
              onPaste={(e) => { e.preventDefault(); const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split(""); const n = Array(6).fill("").map((_, j) => p[j] ?? ""); poner(n); refs.current[Math.min(p.length, 5)]?.focus(); }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

/* Temporizador mm:ss hasta una fecha */
export function Temporizador({ hasta, texto = "El código vence en", vencido = "El código venció." }: { hasta: string; texto?: string; vencido?: string }) {
  const [s, setS] = useState(() => Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 1000)));
  useEffect(() => { const t = setInterval(() => setS(Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 1000))), 1000); return () => clearInterval(t); }, [hasta]);
  if (s <= 0) return <span className="reloj vence"><b>00:00</b>{vencido}</span>;
  return <span className={`reloj ${s < 60 ? "vence" : ""}`}>{texto} <b>{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</b></span>;
}

/* Cuenta regresiva en bloques (días, horas, min, seg) */
export function CuentaRegresiva({ hasta, compacta = false }: { hasta: string; compacta?: boolean }) {
  const calc = () => Math.max(0, Math.floor((new Date(hasta).getTime() - Date.now()) / 1000));
  const [s, setS] = useState<number | null>(null);
  useEffect(() => { setS(calc()); const t = setInterval(() => setS(calc()), 1000); return () => clearInterval(t); }, [hasta]); // eslint-disable-line
  const v = s ?? 0;
  const p = { d: Math.floor(v / 86400), h: Math.floor((v % 86400) / 3600), m: Math.floor((v % 3600) / 60), s: v % 60 };
  if (compacta) return <b suppressHydrationWarning>{`${String(p.d * 24 + p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}:${String(p.s).padStart(2, "0")}`}</b>;
  return (
    <div className="cuenta" aria-live="off" suppressHydrationWarning>
      <div><b>{p.d}</b><span>días</span></div><div><b>{String(p.h).padStart(2, "0")}</b><span>horas</span></div><div><b>{String(p.m).padStart(2, "0")}</b><span>min</span></div><div><b>{String(p.s).padStart(2, "0")}</b><span>seg</span></div>
    </div>
  );
}

/* Botón con espera (reenviar código) */
export function BotonEspera({ segundos, children, name, value, formAction }: { segundos: number; children: React.ReactNode; name?: string; value?: string; formAction?: (f: FormData) => void }) {
  const [s, setS] = useState(segundos);
  useEffect(() => { setS(segundos); }, [segundos]);
  useEffect(() => { if (s <= 0) return; const t = setTimeout(() => setS(s - 1), 1000); return () => clearTimeout(t); }, [s]);
  return (
    <button type="submit" className="btn btn-fantasma" disabled={s > 0} name={name} value={value} formAction={formAction} formNoValidate>
      {s > 0 ? `${children} en ${s} s` : children}
    </button>
  );
}

/* Zona de carga de archivo con arrastrar y soltar y vista previa */
export function ZonaArchivo({ name, aceptar = "application/pdf,image/jpeg,image/png", texto = "Arrastra el archivo aquí o elige uno", ayuda = "PDF, JPG o PNG de máximo 5 MB.", requerido = false }: { name: string; aceptar?: string; texto?: string; ayuda?: string; requerido?: boolean }) {
  const [f, setF] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [sobre, setSobre] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const elegir = (file: File | null) => { setF(file); setUrl(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null); };
  return (
    <div>
      <input ref={ref} type="file" name={name} accept={aceptar} required={requerido} className="sr" tabIndex={-1} onChange={(e) => elegir(e.target.files?.[0] ?? null)} />
      {!f && (
        <div className={`dropzone ${sobre ? "is-over" : ""}`} role="button" tabIndex={0} onClick={() => ref.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)}
          onDrop={(e) => { e.preventDefault(); setSobre(false); const file = e.dataTransfer.files?.[0]; if (file && ref.current) { const dt = new DataTransfer(); dt.items.add(file); ref.current.files = dt.files; elegir(file); } }}>
          <Upload className="i" aria-hidden /><b>{texto}</b><span className="nota">{ayuda}</span>
        </div>
      )}
      {f && (
        <>
          {url && <div className="vista-previa mt-1"><img src={url} alt="Vista previa del archivo" /></div>}
          <div className="archivo">
            <span className="ico"><FileText className="i" /></span>
            <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 14, wordBreak: "break-all" }}>{f.name}</b><div className="nota">{(f.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB · listo para enviar</div><div className="barra"><i /></div></div>
            <button type="button" className="cerrar" aria-label="Quitar archivo" onClick={() => { elegir(null); if (ref.current) ref.current.value = ""; }}><X className="i" /></button>
          </div>
        </>
      )}
    </div>
  );
}

/* Toast que aparece con ?ok= o ?error= en la URL */
export function ToastUrl() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const ok = sp.get("ok"), err = sp.get("err");
  const [vis, setVis] = useState<{ t: string; tipo: "ok" | "err" } | null>(null);
  useEffect(() => {
    if (!ok && !err) return;
    setVis({ t: (ok || err)!, tipo: ok ? "ok" : "err" });
    const q = new URLSearchParams(sp.toString()); q.delete("ok"); q.delete("err");
    router.replace(path + (q.toString() ? `?${q}` : ""), { scroll: false });
    const t = setTimeout(() => setVis(null), 5000);
    return () => clearTimeout(t);
  }, [ok, err]); // eslint-disable-line
  if (!vis) return null;
  return (
    <div className="toast-zona" role="status" aria-live="polite">
      <div className="toast entra">
        <span className="ic" style={{ background: vis.tipo === "ok" ? "var(--exito)" : "var(--error)" }}>{vis.tipo === "ok" ? <Check className="i i-sm" /> : <X className="i i-sm" />}</span>
        <div><b>{vis.t}</b></div>
        <button className="x" aria-label="Cerrar" onClick={() => setVis(null)}><X className="i i-sm" /></button>
        <span className="prog" />
      </div>
    </div>
  );
}

/* Copiar al portapapeles */
export function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="copiar" aria-label={`Copiar ${texto}`} onClick={() => { navigator.clipboard?.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); }}>
      {ok ? <Check className="i i-sm" style={{ color: "var(--exito)" }} /> : <Copy className="i i-sm" />}
    </button>
  );
}

/* Modal de confirmación con <dialog>; el contenido es un formulario */
export function Confirmar({ boton, botonClase = "btn btn-peligro", titulo, descripcion, children, icono, tono = "error" }: { boton: React.ReactNode; botonClase?: string; titulo: string; descripcion?: string; children: React.ReactNode; icono?: React.ReactNode; tono?: "error" | "info" | "exito" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const fondo = tono === "error" ? "var(--error-bg)" : tono === "exito" ? "var(--exito-bg)" : "var(--info-bg)";
  const color = tono === "error" ? "var(--error)" : tono === "exito" ? "var(--exito)" : "var(--info)";
  return (
    <>
      <button type="button" className={botonClase} onClick={() => ref.current?.showModal()}>{boton}</button>
      <dialog ref={ref} className="modal-d" aria-labelledby={titulo} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <div className="cab"><span className="ic" style={{ background: fondo, color }}>{icono ?? <Info className="i" />}</span><div><h2>{titulo}</h2>{descripcion && <p>{descripcion}</p>}</div></div>
        {children}
      </dialog>
    </>
  );
}
export function CerrarDialogo({ children = "Volver" }: { children?: React.ReactNode }) {
  return <button type="button" className="btn btn-fantasma" onClick={(e) => (e.currentTarget.closest("dialog") as HTMLDialogElement)?.close()}>{children}</button>;
}

/* Banner de cookies */
export function BannerCookies() {
  const [vis, setVis] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem("udem_cookies")) setVis(true); } catch { /* sin almacenamiento */ } }, []);
  if (!vis) return null;
  const elegir = (v: string) => { try { localStorage.setItem("udem_cookies", v); } catch {} setVis(false); };
  return (
    <div className="cookies" role="dialog" aria-label="Uso de cookies">
      <b>Usamos cookies</b>
      <p>Solo las necesarias para mantener tu sesión y recordar tus preferencias. Más detalles en la <a href="/terminos#datos" className="enlace-simple">política de tratamiento de datos</a>.</p>
      <div className="fila"><button className="btn btn-contorno btn-sm" onClick={() => elegir("necesarias")}>Solo necesarias</button><button className="btn btn-primario btn-sm" onClick={() => elegir("todas")}>Aceptar</button></div>
    </div>
  );
}

/* Clase "is-stuck" para barras fijas */
export function Fijable({ children, className, desde = 120 }: { children: React.ReactNode; className: string; desde?: number }) {
  const [p, setP] = useState(false);
  useEffect(() => { const f = () => setP(window.scrollY > desde); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, [desde]);
  return <div className={`${className} ${p ? "is-stuck" : ""}`}>{children}</div>;
}
