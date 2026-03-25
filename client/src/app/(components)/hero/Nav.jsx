"use client"
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(12px)",
      borderBottom: scrolled ? "1px solid #e5e7eb" : "1px solid #f3f4f6",
      padding: "0 48px", height: 68,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "border-color 0.3s",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/LSC_LOGO.png" alt="LSC" style={{ width: 38, height: 38, objectFit: "contain" }} />
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>LSC Inventory</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Supply Portal</div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {["Catalogue", "My Orders", "Branches", "Support"].map((label) => (
          <a key={label} href="#" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: "#4b5563", textDecoration: "none", fontWeight: 500,
            transition: "color 0.2s",
          }}
            onMouseEnter={e => e.target.style.color = "#16a34a"}
            onMouseLeave={e => e.target.style.color = "#4b5563"}
          >{label}</a>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <a href="#" style={{
          display: "inline-flex", alignItems: "center",
          padding: "9px 18px", borderRadius: 10,
          background: "white", color: "#374151",
          border: "1.5px solid #e5e7eb",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
          textDecoration: "none", transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
        >Log In</a>
        <a href="#" style={{
          display: "inline-flex", alignItems: "center",
          padding: "9px 18px", borderRadius: 10,
          background: "#16a34a", color: "white",
          border: "none",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
          textDecoration: "none", transition: "all 0.2s",
          boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; }}
        >Request Stock</a>
      </div>
    </nav>
  );
}