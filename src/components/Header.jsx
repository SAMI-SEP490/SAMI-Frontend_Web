import { Link } from "react-router-dom";
import { colors } from "../constants/colors";
export default function Header() {
  return (
    <header
      style={{ padding: "12px 20px", background: colors.brand , color: "#fff" }}
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
