// src/pages/contract/ContractListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner, OverlayTrigger, Tooltip, Form , Alert} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { http } from "../../services/http";
import {
  listContracts,
  deleteContract,
  downloadContractDirect,
  fetchContractFileBlob, forceTerminateContract,
  requestTermination
} from "../../services/api/contracts";
import { listBuildings } from "@/services/api/building.js";
import { getAccessToken } from "../../services/http";
import {
  PlusLg, Download, Eye, Trash,
  ArrowClockwise, FileEarmarkPdf, Building, Person, Calendar3,
  JournalText, PencilSquare, ShieldExclamation,
  ExclamationTriangle, SlashCircle,CheckCircle, HourglassSplit, Wallet2, ExclamationCircle,
   XCircle, FileEarmarkX
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
// --- STATE: REQUEST TERMINATION (Mới) ---
  const [showTermModal, setShowTermModal] = useState(false);
  const [termContractId, setTermContractId] = useState(null);
  const [termReason, setTermReason] = useState("");
  const [termLoading, setTermLoading] = useState(false);
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

  const [showForceModal, setShowForceModal] = useState(false);
  const [forceContractId, setForceContractId] = useState(null);
  const [forceReason, setForceReason] = useState("");
  const [forceFiles, setForceFiles] = useState(null);
  const [forceSubmitting, setForceSubmitting] = useState(false);

  // --- HANDLER ---
  const openForceModal = (contractId) => {
    setForceContractId(contractId);
    setForceReason("");
    setForceFiles(null);
    setShowForceModal(true);
  };

  const handleForceSubmit = async () => {
    if (!forceReason.trim()) return alert("Vui lòng nhập lý do.");
    if (!forceFiles || forceFiles.length === 0) return alert("Bắt buộc phải upload bằng chứng.");

    try {
      setForceSubmitting(true);
      await forceTerminateContract(forceContractId, {
        reason: forceReason,
        evidence: forceFiles
      });

      alert("Cưỡng chế hủy thành công!");
      setShowForceModal(false);
      fetchContracts(); // Reload lại danh sách
    } catch (error) {
      alert("Lỗi: " + (error.message || "Không thể thực hiện"));
    } finally {
      setForceSubmitting(false);
    }
  };

  const openTerminationModal = (contractId) => {
    setTermContractId(contractId);
    setTermReason("");
    setShowTermModal(true);
  };

  const handleTerminationSubmit = async () => {
    if (!termReason.trim()) return alert("Vui lòng nhập lý do chấm dứt hợp đồng.");

    try {
      setTermLoading(true);
      await requestTermination(termContractId, termReason);

      alert("Đã gửi yêu cầu chấm dứt thành công! Đang chờ Tenant xác nhận.");
      setShowTermModal(false);
      fetchContracts(); // Reload lại danh sách để cập nhật trạng thái
    } catch (error) {
      alert("Lỗi: " + (error.message || "Không thể gửi yêu cầu"));
    } finally {
      setTermLoading(false);
    }
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
  const evidenceKey = useMemo(() => {
    if (!selectedContract?.note) return null;
    const match = selectedContract.note.match(/\[EVIDENCE_S3_KEY::(.*?)\]/);
    return match ? match[1] : null;
  }, [selectedContract]);



  const handleViewEvidence = async () => {
    console.log("--- [DEBUG] CLIENT: View Evidence Clicked ---");
    console.log("Full Note:", selectedContract?.note);
    console.log("Extracted Key:", evidenceKey);

    // 1. Kiểm tra key
    if (!evidenceKey) {
      alert("Không tìm thấy file bằng chứng trong ghi chú hợp đồng.");
      return;
    }

    try {
      // 2. Gọi API
      console.log("Requesting URL for key:", evidenceKey);
      const response = await http.get(`/contract/evidence/download`, {
        params: { key: evidenceKey }
      });

      console.log("API Response:", response);
      const { url } = response.data || response;

      if (url) {
        window.open(url, '_blank');
      } else {
        alert("Lỗi: Server trả về thành công nhưng không có URL.");
      }

    } catch (error) {
      console.error("View Evidence Error:", error);
      alert("Không thể tải bằng chứng. Lỗi: " + (error.message || "Unknown"));
    }
  };
  // --- RENDER HELPERS ---
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";


  const renderStatus = (status) => {
    // Cấu hình hiển thị cho từng trạng thái Backend
    const config = {
      active: {
        label: "Đang hiệu lực",
        className: "status-active",
        icon: <CheckCircle size={14} />
      },
      pending: {
        label: "Chờ ký kết",
        className: "status-pending",
        icon: <HourglassSplit size={14} />
      },
      pending_transaction: {
        label: "Chờ thanh toán",
        className: "status-pending-transaction",
        icon: <Wallet2 size={14} />
      },
      requested_termination: {
        label: "Yêu cầu hủy",
        className: "status-requested-termination",
        icon: <ExclamationCircle size={14} />
      },
      expired: {
        label: "Đã hết hạn",
        className: "status-expired",
        icon: <FileEarmarkX size={14} />
      },
      terminated: {
        label: "Đã thanh lý",
        className: "status-terminated",
        icon: <SlashCircle size={14} />
      },
      rejected: {
        label: "Đã từ chối",
        className: "status-rejected",
        icon: <XCircle size={14} />
      }
    };

    // Fallback nếu status không tồn tại trong config
    const item = config[status] || {
      label: status,
      className: "status-expired",
      icon: null
    };

    return (
        <span className={`status-badge ${item.className}`}>
        {item.icon && <span className="me-2 d-flex align-items-center">{item.icon}</span>}
          {item.label}
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
              <label className="fw-bold small mb-1">Trạng thái</label>
              <select
                  name="status"
                  className="form-select form-select-sm shadow-none border-secondary-subtle"
                  value={filters.status}
                  onChange={handleFilterChange}
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="active"> Đang hiệu lực</option>
                <option value="pending"> Chờ ký kết</option>
                <option value="pending_transaction"> Chờ thanh toán (Công nợ)</option>
                <option value="requested_termination">️ Yêu cầu hủy</option>
                <option value="expired"> Đã hết hạn</option>
                <option value="terminated">Đã thanh lý</option>
                <option value="rejected"> Đã từ chối</option>
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
                            {/* 1. Xem chi tiết (Giữ nguyên) */}
                            <WithTooltip text="Xem chi tiết">
                              <button className="btn-icon view" onClick={() => { setSelectedContract(c); setShowDetailModal(true); }}>
                                <Eye />
                              </button>
                            </WithTooltip>

                            {/* 2. Phụ lục (Giữ nguyên) */}
                            {/*<WithTooltip text="Phụ lục hợp đồng">*/}
                            {/*  <button*/}
                            {/*      className="btn-icon info"*/}
                            {/*      onClick={() => navigate(`/contracts/${c.contract_id}/addendum`)}*/}
                            {/*  >*/}
                            {/*    <JournalText />*/}
                            {/*  </button>*/}
                            {/*</WithTooltip>*/}

                            {/* 3. Chỉnh sửa (THAY THẾ nút xem file) */}
                            {/* Chỉ cho phép sửa khi status là pending hoặc rejected */}
                            {['pending', 'rejected'].includes(c.status) && (
                                <WithTooltip text="Chỉnh sửa">
                                  <button
                                      className="btn-icon text-primary" // Sử dụng text-primary hoặc class edit tùy CSS của bạn
                                      onClick={() => navigate(`/contracts/${c.contract_id}`)}
                                  >
                                    <PencilSquare />
                                  </button>
                                </WithTooltip>
                            )}

                            {/* 4. Download file (Giữ nguyên) */}
                            {c.has_file && (
                                <WithTooltip text="Tải xuống">
                                  <button className="btn-icon download" onClick={() => handleDownload(c)} disabled={isDownloading}>
                                    {isDownloading ? <Spinner size="sm"/> : <Download />}
                                  </button>
                                </WithTooltip>
                            )}
                            {c.status === 'active' && (
                                <WithTooltip text="Yêu cầu chấm dứt">
                                  <button
                                      className="btn-icon text-warning" // Màu vàng cảnh báo
                                      onClick={() => openTerminationModal(c.contract_id)}
                                  >
                                    <SlashCircle />
                                  </button>
                                </WithTooltip>
                            )}
                            {userRole === "OWNER" && c.status === 'requested_termination' && (
                                <WithTooltip text="Cưỡng chế hủy (Owner)">
                                  <button
                                      className="btn-icon text-danger"
                                      onClick={() => openForceModal(c.contract_id)}
                                  >
                                    <ExclamationTriangle />
                                  </button>
                                </WithTooltip>
                            )}
                            {/* 5. Xóa (Cập nhật điều kiện) */}
                            {/* Chỉ xóa khi: Owner AND (Terminated OR Expired OR Rejected) */}
                            {userRole === "OWNER" && ['terminated', 'expired', 'rejected'].includes(c.status) && (
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

        {/* --- MODAL DETAIL (Giữ nguyên, nhưng trong modal vẫn có nút xem file nên không lo mất tính năng này) --- */}
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="h5 fw-bold">Thông tin Hợp đồng</Modal.Title>
          </Modal.Header>
          {/* --- Thay thế toàn bộ phần Modal.Body hiện tại bằng đoạn dưới đây --- */}
          <Modal.Body className="pt-2">
            {selectedContract && (
                <div className="d-flex flex-column gap-4">
                  {/* 1. Header Info & Trạng thái */}
                  <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                    <div>
                      <span className="text-muted small text-uppercase">Mã hợp đồng</span>
                      <div className="d-flex align-items-center gap-2">
                        <div className="fw-bold fs-5">#{selectedContract.contract_number || selectedContract.contract_id}</div>
                        <span className="text-muted small fst-italic">
               (Tạo ngày: {formatDate(selectedContract.created_at)})
             </span>
                      </div>
                    </div>
                    {renderStatus(selectedContract.status)}
                  </div>

                  <div className="detail-grid">
                    {/* 2. Cột trái: Thông tin Bên thuê (Bổ sung CCCD) */}
                    <div className="d-flex flex-column gap-3">
                      <h6 className="border-bottom pb-2 mb-0 text-primary fw-bold">
                        <Person className="me-2"/>Bên thuê
                      </h6>

                      <div className="detail-item">
                        <div className="detail-label">Họ và tên</div>
                        <div className="detail-value fw-bold">{selectedContract.tenant_name}</div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">Thông tin định danh</div>
                        {/* Hiển thị CCCD/CMND nếu có */}
                        <div className="detail-value">
                          {selectedContract.id_number || selectedContract.tenant_id_number ? (
                              <span>CCCD/CMND: {selectedContract.id_number || selectedContract.tenant_id_number}</span>
                          ) : (
                              <span className="text-muted fst-italic">Chưa cập nhật CCCD</span>
                          )}
                        </div>
                      </div>

                      <div className="detail-item">
                        <div className="detail-label">Liên hệ</div>
                        <div className="detail-value">{selectedContract.tenant_phone || "N/A"}</div>
                        <div className="small text-muted">{selectedContract.tenant_email}</div>
                      </div>
                    </div>

                    {/* 3. Cột phải: Tài chính & Phòng (Bổ sung Chu kỳ thanh toán & Phạt) */}
                    <div className="d-flex flex-column gap-3">
                      <h6 className="border-bottom pb-2 mb-0 text-primary fw-bold">
                        <Building className="me-2"/>Phòng & Tài chính
                      </h6>

                      <div className="detail-item">
                        <div className="detail-label">Vị trí thuê</div>
                        <div className="detail-value">
                          {userRole === "OWNER" && <strong>{selectedContract.building_name} - </strong>}
                          Phòng {selectedContract.room_number}
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <div className="detail-item">
                            <div className="detail-label">Tiền thuê / tháng</div>
                            <div className="detail-value text-success fw-bold">
                              {selectedContract.rent_amount?.toLocaleString()} ₫
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="detail-item">
                            <div className="detail-label">Tiền đặt cọc</div>
                            <div className="detail-value fw-bold">
                              {selectedContract.deposit_amount?.toLocaleString()} ₫
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BỔ SUNG: Chu kỳ thanh toán và Lãi phạt */}
                      <div className="row g-2">
                        <div className="col-6">
                          <div className="detail-item">
                            <div className="detail-label">Chu kỳ thanh toán</div>
                            <div className="detail-value">
                              {selectedContract.payment_cycle_months} tháng/lần
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="detail-item">
                            <div className="detail-label">Phạt chậm trả</div>
                            <div className="detail-value text-danger">
                              {selectedContract.penalty_rate ? `${selectedContract.penalty_rate}% / ngày` : "Không áp dụng"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Hàng dưới: Thời hạn & Ghi chú */}
                  <div className="d-flex flex-column gap-3">
                    <h6 className="border-bottom pb-2 mb-0 text-primary fw-bold">
                      <Calendar3 className="me-2"/>Thời hạn & Khác
                    </h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Hiệu lực hợp đồng</div>
                        <div className="detail-value">
                          {formatDate(selectedContract.start_date)} <span className="mx-2">➔</span> {formatDate(selectedContract.end_date)}
                        </div>
                        <div className="small text-muted mt-1 fw-bold">
                          (Tổng thời hạn: {selectedContract.duration_months} tháng)
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Ghi chú / Điều khoản bổ sung</div>
                        <div className="detail-value bg-light p-2 rounded text-break" style={{ fontSize: '14px', minHeight: '60px' }}>
                          {selectedContract.note || "Không có ghi chú"}
                        </div>
                      </div>
                      {/* [NEW] KHU VỰC BẰNG CHỨNG (CHỈ DÀNH CHO OWNER) */}
                      {userRole === "OWNER" && evidenceKey && (
                          <Alert variant="danger" className="mt-2 mb-0 border-danger">
                            <div className="d-flex align-items-start gap-3">
                              <ShieldExclamation size={24} className="text-danger mt-1" />
                              <div className="flex-grow-1">
                                <h6 className="alert-heading fw-bold mb-1 text-danger">Bằng chứng Cưỡng chế Hủy</h6>
                                <p className="mb-2 small text-muted">
                                  Hợp đồng này đã bị cưỡng chế hủy. Dưới đây là biên bản/hình ảnh bằng chứng được lưu trữ an toàn.
                                </p>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleViewEvidence}
                                    className="d-flex align-items-center gap-2"
                                >
                                  <Eye /> Xem File Bằng Chứng
                                </Button>
                              </div>
                            </div>
                          </Alert>
                      )}
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


          </Modal.Footer>
        </Modal>

        {/* --- PREVIEW & DELETE MODALS --- */}
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
            <div className="text-danger mb-3">
              <Trash size={40} />
            </div>
            <h5 className="fw-bold text-danger">Xóa vĩnh viễn Hợp đồng?</h5>

            <div className="alert alert-warning text-start mt-3" style={{ fontSize: '14px' }}>
              <p className="mb-2 fw-bold">⚠️ Cảnh báo quan trọng:</p>
              <ul className="mb-0 ps-3">
                <li>Hợp đồng này sẽ bị xóa hoàn toàn khỏi hệ thống.</li>
                <li>
                  <strong>TOÀN BỘ HÓA ĐƠN & LỊCH SỬ THANH TOÁN</strong> gắn liền với hợp đồng này cũng sẽ bị xóa sạch.
                </li>
                <li>Hành động này <strong>không thể hoàn tác</strong>.</li>
              </ul>
            </div>

            <p className="text-muted small">
              Nếu bạn chỉ muốn kết thúc hợp đồng, hãy dùng chức năng "Thanh lý" thay vì xóa.
            </p>

            <div className="d-flex justify-content-center gap-2 mt-4">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy bỏ
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Xác nhận Xóa
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal show={showForceModal} onHide={() => setShowForceModal(false)} backdrop="static" centered>
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title className="h5">⚠️ Cưỡng chế Hủy Hợp đồng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning" className="small">
              Hành động này sẽ giải phóng phòng ngay lập tức và ghi log kiểm toán.
              Nếu còn công nợ, hợp đồng sẽ chuyển sang trạng thái <b>Pending Transaction</b>.
            </Alert>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Lý do hủy <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    as="textarea" rows={3}
                    value={forceReason}
                    onChange={(e) => setForceReason(e.target.value)}
                    placeholder="VD: Khách bỏ trốn, vi phạm nghiêm trọng..."
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Bằng chứng (Ảnh/Biên bản) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => setForceFiles(e.target.files)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForceModal(false)}>Hủy</Button>
            <Button
                variant="danger"
                onClick={handleForceSubmit}
                disabled={forceSubmitting}
            >
              {forceSubmitting ? <Spinner size="sm" /> : "Xác nhận Cưỡng chế"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* --- MODAL: REQUEST TERMINATION (STANDARD) --- */}
        <Modal show={showTermModal} onHide={() => setShowTermModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="h5">Yêu cầu Chấm dứt Hợp đồng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info" className="small mb-3">
              Hành động này sẽ chuyển trạng thái hợp đồng sang <b>Requested Termination</b>.
              Khách thuê (Tenant) sẽ nhận được email thông báo và cần xác nhận trên ứng dụng của họ.
            </Alert>
            <Form.Group>
              <Form.Label>Lý do chấm dứt <span className="text-danger">*</span></Form.Label>
              <Form.Control
                  as="textarea"
                  rows={3}
                  value={termReason}
                  onChange={(e) => setTermReason(e.target.value)}
                  placeholder="VD: Kết thúc hợp đồng trước hạn theo thỏa thuận..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTermModal(false)}>Đóng</Button>
            <Button
                variant="warning"
                onClick={handleTerminationSubmit}
                disabled={termLoading}
            >
              {termLoading ? <Spinner size="sm" /> : "Gửi yêu cầu"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
}

export default ContractListPage;