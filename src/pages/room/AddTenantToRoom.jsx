import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { addTenantToRoom, getRoomById } from "../../services/api/rooms";
import { listTenants } from "../../services/api/users";

function AddTenantToRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTouched, setSearchTouched] = useState(false);

  const [movedInAt, setMovedInAt] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);

  const [contractWindow, setContractWindow] = useState({
    start: null,
    end: null,
    minMoveIn: "",
    maxMoveIn: "",
  });

  // ===== CACHE ALL TENANTS =====
  const [allTenants, setAllTenants] = useState([]);

  // ===== LOAD ROOM + CONTRACT WINDOW =====
  useEffect(() => {
    async function fetchContractWindow() {
      try {
        const room = await getRoomById(roomId);
        setRoomInfo(room);
        const active =
          (Array.isArray(room?.contracts_history) &&
            room.contracts_history[0]) ||
          room?.current_contract;

        if (!active?.start_date || !active?.end_date) return;

        const start = new Date(active.start_date);
        const end = new Date(active.end_date);

        const pad = (n) => String(n).padStart(2, "0");
        const toYMD = (d) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        setContractWindow({
          start,
          end,
          minMoveIn: toYMD(start),
          maxMoveIn: toYMD(end),
        });
      } catch {
        // backend đã chặn
      }
    }

    if (roomId) fetchContractWindow();
  }, [roomId]);

  // ===== LOAD ALL USERS ONCE =====
  useEffect(() => {
    async function fetchTenants() {
      try {
        const buildingId = roomInfo?.building_id;
        if (!buildingId) return;

        setSearchLoading(true);

        const res = await listTenants();
        const users = Array.isArray(res) ? res : [];
        const validTenants = users.filter(
          (u) => u.role === "TENANT" && u.building_id == buildingId,
        );
        setAllTenants(validTenants);
      } catch {
        setAllTenants([]);
      } finally {
        setSearchLoading(false);
      }
    }

    fetchTenants();
  }, [roomInfo?.building_id]);

  // ===== SEARCH TENANT (FILTER FROM CACHE) =====
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term || selectedUser) {
      setSearchResults([]);
      return;
    }

    setSearchTouched(true);

    const filtered = allTenants.filter((u) => {
      const phone = u.phone?.toLowerCase() || "";
      const email = u.email?.toLowerCase() || "";
      return phone.includes(term) || email.includes(term);
    });

    setSearchResults(filtered);
  }, [searchTerm, selectedUser, allTenants]);

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

    if (contractWindow.minMoveIn && movedInAt < contractWindow.minMoveIn) {
      setError("Ngày đến phải từ ngày bắt đầu hợp đồng trở đi");
      return;
    }

    if (contractWindow.maxMoveIn && movedInAt > contractWindow.maxMoveIn) {
      setError("Ngày đến không được sau ngày kết thúc hợp đồng");
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
      navigate(-1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "❌ Không thể thêm người thuê vào phòng",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <strong>
            ➕ Thêm người thuê vào phòng{" "}
            {roomInfo?.room_number ? roomInfo.room_number : `#${roomId}`}
          </strong>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            {/* ===== SEARCH USER ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Người thuê (SĐT hoặc Email)</Form.Label>
              <Form.Control
                type="text"
                placeholder="VD: 0123456789 hoặc email@example.com"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedUser(null);
                }}
              />

              {searchLoading && !selectedUser && (
                <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                  <Spinner size="sm" animation="border" /> Đang tải danh sách...
                </div>
              )}

              {searchResults.length > 0 && !selectedUser && (
                <div
                  style={{
                    border: "1px solid #dee2e6",
                    borderRadius: 6,
                    marginTop: 6,
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                  }}
                >
                  {searchResults.map((u) => (
                    <div
                      key={u.user_id}
                      style={{ padding: "8px 12px", cursor: "pointer" }}
                      onClick={() => {
                        setSelectedUser(u);
                        setSearchResults([]);
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
                        📞 {u.phone || "N/A"} | ✉ {u.email || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!searchLoading &&
                !selectedUser &&
                searchTouched &&
                searchTerm.trim() &&
                searchResults.length === 0 && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                    Không tìm thấy người thuê phù hợp
                  </div>
                )}
            </Form.Group>

            {/* ===== MOVED IN DATE ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Ngày đến</Form.Label>
              <Form.Control
                type="date"
                value={movedInAt}
                min={contractWindow.minMoveIn || undefined}
                max={contractWindow.maxMoveIn || undefined}
                onChange={(e) => setMovedInAt(e.target.value)}
              />
              {(contractWindow.minMoveIn || contractWindow.maxMoveIn) && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                  Ngày đến hợp lệ: từ <b>{contractWindow.minMoveIn}</b> đến{" "}
                  <b>{contractWindow.maxMoveIn}</b>
                </div>
              )}
            </Form.Group>

            {/* ===== NOTE ===== */}
            <Form.Group className="mb-3">
              <Form.Label>Ghi chú</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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
