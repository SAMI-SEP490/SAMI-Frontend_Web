// src/pages/contract/ContractDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Button, Card } from "react-bootstrap";
import { colors } from "../../constants/colors";

import { getContract } from "../../services/api/contracts";
import { listUsers } from "../../services/api/users";

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [appendices, setAppendices] = useState([]);

  const [loading, setLoading] = useState(true);

  /** ===== FETCH DATA ===== */
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // 1. Lấy hợp đồng
        const c = await getContract(id);
        if (!c) {
          setLoading(false);
          return;
        }

        // Chuẩn hóa object (mapping API -> FE)
        const mapped = {
          id: c.contract_id,
          room: c.room_number,
          roomId: c.room_id,
          tenantUserId: c.tenant_user_id,
          tenantName: c.tenant_name,
          tenantEmail: c.tenant_email,
          startDate: c.start_date,
          endDate: c.end_date,
          rentAmount: c.rent_amount,
          depositAmount: c.deposit_amount,
          status: c.status,
          hasFile: c.has_file,
          note: c.note,
        };

        setContract(mapped);

        // 2. Lấy thông tin tenant
        const userList = await listUsers();
        const foundTenant = userList?.items?.find(
          (u) => Number(u.id) === Number(mapped.tenantUserId)
        );
        setTenant(foundTenant || null);

        // 3. Lấy phụ lục
        
        const filtered = c?.appendices?.items.filter(
          (a) => Number(a.contract_id) === Number(id)
        );
        setAppendices(filtered);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h4>Đang tải...</h4>
      </div>
    );
  }

  if (!contract) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: "40px",
          backgroundColor: colors.background,
        }}
      >
        <h4>Không tìm thấy hợp đồng</h4>
        <Button
          variant="secondary"
          onClick={() => navigate("/contracts")}
          style={{ marginTop: "10px", width: "120px" }}
        >
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        backgroundColor: colors.background,
        overflowY: "auto",
      }}
    >
      <h4 style={{ fontWeight: 600, marginBottom: 20 }}>Chi Tiết Hợp Đồng</h4>

      {/* ===== Thông tin hợp đồng ===== */}
      <Card
        style={{
          marginBottom: 25,
          border: "none",
          boxShadow: "0 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: colors.brand,
            color: "white",
            fontWeight: 500,
          }}
        >
          Thông tin hợp đồng
        </Card.Header>
        <Card.Body>
          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Hợp đồng số:</strong> {contract.id}
            </div>
            <div className="col-md-6">
              <strong>Tiền thuê tháng:</strong> {contract.rentAmount} vnd
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Tên người thuê:</strong>{" "}
              <span
                style={{ color: colors.brand, cursor: "pointer" }}
                onClick={() => navigate(`/tenants/${contract.tenantUserId}`)}
              >
                {contract.tenantName}
              </span>
            </div>

            <div className="col-md-6">
              <strong>Tiền cọc:</strong> {contract.depositAmount ?? "0"} vnd
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Số phòng:</strong> {contract.room}
            </div>
            <div className="col-md-6">
              <strong>Trạng thái:</strong> {contract.status}
            </div>
          </div>

          <div className="row mb-2">
            <div className="col-md-6">
              <strong>Ngày bắt đầu:</strong>{" "}
              {new Date(contract.startDate).toLocaleDateString("vi-VN")}
            </div>
            <div className="col-md-6">
              <strong>Ngày kết thúc:</strong>{" "}
              {new Date(contract.endDate).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ===== Phụ lục hợp đồng ===== */}
      <Card
        style={{
          marginBottom: 25,
          border: "none",
          boxShadow: "0 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <Card.Header
          style={{
            backgroundColor: colors.brand,
            color: "white",
            fontWeight: 500,
          }}
        >
          Phụ lục hợp đồng
        </Card.Header>
        <Card.Body>
          {appendices.length > 0 ? (
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Phụ lục số</th>
                  <th>Phân loại</th>
                  <th>Nội dung</th>
                  <th>Ngày hiệu lực</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {appendices.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.type}</td>
                    <td>{item.content}</td>
                    <td>
                      {new Date(item.effective_date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p>Không có phụ lục nào cho hợp đồng này.</p>
          )}

          <div className="d-flex justify-content-end">
            <Button
              style={{ backgroundColor: colors.brand, border: "none" }}
              onClick={() => navigate(`/contracts/${id}/addendum`)}
            >
              Thêm phụ lục
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ===== Buttons ===== */}
      <div className="d-flex justify-content-between mt-4">
        <Button
          variant="secondary"
          onClick={() => navigate("/contracts")}
          style={{ width: "120px" }}
        >
          Quay lại
        </Button>

        <div className="d-flex gap-3">
          <Button
            style={{
              backgroundColor: colors.brand,
              border: "none",
              width: "120px",
            }}
          >
            Xuất file
          </Button>
          <Button variant="danger" style={{ width: "120px" }}>
            Xóa
          </Button>
        </div>
      </div>
    </div>
  );
}
