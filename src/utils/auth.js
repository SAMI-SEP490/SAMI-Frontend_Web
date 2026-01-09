
export function getUserRole() {
  try {
    const userRaw = localStorage.getItem("sami:user");
    if (!userRaw) return null;

    const user = JSON.parse(userRaw);
    return user?.role || null;
  } catch (err) {
    console.error("Get role from localStorage failed", err);
    return null;
  }
}

