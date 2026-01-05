// src/pages/contract/EditContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, fetchContractFileBlob } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getEmptyRoomsByBuildingId } from "@/services/api/rooms.js";
// [UPDATE] Import lookupTenant
import { lookupTenant } from "@/services/api/tenants.js";

import { Button, Spinner, Alert, Row, Col, Card, Image } from "react-bootstrap";
import {
    Building, CalendarDate, CashCoin, FileEarmarkText,
    CheckCircleFill, XLg, Search, Telephone, PersonBadge,
    FileEarmarkPdf, FileEarmarkImage, PencilSquare, Save, BoxArrowUpRight
} from "react-bootstrap-icons";
import "./EditContractPage.css"; // Có thể dùng chung CSS hoặc CSS riêng
import { getAccessToken } from "@/services/http.js";

function EditContractPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [contract, setContract] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);

    // [UPDATE] Tenant Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [foundTenant, setFoundTenant] = useState(null); // Tenant object
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    const [assignedBuilding, setAssignedBuilding] = useState(null);

    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "",
        tenant_user_id: "",
        start_date: "",
        duration_months: 12, // Thêm duration cho đồng bộ
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        penalty_rate: 0.1,
        payment_cycle_months: 1,
        status: "pending",
        note: "",
        files: [] // [UPDATE] Array files
    });

    // --- EFFECT: Calculate End Date automatically (Giống CreatePage) ---
    useEffect(() => {
        if (form.start_date && form.duration_months) {
            const start = new Date(form.start_date);
            const duration = parseInt(form.duration_months);
            if (!isNaN(start.getTime()) && !isNaN(duration) && duration > 0) {
                const end = new Date(start);
                end.setMonth(end.getMonth() + duration);
                setForm(prev => ({ ...prev, end_date: end.toISOString().split('T')[0] }));
            }
        }
    }, [form.start_date, form.duration_months]);

    // Get Role
    useEffect(() => {
        try {
            const token = getAccessToken();
            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                setUserRole((decoded.role || decoded.userRole || "").toUpperCase());
            }
        } catch (error) { console.error(error); }
    }, []);

    // Load Data
    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const data = await getContractById(id);
                setContract(data);

                const currentBuildingId = data.building_id ?? data.buildingId ?? data.building?.id ?? "";
                const currentRoomNum = data.room_number ?? data.room ?? "";

                // [UPDATE] Load Tenant Info ban đầu
                if (data.tenant_user_id) {
                    setFoundTenant({
                        user_id: data.tenant_user_id,
                        full_name: data.tenant_name,
                        phone: data.tenant_phone,
                        // Nếu API getContract trả về id_number thì tốt, ko thì tạm để trống hoặc fetch thêm
                        id_number: data.tenant_id_number || "..."
                    });
                    setSearchQuery(data.tenant_phone || "");
                }

                // Load Buildings
                if (userRole === "MANAGER") {
                    const assigned = await listAssignedBuildings();
                    if (Array.isArray(assigned) && assigned.length > 0) {
                        setAssignedBuilding(assigned[0]);
                    }
                } else {
                    const bRes = await listBuildings();
                    const items = Array.isArray(bRes) ? bRes : (bRes.items || []);
                    setBuildings(items.map(x => ({ id: x.id ?? x.building_id, name: x.name ?? x.building_name })));
                }

                // Load Rooms
                let tempRooms = [];
                if (currentBuildingId) {
                    const rRes = await getEmptyRoomsByBuildingId(currentBuildingId);
                    tempRooms = Array.isArray(rRes) ? rRes : rRes.data || [];

                    // Vì phòng hiện tại của hợp đồng này đang "Occupied" bởi chính nó,
                    // nên API getEmptyRooms có thể không trả về phòng này.
                    // Cần push phòng hiện tại vào list nếu chưa có (để hiển thị đúng trong select box)
                    const currentRoomInList = tempRooms.find(r => r.room_id === data.room_id);
                    if (!currentRoomInList) {
                        tempRooms.push({
                            room_id: data.room_id,
                            room_number: currentRoomNum,
                            status: 'occupied' // Đánh dấu để biết
                        });
                        // Sort lại theo tên phòng cho đẹp
                        tempRooms.sort((a,b) => a.room_number.localeCompare(b.room_number, undefined, {numeric: true}));
                    }

                    setRooms(tempRooms);
                }

                setForm({
                    building_id: currentBuildingId,
                    room_number: currentRoomNum,
                    room_id: data.room_id,
                    tenant_user_id: data.tenant_user_id,
                    start_date: data.start_date ? data.start_date.slice(0,10) : "",
                    duration_months: data.duration_months || 12,
                    end_date: data.end_date ? data.end_date.slice(0,10) : "",
                    rent_amount: data.rent_amount ?? "",
                    deposit_amount: data.deposit_amount ?? "",
                    penalty_rate: data.penalty_rate || 0.1,
                    payment_cycle_months: data.payment_cycle_months || 1,
                    status: data.status ?? "pending",
                    note: data.note ?? "",
                    files: []
                });

            } catch (error) {
                console.error("Load contract error:", error);
                alert("Không tải được dữ liệu.");
            } finally {
                setLoading(false);
            }
        }
        if(userRole || userRole === "") init();
    }, [id, userRole]);

    // --- HANDLERS ---
    const handleBuildingChange = async (e) => {
        const bId = e.target.value;
        setForm(prev => ({ ...prev, building_id: bId, room_number: "", room_id: "" }));
        setRooms([]);
        if (bId) {
            const res = await getEmptyRoomsByBuildingId(bId);
            setRooms(Array.isArray(res) ? res : res.data || []);
        }
    };

    const handleRoomChange = async (e) => {
        const rId = e.target.value;
        const selectedRoom = rooms.find(r => String(r.room_id) === String(rId));
        setForm(prev => ({
            ...prev,
            room_id: rId,
            room_number: selectedRoom ? selectedRoom.room_number : "",
        }));
    };

    // [UPDATE] Handler tìm kiếm Tenant (Giống CreatePage)
    const handleSearchTenant = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchError("");
        setFoundTenant(null);
        setForm(prev => ({...prev, tenant_user_id: ""}));

        try {
            const tenant = await lookupTenant(searchQuery);
            if (tenant) {
                setFoundTenant(tenant);
                setForm(prev => ({...prev, tenant_user_id: tenant.user_id}));
            } else {
                setSearchError("Không tìm thấy khách thuê này.");
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setSearchError("Không tìm thấy dữ liệu (404).");
            } else {
                setSearchError("Lỗi hệ thống khi tìm kiếm.");
            }
        } finally {
            setSearchLoading(false);
        }
    };

    const handleClearTenant = () => {
        setFoundTenant(null);
        setSearchQuery("");
        setForm(prev => ({...prev, tenant_user_id: ""}));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;
        const hasPDF = selectedFiles.some(f => f.type === "application/pdf");
        if (hasPDF && selectedFiles.length > 1) {
            alert("Nếu chọn PDF, bạn chỉ được phép tải lên 1 file duy nhất.");
            e.target.value = "";
            return;
        }
        setForm(prev => ({ ...prev, files: selectedFiles }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // [UPDATE] Build FormData for update (support multi files)
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'files') {
                    form.files.forEach(file => {
                        formData.append('contract_file', file);
                    });
                } else {
                    formData.append(key, form[key]);
                }
            });

            await updateContract(id, formData);
            alert("Cập nhật thành công");
            navigate("/contracts");
        } catch (error) {
            alert("Lỗi: " + (error?.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePreviewFile = async () => {
        if (!contract?.has_file) return alert("Không có file để xem.");
        try {
            const blob = await fetchContractFileBlob(contract.contract_id ?? id);
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
        } catch (error) {
            alert("Không preview được file.");
        }
    };

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="edit-contract-page-container container mt-4">
            {/* Header */}
            <div className="edit-contract-header mb-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
                <div>
                    <h3 className="m-0 text-primary">
                        <PencilSquare className="me-2"/>
                        Chỉnh sửa hợp đồng #{contract?.contract_number || id}
                    </h3>
                    <p className="text-muted mb-0 mt-1">Cập nhật thông tin chi tiết và tệp đính kèm.</p>
                </div>
                <div className="badge bg-light text-dark border px-3 py-2">
                    Trạng thái: <strong>{contract?.status?.toUpperCase()}</strong>
                </div>
            </div>

            <div className="edit-contract-card card shadow-sm border-0">
                <div className="card-body p-4">
                    <form className="contract-form needs-validation" onSubmit={handleSubmit}>

                        {/* SECTION 1: INFO */}
                        <h5 className="mb-3 text-secondary d-flex align-items-center gap-2"><Building/> Thông tin bất động sản</h5>
                        <div className="row mb-3">
                            {/* 1. TÒA NHÀ */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Tòa nhà</label>
                                {userRole === "MANAGER" ? (
                                    <input type="text" className="form-control" value={assignedBuilding?.name || contract?.building_name} disabled />
                                ) : (
                                    <select name="building_id" className="form-select" value={form.building_id} onChange={handleBuildingChange} required>
                                        <option value="">-- Chọn tòa nhà --</option>
                                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* 2. PHÒNG */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Số phòng</label>
                                <select name="room_id" className="form-select" value={form.room_id} onChange={handleRoomChange} required>
                                    <option value="">-- Chọn phòng --</option>
                                    {rooms.map(r => (
                                        <option key={r.room_id} value={r.room_id}>
                                            Phòng {r.room_number} {r.status === 'occupied' && r.room_id === parseInt(form.room_id) ? "(Hiện tại)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. KHÁCH THUÊ [UPDATE UI] */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Khách thuê</label>
                                <div className="input-group mb-2">
                                    <input
                                        type="text"
                                        className={`form-control ${searchError ? 'is-invalid' : ''}`}
                                        placeholder="Nhập SĐT hoặc CCCD..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchTenant())}
                                        disabled={!!foundTenant}
                                    />
                                    {foundTenant ? (
                                        <Button variant="outline-danger" onClick={handleClearTenant}>
                                            <XLg />
                                        </Button>
                                    ) : (
                                        <Button variant="outline-primary" onClick={handleSearchTenant} disabled={searchLoading}>
                                            {searchLoading ? <Spinner size="sm"/> : <Search />}
                                        </Button>
                                    )}
                                </div>
                                {searchError && <div className="text-danger small mb-2">{searchError}</div>}

                                {/* USER CARD */}
                                {foundTenant && (
                                    <Card className="tenant-info-card border-success bg-light">
                                        <Card.Body className="p-2">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-placeholder rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{width:35, height:35}}>
                                                    {foundTenant.full_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="fw-bold text-success text-truncate">{foundTenant.full_name}</div>
                                                    <div className="small text-muted"><Telephone size={10}/> {foundTenant.phone}</div>
                                                </div>
                                                <CheckCircleFill className="text-success"/>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </div>
                        </div>

                        <hr className="my-4 text-muted opacity-25" />

                        {/* SECTION 2: FINANCE */}
                        <h5 className="mb-3 text-secondary d-flex align-items-center gap-2"><CalendarDate/> Thời hạn & Tài chính</h5>
                        <Row className="mb-3">
                            <Col md={3}>
                                <label className="form-label">Ngày bắt đầu</label>
                                <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} required />
                            </Col>
                            <Col md={3}>
                                <label className="form-label">Thời hạn (Tháng)</label>
                                <input type="number" name="duration_months" className="form-control" value={form.duration_months} onChange={handleChange} min="1" required />
                            </Col>
                            <Col md={3}>
                                <label className="form-label">Ngày kết thúc</label>
                                <input type="date" className="form-control" value={form.end_date} readOnly />
                            </Col>
                            <Col md={3}>
                                <label className="form-label">Chu kỳ thanh toán (Tháng)</label>
                                <select name="payment_cycle_months" className="form-select" value={form.payment_cycle_months} onChange={handleChange}>
                                    <option value="1">1 tháng / lần</option>
                                    <option value="3">3 tháng / lần</option>
                                    <option value="6">6 tháng / lần</option>
                                    <option value="12">1 năm / lần</option>
                                </select>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col md={4}>
                                <label className="form-label">Tiền thuê (VNĐ)</label>
                                <div className="input-group">
                                    <input type="number" name="rent_amount" className="form-control" value={form.rent_amount} onChange={handleChange} />
                                    <span className="input-group-text">₫</span>
                                </div>
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Tiền cọc (VNĐ)</label>
                                <div className="input-group">
                                    <input type="number" name="deposit_amount" className="form-control" value={form.deposit_amount} onChange={handleChange} />
                                    <span className="input-group-text">₫</span>
                                </div>
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Phạt quá hạn (%)</label>
                                <div className="input-group">
                                    <input type="number" name="penalty_rate" className="form-control" value={form.penalty_rate} onChange={handleChange} step="0.01" min="0.01" max="1" />
                                    <span className="input-group-text">%</span>
                                </div>
                            </Col>
                        </Row>

                        {/* SECTION 3: STATUS & FILE */}
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Trạng thái hợp đồng</label>
                                <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="rejected">Bị từ chối</option>
                                    <option value="active" disabled>Hiệu lực (Active)</option>
                                </select>

                            </div>
                            <div className="col-md-8">
                                <label className="form-label">Ghi chú bổ sung</label>
                                <textarea name="note" className="form-control" value={form.note} onChange={handleChange} rows={2} placeholder="Nhập ghi chú..." />
                            </div>
                        </div>

                        {/* FILE UPLOAD SECTION [UPDATE] */}
                        <div className="file-upload-section bg-light p-3 rounded-3 mb-4 border dashed-border">
                            <h6 className="mb-3 d-flex align-items-center gap-2"><FileEarmarkText/> Tệp đính kèm hợp đồng</h6>
                            <div className="row align-items-center">
                                <div className="col-md-7">
                                    <label className="form-label small text-muted mb-1">Tải file mới (PDF hoặc Nhiều ảnh) để thay thế:</label>
                                    <input type="file" name="file" accept=".pdf,image/*" multiple onChange={handleFileChange} className="form-control" />

                                    {form.files && form.files.length > 0 && (
                                        <div className="mt-2 text-start d-inline-block">
                                            {form.files.map((f, idx) => (
                                                <div key={idx} className="small text-success fw-bold d-flex align-items-center gap-1">
                                                    {f.type === 'application/pdf' ? <FileEarmarkPdf/> : <FileEarmarkImage/>}
                                                    {f.name}
                                                </div>
                                            ))}
                                            <div className="small text-muted mt-1">Đã chọn {form.files.length} file mới.</div>
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-5 mt-3 mt-md-0 text-md-end">
                                    {contract?.has_file ? (
                                        <Alert variant="info" className="d-inline-flex align-items-center m-0 py-2 px-3">
                                            <FileEarmarkPdf className="h5 m-0 me-2"/>
                                            <div>
                                                <div className="small fw-bold">File hiện tại</div>
                                                <Button variant="link" className="p-0 text-decoration-none small" onClick={handlePreviewFile}>
                                                    Xem chi tiết <BoxArrowUpRight className="ms-1"/>
                                                </Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <span className="text-muted small fst-italic">Chưa có file nào được tải lên.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions d-flex justify-content-end gap-2 pt-3 border-top">
                            <Button variant="light" className="px-4 text-secondary fw-semibold" onClick={() => navigate("/contracts")}>
                                <XLg className="me-2"/>Hủy bỏ
                            </Button>
                            <Button type="submit" variant="primary" className="px-4 fw-bold shadow-sm" disabled={submitting}>
                                {submitting ? <><Spinner size="sm" animation="border" className="me-2" /> Đang lưu...</> : <><Save className="me-2"/>Cập nhật</>}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditContractPage;