export default function Footer() {
  return (
    <footer
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "32px 24px 40px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div style={{ color: "var(--faint)", fontSize: "0.82rem", lineHeight: 1.8 }}>
        <a
          href="https://adediran.xyz"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--muted)",
            fontWeight: 700,
            fontSize: "0.85rem",
            textDecoration: "none",
          }}
        >
          Muhammed Adediran
        </a>
        <br />
        Quantitative AI Engineer · Strategy Backtesting &amp; Risk Analytics
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a
          href="https://adediran.xyz/projects"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--muted)",
            fontWeight: 600,
            fontSize: "0.85rem",
            border: "1px solid var(--border2)",
            borderRadius: 8,
            padding: "9px 18px",
            textDecoration: "none",
          }}
        >
          All projects
        </a>
        <a
          href="https://adediran.xyz/contact"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--accent)",
            fontWeight: 600,
            fontSize: "0.85rem",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: 8,
            padding: "9px 20px",
            textDecoration: "none",
          }}
        >
          Get in touch
        </a>
      </div>
    </footer>
  );
}
