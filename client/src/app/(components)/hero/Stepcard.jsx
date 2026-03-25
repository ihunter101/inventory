"use client"

function StepCard({ step, icon, title, desc, iconBg }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white", borderRadius: 20, padding: "32px 28px",
        border: "1.5px solid #f3f4f6",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.25s ease",
      }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, marginBottom: 20,
      }}>{icon}</div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700,
        color: "#16a34a", letterSpacing: "0.1em", marginBottom: 8,
      }}>STEP {step}</div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700,
        color: "#111827", marginBottom: 10, lineHeight: 1.3,
      }}>{title}</div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}