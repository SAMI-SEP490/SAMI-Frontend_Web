// src/pages/contract/ContractListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner, OverlayTrigger, Tooltip, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  deleteContract,
  downloadContractDirect,
  fetchContractFileBlob
} from "../../services/api/contracts";
import { listBuildings } from "@/services/api/building.js";
import { getAccessToken } from "../../services/http";
import {
  PlusLg, Download, Eye, Trash,
  ArrowClockwise, FileEarmarkPdf, Building, Person, Calendar3
} from "react-bootstrap-icons";
import "./ContractListPage.css";

function ContractListPage() {
  const navigate = useNavigate();

  // --- ROLE ---
  const [userRole, setUserRole] = useState("");

  // --- DATA ---
  const [allContracts, setAllContracts] = useState([]);
  const [listBuildingsData, setListBuildingsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIds, setLoadingIds] = useState([]);

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FILTERS ---
  const [filters, setFilters] = useState({
    status: "",
    start_date: "",
    end_date: "",
    building: "",
    q: ""
  });

  // --- MODALS ---
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // --- FILE PREVIEW ---
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [filePreviewType, setFilePreviewType] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // --- INIT ---
  useEffect(() => {
    try {
      const token = getAccessToken();
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const role = decoded.role || decoded.userRole || "";
        setUserRole(role.toUpperCase());
      }
    } catch (error) {
      console.error("JWT Error:", error);
    }
    fetchContracts();
    fetchBuildings();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await listContracts();
      setAllContracts(Array.isArray(res) ? res : (res.items || []));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBuildings = async () => {
    try {
      const res = await listBuildings();
      setListBuildingsData(Array.isArray(res) ? res : (res.items || []));
    } catch (err) { console.error(err); }
  };

  // --- MEMOS ---
  const uniqueBuildings = useMemo(() => {
    if (listBuildingsData?.length > 0) {
      return listBuildingsData.map(b => ({ id: b.id ?? b.building_id, name: b.name }));
    }
    const buildings = [...new Set(allContracts.map(c => c.building_name).filter(Boolean))];
    return buildings.map(n => ({ id: n, name: n }));
  }, [listBuildingsData, allContracts]);

  const filteredContracts = useMemo(() => {
    let result = [...allContracts];
    if (filters.q) {
      const lowerQ = filters.q.toLowerCase();
      result = result.filter(c =>
          (c.tenant_name?.toLowerCase().includes(lowerQ)) ||
          (c.room_number?.toLowerCase().includes(lowerQ))
      );
    }
    if (filters.status) result = result.filter(c => c.status === filters.status);
    if (filters.building) {
      result = result.filter(c =>
          (String(c.building_id) === String(filters.building)) ||
          (c.building_name === filters.building)
      );
    }
    if (filters.start_date) result = result.filter(c => c.start_date && new Date(c.start_date) >= new Date(filters.start_date));
    if (filters.end_date) result = result.filter(c => c.end_date && new Date(c.end_date) <= new Date(filters.end_date));
    return result;
  }, [allContracts, filters]);

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContracts, currentPage]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const handleDownload = async (c) => {
    if (!c.has_file) return;
    setLoadingIds(prev => [...prev, c.contract_id]);
    try {
      await downloadContractDirect(c.contract_id, c.file_name || `contract-${c.contract_id}.pdf`);
    } catch (e) { alert("Lỗi tải file."); }
    finally { setLoadingIds(prev => prev.filter(id => id !== c.contract_id)); }
  };

  const handlePreviewFile = async (c) => {
    if (!c.has_file) return;
    setPreviewLoading(true);
    try {
      const blob = await fetchContractFileBlob(c.contract_id);
      setFilePreviewUrl(URL.createObjectURL(blob));
      setFilePreviewType(blob.type);
      setShowFilePreviewModal(true);
    } catch (e) { alert("Lỗi xem file."); }
    finally { setPreviewLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContract(deleteId);
      setAllContracts(prev => prev.filter(c => c.contract_id !== deleteId));
      setShowDeleteModal(false);
    } catch (e) { alert("Lỗi xóa: " + e.message); }
  };

  // --- RENDER HELPERS ---
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  const renderStatus = (status) => {
    const map = {
      active: { label: "Hiệu lực", css: "status-active" },
      pending: { label: "Chờ duyệt", css: "status-pending" },
      expired: { label: "Hết hạn", css: "status-expired" },
      terminated: { label: "Đã hủy", css: "status-terminated" },
    };
    const item = map[status] || { label: status, css: "status-expired" };
    return (
        <span className={`status-badge ${item.css}`}>
        <span className="status-dot"></span> {item.label}
      </span>
    );
  };

  // Helper for Tooltip
  const WithTooltip = ({ text, children }) => (
      <OverlayTrigger placement="top" overlay={<Tooltip>{text}</Tooltip>}>
        {children}
      </OverlayTrigger>
  );

  return (
      <div className="contract-page-container">
        {/* HEADER */}
        <div className="page-header">
          <div className="page-title">
            <h2>Quản lý Hợp đồng</h2>
            <p>Danh sách tất cả hợp đồng thuê phòng hiện tại và lịch sử.</p>
          </div>
          <Button
              variant="primary"
              className="shadow-sm d-flex align-items-center gap-2"
              onClick={() => navigate("/contracts/create")}
          >
            <PlusLg /> Tạo hợp đồng mới
          </Button>
        </div>

        {/* FILTER CARD */}
        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-group search-input-wrapper">
              <label>Tìm kiếm</label>
              <input
                  type="text"
                  name="q"
                  className="form-control form-control-sm"
                  placeholder="Tên khách, số phòng..."
                  value={filters.q}
                  onChange={handleFilterChange}
              />
            </div>

            {userRole === "OWNER" && (
                <div className="filter-group">
                  <label>Tòa nhà</label>
                  <select name="building" className="form-select form-select-sm" value={filters.building} onChange={handleFilterChange}>
                    <option value="">-- Tất cả --</option>
                    {uniqueBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
            )}

            <div className="filter-group">
              <label>Trạng thái</label>
              <select name="status" className="form-select form-select-sm" value={filters.status} onChange={handleFilterChange}>
                <option value="">-- Tất cả --</option>
                <option value="active">Đang hiệu lực</option>
                <option value="pending">Chờ duyệt</option>
                <option value="expired">Hết hạn</option>
                <option value="terminated">Đã hủy</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Bắt đầu từ</label>
              <input type="date" name="start_date" className="form-control form-control-sm" value={filters.start_date} onChange={handleFilterChange} />
            </div>

            <div className="filter-group">
              <label>Đến ngày</label>
              <input type="date" name="end_date" className="form-control form-control-sm" value={filters.end_date} onChange={handleFilterChange} />
            </div>

            {(filters.q || filters.status || filters.building || filters.start_date) && (
                <Button variant="light" size="sm" className="btn-reset-filter mb-1" onClick={() => setFilters({status:"", start_date:"", end_date:"", q:"", building:""})}>
                  <ArrowClockwise /> Xóa lọc
                </Button>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <Table hover responsive className="custom-table">
            <thead>
            <tr>
              <th className="text-center" style={{width: '50px'}}>#</th>
              {userRole === "OWNER" && <th>Tòa nhà</th>}
              <th>Khách thuê & Phòng</th>
              <th>Thời hạn</th>
              <th>Giá trị HĐ</th>
              <th>Trạng thái</th>
              <th className="text-end">Hành động</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr><td colSpan={10} className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
            ) : currentTableData.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-5 text-muted fst-italic">Không có dữ liệu hợp đồng</td></tr>
            ) : (
                currentTableData.map((c, i) => {
                  const idx = (currentPage - 1) * itemsPerPage + i + 1;
                  const isDownloading = loadingIds.includes(c.contract_id);
                  return (
                      <tr key={c.contract_id}>
                        <td className="text-center text-muted">{idx}</td>

                        {userRole === "OWNER" && (
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <Building className="text-secondary" />
                                {c.building_name || "N/A"}
                              </div>
                            </td>
                        )}

                        <td>
                          <span className="tenant-name">{c.tenant_name || "Unknown Tenant"}</span>
                          <div className="room-info">
                            <span className="badge bg-light text-dark border">P.{c.room_number}</span>
                            {c.tenant_phone && <span>• {c.tenant_phone}</span>}
                          </div>
                        </td>

                        <td>
                          <div className="date-range">
                            <div>{formatDate(c.start_date)}</div>
                            <div className="text-muted" style={{fontSize: '11px'}}>đến {formatDate(c.end_date)}</div>
                          </div>
                        </td>

                        <td>
                          <div className="price-tag">{c.rent_amount?.toLocaleString()} ₫</div>
                          {c.deposit_amount > 0 && <div style={{fontSize:'11px', color:'#6b7280'}}>Cọc: {c.deposit_amount?.toLocaleString()} ₫</div>}
                        </td>

                        <td>{renderStatus(c.status)}</td>

                        <td>
                          <div className="action-cell">
                            <WithTooltip text="Xem chi tiết">
                              <button className="btn-icon view" onClick={() => { setSelectedContract(c); setShowDetailModal(true); }}>
                                <Eye />
                              </button>
                            </WithTooltip>

                            {c.has_file && (
                                <>
                                  <WithTooltip text="Xem file gốc">
                                    <button className="btn-icon view" onClick={() => handlePreviewFile(c)} disabled={previewLoading}>
                                      <FileEarmarkPdf />
                                    </button>
                                  </WithTooltip>
                                  <WithTooltip text="Tải xuống">
                                    <button className="btn-icon download" onClick={() => handleDownload(c)} disabled={isDownloading}>
                                      {isDownloading ? <Spinner size="sm"/> : <Download />}
                                    </button>
                                  </WithTooltip>
                                </>
                            )}

                            {userRole === "OWNER" && (
                                <WithTooltip text="Xóa hợp đồng">
                                  <button className="btn-icon delete" onClick={() => { setDeleteId(c.contract_id); setShowDeleteModal(true); }}>
                                    <Trash />
                                  </button>
                                </WithTooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                  );
                })
            )}
            </tbody>
          </Table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2">
              <span className="text-muted small">Hiển thị {currentTableData.length} / {filteredContracts.length} kết quả</span>
              <div className="d-flex gap-1">
                <Button variant="outline-light" className="text-dark border" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p=>p-1)}>Trước</Button>
                {[...Array(totalPages)].map((_, idx) => (
                    <Button
                        key={idx}
                        variant={currentPage === idx + 1 ? "primary" : "outline-light"}
                        className={`border ${currentPage !== idx + 1 ? 'text-dark' : ''}`}
                        size="sm"
                        onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </Button>
                ))}
                <Button variant="outline-light" className="text-dark border" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p=>p+1)}>Sau</Button>
              </div>
            </div>
        )}

        {/* --- MODAL DETAIL --- */}
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="h5 fw-bold">Thông tin Hợp đồng</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            {selectedContract && (
                <div className="d-flex flex-column gap-4">
                  {/* Header Info */}
                  <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                    <div>
                      <span className="text-muted small text-uppercase">Mã hợp đồng</span>
                      <div className="fw-bold fs-5">#{selectedContract.contract_number || selectedContract.contract_id}</div>
                    </div>
                    {renderStatus(selectedContract.status)}
                  </div>

                  <div className="detail-grid">
                    {/* Cột trái: Thông tin thuê */}
                    <div className="d-flex flex-column gap-3">
                      <h6 className="border-bottom pb-2 mb-0 text-primary"><Person className="me-2"/>Bên thuê</h6>
                      <div className="detail-item">
                        <div className="detail-label">Khách thuê</div>
                        <div className="detail-value">{selectedContract.tenant_name}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Liên hệ</div>
                        <div className="detail-value">{selectedContract.tenant_phone || "N/A"}</div>
                        <div className="small text-muted">{selectedContract.tenant_email}</div>
                      </div>
                    </div>

                    {/* Cột phải: Thông tin phòng & Giá */}
                    <div className="d-flex flex-column gap-3">
                      <h6 className="border-bottom pb-2 mb-0 text-primary"><Building className="me-2"/>Phòng & Chi phí</h6>
                      <div className="detail-item">
                        <div className="detail-label">Vị trí</div>
                        <div className="detail-value">
                          {userRole === "OWNER" && <span>{selectedContract.building_name} - </span>}
                          Phòng {selectedContract.room_number}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <div className="detail-item w-50">
                          <div className="detail-label">Tiền thuê</div>
                          <div className="detail-value text-success">{selectedContract.rent_amount?.toLocaleString()} ₫</div>
                        </div>
                        <div className="detail-item w-50">
                          <div className="detail-label">Đặt cọc</div>
                          <div className="detail-value">{selectedContract.deposit_amount?.toLocaleString()} ₫</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hàng dưới: Thời hạn & Ghi chú */}
                  <div className="d-flex flex-column gap-3">
                    <h6 className="border-bottom pb-2 mb-0 text-primary"><Calendar3 className="me-2"/>Thời hạn & Ghi chú</h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Ngày bắt đầu - Kết thúc</div>
                        <div className="detail-value">
                          {formatDate(selectedContract.start_date)} - {formatDate(selectedContract.end_date)}
                        </div>
                        <div className="small text-muted mt-1">({selectedContract.duration_months} tháng)</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Ghi chú</div>
                        <div className="detail-value text-break" style={{fontSize:'14px'}}>
                          {selectedContract.note || "Không có ghi chú"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0">
            <Button variant="light" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            {selectedContract?.has_file && (
                <Button variant="outline-primary" onClick={() => handlePreviewFile(selectedContract)}>
                  <FileEarmarkPdf className="me-2"/> Xem file
                </Button>
            )}
            <Button variant="primary" onClick={() => navigate(`/contracts/${selectedContract?.contract_id}`)}>
              Chỉnh sửa
            </Button>
          </Modal.Footer>
        </Modal>

        {/* --- PREVIEW & DELETE MODALS (Giữ nguyên logic, chỉnh nhẹ UI) --- */}
        <Modal show={showFilePreviewModal} onHide={() => {setShowFilePreviewModal(false); setFilePreviewUrl(null);}} size="xl" centered>
          <Modal.Body className="p-0 bg-dark d-flex justify-content-center align-items-center" style={{height:'85vh', position:'relative'}}>
            <Button variant="light" size="sm" className="position-absolute top-0 end-0 m-3" onClick={()=>setShowFilePreviewModal(false)}>✕</Button>
            {previewLoading ? <Spinner animation="border" variant="light"/> : (
                filePreviewUrl && (
                    filePreviewType?.startsWith("image/")
                        ? <img src={filePreviewUrl} alt="preview" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} />
                        : <iframe title="pdf-viewer" src={filePreviewUrl} style={{width:'100%', height:'100%', border:'none'}} />
                )
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Body className="text-center p-4">
            <div className="text-danger mb-3"><Trash size={40}/></div>
            <h5>Xác nhận xóa hợp đồng?</h5>
            <p className="text-muted">Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
            <div className="d-flex justify-content-center gap-2 mt-4">
              <Button variant="light" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</Button>
              <Button variant="danger" onClick={handleDelete}>Xóa vĩnh viễn</Button>
            </div>
          </Modal.Body>
        </Modal>

      </div>
  );
}

export default ContractListPage;