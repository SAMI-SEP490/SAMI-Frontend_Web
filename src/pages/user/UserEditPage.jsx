import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById } from "../../services/api/users";
import {
  getBuildings,
  updateManagerAssignment,
} from "../../services/api/building";
import { colors } from "../../constants/colors";

/* ===== Helpers ===== */
const formatDateVN = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const toISO = (vn) => {
  if (!vn) return null;
  const [dd, mm, yyyy] = vn.split("/");
  return `${yyyy}-${mm}-${dd}`;
};

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [buildings, setBuildings] = useState([]);

  const [form, setForm] = useState({
    building_id: "",
    note: "",
  });

  /* ===== Load data ===== */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [user, bds] = await Promise.all([
          getUserById(id),
          getBuildings(),
        ]);

        if (!mounted) return;

        if (user.role !== "MANAGER") {
          setError("Trang này chỉ dùng cho quản lý.");
          return;
        }

        setBuildings(bds || []);

        setForm({
          building_id: user.building_id || "",
          assigned_from: formatDateVN(user.assigned_from),
          assigned_to: formatDateVN(user.assigned_to),
          note: user.note || "",
        });
      } catch {
        setError("Không tải được dữ liệu.");
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id]);

  /* ===== Submit ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateManagerAssignment(form.building_id, id, {
        assigned_from: toISO(form.assigned_from),
        assigned_to: toISO(form.assigned_to),
        note: form.note,
      });

      alert("Cập nhật quản lý thành công");
      navigate(`/users/${id}`);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Cập nhật thông tin quản lý thất bại"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 24, color: "#e11d48" }}>{error}</div>;

  return (
    <div className="page">
      <style>{`
        .page{
          min-height:calc(100vh - 80px);
          display:flex;
          justify-content:center;
          align-items:center;
          background:#f8fafc;
        }
        .card{
          width:420px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:20px;
        }
        h1{text-align:center;margin-bottom:16px}
        .field{margin-bottom:12px}
        .label{font-size:13px;color:#475569;margin-bottom:4px}
        input,select,textarea{
          width:100%;
          border:1px solid #cbd5e1;
          border-radius:8px;
          padding:8px 10px;
        }
        textarea{resize:vertical}
        .actions{
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:16px;
        }
        .btn{
          height:38px;
          padding:0 16px;
          border-radius:8px;
          border:none;
          font-weight:600;
          cursor:pointer;
        }
        .primary{background:${colors.brand};color:#fff}
        .secondary{background:#e5e7eb}
      `}</style>

      <form className="card" onSubmit={handleSubmit}>
        <h1>Sửa quản lý tòa nhà</h1>

        <div className="field">
          <div className="label">Tòa nhà</div>
          <select
            value={form.building_id}
            onChange={(e) =>
              setForm({ ...form, building_id: e.target.value })
            }
            required
          >
            <option value="">-- Chọn tòa nhà --</option>
            {buildings.map((b) => (
              <option key={b.building_id} value={b.building_id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <div className="label">Ghi chú</div>
          <textarea
            rows={3}
            value={form.note}
            onChange={(e) =>
              setForm({ ...form, note: e.target.value })
            }
          />
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(-1)}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn primary"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}
