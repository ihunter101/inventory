"use client"
function FulfillmentBadge() {
  return (
    <div style={{
      background: "#16a34a",
      borderRadius: 16,
      padding: "16px 22px",
      boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
      display: "flex", flexDirection: "column", alignItems: "center",
      animation: "bobble 4s ease-in-out 0.7s infinite",
    }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 30, fontWeight: 800, color: "white", lineHeight: 1 }}>24h</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 4, textAlign: "center" }}>Avg. Fulfillment</div>
    </div>
  );
}