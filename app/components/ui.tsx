import { useState } from "react";
import { Link } from "react-router";
import type { LinkProps } from "react-router";

export const ACCENT = "#9146FF";
const ACCENT_DARK = "#7c32e6";
const ACCENT_BORDER = "#6a29cc";

// ─── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  children,
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const base: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: props.disabled ? "not-allowed" : "pointer",
    transition: "background 0.15s ease, opacity 0.15s ease",
    outline: pressed ? "2px solid #374151" : "none",
    outlineOffset: 2,
    opacity: props.disabled ? 0.45 : 1,
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: hovered && !props.disabled ? ACCENT_DARK : ACCENT,
      color: "#fff",
      border: `1px solid ${ACCENT_BORDER}`,
    },
    secondary: {
      background: hovered && !props.disabled
        ? `color-mix(in srgb, ${ACCENT} 18%, #faf5f0)`
        : `color-mix(in srgb, ${ACCENT} 8%, #faf5f0)`,
      color: ACCENT_DARK,
      border: `1px solid ${ACCENT}`,
    },
    ghost: {
      background: hovered && !props.disabled ? "rgba(0,0,0,0.06)" : "transparent",
      color: "#555",
      border: "1px solid transparent",
    },
  };

  return (
    <button
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ─── ButtonLink ───────────────────────────────────────────────────────────────

interface ButtonLinkProps extends Omit<LinkProps, "style"> {
  children: React.ReactNode;
}

export function ButtonLink({ children, ...props }: ButtonLinkProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <Link
      {...props}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "inline-block",
        background: hovered ? ACCENT_DARK : ACCENT,
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        padding: "14px 32px",
        borderRadius: 8,
        textDecoration: "none",
        border: `1px solid ${ACCENT_BORDER}`,
        transition: "background 0.15s ease",
        outline: pressed ? "2px solid #374151" : "none",
        outlineOffset: 2,
      }}
    >
      {children}
    </Link>
  );
}

// ─── PageShell ────────────────────────────────────────────────────────────────

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        color: "#1a1a1a",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 768,
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── PageTitle ────────────────────────────────────────────────────────────────

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: -0.5,
        marginBottom: 24,
        color: "#1a1a1a",
      }}
    >
      {children}
    </h1>
  );
}

// ─── Field (label + textarea) ─────────────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  rows?: number;
}

export function Field({
  label,
  id,
  value,
  defaultValue,
  placeholder,
  readOnly,
  disabled,
  textareaRef,
  rows = 10,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: ACCENT_DARK,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        rows={rows}
        style={{
          padding: "10px 12px",
          border: `1.5px solid ${disabled ? "#ddd" : ACCENT}`,
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "monospace",
          background: disabled ? "#f5f5f5" : "#fff",
          color: disabled ? "#999" : "#1a1a1a",
          resize: "vertical",
          outline: "none",
        }}
      />
    </div>
  );
}

// ─── VideoGrid ────────────────────────────────────────────────────────────────

export function VideoGrid({ username }: { username?: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <div style={{ position: "relative" }}>
        <video
          id="local-video"
          autoPlay
          playsInline
          style={{
            width: "100%",
            display: "block",
            borderRadius: 8,
            border: `2px solid #ddd`,
            background: "#111",
            aspectRatio: "16/9",
            objectFit: "cover",
          }}
        />
        {username && (
          <span
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {username}
          </span>
        )}
      </div>
      <video
        id="remote-video"
        autoPlay
        playsInline
        style={{
          width: "100%",
          display: "block",
          borderRadius: 8,
          border: "2px solid #ddd",
          background: "#111",
          aspectRatio: "16/9",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function Toast() {
  return (
    <output
      id="toast"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#fff",
        border: `1.5px solid ${ACCENT}`,
        borderRadius: 8,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 500,
        color: ACCENT_DARK,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        display: "none",
      }}
    />
  );
}

// ─── EventBadge ───────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  offer: { bg: "#f0e8ff", text: ACCENT_DARK, border: ACCENT },
  answer: { bg: "#e8f4ff", text: "#1d4ed8", border: "#3b82f6" },
  candidate: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },
};

export function eventColors(type: string) {
  return EVENT_COLORS[type] ?? { bg: "#f5f5f5", text: "#555", border: "#ccc" };
}
