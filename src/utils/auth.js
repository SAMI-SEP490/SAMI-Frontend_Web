import { jwtDecode } from "jwt-decode";

export function getUserRole() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded?.role || null;
  } catch (err) {
    console.error("Decode token failed", err);
    return null;
  }
}
