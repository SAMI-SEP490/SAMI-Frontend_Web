import { main } from "@popperjs/core";
import { http, unwrap } from "../http";

export async function listMaintenance(params = {}) {
  const { data } = await http.get("/maintenance/", { params });
  return unwrap(data);
}
