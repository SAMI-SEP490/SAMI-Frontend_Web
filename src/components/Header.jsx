import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{ padding: "12px 20px", background: "#1e4ea8", color: "#fff" }}
    >
      <strong>SAMI</strong>
      <nav style={{ display: "inline-flex", gap: 16, marginLeft: 24 }}>
        <Link to="/" style={{ color: "#fff" }}>
          Trang chủ
        </Link>
        <Link to="/profile" style={{ color: "#fff" }}>
          Hồ sơ
        </Link>
      </nav>
    </header>
  );
}
