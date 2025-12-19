import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, updateUser } from "../../services/api/users";
import { colors } from "../../constants/colors";

/* ===== Helpers ===== */
const formatDateVN = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toISODate = (vn) => {
  if (!vn) return undefined;
  const [dd, mm, yyyy] = vn.split("/");
  if (!dd || !mm || !yyyy) return undefined;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
  });

  /* ===== Load user ===== */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getUserById(id);
        if (!mounted) return;

        setForm({
          full_name: data?.full_name || "",
          email: data?.email || "",
          phone: data?.phone || "",
          birthday: formatDateVN(data?.birthday),
          gender: data?.gender || "",
        });
      } catch (e) {
        setErr("Không tải được thông tin người dùng.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* ===== Submit ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      await updateUser(id, {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        birthday: toISODate(form.birthday),
        gender: form.gender,
      });

      alert("Cập nhật thành công");
      navigate(`/users/${id}`);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "Cập nhật người dùng thất bại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>Đang tải...</div>;
  }

  return (
    <div className="user-edit-page">
      <style>{`
        .user-edit-page{
          min-height:calc(100vh - 80px);
          background:#f8fafc;
          display:flex;
          align-items:center;
          justify-content:center;
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
        input,select{
          width:100%;
          height:38px;
          border:1px solid #CBD5E1;
          border-radius:8px;
          padding:0 10px;
        }
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
        .btn-primary{background:${colors.brand};color:#fff}
        .btn-secondary{background:#e5e7eb}
        .error{color:#e11d48;font-size:13px;margin-bottom:8px}
      `}</style>

      <form className="card" onSubmit={handleSubmit}>
        <h1>Sửa người dùng</h1>

        {err && <div className="error">{err}</div>}

        <div className="field">
          <div className="label">Họ tên</div>
          <input
            value={form.full_name}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
            required
          />
        </div>

        <div className="field">
          <div className="label">Số điện thoại</div>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="field">
          <div className="label">Ngày sinh (dd/mm/yyyy)</div>
          <input
            placeholder="dd/mm/yyyy"
            value={form.birthday}
            onChange={(e) =>
              setForm({ ...form, birthday: e.target.value })
            }
          />
        </div>

        <div className="field">
          <div className="label">Giới tính</div>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">—</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </select>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </div>
  );
}
