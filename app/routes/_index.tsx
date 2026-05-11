import { ButtonLink } from "~/components/ui";
import { useState } from "react";
import { Link } from "react-router";

const ACCENT = "#9146FF";

export default function Index() {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        color: "#1a1a1a",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "96px 24px 56px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            margin: "0 0 20px",
            letterSpacing: -1.5,
          }}
        >
          Peerference
        </h1>
        <p
          style={{
            fontSize: 20,
            color: "#555",
            maxWidth: 480,
            margin: "0 auto 48px",
            lineHeight: 1.6,
          }}
        >
          Explore WebRTC peer-to-peer connections — from a
          single browser tab all the way to server-assisted
          real-time signaling.
        </p>
        <ButtonLink to="/peer-player">Try Peer Player</ButtonLink>
      </section>

      {/* How it works */}
      <section
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px 64px",
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 40,
            textAlign: "center",
          }}
        >
          How it works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 32,
          }}
        >
          {[
            {
              step: "1",
              title: "Open a room",
              desc: "Start a session and get a shareable link. No accounts, no sign-up.",
            },
            {
              step: "2",
              title: "Share the link",
              desc: "Send the link to your peer. They open it and the signaling begins automatically.",
            },
            {
              step: "3",
              title: "Connect directly",
              desc: "Once signaling completes, your browsers establish a direct WebRTC data channel.",
            },
            {
              step: "4",
              title: "Exchange messages",
              desc: "Send messages peer-to-peer in real time — no relay server in between.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: ACCENT,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 18,
                  marginBottom: 14,
                }}
              >
                {step}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Other modes */}
      <section
        style={{
          background: "#fff",
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Other modes
          </h2>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 32, lineHeight: 1.6 }}>
            Want to understand how WebRTC signaling works under the
            hood? These modes let you explore each step manually.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            <ModeCard
              to="/single-player"
              title="Single Player"
              desc="Both peers live in the same browser tab. Perfect for understanding the ICE/SDP handshake without any network complexity."
            />
            <ModeCard
              to="/multi-player"
              title="Multi Player"
              desc="Peers exchange signaling events manually via copy-paste. Great for seeing exactly what gets transmitted between browsers."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #eee",
          textAlign: "center",
          padding: "28px 24px",
          fontSize: 13,
          color: "#999",
        }}
      >
        Built to learn WebRTC
      </footer>
    </div>
  );
}

function ModeCard({
  to,
  title,
  desc,
}: {
  to: string;
  title: string;
  desc: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        padding: "20px 24px",
        borderRadius: 8,
        border: "1px solid #eee",
        background: hovered
          ? `color-mix(in srgb, ${ACCENT} 6%, #fff)`
          : "#faf5f0",
        boxShadow: hovered
          ? "0 4px 16px rgba(0,0,0,0.10)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        textDecoration: "none",
        color: "inherit",
        transition: "background 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>
        {desc}
      </p>
    </Link>
  );
}
