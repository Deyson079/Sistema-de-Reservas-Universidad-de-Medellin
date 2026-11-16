import { CircleX, CircleCheck } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  ok?: string;
  opcional?: boolean;
  icono?: React.ReactNode;
  full?: boolean;
};

export function Campo({ etiqueta, ayuda, error, ok, opcional, icono, full, id, name, ...rest }: Props) {
  const iid = id ?? name;
  return (
    <div className={`campo ${error ? "is-error" : ok ? "is-ok" : ""} ${full ? "full" : ""}`}>
      <label htmlFor={iid}>
        {etiqueta} {opcional && <span className="opc">(opcional)</span>}
      </label>
      <div className="control">
        {icono}
        <input id={iid} name={name} className="input" aria-invalid={!!error} aria-describedby={error || ayuda || ok ? `${iid}-a` : undefined} {...rest} />
      </div>
      {(error || ok || ayuda) && (
        <span className="campo-ayuda" id={`${iid}-a`}>
          {error ? <CircleX className="i" aria-hidden /> : ok ? <CircleCheck className="i" aria-hidden /> : null}
          {error || ok || ayuda}
        </span>
      )}
    </div>
  );
}

export function Seleccion({ etiqueta, error, full, id, name, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; error?: string; full?: boolean }) {
  const iid = id ?? name;
  return (
    <div className={`campo ${error ? "is-error" : ""} ${full ? "full" : ""}`}>
      <label htmlFor={iid}>{etiqueta}</label>
      <div className="control">
        <select id={iid} name={name} className="input" {...rest}>{children}</select>
      </div>
      {error && <span className="campo-ayuda"><CircleX className="i" aria-hidden />{error}</span>}
    </div>
  );
}

export function Area({ etiqueta, ayuda, error, full, id, name, opcional, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: string; ayuda?: string; error?: string; full?: boolean; opcional?: boolean }) {
  const iid = id ?? name;
  return (
    <div className={`campo ${error ? "is-error" : ""} ${full ? "full" : ""}`}>
      <label htmlFor={iid}>{etiqueta} {opcional && <span className="opc">(opcional)</span>}</label>
      <textarea id={iid} name={name} className="input" {...rest} />
      {(error || ayuda) && <span className="campo-ayuda">{error && <CircleX className="i" aria-hidden />}{error || ayuda}</span>}
    </div>
  );
}
