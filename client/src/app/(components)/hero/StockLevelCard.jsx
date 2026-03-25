"use client"

function StockCard() {
  const bars = [
    { label: "Reagents", pct: 82, color: "#16a34a" },
    { label: "Swab Kits", pct: 61, color: "#0ea5e9" },
    { label: "Collection Tubes", pct: 45, color: "#f59e0b" },
    { label: "Blood Culture Bottles", pct: 78, color: "#8b5cf6" },
  ];

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "16px 18px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
      border: "1px solid #f3f4f6",
      minWidth: 196,
      animation: "bobble 4s ease-in-out 1.4s infinite",
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10, fontWeight: 700,
        color: "#9ca3af", letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: 12,
      }}>Stock Levels</div>
      {bars.map(({ label, pct, color }) => (
        <div key={label} style={{ marginBottom: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9ca3af" }}>{pct}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 100, background: "#f3f4f6", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 100 }} />
          </div>
        </div>
      ))}
    </div>
  );
}