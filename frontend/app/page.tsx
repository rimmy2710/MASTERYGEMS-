import Link from "next/link";

export default function HomePage() {
  const cardStyles: React.CSSProperties = {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  return (
    <section style={cardStyles}>
      <h1 style={{ marginTop: 0 }}>Mastery Gems</h1>
      <p style={{ lineHeight: 1.5 }}>
        This is a lightweight developer UI for testing the Mastery Gems backend.
      </p>
      <Link
        href="/lobby"
        style={{ display: "inline-block", marginTop: "1rem", color: "#2563eb" }}
      >
        Go to Lobby
      </Link>
    </section>
  );
}
