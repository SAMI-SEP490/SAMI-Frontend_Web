import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Card, Spinner, Alert } from "react-bootstrap";
import { addTenantToRoom, getRoomById } from "../../services/api/rooms";
import { lookupTenant } from "../../services/api/tenants";

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

  const [loading, setLoading] = useState(false); // loading khi submit
  const [error, setError] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);
  const [contractWindow, setContractWindow] = useState({
    start: null,
    end: null,
    minMoveIn: "", // yyyy-mm-dd
    maxMoveIn: "", // yyyy-mm-dd
  });
  // ===== SEARCH (DEBOUNCE) =====
  useEffect(() => {
    const term = searchTerm.trim();

    // Nếu đã chọn user rồi hoặc input rỗng -> clear dropdown
    if (!term || selectedUser) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchTouched(true);

    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setError("");

        // lookupTenant() -> backend sẽ tự loại tenant đã là secondary ở phòng khác
        const res = await lookupTenant(term);

        // normalize result: object | array | null
        const arr = Array.isArray(res) ? res : res ? [res] : [];

        setSearchResults(arr);
      } catch {
        // 404 hoặc lỗi -> coi như không có kết quả
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [searchTerm, selectedUser]);

  useEffect(() => {
    async function fetchContractWindow() {
      try {
        const room = await getRoomById(roomId);
        setRoomInfo(room);

        // lấy active contract: ưu tiên contracts_history[0], fallback current_contract
        const active =
          (Array.isArray(room?.contracts_history) &&
            room.contracts_history[0]) ||
          room?.current_contract;

        if (!active?.start_date || !active?.end_date) {
          // không chặn UI ở đây, vì backend đã chặn; chỉ để trống window
          return;
        }

        const start = new Date(active.start_date);
        const end = new Date(active.end_date);

        const pad = (n) => String(n).padStart(2, "0");
        const toYMD = (d) =>
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

        // min: SAU start_date => +1 day
        const min = new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate(),
        );

        // max: end_date - 1 month
        const max = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        setContractWindow({
          start,
          end,
          minMoveIn: toYMD(min),
          maxMoveIn: toYMD(max),
        });
      } catch {
        // ignore: BE vẫn chặn ở submit
      }
    }

    if (roomId) fetchContractWindow();
  }, [roomId]);

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

    // ✅ Validate theo hợp đồng (nếu đã load được window)
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

              {/* Loading tìm kiếm (giữ đúng cảm giác cũ) */}
              {searchLoading && !selectedUser && (
                <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
                  <Spinner size="sm" animation="border" /> Đang tìm kiếm...
                </div>
              )}

              {/* DROPDOWN RESULT */}
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
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                      }}
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

              {/* No result */}
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
