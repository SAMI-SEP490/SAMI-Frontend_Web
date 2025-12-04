// src/pages/tenant/TenantListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllTenants,
  deleteTenantByUserId,
} from "../../services/api/tenants";
import { listRoomsLite } from "../../services/api/rooms";

// Helper: lấy giá trị đầu tiên != null/""
const pick = (...vals) => {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return undefined;
};

// Chuẩn hoá item tenant về 1 shape thống nhất
function normalize(item) {
  const user = pick(item?.user, item);
  const id = pick(
    user?.user_id,
    user?.id,
    item?.tenant?.user_id,
    item?.userId,
    item?._id
  );
  const name = pick(
    user?.full_name,
    user?.name,
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim(),
    "Người thuê"
  );
  const email = pick(user?.email, "");
  const phone = pick(user?.phone, user?.phone_number, "");
  const avatar = pick(user?.avatar_url, "");

  const room_id = pick(
    item?.room_id,
    item?.roomId,
    item?.room?.room_id,
    item?.room?.id,
    item?.tenant?.room_id,
    item?.tenant?.room?.room_id,
    Array.isArray(item?.tenants) ? item?.tenants?.[0]?.room_id : undefined,
    Array.isArray(item?.tenants) ? item?.tenants?.[0]?.room?.room_id : undefined
  );

  const room = pick(
    item?.room?.room_number,
    item?.room_number,
    item?.room,
    item?.tenant?.room?.room_number,
    Array.isArray(item?.tenants)
      ? item?.tenants?.[0]?.room?.room_number
      : undefined,
    room_id != null ? `Phòng ${room_id}` : ""
  );

  return {
    id,
    name,
    email,
    phone,
    avatar,
    room_id: room_id != null ? String(room_id) : undefined,
    room: room != null ? String(room) : "",
  };
}

export default function TenantListPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState("all");
  const [q, setQ] = useState("");
  const [searchKey, setSearchKey] = useState("");

  // Lấy danh sách tenants từ /tenant/all
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await getAllTenants();
        if (!mounted) return;
        const raw = Array.isArray(data) ? data : data?.items ?? [];
        setItems(raw.map(normalize));
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được danh sách người thuê."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Lấy danh sách phòng cho dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      const apiRooms = await listRoomsLite();
      if (mounted && apiRooms.length > 0) {
        setRooms(
          apiRooms.map((r) => ({ id: String(r.id), label: String(r.label) }))
        );
        return;
      }

      // fallback: suy ra từ dữ liệu tenants
      const fromTenants = Array.from(
        new Map(
          items
            .filter((t) => t.room_id != null)
            .map((t) => [
              t.room_id,
              {
                id: t.room_id,
                label:
                  t.room && !t.room.startsWith("Phòng ") ? t.room : t.room_id,
              },
            ])
        ).values()
      );
      if (mounted) setRooms(fromTenants);
    })();
    return () => {
      mounted = false;
    };
  }, [items]);

  const roomOptions = useMemo(
    () => [{ id: "all", label: "Tất cả" }, ...rooms],
    [rooms]
  );

  const rows = useMemo(() => {
    const k = searchKey.trim().toLowerCase();
    return items.filter((x) => {
      const okRoom =
        roomFilter === "all" ||
        x.room_id === String(roomFilter) ||
        x.room === String(roomFilter);
      if (!okRoom) return false;
      if (!k) return true;
      return (
        x.name.toLowerCase().includes(k) ||
        x.email.toLowerCase().includes(k) ||
        x.phone.toLowerCase().includes(k) ||
        String(x.room || "")
          .toLowerCase()
          .includes(k)
      );
    });
  }, [items, roomFilter, searchKey]);

  return (
    <div className="tenants-page">
      <style>{`
        .tenants-page{display:flex;min-height:100vh;background:#F8FAFC;color:#0f172a}
        .tenants-content{flex:1;display:flex;flex-direction:column;min-width:0;padding:20px 24px 36px}
        .tenants-title{font-size:28px;line-height:1.2;font-weight:700;margin:12px 0 16px;text-align:left}
        .card{background:#fff;border:1px solid #E5E7EB;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.04);padding:16px}
        .toolbar{display:grid;grid-template-columns:260px 1fr 100px;gap:12px;align-items:center;margin-bottom:8px}
        @media (max-width:920px){.toolbar{grid-template-columns:1fr}}
        .label{font-size:13px;color:#475569;display:block;margin-bottom:6px}
        select,input[type="text"]{height:38px;border:1px solid #CBD5E1;border-radius:8px;padding:0 10px;outline:0;font-size:14px;width:100%;box-sizing:border-box}
        select:focus,input[type="text"]:focus{border-color:#0EA5E9;box-shadow:0 0 0 3px rgba(14,165,233,.15)}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 16px;border-radius:8px;border:0;font-weight:600;cursor:pointer;transition:background .15s,opacity .15s}
        .btn-primary{background:#0EA5E9;color:#fff}.btn-primary:hover{background:#0284C7}
        .table-wrap{overflow-x:auto}table{min-width:100%;border-collapse:collapse;font-size:14px;background:#fff}
        thead tr{background:#F1F5F9}th,td{padding:12px 16px;text-align:left;white-space:nowrap}
        tbody tr{border-top:1px solid #E5E7EB}tbody tr:hover{background:#F8FAFC}
        .avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB}
        .actions{display:flex;gap:10px}
        .link{background:transparent;border:0;color:#0EA5E9;cursor:pointer;font-weight:600}
        .link.gray{color:#475569}
        .link.red{color:#E11D48}
        .footerActions{display:flex;justify-content:flex-end;padding:12px 0 4px}
      `}</style>

      <div className="tenants-content">
        <h1 className="tenants-title">Danh Sách Người Thuê</h1>

        <div className="card">
          <div className="toolbar">
            <div>
              <label className="label">Số phòng</label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              >
                {roomOptions.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Nhập tên / email / SĐT / số phòng..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearchKey(q)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                className="btn btn-primary"
                onClick={() => setSearchKey(q)}
              >
                Tìm
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th style={{ width: 130 }}>Ảnh đại diện</th>
                  <th>Tên</th>
                  <th style={{ width: 140 }}>Số phòng</th>
                  <th>Email</th>
                  <th style={{ width: 180 }}>Số điện thoại</th>
                  <th style={{ width: 220 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ color: "#64748B" }}>
                      Đang tải...
                    </td>
                  </tr>
                ) : err ? (
                  <tr>
                    <td colSpan={7} style={{ color: "#E11D48" }}>
                      {err}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ color: "#64748B" }}>
                      Không có người thuê nào.
                    </td>
                  </tr>
                ) : (
                  rows.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id || "—"}</td>
                      <td>
                        <img
                          className="avatar"
                          src={u.avatar || "https://placehold.co/72x72?text="}
                          alt=""
                        />
                      </td>
                      <td>{u.name}</td>
                      <td>{u.room || "—"}</td>
                      <td>{u.email || "—"}</td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="link"
                            onClick={() => nav(`/tenants/${u.id}`)}
                            disabled={!u.id}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            className="link gray"
                            onClick={() => nav(`/tenants/${u.id}/edit`)}
                            disabled={!u.id}
                          >
                            Sửa
                          </button>
                          <button
                            className="link red"
                            onClick={() => alert("Xóa sẽ nối API sau")}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="footerActions">
            <button
              className="btn btn-primary"
              onClick={() => nav("/tenants/create")}
            >
              + Thêm người thuê
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
