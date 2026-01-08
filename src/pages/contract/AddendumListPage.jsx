// src/pages/addendum/AddendumListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner, OverlayTrigger, Tooltip, Form, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
    listAddendums,
    deleteAddendum,
    approveAddendum,
    rejectAddendum,
    downloadAddendumDirect
} from "../../services/api/addendum";
import { listContracts } from "../../services/api/contracts"; // Để filter theo hợp đồng
import { getAccessToken } from "../../services/http";
import {
    PlusLg, Download, Eye, Trash,
    ArrowClockwise, FileEarmarkPdf, CheckCircle, XCircle,
    PencilSquare, Journals
} from "react-bootstrap-icons";
import "./AddendumListPage.css"; // Có thể dùng chung CSS hoặc copy từ ContractListPage.css

function AddendumListPage() {
    const navigate = useNavigate();

    // --- ROLE ---
    const [userRole, setUserRole] = useState("");

    // --- DATA ---
    const [allAddendums, setAllAddendums] = useState([]);
    const [contractList, setContractList] = useState([]); // Cho filter dropdown
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // Loading cho nút approve/reject/download

    // --- PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- FILTERS ---
    const [filters, setFilters] = useState({
        status: "",
        contract_id: "",
        start_date: "", // Tìm theo ngày tạo hoặc ngày hiệu lực
        end_date: "",
        q: "" // Search text
    });

    // --- MODALS ---
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAddendum, setSelectedAddendum] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Tenant Action Modals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

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
        fetchAddendums();
        fetchContractList();
    }, []);

    const fetchAddendums = async () => {
        setLoading(true);
        try {
            // Backend có thể hỗ trợ params filter trực tiếp, hoặc ta filter client-side như ContractListPage
            const res = await listAddendums();
            setAllAddendums(Array.isArray(res) ? res : (res.data || []));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchContractList = async () => {
        try {
            // Lấy danh sách hợp đồng để hiển thị trong Filter Dropdown
            const res = await listContracts();
            setContractList(Array.isArray(res) ? res : (res.items || []));
        } catch (err) { console.error(err); }
    };

    // --- MEMOS ---
    const filteredAddendums = useMemo(() => {
        let result = [...allAddendums];

        // Filter by Search Text (Mã phụ lục, Tên khách, Số HĐ)
        if (filters.q) {
            const lowerQ = filters.q.toLowerCase();
            result = result.filter(a =>
                (a.addendum_number?.toLowerCase().includes(lowerQ)) ||
                (a.contract_number?.toLowerCase().includes(lowerQ)) ||
                (a.tenant_name?.toLowerCase().includes(lowerQ))
            );
        }

        // Filter by Status
        if (filters.status) {
            result = result.filter(a => a.status === filters.status);
        }

        // Filter by Contract
        if (filters.contract_id) {
            result = result.filter(a => String(a.contract_id) === String(filters.contract_id));
        }

        // Filter by Date (Effective Date)
        if (filters.start_date) {
            result = result.filter(a => a.effective_from && new Date(a.effective_from) >= new Date(filters.start_date));
        }
        if (filters.end_date) {
            result = result.filter(a => a.effective_from && new Date(a.effective_from) <= new Date(filters.end_date));
        }

        return result;
    }, [allAddendums, filters]);

    const currentTableData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAddendums.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAddendums, currentPage]);

    const totalPages = Math.ceil(filteredAddendums.length / itemsPerPage);

    // --- HANDLERS ---
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const handleDownload = async (addendum) => {
        setActionLoading(true);
        try {
            // Mặc định tên file tải về
            const fileName = `PLHD-${addendum.addendum_number || addendum.id}.pdf`;
            // Hàm này trả về Blob, cần tạo thẻ a để tải
            const blob = await downloadAddendumDirect(addendum.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) { alert("Lỗi tải file: " + e.message); }
        finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteAddendum(deleteId);
            setAllAddendums(prev => prev.filter(item => item.id !== deleteId));
            setShowDeleteModal(false);
        } catch (e) { alert("Lỗi xóa: " + e.message); }
    };

    // --- TENANT APPROVAL HANDLERS ---
    const handleApprove = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xác nhận phụ lục này? Các thay đổi sẽ được áp dụng vào hợp đồng.")) return;
        setActionLoading(true);
        try {
            await approveAddendum(id);
            // Update local state
            setAllAddendums(prev => prev.map(item =>
                item.id === id ? { ...item, status: 'approved' } : item
            ));
            if (selectedAddendum?.id === id) setShowDetailModal(false);
            alert("Đã duyệt phụ lục thành công!");
        } catch (e) { alert("Lỗi duyệt: " + e.message); }
        finally { setActionLoading(false); }
    };

    const handleRejectSubmit = async () => {
        if (!selectedAddendum) return;
        setActionLoading(true);
        try {
            await rejectAddendum(selectedAddendum.id, rejectReason);
            setAllAddendums(prev => prev.map(item =>
                item.id === selectedAddendum.id ? { ...item, status: 'rejected' } : item
            ));
            setShowRejectModal(false);
            setShowDetailModal(false);
            setRejectReason("");
            alert("Đã từ chối phụ lục.");
        } catch (e) { alert("Lỗi từ chối: " + e.message); }
        finally { setActionLoading(false); }
    };

    // --- RENDER HELPERS ---
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const renderStatus = (status) => {
        const map = {
            approved: { label: "Đã duyệt", css: "bg-success" },
            pending_approval: { label: "Chờ duyệt", css: "bg-warning text-dark" },
            rejected: { label: "Đã từ chối", css: "bg-danger" },
        };
        const item = map[status] || { label: status, css: "bg-secondary" };
        return <Badge className={item.css}>{item.label}</Badge>;
    };

    const renderChangesSummary = (changes) => {
        if (!changes) return <span className="text-muted">Không có dữ liệu</span>;
        try {
            const changesObj = typeof changes === 'string' ? JSON.parse(changes) : changes;
            const keys = Object.keys(changesObj);
            if (keys.length === 0) return <span className="text-muted">Không thay đổi</span>;
            return (
                <small className="text-muted">
                    {keys.slice(0, 2).map(k => {
                        // Mapping tên trường sang tiếng Việt
                        const labelMap = { rent_amount: "Giá thuê", end_date: "Ngày kết thúc", deposit_amount: "Tiền cọc" };
                        return labelMap[k] || k;
                    }).join(", ")}
                    {keys.length > 2 && "..."}
                </small>
            );
        } catch (e) { return <span className="text-muted">Lỗi định dạng</span>; }
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
                    <h2>Quản lý Phụ lục Hợp đồng</h2>
                    <p>Danh sách các phụ lục, gia hạn và điều chỉnh hợp đồng.</p>
                </div>
                {(userRole === "OWNER" || userRole === "MANAGER") && (
                    <Button
                        variant="primary"
                        className="shadow-sm d-flex align-items-center gap-2"
                        onClick={() => navigate("/addendums/create")}
                    >
                        <PlusLg /> Tạo phụ lục mới
                    </Button>
                )}
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
                            placeholder="Mã PL, Khách, Hợp đồng..."
                            value={filters.q}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Hợp đồng gốc</label>
                        <select name="contract_id" className="form-select form-select-sm" value={filters.contract_id} onChange={handleFilterChange}>
                            <option value="">-- Tất cả --</option>
                            {contractList.map(c => (
                                <option key={c.contract_id} value={c.contract_id}>
                                    #{c.contract_number} - {c.tenant_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Trạng thái</label>
                        <select name="status" className="form-select form-select-sm" value={filters.status} onChange={handleFilterChange}>
                            <option value="">-- Tất cả --</option>
                            <option value="pending_approval">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Hiệu lực từ</label>
                        <input type="date" name="start_date" className="form-control form-control-sm" value={filters.start_date} onChange={handleFilterChange} />
                    </div>

                    {(filters.q || filters.status || filters.contract_id || filters.start_date) && (
                        <Button variant="light" size="sm" className="btn-reset-filter mb-1" onClick={() => setFilters({status:"", contract_id:"", start_date:"", end_date:"", q:""})}>
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
                        <th>Mã Phụ lục</th>
                        <th>Hợp đồng & Khách</th>
                        <th>Nội dung thay đổi</th>
                        <th>Ngày hiệu lực</th>
                        <th>Trạng thái</th>
                        <th className="text-end">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={7} className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                    ) : currentTableData.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-5 text-muted fst-italic">Không có dữ liệu phụ lục</td></tr>
                    ) : (
                        currentTableData.map((item, i) => {
                            const idx = (currentPage - 1) * itemsPerPage + i + 1;
                            return (
                                <tr key={item.id}>
                                    <td className="text-center text-muted">{idx}</td>

                                    <td>
                                        <div className="fw-bold">{item.addendum_number}</div>
                                        <small className="text-muted">{formatDate(item.created_at)}</small>
                                    </td>

                                    <td>
                                        <div className="d-flex flex-column">
                        <span className="fw-medium text-primary" style={{cursor:'pointer'}} onClick={() => navigate(`/contracts/${item.contract_id}`)}>
                            HĐ: {item.contract_number}
                        </span>
                                            <small className="text-muted">{item.tenant_name}</small>
                                        </div>
                                    </td>

                                    <td>{renderChangesSummary(item.changes)}</td>

                                    <td>{formatDate(item.effective_from)}</td>

                                    <td>{renderStatus(item.status)}</td>

                                    <td>
                                        <div className="action-cell">
                                            <WithTooltip text="Xem chi tiết">
                                                <button className="btn-icon view" onClick={() => { setSelectedAddendum(item); setShowDetailModal(true); }}>
                                                    <Eye />
                                                </button>
                                            </WithTooltip>

                                            {/* DOWNLOAD */}
                                            <WithTooltip text="Tải phụ lục">
                                                <button className="btn-icon download" onClick={() => handleDownload(item)} disabled={actionLoading}>
                                                    <Download />
                                                </button>
                                            </WithTooltip>

                                            {/* OWNER ACTIONS */}
                                            {(userRole === "OWNER" || userRole === "MANAGER") && item.status === 'pending_approval' && (
                                                <>
                                                    <WithTooltip text="Chỉnh sửa">
                                                        <button className="btn-icon edit" onClick={() => navigate(`/addendums/${item.id}`)}>
                                                            <PencilSquare />
                                                        </button>
                                                    </WithTooltip>
                                                    <WithTooltip text="Xóa">
                                                        <button className="btn-icon delete" onClick={() => { setDeleteId(item.id); setShowDeleteModal(true); }}>
                                                            <Trash />
                                                        </button>
                                                    </WithTooltip>
                                                </>
                                            )}

                                            {/* TENANT ACTIONS */}
                                            {userRole === "TENANT" && item.status === 'pending_approval' && (
                                                <>
                                                    <WithTooltip text="Đồng ý">
                                                        <button className="btn-icon success text-success" onClick={() => handleApprove(item.id)} disabled={actionLoading}>
                                                            <CheckCircle />
                                                        </button>
                                                    </WithTooltip>
                                                    <WithTooltip text="Từ chối">
                                                        <button className="btn-icon danger text-danger" onClick={() => { setSelectedAddendum(item); setShowRejectModal(true); }} disabled={actionLoading}>
                                                            <XCircle />
                                                        </button>
                                                    </WithTooltip>
                                                </>
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
                    <span className="text-muted small">Hiển thị {currentTableData.length} / {filteredAddendums.length} kết quả</span>
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
                <Modal.Header closeButton>
                    <Modal.Title className="h5 fw-bold">Chi tiết Phụ lục</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {selectedAddendum && (
                        <div className="d-flex flex-column gap-3">
                            {/* Info Header */}
                            <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded">
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Journals /> <span className="fw-bold fs-5">{selectedAddendum.addendum_number}</span>
                                    </div>
                                    <div className="small text-muted">Hợp đồng gốc: {selectedAddendum.contract_number}</div>
                                </div>
                                {renderStatus(selectedAddendum.status)}
                            </div>

                            {/* Changes Detail */}
                            <div className="border p-3 rounded">
                                <h6 className="text-primary border-bottom pb-2">Nội dung thay đổi</h6>
                                {(() => {
                                    try {
                                        const changes = typeof selectedAddendum.changes === 'string'
                                            ? JSON.parse(selectedAddendum.changes)
                                            : selectedAddendum.changes;

                                        if(!changes || Object.keys(changes).length === 0) return <p>Không có thay đổi dữ liệu.</p>;

                                        // Dictionary để hiển thị tên trường đẹp hơn
                                        const dict = {
                                            rent_amount: "Giá thuê",
                                            deposit_amount: "Tiền đặt cọc",
                                            end_date: "Ngày kết thúc hợp đồng",
                                            start_date: "Ngày bắt đầu",
                                            note: "Ghi chú",
                                            payment_term: "Kỳ thanh toán"
                                        };

                                        return (
                                            <Table size="sm" striped>
                                                <thead>
                                                <tr>
                                                    <th>Thông tin</th>
                                                    <th>Giá trị Mới</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {Object.entries(changes).map(([key, val]) => (
                                                    <tr key={key}>
                                                        <td>{dict[key] || key}</td>
                                                        <td className="fw-bold">
                                                            {key.includes('amount')
                                                                ? `${Number(val).toLocaleString()} ₫`
                                                                : (key.includes('date') ? formatDate(val) : val)
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        );
                                    } catch(e) { return <p className="text-danger">Lỗi hiển thị dữ liệu thay đổi.</p> }
                                })()}
                            </div>

                            {/* Footer Info */}
                            <div className="d-flex justify-content-between small text-muted px-1">
                                <div>Ngày ký: {formatDate(selectedAddendum.signing_date || selectedAddendum.created_at)}</div>
                                <div>Ngày hiệu lực: {formatDate(selectedAddendum.effective_from)}</div>
                            </div>

                            {/* Tenant Reject Reason (If rejected) */}
                            {selectedAddendum.status === 'rejected' && selectedAddendum.reject_reason && (
                                <div className="alert alert-danger mt-2">
                                    <strong>Lý do từ chối:</strong> {selectedAddendum.reject_reason}
                                </div>
                            )}

                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowDetailModal(false)}>Đóng</Button>

                    {selectedAddendum?.status === 'pending_approval' && userRole === 'TENANT' && (
                        <>
                            <Button variant="danger" onClick={() => { setShowRejectModal(true); }}>Từ chối</Button>
                            <Button variant="success" onClick={() => handleApprove(selectedAddendum.id)}>Xác nhận đồng ý</Button>
                        </>
                    )}

                    {selectedAddendum && (
                        <Button variant="outline-primary" onClick={() => handleDownload(selectedAddendum)}>
                            <Download className="me-2"/> Tải File
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* --- MODAL REJECT (Tenant only) --- */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Từ chối Phụ lục</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Vui lòng nhập lý do từ chối:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Ví dụ: Sai thông tin giá thuê..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowRejectModal(false)}>Hủy</Button>
                    <Button variant="danger" disabled={!rejectReason.trim() || actionLoading} onClick={handleRejectSubmit}>
                        {actionLoading ? <Spinner size="sm"/> : "Xác nhận từ chối"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- MODAL DELETE (Owner only) --- */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Body className="text-center p-4">
                    <div className="text-danger mb-3"><Trash size={40}/></div>
                    <h5>Xác nhận xóa phụ lục?</h5>
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

export default AddendumListPage;