import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Container, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
// BỎ ContractContext/UserContext mock -> GỌI API THẬT:
import { listTenants } from "../../services/api/users";
import { createContract } from "../../services/api/contracts";
import { colors } from "../../constants/colors";

function CreateContractPage() {
  const navigate = useNavigate();

  // GIỮ NGUYÊN state UI bạn đang có
  const [newContract, setNewContract] = useState({
    roomNumber: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    deposit: "",
    monthlyRent: "",
    status: "Đang xử lý",
  });

  // NEW: nạp tenants từ API để thay cho UserContext
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingTenants(true);
        const data = await listTenants();
        // Chuẩn hoá dữ liệu tenants về {id, full_name, avatar_url}
        const arr = (data?.data || data?.users || data || []).map((u) => ({
          id: u?.id ?? u?.user_id ?? u?._id,
          full_name: u?.full_name ?? u?.name ?? u?.email ?? "Người thuê",
          avatar_url: u?.avatar_url ?? u?.avatar ?? null,
        }));
        setTenants(arr);
      } catch {
        setTenants([]);
      } finally {
        setLoadingTenants(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewContract({ ...newContract, [name]: value });
  };

  // LƯU NHÁP: backend thường không có "draft", nên mình giữ hành vi cũ
  // bằng cách lưu cục bộ để bạn không mất dữ liệu.
  const handleSaveDraft = () => {
    const key = "sami:contract:draft";
    const draft = { ...newContract, _savedAt: Date.now() };
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      alert("Đã lưu bản nháp (cục bộ)!");
    } catch {
      alert("Không thể lưu bản nháp trên trình duyệt.");
    }
    navigate("/contracts");
  };

  // TẠO HỢP ĐỒNG THẬT: gọi API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map dữ liệu UI -> payload backend (bạn chỉnh key nếu BE khác)
    const payload = {
      // Thường BE sẽ nhận room_id hoặc room_number — bạn có roomNumber (101/102…)
      room_number: newContract.roomNumber,
      tenant_user_id: newContract.tenantId,
      start_date: newContract.startDate, // "YYYY-MM-DD"
      end_date: newContract.endDate,
      deposit_amount:
        newContract.deposit?.replace?.(/[^\d]/g, "") || newContract.deposit, // "4.000.000 vnd" -> "4000000"
      rent_amount:
        newContract.monthlyRent?.replace?.(/[^\d]/g, "") ||
        newContract.monthlyRent,
      status: newContract.status, // "Đang xử lý" / "Đang hiệu lực" / "Đã kết thúc"
      note: "", // nếu form bạn bổ sung ghi chú sau này
      // file: <File> // nếu UI sau này thêm input file
    };

    try {
      await createContract(payload);
      alert("Tạo hợp đồng thành công!");
      navigate("/contracts");
    } catch (e2) {
      alert(e2?.response?.data?.message || "Tạo hợp đồng thất bại!");
    }
  };

  // Lấy avatar người thuê theo lựa chọn hiện tại (giữ nguyên UI)
  const selectedTenant = tenants.find(
    (tenant) => String(tenant.id) === String(newContract.tenantId)
  );

  return (
    <Container
      style={{
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "20px",
        maxWidth: "500px",
        marginTop: "40px",
      }}
    >
      <h5
        style={{
          backgroundColor: colors.brand,
          color: "#fff",
          display: "inline-block",
          padding: "5px 10px",
          borderRadius: "5px 5px 0 0",
        }}
      >
        Tạo hợp đồng
      </h5>

      {/* GIỮ NGUYÊN UI FORM */}
      <Form onSubmit={handleSubmit}>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Số phòng
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="roomNumber"
              value={newContract.roomNumber}
              onChange={handleChange}
              required
            >
              <option value="">Chọn phòng</option>
              <option value="101">101</option>
              <option value="102">102</option>
              <option value="103">103</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Người thuê
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="tenantId"
              value={newContract.tenantId}
              onChange={handleChange}
              required
              disabled={loadingTenants}
            >
              <option value="">
                {loadingTenants ? "Đang tải..." : "Chọn người thuê"}
              </option>
              {tenants.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Form.Group>

        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <Image
            src={
              selectedTenant?.avatar_url ||
              "https://cdn-icons-png.flaticon.com/512/194/194938.png"
            }
            width="80"
            height="80"
            roundedCircle
          />
        </div>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Ngày bắt đầu
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="date"
              name="startDate"
              value={newContract.startDate}
              onChange={handleChange}
              required
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Ngày kết thúc
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="date"
              name="endDate"
              value={newContract.endDate}
              onChange={handleChange}
              required
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Tiền cọc
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="text"
              name="deposit"
              value={newContract.deposit}
              onChange={handleChange}
              placeholder="4.000.000 vnd"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Tiền thuê tháng
          </Form.Label>
          <Col sm="8">
            <Form.Control
              type="text"
              name="monthlyRent"
              value={newContract.monthlyRent}
              onChange={handleChange}
              placeholder="10.000.000 vnd"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="4">
            Trạng thái
          </Form.Label>
          <Col sm="8">
            <Form.Select
              name="status"
              value={newContract.status}
              onChange={handleChange}
              required
            >
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Đang hiệu lực">Đang hiệu lực</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "20px",
          }}
        >
          <Button variant="secondary" onClick={() => navigate("/contracts")}>
            Quay lại
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: colors.brand }}
            onClick={handleSaveDraft}
            type="button"
          >
            Lưu làm bản nháp
          </Button>
          <Button type="submit" variant="primary">
            Tạo
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default CreateContractPage;
