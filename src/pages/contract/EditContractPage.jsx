// src/pages/contract/EditContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, fetchContractFileBlob } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getRoomsByBuildingId } from "@/services/api/rooms.js";
import { getTenantsByRoomId } from "@/services/api/tenants.js";

import { Button, Spinner, Alert } from "react-bootstrap"; // Thêm Alert
import "./EditContractPage.css";
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
    const [tenants, setTenants] = useState([]);

    const [assignedBuilding, setAssignedBuilding] = useState(null);

    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "",
        tenant_user_id: "",
        start_date: "",
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        status: "pending",
        note: "",
        file: null
    });

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
                const currentTenantId = data.tenant_user_id ?? "";

                let tempRooms = [];
                let foundRoomId = "";

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

                if (currentBuildingId) {
                    const rRes = await getRoomsByBuildingId(currentBuildingId);
                    tempRooms = Array.isArray(rRes) ? rRes : rRes.data || [];
                    setRooms(tempRooms);

                    const matchRoom = tempRooms.find(r => r.room_number == currentRoomNum);
                    if (matchRoom) {
                        foundRoomId = matchRoom.id || matchRoom._id || matchRoom.room_id;
                    }
                }

                if (foundRoomId) {
                    const tRes = await getTenantsByRoomId(foundRoomId);
                    setTenants(Array.isArray(tRes) ? tRes : []);
                }

                setForm({
                    building_id: currentBuildingId,
                    room_number: currentRoomNum,
                    room_id: foundRoomId,
                    tenant_user_id: currentTenantId,
                    start_date: data.start_date ? data.start_date.slice(0,10) : "",
                    end_date: data.end_date ? data.end_date.slice(0,10) : "",
                    rent_amount: data.rent_amount ?? "",
                    deposit_amount: data.deposit_amount ?? "",
                    status: data.status ?? "pending",
                    note: data.note ?? "",
                    file: null
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

    const handleBuildingChange = async (e) => {
        const bId = e.target.value;
        setForm(prev => ({ ...prev, building_id: bId, room_number: "", room_id: "", tenant_name: "" }));
        setRooms([]);
        setTenants([]);
        if (bId) {
            const res = await getRoomsByBuildingId(bId);
            setRooms(Array.isArray(res) ? res : res.data || []);
        }
    };

    const handleRoomChange = async (e) => {
        const rId = e.target.value;
        const selectedRoom = rooms.find(r => (r.id || r._id || r.room_id) == rId);
        setForm(prev => ({
            ...prev,
            room_id: rId,
            room_number: selectedRoom ? selectedRoom.room_number : "",
            tenant_user_id: ""
        }));
        setTenants([]);
        if (rId) {
            const res = await getTenantsByRoomId(rId);
            setTenants(Array.isArray(res) ? res : []);
        }
    };
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") setForm(prev => ({ ...prev, file: files?.[0] ?? null }));
        else setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateContract(id, form);
            alert("Cập nhật thành công");
            navigate("/contracts");
        } catch (error) {
            alert("Lỗi: " + error.message);
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
            {/* Header với background nhẹ */}
            <div className="edit-contract-header mb-4 pb-3 border-bottom">
                <h3 className="m-0 text-primary">
                    <i className="bi bi-pencil-square me-2"></i> {/* Ví dụ icon nếu có bootstrap-icons */}
                    Chỉnh sửa hợp đồng #{contract?.contract_id ?? id}
                </h3>
                <p className="text-muted mb-0 mt-1">Cập nhật thông tin chi tiết và tệp đính kèm của hợp đồng.</p>
            </div>

            <div className="edit-contract-card card shadow-sm border-0">
                <div className="card-body p-4">
                    <form className="contract-form needs-validation" onSubmit={handleSubmit}>

                        {/* Hàng 1: Thông tin Phòng/Tòa nhà */}
                        <h5 className="mb-3 text-secondary">Thông tin bất động sản</h5>
                        <div className="row mb-3">
                            {/* 1. TÒA NHÀ */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Tòa nhà</label>
                                {userRole === "MANAGER" ? (
                                    <input type="text" className="form-control-plaintext px-3 py-2 bg-light rounded" value={assignedBuilding?.name || contract?.building_name} disabled />
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
                                        <option key={r.id || r._id || r.room_id} value={r.id || r._id || r.room_id}>
                                            Phòng {r.room_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 3. KHÁCH THUÊ */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Khách thuê</label>
                                <select name="tenant_user_id" className="form-select" value={form.tenant_user_id} onChange={handleChange} required>
                                    <option value="">-- Chọn khách --</option>
                                    {tenants.map((t, idx) => (
                                        <option key={t.user_id || t.id || idx} value={t.user_id}>
                                            {t.full_name || t.name} - {t.phone}
                                        </option>
                                    ))}
                                    {tenants.length === 0 && contract?.tenant_name && (
                                        <option value={contract.tenant_user_id} disabled>
                                            {contract.tenant_name} (Hiện tại)
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <hr className="my-4 text-muted opacity-25" />

                        {/* Hàng 2: Thời hạn và Tài chính */}
                        <h5 className="mb-3 text-secondary">Điều khoản & Tài chính</h5>
                        <div className="row mb-3">
                            <div className="col-md-3">
                                <label className="form-label">Ngày bắt đầu</label>
                                <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Ngày kết thúc</label>
                                <input type="date" name="end_date" className="form-control" value={form.end_date} onChange={handleChange} />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Tiền thuê (VNĐ)</label>
                                <div className="input-group">
                                    <input type="number" name="rent_amount" className="form-control" value={form.rent_amount} onChange={handleChange} placeholder="Vd: 5000000" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">Tiền cọc (VNĐ)</label>
                                <div className="input-group">
                                    <input type="number" name="deposit_amount" className="form-control" value={form.deposit_amount} onChange={handleChange} placeholder="Vd: 5000000" />
                                </div>
                            </div>
                        </div>

                        {/* Hàng 3: Trạng thái và Ghi chú */}
                        <div className="row mb-4">
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Trạng thái hợp đồng</label>
                                <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                                    <option value="pending"> Chờ duyệt</option>
                                    <option value="active"> Hiệu lực (Active)</option>
                                    <option value="terminated"> Đã hủy (Terminated)</option>
                                    <option value="expired"> Đã hết hạn (Expired)</option>
                                </select>
                            </div>
                            <div className="col-md-8">
                                <label className="form-label">Ghi chú bổ sung</label>
                                <textarea name="note" className="form-control" value={form.note} onChange={handleChange} rows={3} placeholder="Nhập ghi chú nếu có..." />
                            </div>
                        </div>

                        {/* Khu vực File đính kèm - Làm nổi bật */}
                        <div className="file-upload-section bg-light p-3 rounded-3 mb-4 border dashed-border">
                            <h6 className="mb-3">Tệp đính kèm hợp đồng</h6>
                            <div className="row align-items-center">
                                <div className="col-md-7">
                                    <label className="form-label small text-muted mb-1">Chọn file mới để thay thế (PDF/Ảnh)</label>
                                    <input type="file" name="file" accept="application/pdf,image/*" onChange={handleChange} className="form-control form-control-sm" />
                                    {form.file && <div className="mt-2 small text-success"><i className="bi bi-check-circle me-1"></i>Đã chọn: <strong>{form.file.name}</strong></div>}
                                </div>

                                {/* Hiển thị file hiện tại đẹp hơn */}
                                <div className="col-md-5 mt-3 mt-md-0 text-md-end">
                                    {contract?.has_file ? (
                                        <Alert variant="info" className="d-inline-flex align-items-center m-0 py-2 px-3">
                                            <i className="bi bi-file-earmark-pdf h5 m-0 me-2"></i>
                                            <div>
                                                <div className="small fw-bold">File hiện tại đang lưu</div>
                                                <Button variant="link" className="p-0 text-decoration-none small" onClick={handlePreviewFile}>
                                                    Nhấn để xem hoặc tải xuống <i className="bi bi-box-arrow-up-right ms-1"></i>
                                                </Button>
                                            </div>
                                        </Alert>
                                    ) : (
                                        <span className="text-muted small fst-italic">Chưa có file hợp đồng nào được tải lên.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions d-flex justify-content-end gap-2 pt-3 border-top">
                            <Button variant="light" className="px-4 text-secondary fw-semibold" onClick={() => navigate("/contracts")}>
                                <i className="bi bi-x-lg me-2"></i>Hủy bỏ
                            </Button>
                            <Button type="submit" variant="primary" className="px-4 fw-bold shadow-sm" disabled={submitting}>
                                {submitting ? <><Spinner size="sm" animation="border" className="me-2" /> Đang xử lý...</> : <><i className="bi bi-save me-2"></i>Cập nhật hợp đồng</>}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditContractPage;