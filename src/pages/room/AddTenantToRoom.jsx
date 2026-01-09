import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { listUsers } from "../../services/api/users";
import { addTenantToRoom } from "../../services/api/rooms";

function AddTenantToRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [movedInAt, setMovedInAt] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== LOAD USERS =====
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await listUsers();
        const data = Array.isArray(res) ? res : res?.data ?? [];
        setUsers(data);
      } catch (err) {
        setError("Không thể tải danh sách người dùng");
      }
    }
    fetchUsers();
  }, []);

  // ===== FILTER USERS BY PHONE / EMAIL =====
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

    return users.filter(
      (u) =>
        u.phone?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    );
  }, [searchTerm, users]);

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Vui lòng chọn người thuê");
      return;
    }

    if (!movedInAt) {
      setError("Vui lòng chọn ngày đến");
      return;
    }

    try {
      setLoading(true);

      await addTenantToRoom(roomId, {
        user_id: selectedUser.user_id,
        moved_in_at: movedInAt,
        note: note || undefined,
      });

      alert("✅ Thêm người thuê thành công");
      navigate(-1); // quay lại trang trước
    } catch (err) {
      setError(
        err?.response?.data?.message || "❌ Không thể thêm người thuê vào phòng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <strong>➕ Thêm người thuê vào phòng #{roomId}</strong>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            {/* ===== USER SEARCH ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Người thuê (nhập SĐT hoặc Email)</Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: 0123456789 hoặc email@example.com"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedUser(null);
                }}
              />

              {/* DROPDOWN RESULT */}
              {filteredUsers.length > 0 && !selectedUser && (
                <div
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: 6,
                    marginTop: 4,
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                  }}
                >
                  {filteredUsers.map((u) => (
                    <div
                      key={u.user_id}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchTerm(`${u.full_name} (${u.phone || u.email})`);
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#f1f5f9")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                    >
                      <strong>{u.full_name}</strong>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        📞 {u.phone || "N/A"} | ✉ {u.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>

            {/* ===== MOVED IN DATE ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Ngày đến</Form.Label>
              <Form.Control
                type="date"
                value={movedInAt}
                onChange={(e) => setMovedInAt(e.target.value)}
              />
            </Form.Group>

            {/* ===== NOTE ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Ghi chú (không bắt buộc)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="VD: Người ở ghép, bạn bè..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Form.Group>

            {/* ===== ACTIONS ===== */}
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Hủy
              </Button>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" /> Đang lưu...
                  </>
                ) : (
                  "➕ Thêm người thuê"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default AddTenantToRoom;
