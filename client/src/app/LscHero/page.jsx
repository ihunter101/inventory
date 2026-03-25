"use client";

export default function LSCHero() {
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes bobble {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          50%       { box-shadow: 0 0 0 7px rgba(22,163,74,0); }
        }
      `}</style>

      <Nav />

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(150deg, #f0fdf4 0%, #ffffff 45%, #f0f9ff 100%)",
        padding: "72px 48px 60px",
        maxWidth: 1320, margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 60, alignItems: "center",
        position: "relative", overflow: "hidden",
        minHeight: "calc(100vh - 68px)",
      }}>

        {/* Background blobs */}
        <div style={{
          position: "absolute", top: -100, right: -60, width: 480, height: 480,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: 40, left: "30%", width: 320, height: 320,
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)",
        }} />

        {/* ── LEFT COPY ── */}
        <div style={{ position: "relative", zIndex: 2 }}>

          {/* Eyebrow chips */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24,
            animation: "fadeUp 0.65s ease 0.05s both",
          }}>
            {[
              { label: "9 Branches Island-wide", dot: true },
              { label: "✔ Fully Accredited" },
              { label: "Est. 1993" },
            ].map(({ label, dot }) => (
              <span key={label} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 100,
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                fontWeight: 600, color: "#166534",
              }}>
                {dot && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#16a34a", display: "inline-block",
                    animation: "pulseDot 2s infinite",
                  }} />
                )}
                {label}
              </span>
            ))}
          </div>

          {/* Headline */}
          <div style={{ animation: "fadeUp 0.65s ease 0.18s both" }}>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(38px, 4.2vw, 60px)",
              fontWeight: 400, lineHeight: 1.1, color: "#111827",
            }}>Order diagnostic</h1>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(38px, 4.2vw, 60px)",
              fontWeight: 400, lineHeight: 1.1,
              color: "#16a34a", fontStyle: "italic",
            }}>supplies online —</h1>
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(38px, 4.2vw, 60px)",
              fontWeight: 400, lineHeight: 1.1, color: "#111827",
            }}>delivered island-wide.</h1>
          </div>

          {/* Body copy */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: "#6b7280", lineHeight: 1.75,
            marginTop: 22, marginBottom: 34, maxWidth: 460,
            animation: "fadeUp 0.65s ease 0.30s both",
          }}>
            The LSC portal lets verified medical professionals across Saint Lucia
            request culture swabs, reagents, tubes and more. We stock them, we
            distribute them — across{" "}
            <strong style={{ color: "#374151", fontWeight: 600 }}>all 9 branches</strong>,
            fulfilled within{" "}
            <strong style={{ color: "#374151", fontWeight: 600 }}>24 hours</strong>.
          </p>

          {/* CTAs */}
          <div style={{
            display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 44,
            animation: "fadeUp 0.65s ease 0.42s both",
          }}>
            <a href="#" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 26px", borderRadius: 10,
              background: "#16a34a", color: "white", border: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
              textDecoration: "none", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(22,163,74,0.38)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,0.3)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M2 4h8M2 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Browse &amp; Order Stock
            </a>
            <a href="#" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 26px", borderRadius: 10,
              background: "white", color: "#374151",
              border: "1.5px solid #e5e7eb",
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
              textDecoration: "none", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Create Free Account
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
            animation: "fadeUp 0.65s ease 0.54s both",
          }}>
            {[
              { n: 9, s: "", lbl: "Branches" },
              { n: 30, s: "+", lbl: "Years Active" },
              { n: 100, s: "%", lbl: "Accredited" },
            ].map(({ n, s, lbl }) => (
              <div key={lbl} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "16px 22px", borderRadius: 14,
                background: "white", border: "1.5px solid #e5e7eb",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)", minWidth: 88,
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 26, fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                  <Counter target={n} suffix={s} />
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9ca3af", marginTop: 4, fontWeight: 500 }}>{lbl}</span>
              </div>
            ))}
            <div style={{
              padding: "16px 20px", borderRadius: 14,
              background: "white", border: "1.5px solid #e5e7eb",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 13, fontStyle: "italic", color: "#9ca3af" }}>
                "Saving lives &amp; caring for people"
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#d1d5db", marginTop: 2 }}>— LSC, est. 1993</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT VISUAL ── */}
        <div style={{
          position: "relative", height: 560,
          animation: "fadeIn 0.9s ease 0.2s both",
        }}>
          {/* Main photo */}
          <div style={{
            position: "absolute", top: 0, left: "6%", right: 0, bottom: 50,
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.13)",
          }}>
            <img
              src="https://images.unsplash.com/photo-1579165466741-7f35e4755182?w=900&q=80"
              alt="Medical laboratory supplies"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
              background: "linear-gradient(to top, rgba(3,30,12,0.65), transparent)",
            }} />
            <div style={{ position: "absolute", bottom: 20, left: 22 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                LSC Stock Catalogue
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "white" }}>
                200+ diagnostic product lines
              </div>
            </div>
          </div>

          {/* Floating card: fulfilled order */}
          <div style={{ position: "absolute", bottom: 24, left: -10, zIndex: 10 }}>
            <OrderCard />
          </div>

          {/* Floating card: stock levels */}
          <div style={{ position: "absolute", top: 16, right: -18, zIndex: 10 }}>
            <StockCard />
          </div>

          {/* Floating badge: fulfillment speed */}
          <div style={{ position: "absolute", top: "41%", right: -22, zIndex: 10 }}>
            <FulfillmentBadge />
          </div>
        </div>
      </section>

      {/* ── ECG BAR ── */}
      <div style={{ background: "white", borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
        <ECGStrip />
        <div style={{
          textAlign: "center", paddingBottom: 10,
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          color: "#d1d5db", letterSpacing: "0.08em",
        }}>
          Laboratory Services &amp; Consultations Ltd · Saving lives &amp; caring for people · Est. 1993
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#f9fafb", padding: "80px 48px", borderTop: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, color: "#111827", marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#6b7280", maxWidth: 440, margin: "0 auto" }}>
              From request to your branch door — fully online.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 44 }}>
            {[
              { step: "01", icon: "👤", title: "Sign up as a Medical Professional", desc: "Create your verified account in minutes. Get instant access to the full LSC diagnostic supply catalogue.", iconBg: "#eff6ff" },
              { step: "02", icon: "📋", title: "Browse & Request Your Stock", desc: "Search culture swabs, reagents, tubes and more. Add to your request and submit — we already carry the stock.", iconBg: "#f0fdf4" },
              { step: "03", icon: "🚚", title: "We Fulfill to Your Branch", desc: "Your order is routed to the nearest of our 9 branches and ready within 24 hours. Track every step online.", iconBg: "#fefce8" },
            ].map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <a href="#" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 10,
              background: "#16a34a", color: "white", border: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
              textDecoration: "none", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Get Started — It's Free
            </a>
          </div>
        </div>
      </section>
    </>
  );
}