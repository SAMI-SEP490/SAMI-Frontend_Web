// src/pages/contract/ContractListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  listContracts,
  deleteContract,
  downloadContractDirect,
  fetchContractFileBlob
} from "../../services/api/contracts";
import { listBuildings } from "@/services/api/building.js";
import { getAccessToken } from "../../services/http";
import { PlusLg, Download, Eye, Trash, ArrowClockwise } from "react-bootstrap-icons";
import "./ContractListPage.css";

function ContractListPage() {
  const navigate = useNavigate();

  // --- ROLE ---
  const [userRole, setUserRole] = useState("");

  // --- DATA ---
  const [allContracts, setAllContracts] = useState([]);
  const [listBuildingsData, setListBuildingsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingIds, setLoadingIds] = useState([]); // download per id

  // --- PAGINATION (frontend) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- FILTERS ---
  const [filters, setFilters] = useState({
    status: "",
    start_date: "",
    end_date: "",
    building: "", // value will be building id (if available) or building name
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

  // --- GET ROLE FROM JWT ---
  useEffect(() => {
    try {
      const token = getAccessToken();
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const role = decoded.role || decoded.userRole || "";
        setUserRole(role.toUpperCase());
        console.log("🔑 User Role from JWT:", role.toUpperCase());
      }
    } catch (error) {
      console.error("❌ Error parsing JWT:", error);
    }
  }, []);

  // --- FETCH CONTRACTS ---
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await listContracts();
      const data = Array.isArray(res) ? res : (res.items || []);
      setAllContracts(data);
    } catch (error) {
      console.error("Fetch error:", error);
      setAllContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH BUILDINGS (for building filter) ---
  const fetchBuildings = async () => {
    try {
      const res = await listBuildings(); // assume returns array of { id, name } or similar
      const data = Array.isArray(res) ? res : (res.items || []);
      setListBuildingsData(data);
    } catch (error) {
      console.error("Lỗi khi lấy list building:", error);
      setListBuildingsData([]);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchBuildings();
  }, []);

  // --- UNIQUE BUILDINGS for select (prefer building list from API) ---
  const uniqueBuildings = useMemo(() => {
    if (listBuildingsData && listBuildingsData.length > 0) {
      // Map to { id, name }
      return listBuildingsData.map(b => ({ id: b.id ?? b.building_id ?? b._id ?? b.value, name: b.name ?? b.building_name ?? b.label }));
    }
    // fallback: derive from contracts
    const buildings = [...new Set(allContracts.map(c => c.building_name).filter(Boolean))];
    return buildings.map(n => ({ id: n, name: n }));
  }, [listBuildingsData, allContracts]);

  // --- FILTER LOGIC ---
  const filteredContracts = useMemo(() => {
    let result = [...allContracts];

    if (filters.q) {
      const lowerQ = filters.q.toLowerCase();
      result = result.filter(c =>
          (c.tenant_name && c.tenant_name.toLowerCase().includes(lowerQ)) ||
          (c.room_number && c.room_number.toLowerCase().includes(lowerQ))
      );
    }

    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.building) {
      // filters.building may be building id or name
      result = result.filter(c =>
          (c.building_id && String(c.building_id) === String(filters.building)) ||
          (c.building_name && c.building_name === filters.building)
      );
    }

    if (filters.start_date) {
      const startFilter = new Date(filters.start_date);
      result = result.filter(c => c.start_date && new Date(c.start_date) >= startFilter);
    }
    if (filters.end_date) {
      const endFilter = new Date(filters.end_date);
      result = result.filter(c => c.end_date && new Date(c.end_date) <= endFilter);
    }

    return result;
  }, [allContracts, filters]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const currentTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContracts, currentPage, itemsPerPage]);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ status: "", start_date: "", end_date: "", q: "", building: "" });
  };

  const handleViewDetails = (c) => {
    setSelectedContract(c);
    setShowDetailModal(true);
  };

  const handleDownload = async (c) => {
    if (!c.has_file) return;
    try {
      setLoadingIds(prev => [...prev, c.contract_id]);
      await downloadContractDirect(c.contract_id, c.file_name || `contract-${c.contract_id}.pdf`);
    } catch (error) {
      alert("Không tải được file.");
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== c.contract_id));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteContract(deleteId);
      setAllContracts(prev => prev.filter(c => c.contract_id !== deleteId));
      setShowDeleteModal(false);
    } catch (error) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  // --- FILE PREVIEW HANDLER ---
  const handlePreviewFile = async (c) => {
    if (!c.has_file) return alert("Không có file để xem.");
    try {
      setPreviewLoading(true);
      const blob = await fetchContractFileBlob(c.contract_id);
      const url = URL.createObjectURL(blob);
      setFilePreviewUrl(url);
      setFilePreviewType(blob.type);
      setShowFilePreviewModal(true);
    } catch (error) {
      console.error("Preview error:", error);
      alert("Không thể load file để xem.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeFilePreview = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setFilePreviewUrl(null);
    setFilePreviewType(null);
    setShowFilePreviewModal(false);
  };

  // --- UI HELPERS ---
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

  const renderStatus = (status) => {
    const map = {
      active: { label: "Hiệu lực", class: "active" },
      pending: { label: "Chờ duyệt", class: "pending" },
      expired: { label: "Hết hạn", class: "expired" },
      terminated: { label: "Đã hủy", class: "terminated" },
    };
    const item = map[status] || { label: status, class: "" };
    return <span className={`status ${item.class}`}>{item.label}</span>;
  };

  const hasActiveFilters = filters.status || filters.start_date || filters.end_date || filters.q || filters.building;

  return (
      <div className="container">
        <div className="title">
          <span>📜 Quản lý Hợp đồng</span>
          <Button
              variant="primary"
              className="d-flex align-items-center gap-2"
              onClick={() => navigate("/contracts/create")}
          >
            <PlusLg /> Tạo mới
          </Button>
        </div>

        <div className="filter-bar">
          <input
              type="text"
              name="q"
              className="search-input"
              placeholder="🔎 Tìm tên khách, số phòng..."
              value={filters.q}
              onChange={handleFilterChange}
          />

          <select
              name="status"
              className="status-select"
              value={filters.status}
              onChange={handleFilterChange}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="active">Đang hiệu lực</option>
            <option value="pending">Chờ duyệt</option>
            <option value="expired">Hết hạn</option>
            <option value="terminated">Đã hủy</option>
          </select>

          {/* CHỈ HIỆN FILTER TÒA NHÀ NẾU LÀ OWNER (Giữ như bạn có) */}
          {userRole === "OWNER" && (
              <select
                  name="building"
                  className="status-select"
                  value={filters.building}
                  onChange={handleFilterChange}
              >
                <option value="">-- Tất cả tòa nhà --</option>
                {uniqueBuildings.map((b) => (
                    <option key={b.id} value={b.id ?? b.name}>{b.name}</option>
                ))}
              </select>
          )}

          <div className="d-flex align-items-center gap-2">
            <span className="ms-2">Từ:</span>
            <input
                type="date"
                name="start_date"
                className="date-input"
                value={filters.start_date}
                onChange={handleFilterChange}
            />
            <span>Đến:</span>
            <input
                type="date"
                name="end_date"
                className="date-input"
                value={filters.end_date}
                onChange={handleFilterChange}
            />
          </div>

          {hasActiveFilters && (
              <Button variant="light" className="btn-reset" onClick={handleResetFilters}>
                <ArrowClockwise /> Xóa lọc
              </Button>
          )}
        </div>

        <div className="table-wrapper">
          <Table bordered hover responsive>
            <thead>
            <tr>
              <th style={{width: '50px'}}>#</th>
              {userRole === "OWNER" && <th>Tòa nhà</th>}
              <th>Khách thuê / Phòng</th>
              <th>Thời hạn</th>
              <th>Tiền thuê (VNĐ)</th>
              <th>Trạng thái</th>
              <th style={{width: '280px'}}>Hành động</th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr><td colSpan={userRole === "OWNER" ? 7 : 6} className="text-center py-5"><Spinner animation="border" variant="primary"/></td></tr>
            ) : currentTableData.length === 0 ? (
                <tr><td colSpan={userRole === "OWNER" ? 7 : 6} className="no-data">Không tìm thấy hợp đồng phù hợp</td></tr>
            ) : (
                currentTableData.map((c, i) => {
                  const indexNumber = (currentPage - 1) * itemsPerPage + i + 1;
                  const isDownloading = loadingIds.includes(c.contract_id);

                  return (
                      <tr key={c.contract_id}>
                        <td>{indexNumber}</td>
                        {userRole === "OWNER" && <td>{c.building_name || "N/A"}</td>}
                        <td>
                          <div className="fw-bold" style={{color: '#1e3a8a'}}>{c.tenant_name || "N/A"}</div>
                          <small className="text-muted">Phòng: <strong>{c.room_number}</strong></small>
                        </td>
                        <td>
                          <div>{formatDate(c.start_date)}</div>
                          <small className="text-muted">đến {formatDate(c.end_date)}</small>
                        </td>
                        <td>
                          <div className="fw-bold text-success">{c.rent_amount?.toLocaleString()} đ</div>
                          {c.deposit_amount > 0 && <small className="text-muted">Cọc: {c.deposit_amount?.toLocaleString()}</small>}
                        </td>
                        <td>{renderStatus(c.status)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-custom btn-view" onClick={() => handleViewDetails(c)} title="Xem chi tiết">
                              <Eye /> Xem
                            </button>

                            <button
                                className="btn-custom btn-download"
                                onClick={() => handleDownload(c)}
                                disabled={!c.has_file || isDownloading}
                                style={{ opacity: !c.has_file ? 0.5 : 1 }}
                                title="Tải file"
                            >
                              {isDownloading ? <Spinner size="sm"/> : <Download />} Tải
                            </button>

                            <button
                                className="btn-custom btn-view-file"
                                onClick={() => handlePreviewFile(c)}
                                disabled={!c.has_file || previewLoading}
                                title="Xem file"
                                style={{ opacity: !c.has_file ? 0.5 : 1 }}
                            >
                              {previewLoading ? <Spinner size="sm"/> : "Xem file"}
                            </button>

                            {userRole === "OWNER" && (
                                <button className="btn-custom btn-delete" onClick={() => { setDeleteId(c.contract_id); setShowDeleteModal(true); }} title="Xóa">
                                  <Trash /> Xóa
                                </button>
                            )}
                          </div>
                        </td>
                      </tr>
                  )})
            )}
            </tbody>
          </Table>
        </div>

        {!loading && filteredContracts.length > 0 && (
            <div className="d-flex justify-content-end mt-3 gap-2 align-items-center">
              <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
              >
                Trước
              </Button>
              <span className="px-2" style={{fontSize: '14px'}}>
                Trang <b>{currentPage}</b> / {totalPages || 1}
                <span className="text-muted ms-2">({filteredContracts.length} bản ghi)</span>
            </span>
              <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
              >
                Sau
              </Button>
            </div>
        )}

        {/* DETAIL MODAL */}
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>📌 Chi tiết Hợp đồng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedContract && (
                <div className="detail-content">
                  <p><strong>Mã hợp đồng:</strong> <span>#{selectedContract.contract_id}</span></p>
                  {userRole === "OWNER" && <p><strong>Tòa nhà:</strong> <span>{selectedContract.building_name || "N/A"}</span></p>}
                  <p><strong>Khách thuê:</strong> <span>{selectedContract.tenant_name}</span></p>
                  <p><strong>Phòng:</strong> <span>{selectedContract.room_number}</span></p>
                  <p><strong>Thời hạn:</strong> <span>{formatDate(selectedContract.start_date)} - {formatDate(selectedContract.end_date)}</span></p>
                  <p><strong>Giá thuê:</strong> <span>{selectedContract.rent_amount?.toLocaleString()} VNĐ</span></p>
                  <p><strong>Tiền cọc:</strong> <span>{selectedContract.deposit_amount?.toLocaleString()} VNĐ</span></p>
                  <p><strong>Trạng thái:</strong> {renderStatus(selectedContract.status)}</p>
                  <p><strong>Ghi chú:</strong> <span>{selectedContract.note || "Không có"}</span></p>

                  {/* File actions in detail */}
                  <div className="mt-3 d-flex gap-2">
                    {selectedContract.has_file ? (
                        <>
                          <Button variant="outline-primary" onClick={() => handlePreviewFile(selectedContract)}>
                            Xem file
                          </Button>
                          <Button variant="primary" onClick={() => handleDownload(selectedContract)}>
                            Tải file
                          </Button>
                        </>
                    ) : (
                        <small className="text-muted">Không có file đính kèm</small>
                    )}
                  </div>
                </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            <Button variant="primary" onClick={() => navigate(`/contracts/${selectedContract?.contract_id}`)}>
              Sửa hợp đồng
            </Button>
          </Modal.Footer>
        </Modal>

        {/* FILE PREVIEW MODAL */}
        <Modal show={showFilePreviewModal} onHide={closeFilePreview} size="xl" centered>
          <Modal.Header closeButton>
            <Modal.Title>📎 Xem file hợp đồng</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {previewLoading ? (
                <Spinner animation="border" />
            ) : filePreviewUrl ? (
                filePreviewType && filePreviewType.startsWith("image/") ? (
                    <img src={filePreviewUrl} alt="contract" style={{ maxWidth: '100%', maxHeight: '75vh' }} />
                ) : filePreviewType === "application/pdf" || filePreviewUrl.endsWith(".pdf") ? (
                    // PDF: show in iframe
                    <iframe title="contract-pdf" src={filePreviewUrl} style={{ width: '100%', height: '75vh', border: 'none' }} />
                ) : (
                    <div>
                      <p>Không thể hiển thị file này trong trình duyệt.</p>
                      <a href={filePreviewUrl} target="_blank" rel="noreferrer">Mở file trong tab mới / Tải xuống</a>
                    </div>
                )
            ) : (
                <div>Không có file để hiển thị.</div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeFilePreview}>Đóng</Button>
            {filePreviewUrl && <a className="btn btn-primary" href={filePreviewUrl} target="_blank" rel="noreferrer" download> Mở/Tải </a>}
          </Modal.Footer>
        </Modal>

        {/* DELETE CONFIRM */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>⚠️ Xác nhận xóa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Bạn có chắc chắn muốn xóa hợp đồng này không? <br/>
            Hành động này <strong>không thể hoàn tác</strong>.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Xóa vĩnh viễn</Button>
          </Modal.Footer>
        </Modal>
      </div>
  );
}

export default ContractListPage;
