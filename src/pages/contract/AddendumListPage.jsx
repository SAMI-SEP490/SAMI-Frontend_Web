// src/pages/addendum/AddendumListPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Spinner, OverlayTrigger, Tooltip, Form, Badge } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
    listAddendums,
    deleteAddendum,
    approveAddendum,
    rejectAddendum,
    downloadAddendumDirect
} from "../../services/api/addendum";
import { listContracts } from "../../services/api/contracts";
import { getAccessToken } from "../../services/http";
import {
    PlusLg, Download, Eye, Trash,
    ArrowClockwise, CheckCircle, XCircle,
    PencilSquare, Journals
} from "react-bootstrap-icons";
import "./AddendumListPage.css";

function AddendumListPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [userRole, setUserRole] = useState("");

    const [allAddendums, setAllAddendums] = useState([]);
    const [contractList, setContractList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [filters, setFilters] = useState({
        status: "",
        contract_id: "",
        start_date: "",
        end_date: "",
        q: ""
    });

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAddendum, setSelectedAddendum] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

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
            const res = await listAddendums();
            // Backend trả về data trực tiếp hoặc trong res.data
            setAllAddendums(Array.isArray(res) ? res : (res.data || []));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchContractList = async () => {
        try {
            const res = await listContracts();
            setContractList(Array.isArray(res) ? res : (res.items || []));
        } catch (err) { console.error(err); }
    };

    // --- MEMOS ---
    const filteredAddendums = useMemo(() => {
        let result = [...allAddendums];

        if (filters.q) {
            const lowerQ = filters.q.toLowerCase();
            result = result.filter(a =>
                (String(a.addendum_number).toLowerCase().includes(lowerQ)) ||
                (a.contract?.contract_number?.toLowerCase().includes(lowerQ)) || // SỬA: truy cập vào a.contract
                (a.contract?.tenant_name?.toLowerCase().includes(lowerQ))        // SỬA: truy cập vào a.contract
            );
        }

        if (filters.status) {
            result = result.filter(a => a.status === filters.status);
        }

        if (filters.contract_id) {
            result = result.filter(a => String(a.contract_id) === String(filters.contract_id));
        }

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
            // SỬA: Dùng addendum.addendum_id thay vì .id
            const fileName = `PLHD-${addendum.addendum_number}.pdf`;
            const blob = await downloadAddendumDirect(addendum.addendum_id);
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
            // SỬA: Filter theo addendum_id
            setAllAddendums(prev => prev.filter(item => item.addendum_id !== deleteId));
            setShowDeleteModal(false);
        } catch (e) { alert("Lỗi xóa: " + e.message); }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xác nhận phụ lục này? Các thay đổi sẽ được áp dụng vào hợp đồng.")) return;
        setActionLoading(true);
        try {
            await approveAddendum(id);
            // SỬA: Map theo addendum_id
            setAllAddendums(prev => prev.map(item =>
                item.addendum_id === id ? { ...item, status: 'approved' } : item
            ));
            if (selectedAddendum?.addendum_id === id) setShowDetailModal(false);
            alert("Đã duyệt phụ lục thành công!");
        } catch (e) { alert("Lỗi duyệt: " + e.message); }
        finally { setActionLoading(false); }
    };

    const handleRejectSubmit = async () => {
        if (!selectedAddendum) return;
        setActionLoading(true);
        try {
            // SỬA: Dùng addendum_id
            await rejectAddendum(selectedAddendum.addendum_id, rejectReason);
            setAllAddendums(prev => prev.map(item =>
                item.addendum_id === selectedAddendum.addendum_id ? { ...item, status: 'rejected' } : item
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
            expired: { label: "Đã hết hạn", css: "bg-secondary" }, // Thêm trạng thái expired
        };
        const item = map[status] || { label: status, css: "bg-secondary" };
        return <Badge className={item.css}>{item.label}</Badge>;
    };

    const renderChangesSummary = (changes) => {
        // SỬA: Backend trả về changes_snapshot, có thể là Object sẵn hoặc String JSON
        if (!changes) return <span className="text-muted">Không có dữ liệu</span>;
        try {
            const changesObj = typeof changes === 'string' ? JSON.parse(changes) : changes;
            const keys = Object.keys(changesObj).filter(k => k !== 'previous_values'); // Lọc bỏ previous_values nếu có
            if (keys.length === 0) return <span className="text-muted">Không thay đổi</span>;

            return (
                <small className="text-muted">
                    {keys.slice(0, 2).map(k => {
                        const labelMap = {
                            rent_amount: "Giá thuê",
                            end_date: "Ngày kết thúc",
                            deposit_amount: "Tiền cọc",
                            payment_cycle_months: "Chu kỳ thanh toán",
                            penalty_rate: "Phạt quá hạn"
                        };
                        return labelMap[k] || k;
                    }).join(", ")}
                    {keys.length > 2 && "..."}
                </small>
            );
        } catch (e) { return <span className="text-muted">Lỗi định dạng</span>; }
    };

    const WithTooltip = ({ text, children }) => (
        <OverlayTrigger placement="top" overlay={<Tooltip>{text}</Tooltip>}>
            {children}
        </OverlayTrigger>
    );

    return (
        <div className="contract-page-container">
            {/* ... (HEADER giữ nguyên) ... */}
            <div className="page-header">
                <div className="page-title">
                    <h2>Quản lý Phụ lục Hợp đồng</h2>
                    <p>Danh sách các phụ lục, gia hạn và điều chỉnh hợp đồng.</p>
                </div>
                {(userRole === "OWNER" || userRole === "MANAGER") && (
                    <Button
                        variant="primary"
                        className="shadow-sm d-flex align-items-center gap-2"
                        onClick={() => navigate(`/contracts/${id || 'all'}/addendum/create`)}
                    >
                        <PlusLg /> Tạo phụ lục mới
                    </Button>
                )}
            </div>

            {/* ... (FILTER giữ nguyên) ... */}
            <div className="filter-card">
                {/* ... code filter giữ nguyên ... */}
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
                    {/* ... các filter khác giữ nguyên ... */}
                    <div className="filter-group">
                        <label>Trạng thái</label>
                        <select name="status" className="form-select form-select-sm" value={filters.status} onChange={handleFilterChange}>
                            <option value="">-- Tất cả --</option>
                            <option value="pending_approval">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                            <option value="expired">Đã hết hạn</option>
                        </select>
                    </div>
                    {/* ... */}
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
                            // SỬA: Truy cập item.contract...
                            const contractNumber = item.contract?.contract_number || "N/A";
                            const tenantName = item.contract?.tenant_name || "N/A";
                            const changes = item.changes_snapshot; // SỬA: Tên trường trong DB/Service

                            return (
                                <tr key={item.addendum_id}> {/* SỬA: key là addendum_id */}
                                    <td className="text-center text-muted">{idx}</td>

                                    <td>
                                        <div className="fw-bold">PL-{item.addendum_number}</div>
                                        <small className="text-muted">{formatDate(item.created_at)}</small>
                                    </td>

                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-medium text-primary" style={{cursor:'pointer'}} onClick={() => navigate(`/contracts/${item.contract_id}`)}>
                                                HĐ: {contractNumber}
                                            </span>
                                            <small className="text-muted">{tenantName}</small>
                                        </div>
                                    </td>

                                    <td>{renderChangesSummary(changes)}</td>

                                    <td>{formatDate(item.effective_from)}</td>

                                    <td>{renderStatus(item.status)}</td>

                                    <td>
                                        <div className="action-cell">
                                            <WithTooltip text="Xem chi tiết">
                                                <button className="btn-icon view" onClick={() => { setSelectedAddendum(item); setShowDetailModal(true); }}>
                                                    <Eye />
                                                </button>
                                            </WithTooltip>

                                            {/* DOWNLOAD: chỉ hiện nếu có file (has_file) */}
                                            {item.has_file && (
                                                <WithTooltip text="Tải phụ lục">
                                                    <button className="btn-icon download" onClick={() => handleDownload(item)} disabled={actionLoading}>
                                                        <Download />
                                                    </button>
                                                </WithTooltip>
                                            )}

                                            {/* OWNER ACTIONS */}
                                            {(userRole === "OWNER" || userRole === "MANAGER") && ['pending_approval', 'rejected'].includes(item.status) && (
                                                <>
                                                    <WithTooltip text="Chỉnh sửa">
                                                        {/* SỬA: Link đúng param */}
                                                        <button className="btn-icon edit" onClick={() => navigate(`/contracts/${item.contract_id}/addendum/${item.addendum_id}/edit`)}>
                                                            <PencilSquare />
                                                        </button>
                                                    </WithTooltip>
                                                    <WithTooltip text="Xóa">
                                                        {/* SỬA: setDeleteId dùng addendum_id */}
                                                        <button className="btn-icon delete" onClick={() => { setDeleteId(item.addendum_id); setShowDeleteModal(true); }}>
                                                            <Trash />
                                                        </button>
                                                    </WithTooltip>
                                                </>
                                            )}

                                            {/* TENANT ACTIONS */}
                                            {userRole === "TENANT" && item.status === 'pending_approval' && (
                                                <>
                                                    <WithTooltip text="Đồng ý">
                                                        <button className="btn-icon success text-success" onClick={() => handleApprove(item.addendum_id)} disabled={actionLoading}>
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

            {/* ... (PAGINATION giữ nguyên) ... */}

            {/* --- MODAL DETAIL --- */}
            <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
                {/* ... Header ... */}
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
                                        <Journals /> <span className="fw-bold fs-5">PL-{selectedAddendum.addendum_number}</span>
                                    </div>
                                    {/* SỬA: Truy cập đúng contract info */}
                                    <div className="small text-muted">Hợp đồng gốc: {selectedAddendum.contract?.contract_number}</div>
                                </div>
                                {renderStatus(selectedAddendum.status)}
                            </div>

                            {/* Changes Detail */}
                            <div className="border p-3 rounded">
                                <h6 className="text-primary border-bottom pb-2">Nội dung thay đổi</h6>
                                {(() => {
                                    try {
                                        // SỬA: Dùng changes_snapshot
                                        const changes = typeof selectedAddendum.changes_snapshot === 'string'
                                            ? JSON.parse(selectedAddendum.changes_snapshot)
                                            : selectedAddendum.changes_snapshot;

                                        if(!changes || Object.keys(changes).length === 0) return <p>Không có thay đổi dữ liệu.</p>;

                                        const dict = {
                                            rent_amount: "Giá thuê",
                                            deposit_amount: "Tiền đặt cọc",
                                            end_date: "Ngày kết thúc hợp đồng",
                                            start_date: "Ngày bắt đầu",
                                            note: "Ghi chú",
                                            payment_cycle_months: "Chu kỳ thanh toán",
                                            penalty_rate: "Lãi phạt"
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
                                                {Object.entries(changes).map(([key, val]) => {
                                                    if (key === 'previous_values') return null; // Ẩn previous values
                                                    return (
                                                        <tr key={key}>
                                                            <td>{dict[key] || key}</td>
                                                            <td className="fw-bold">
                                                                {key.includes('amount')
                                                                    ? `${Number(val).toLocaleString()} ₫`
                                                                    : (key.includes('date') ? formatDate(val) : val)
                                                                }
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                </tbody>
                                            </Table>
                                        );
                                    } catch(e) { return <p className="text-danger">Lỗi hiển thị dữ liệu thay đổi.</p> }
                                })()}
                            </div>

                            <div className="d-flex justify-content-between small text-muted px-1">
                                <div>Người tạo: {selectedAddendum.creator?.full_name || 'N/A'}</div>
                                <div>Ngày hiệu lực: {formatDate(selectedAddendum.effective_from)}</div>
                            </div>

                            {selectedAddendum.status === 'rejected' && selectedAddendum.note && (
                                <div className="alert alert-danger mt-2">
                                    <strong>Lý do từ chối:</strong> {selectedAddendum.note}
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
                            <Button variant="success" onClick={() => handleApprove(selectedAddendum.addendum_id)}>Xác nhận đồng ý</Button>
                        </>
                    )}

                    {selectedAddendum?.has_file && (
                        <Button variant="outline-primary" onClick={() => handleDownload(selectedAddendum)}>
                            <Download className="me-2"/> Tải File
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* --- MODAL REJECT --- */}
            {/* Giữ nguyên logic modal reject, chỉ lưu ý handleRejectSubmit đã sửa ở trên dùng addendum_id */}
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

            {/* ... Modal Delete giữ nguyên (đã sửa handleDelete dùng addendum_id) ... */}
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