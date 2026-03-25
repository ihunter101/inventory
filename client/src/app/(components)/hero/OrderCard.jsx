"use client"

export default function OrderCard() {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "14px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
      border: "1px solid #f0fdf4",
      minWidth: 240,
      animation: "bobble 4s ease-in-out 0s infinite",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "#dcfce7",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🧫</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>
            Culture Swab Kit ×50
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9ca3af" }}>
            Requested by Dr. Samuel
          </div>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 100,
          fontSize: 10, fontWeight: 700,
          background: "#dcfce7", color: "#166534",
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: "nowrap", flexShrink: 0,
        }}>✓ Fulfilled</span>
      </div>
      <div style={{ height: 1, background: "#f3f4f6", marginBottom: 10 }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9ca3af" }}>Castries Branch</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#16a34a" }}>Today, 9:14 am</span>
      </div>
    </div>
  );
}
