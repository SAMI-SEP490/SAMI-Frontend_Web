// src/pages/contract/ContractListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner, OverlayTrigger, Tooltip, Form, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
    listContracts,
    deleteContract,
    downloadContractDirect,
    fetchContractFileBlob,
} from "../../services/api/contracts";

import { listBuildings } from "@/services/api/building.js";
import { getAccessToken } from "../../services/http";
import {
    PlusLg, Download, Eye, Trash,
    ArrowClockwise, FileEarmarkPdf, Building, Person, Calendar3,
    FilePlus, JournalText, FileEarmarkText
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
    const [loadingIds, setLoadingIds] = useState([]); // Cho việc download

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

    // --- MODALS STATE ---
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // File Preview
    const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [filePreviewType, setFilePreviewType] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // --- ADDENDUM STATE (MỚI) ---
    const [showAddendumListModal, setShowAddendumListModal] = useState(false);
    const [showAddAddendumModal, setShowAddAddendumModal] = useState(false);
    const [currentAddendums, setCurrentAddendums] = useState([]);
    const [loadingAddendums, setLoadingAddendums] = useState(false);
    const [newAddendumData, setNewAddendumData] = useState({ description: "", signed_date: "", file: null });

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

    // --- ADDENDUM HANDLERS ---
    const handleOpenAddendumList = async (contract) => {
        setSelectedContract(contract);
        setShowAddendumListModal(true);
        setLoadingAddendums(true);
        try {
            const res = await listContractAddendums(contract.contract_id);
            // Giả sử API trả về mảng addendums hoặc { items: [] }
            setCurrentAddendums(Array.isArray(res) ? res : (res.items || []));
        } catch (error) {
            console.error(error);
            setCurrentAddendums([]);
        } finally {
            setLoadingAddendums(false);
        }
    };

    const handleOpenAddAddendum = (contract) => {
        setSelectedContract(contract);
        setNewAddendumData({ description: "", signed_date: new Date().toISOString().split('T')[0], file: null });
        setShowAddAddendumModal(true);
    };

    const handleSubmitAddendum = async () => {
        if (!newAddendumData.description) return alert("Vui lòng nhập nội dung phụ lục");

        const formData = new FormData();
        formData.append("description", newAddendumData.description);
        formData.append("signed_date", newAddendumData.signed_date);
        if (newAddendumData.file) formData.append("file", newAddendumData.file);

        try {
            await createContractAddendum(selectedContract.contract_id, formData);
            alert("Thêm phụ lục thành công!");
            setShowAddAddendumModal(false);
            // Refresh list if needed or just close
        } catch (error) {
            alert("Lỗi thêm phụ lục: " + error.message);
        }
    };

    const handleDeleteAddendum = async (addendumId) => {
        if(!window.confirm("Bạn chắc chắn muốn xóa phụ lục này?")) return;
        try {
            await deleteContractAddendum(selectedContract.contract_id, addendumId);
            setCurrentAddendums(prev => prev.filter(a => a.id !== addendumId));
        } catch (e) {
            alert("Lỗi xóa phụ lục");
        }
    }

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
                    className="btn-create-contract shadow-sm d-flex align-items-center gap-2"
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
                        <input type="text" name="q" className="form-control form-control-sm" placeholder="Tên khách, số phòng..." value={filters.q} onChange={handleFilterChange} />
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
                <Table hover responsive className="custom-table align-middle">
                    <thead>
                    <tr>
                        <th className="text-center" style={{width: '40px'}}>#</th>
                        {userRole === "OWNER" && <th>Tòa nhà</th>}
                        <th>Khách thuê & Phòng</th>
                        <th>Thời hạn</th>
                        <th>Giá trị HĐ</th>
                        <th>Trạng thái</th>
                        <th className="text-center" style={{minWidth: '220px'}}>Hành động</th>
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
                                                <span className="fw-medium">{c.building_name || "N/A"}</span>
                                            </div>
                                        </td>
                                    )}

                                    <td>
                                        <span className="tenant-name">{c.tenant_name || "Unknown Tenant"}</span>
                                        <div className="room-info mt-1">
                                            <Badge bg="light" text="dark" className="border px-2">P.{c.room_number}</Badge>
                                            {c.tenant_phone && <span className="small text-muted ms-1">• {c.tenant_phone}</span>}
                                        </div>
                                    </td>

                                    <td>
                                        <div className="date-range">
                                            <div className="fw-medium">{formatDate(c.start_date)}</div>
                                            <div className="text-muted small">đến {formatDate(c.end_date)}</div>
                                        </div>
                                    </td>

                                    <td>
                                        <div className="price-tag">{c.rent_amount?.toLocaleString()} ₫</div>
                                        {c.deposit_amount > 0 && <div className="small text-muted">Cọc: {c.deposit_amount?.toLocaleString()}</div>}
                                    </td>

                                    <td>{renderStatus(c.status)}</td>

                                    {/* --- CỘT HÀNH ĐỘNG MỚI --- */}
                                    <td>
                                        <div className="d-flex flex-column gap-2 py-1">
                                            {/* Hàng nút trên: Các thao tác chính */}
                                            <div className="d-flex justify-content-center gap-2">
                                                <WithTooltip text="Xem chi tiết Hợp đồng">
                                                    <Button variant="outline-primary" size="sm" className="action-btn" onClick={() => { setSelectedContract(c); setShowDetailModal(true); }}>
                                                        <Eye /> Xem
                                                    </Button>
                                                </WithTooltip>

                                                {c.has_file && (
                                                    <WithTooltip text="Xem file PDF đính kèm">
                                                        <Button variant="outline-secondary" size="sm" className="action-btn" onClick={() => handlePreviewFile(c)} disabled={previewLoading}>
                                                            <FileEarmarkPdf /> File
                                                        </Button>
                                                    </WithTooltip>
                                                )}
                                            </div>

                                            {/* Hàng nút giữa: Phụ lục */}
                                            <div className="d-flex justify-content-center gap-2">
                                                <WithTooltip text="Danh sách phụ lục">
                                                    <Button variant="outline-info" size="sm" className="action-btn" onClick={() => handleOpenAddendumList(c)}>
                                                        <JournalText /> DS P.Lục
                                                    </Button>
                                                </WithTooltip>
                                                <WithTooltip text="Thêm phụ lục mới">
                                                    <Button variant="outline-success" size="sm" className="action-btn" onClick={() => handleOpenAddAddendum(c)}>
                                                        <FilePlus /> Thêm P.Lục
                                                    </Button>
                                                </WithTooltip>
                                            </div>

                                            {/* Hàng nút dưới: Admin/Owner Only */}
                                            {userRole === "OWNER" && (
                                                <div className="d-flex justify-content-center border-top pt-2 mt-1">
                                                    <Button variant="outline-danger" size="sm" className="action-btn w-100" onClick={() => { setDeleteId(c.contract_id); setShowDeleteModal(true); }}>
                                                        <Trash /> Xóa HĐ
                                                    </Button>
                                                </div>
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
                <div className="pagination-container">
                    <span className="text-muted small">Hiển thị {currentTableData.length} / {filteredContracts.length} kết quả</span>
                    <div className="d-flex gap-1">
                        <Button variant="light" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p=>p-1)}>Trước</Button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <Button
                                key={idx}
                                variant={currentPage === idx + 1 ? "primary" : "light"}
                                size="sm"
                                onClick={() => setCurrentPage(idx + 1)}
                            >
                                {idx + 1}
                            </Button>
                        ))}
                        <Button variant="light" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p=>p+1)}>Sau</Button>
                    </div>
                </div>
            )}

            {/* --- MODAL 1: CHI TIẾT HỢP ĐỒNG --- */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết Hợp đồng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedContract && (
                        <div className="d-flex flex-column gap-3">
                            <div className="alert alert-light border d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Mã HĐ:</strong> #{selectedContract.contract_number || selectedContract.contract_id}
                                </div>
                                {renderStatus(selectedContract.status)}
                            </div>

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="p-3 bg-light rounded h-100">
                                        <h6 className="text-primary border-bottom pb-2"><Person className="me-2"/>Bên thuê</h6>
                                        <p className="mb-1"><strong>Tên:</strong> {selectedContract.tenant_name}</p>
                                        <p className="mb-1"><strong>SĐT:</strong> {selectedContract.tenant_phone}</p>
                                        <p className="mb-0"><strong>Email:</strong> {selectedContract.tenant_email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="p-3 bg-light rounded h-100">
                                        <h6 className="text-primary border-bottom pb-2"><Building className="me-2"/>Phòng</h6>
                                        <p className="mb-1"><strong>Tòa nhà:</strong> {selectedContract.building_name}</p>
                                        <p className="mb-1"><strong>Phòng số:</strong> {selectedContract.room_number}</p>
                                        <p className="mb-0 text-success fw-bold">Giá: {selectedContract.rent_amount?.toLocaleString()} ₫</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border rounded">
                                <h6 className="text-primary"><Calendar3 className="me-2"/>Thời gian & Ghi chú</h6>
                                <p className="mb-1">Từ <strong>{formatDate(selectedContract.start_date)}</strong> đến <strong>{formatDate(selectedContract.end_date)}</strong></p>
                                <p className="mb-0 text-muted fst-italic mt-2">"{selectedContract.note || "Không có ghi chú"}"</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Đóng</Button>
                    <Button variant="primary" onClick={() => navigate(`/contracts/${selectedContract?.contract_id}`)}>Chỉnh sửa</Button>
                </Modal.Footer>
            </Modal>

            {/* --- MODAL 2: DANH SÁCH PHỤ LỤC --- */}
            <Modal show={showAddendumListModal} onHide={() => setShowAddendumListModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Danh sách Phụ lục <small className="text-muted fs-6">(HĐ #{selectedContract?.contract_number || selectedContract?.contract_id})</small></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingAddendums ? (
                        <div className="text-center py-4"><Spinner animation="border" variant="primary"/></div>
                    ) : (
                        <div className="table-responsive">
                            <Table striped hover size="sm" className="mb-0">
                                <thead className="bg-light">
                                <tr>
                                    <th>Ngày ký</th>
                                    <th>Nội dung</th>
                                    <th>File</th>
                                    <th className="text-end">Xóa</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentAddendums.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-3 text-muted">Chưa có phụ lục nào.</td></tr>
                                ) : (
                                    currentAddendums.map(add => (
                                        <tr key={add.id}>
                                            <td>{formatDate(add.signed_date)}</td>
                                            <td>{add.description}</td>
                                            <td>
                                                {add.file_url ? (
                                                    <a href={add.file_url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                        <FileEarmarkText /> Xem
                                                    </a>
                                                ) : <span className="text-muted small">Không có</span>}
                                            </td>
                                            <td className="text-end">
                                                <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteAddendum(add.id)}>
                                                    <Trash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddendumListModal(false)}>Đóng</Button>
                    <Button variant="primary" onClick={() => { setShowAddendumListModal(false); handleOpenAddAddendum(selectedContract); }}>
                        <PlusLg /> Thêm mới
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- MODAL 3: THÊM PHỤ LỤC --- */}
            <Modal show={showAddAddendumModal} onHide={() => setShowAddAddendumModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Thêm Phụ lục mới</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Ngày ký</Form.Label>
                            <Form.Control
                                type="date"
                                value={newAddendumData.signed_date}
                                onChange={(e) => setNewAddendumData({...newAddendumData, signed_date: e.target.value})}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nội dung tóm tắt</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Ví dụ: Gia hạn thêm 6 tháng..."
                                value={newAddendumData.description}
                                onChange={(e) => setNewAddendumData({...newAddendumData, description: e.target.value})}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>File đính kèm (PDF/Ảnh)</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={(e) => setNewAddendumData({...newAddendumData, file: e.target.files[0]})}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddAddendumModal(false)}>Hủy</Button>
                    <Button variant="success" onClick={handleSubmitAddendum}>Lưu Phụ lục</Button>
                </Modal.Footer>
            </Modal>

            {/* --- MODAL PREVIEW & DELETE (CŨ) --- */}
            <Modal show={showFilePreviewModal} onHide={() => {setShowFilePreviewModal(false); setFilePreviewUrl(null);}} size="xl" centered>
                <Modal.Body className="p-0 bg-dark position-relative" style={{height:'85vh'}}>
                    <Button variant="light" size="sm" className="position-absolute top-0 end-0 m-3 z-3" onClick={()=>setShowFilePreviewModal(false)}>✕</Button>
                    {previewLoading ? <div className="d-flex h-100 justify-content-center align-items-center"><Spinner variant="light"/></div> : (
                        filePreviewUrl && (
                            filePreviewType?.startsWith("image/")
                                ? <img src={filePreviewUrl} alt="preview" className="w-100 h-100 object-fit-contain" />
                                : <iframe title="pdf-viewer" src={filePreviewUrl} className="w-100 h-100 border-0" />
                        )
                    )}
                </Modal.Body>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Body className="text-center p-4">
                    <div className="text-danger mb-3"><Trash size={40}/></div>
                    <h5>Xác nhận xóa hợp đồng?</h5>
                    <p className="text-muted">Dữ liệu sẽ bị xóa vĩnh viễn.</p>
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