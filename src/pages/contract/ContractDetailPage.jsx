import React, { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ContractContext } from "../../contexts/ContractContext";
import { UserContext } from "../../contexts/UserContext";
import { Table, Button, Card } from "react-bootstrap";
import Headers from "../../components/Header";
import Sidebar from "../../components/SideBar";
import { colors } from "../../constants/colors";

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contractData, appendices } = useContext(ContractContext);
  const { userData } = useContext(UserContext);

  // Tìm hợp đồng theo id
  const contract = contractData.find((item) => String(item.id) === String(id));

  // Lọc phụ lục theo hợp đồng
  const relatedAppendices = appendices.filter(
    (a) => String(a.contractId) === String(id)
  );

  // Lấy tên người thuê
  const tenant = userData.find((u) => u.id === contract?.tenantId);

  if (!contract) {
    return (
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Headers />
        <div style={{ display: "flex", flex: 1 }}>
          <Sidebar />
          <div style={{ flex: 1, padding: "40px" }}>
            <h4>Không tìm thấy hợp đồng</h4>
            <Button
              variant="secondary"
              onClick={() => navigate("/contracts")}
              style={{ marginTop: "10px" }}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Headers />
      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "220px",
            backgroundColor: colors.brand,
            color: "white",
            height: "100%",
            borderRadius: "10px",
          }}
        >
          <Sidebar />
        </div>

        {/* Nội dung chính */}
        <div
          style={{
            flex: 1,
            padding: "30px",
            backgroundColor: colors.background,
            overflowY: "auto",
          }}
        >
          <h4 style={{ fontWeight: "600", marginBottom: "20px" }}>
            Chi Tiết Hợp Đồng
          </h4>

          {/* Thông tin hợp đồng */}
          <Card
            style={{
              marginBottom: "25px",
              border: "none",
              boxShadow: "0 0 5px rgba(0,0,0,0.1)",
            }}
          >
            <Card.Header
              style={{
                backgroundColor: colors.brand,
                color: "white",
                fontWeight: "500",
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
                  <strong>Tiền thuê tháng:</strong> {contract.monthlyRent} vnd
                </div>
              </div>

              <div className="row mb-2">
                <div className="col-md-6">
                  <strong>Tên người thuê:</strong>{" "}
                  <span
                    style={{ color: colors.brand, cursor: "pointer" }}
                    onClick={() => navigate(`/tenants/${tenant?.id}`)}
                  >
                    {tenant?.full_name || "N/A"}
                  </span>
                </div>
                <div className="col-md-6">
                  <strong>Tiền cọc:</strong> {contract.deposit} vnd
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

          {/* Phụ lục hợp đồng */}
          <Card
            style={{
              marginBottom: "25px",
              border: "none",
              boxShadow: "0 0 5px rgba(0,0,0,0.1)",
            }}
          >
            <Card.Header
              style={{
                backgroundColor: colors.brand,
                color: "white",
                fontWeight: "500",
              }}
            >
              Phụ lục hợp đồng
            </Card.Header>
            <Card.Body>
              {relatedAppendices.length > 0 ? (
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
                    {relatedAppendices.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.type}</td>
                        <td>{item.content}</td>
                        <td>
                          {new Date(item.effectiveDate).toLocaleDateString(
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
                  style={{
                    backgroundColor: colors.brand,
                    border: "none",
                  }}
                  onClick={() => navigate(`/contracts/${id}/addendum`)}
                >
                  Thêm phụ lục
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Nút điều hướng */}
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
      </div>
    </div>
  );
}
