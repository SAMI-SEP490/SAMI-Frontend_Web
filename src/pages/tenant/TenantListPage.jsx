import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Table, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { colors } from "../../constants/colors";
import Header from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  getDownloadUrl,
  downloadContractDirect,
  deleteContract,
} from "../../services/api/contracts";

function ContractListPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const normalize = (it) => ({
    id: it?.id ?? it?.contract_id ?? it?._id ?? "",
    tenantId: it?.tenant_user_id ?? it?.tenant?.id ?? it?.user_id,
    tenantName:
      it?.tenant?.full_name ??
      it?.tenant_full_name ??
      it?.tenant_name ??
      it?.user?.full_name ??
      "N/A",
    room:
      it?.room?.number ??
      it?.room_number ??
      it?.room?.name ??
      it?.room ??
      "N/A",
    startDate: it?.start_date ?? it?.startDate ?? "",
    endDate: it?.end_date ?? it?.endDate ?? "",
    status: it?.status ?? it?.contract_status ?? "Đang xử lý",
  });

  const prettyServerError = (e) => {
    const raw =
      e?.response?.data?.message ||
      e?.message ||
      "Không tải được danh sách hợp đồng.";
    if (/Prisma|does not exist|P2022|column/i.test(raw)) {
      return "Máy chủ đang lỗi dữ liệu hợp đồng (Prisma). Vui lòng thử lại sau hoặc kiểm tra lại migration trên backend.";
    }
    if (/404|not\sfound/i.test(raw)) {
      return "API danh sách hợp đồng chưa có/đổi đường dẫn. Đã thử nhiều endpoint nhưng đều không tìm thấy.";
    }
    return raw;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await listContracts({
        keyword: searchTerm || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const items = (data?.data || data?.contracts || data || []).map(
        normalize
      );
      setRows(items);
    } catch (e) {
      setRows([]);
      setErr(prettyServerError(e));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nameById = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      if (r.tenantId) m[r.tenantId] = r.tenantName;
    });
    return m;
  }, [rows]);

  const getTenantName = (id) => nameById[id] || "N/A";

  const filtered = useMemo(
    () =>
      rows.filter((c) => {
        const sOk =
          !statusFilter ||
          (c.status || "").toLowerCase().includes(statusFilter.toLowerCase());
        const qOk =
          !searchTerm ||
          String(c.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
          (getTenantName(c.tenantId) || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const fromOk =
          !startDate || new Date(c.startDate || "") >= new Date(startDate);
        const toOk = !endDate || new Date(c.endDate || "") <= new Date(endDate);
        return sOk && qOk && fromOk && toOk;
      }),
    [rows, statusFilter, searchTerm, startDate, endDate]
  );

  const handleSearch = () => fetchData();
  const onView = (id) => navigate(`/contracts/${id}`);

  const onDelete = async (id) => {
    if (!window.confirm("Xoá hợp đồng này?")) return;
    try {
      await deleteContract(id);
      await fetchData();
    } catch (e) {
      alert(
        "Không xoá được hợp đồng: " + (e?.response?.data?.message || e.message)
      );
    }
  };

  const onDownload = async (id, filename = `contract-${id}.pdf`) => {
    try {
      const r = await getDownloadUrl(id);
      const url = r?.download_url || r?.url;
      if (url) window.open(url, "_blank");
      else await downloadContractDirect(id, filename);
    } catch {
      await downloadContractDirect(id, filename);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          marginBottom: 10,
          borderRadius: 10,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Header />
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 220,
            backgroundColor: colors.brand,
            color: "#fff",
            height: "100%",
            borderRadius: 10,
          }}
        >
          <Sidebar />
        </div>

        <div
          style={{
            flex: 1,
            padding: 30,
            backgroundColor: colors.background,
            overflowY: "auto",
          }}
        >
          <h4 style={{ fontWeight: 600, marginBottom: 20 }}>
            Danh Sách Hợp Đồng
          </h4>

          {err && (
            <Alert variant="danger" className="mb-3">
              {err}
            </Alert>
          )}

          <Row className="align-items-end mb-3">
            <Col md={3}>
              <Form.Label>Trạng thái:</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Hết hạn">Hết hạn</option>
                <option value="Đã hủy">Đã hủy</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>Ngày:</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Label>Tìm kiếm:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên hoặc mã hợp đồng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Button
                variant="primary"
                style={{
                  width: "100%",
                  backgroundColor: colors.brand,
                  border: "none",
                  marginTop: 5,
                }}
                onClick={handleSearch}
                disabled={loading}
              >
                Tìm
              </Button>
            </Col>
          </Row>

          <Table bordered hover responsive>
            <thead style={{ backgroundColor: "#E6E8ED" }}>
              <tr>
                <th>ID Hợp Đồng</th>
                <th>Tên Người Thuê</th>
                <th>Số phòng</th>
                <th>Ngày Bắt Đầu</th>
                <th>Ngày Kết Thúc</th>
                <th>Trạng Thái</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    Đang tải…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    {err
                      ? "Không thể tải dữ liệu."
                      : "Không có hợp đồng nào phù hợp."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{getTenantName(c.tenantId)}</td>
                    <td>{c.room}</td>
                    <td>
                      {c.startDate
                        ? new Date(c.startDate).toLocaleDateString("vi-VN")
                        : ""}
                    </td>
                    <td>
                      {c.endDate
                        ? new Date(c.endDate).toLocaleDateString("vi-VN")
                        : ""}
                    </td>
                    <td>{c.status}</td>
                    <td className="d-flex gap-3">
                      <span
                        style={{
                          color: colors.brand,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                        onClick={() => onView(c.id)}
                      >
                        Xem chi tiết
                      </span>
                      <span
                        style={{ color: "#0d6efd", cursor: "pointer" }}
                        onClick={() => onDownload(c.id)}
                      >
                        Tải
                      </span>
                      <span
                        style={{ color: "#dc3545", cursor: "pointer" }}
                        onClick={() => onDelete(c.id)}
                      >
                        Xoá
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <Form.Group controlId="formFile">
                <Form.Label style={{ fontWeight: 500 }}>Chọn file:</Form.Label>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control type="file" style={{ width: 250 }} disabled />
                  <Button
                    variant="primary"
                    style={{ backgroundColor: colors.brand, border: "none" }}
                    disabled
                  >
                    Tải lên
                  </Button>
                </div>
              </Form.Group>
            </div>

            <Button
              variant="primary"
              style={{
                backgroundColor: colors.brand,
                border: "none",
                padding: "10px 20px",
              }}
              onClick={() => navigate("/contracts/create")}
            >
              Tạo hợp đồng mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractListPage;
