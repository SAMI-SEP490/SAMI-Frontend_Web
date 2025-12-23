// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createContract, processContractWithAI } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getRoomsByBuildingId } from "@/services/api/rooms.js";
import { getTenantsByRoomId } from "@/services/api/tenants.js";
import { Button, Spinner, Alert, Modal } from "react-bootstrap";
import "./CreateContractPage.css";
import { getAccessToken } from "@/services/http.js";

function CreateContractPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref cho input file ẩn của AI
    const scanIntervalRef = useRef(null);

    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiMessage, setAiMessage] = useState(null);

    // PDF Scanner Modal States
    const [showScanner, setShowScanner] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);

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

    // Helper: Màu sắc theo tiến độ
    const getScanColor = (progress) => {
        if (progress < 35) return "#ef4444"; // Đỏ
        if (progress < 75) return "#f59e0b"; // Vàng
        return "#10b981"; // Xanh lá
    };
    const currentColor = getScanColor(scanProgress);

    // Get Role
    useEffect(() => {
        try {
            const token = getAccessToken();
            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                const role = decoded.role || decoded.userRole || "";
                setUserRole(role.toUpperCase());
            }
        } catch (error) { console.error("Error parsing JWT:", error); }
    }, []);

    // Load Buildings
    useEffect(() => {
        async function fetchBuildings() {
            setLoading(true);
            try {
                if (userRole === "MANAGER") {
                    const res = await listAssignedBuildings();
                    const assignedList = Array.isArray(res) ? res : res?.data;
                    if (Array.isArray(assignedList) && assignedList.length > 0) {
                        const b = assignedList[0];
                        setAssignedBuilding(b);
                        handleBuildingChange({ target: { value: b.building_id } });
                    }
                } else {
                    const res = await listBuildings();
                    const items = Array.isArray(res) ? res : (res.items || []);
                    setBuildings(items.map(x => ({ id: x.id ?? x.building_id ?? x._id, name: x.name ?? x.building_name })));
                }
            } catch (error) { console.error("Lỗi lấy tòa nhà:", error); }
            finally { setLoading(false); }
        }
        fetchBuildings();
    }, [userRole]);

    const handleBuildingChange = async (e) => {
        const bId = e.target.value;
        setForm(prev => ({ ...prev, building_id: bId, room_number: "", room_id: "", tenant_user_id: "" }));
        setRooms([]);
        setTenants([]);
        if (bId) {
            try {
                const res = await getRoomsByBuildingId(bId);
                setRooms(Array.isArray(res) ? res : res.data || []);
            } catch (err) { console.error(err); }
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
            try {
                const res = await getTenantsByRoomId(rId);
                setTenants(Array.isArray(res) ? res : []);
            } catch (err) { console.error(err); }
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") setForm(prev => ({ ...prev, file: files?.[0] ?? null }));
        else setForm(prev => ({ ...prev, [name]: value }));
    };

    // --- AI Logic (Giữ nguyên) ---
    const handleCancelScan = () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setAiProcessing(false);
        setShowScanner(false);
        setScanProgress(0);
        if (pdfPreview) { URL.revokeObjectURL(pdfPreview); setPdfPreview(null); }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAiImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileURL = URL.createObjectURL(file);
        setPdfPreview(fileURL);
        setShowScanner(true);
        setScanProgress(0);
        setAiProcessing(true);
        setAiMessage(null);

        scanIntervalRef.current = setInterval(() => {
            setScanProgress(prev => {
                const increment = Math.floor(Math.random() * 3) + 1;
                return prev >= 90 ? (prev < 95 ? prev + 0.5 : 95) : prev + increment;
            });
        }, 250);

        try {
            const res = await processContractWithAI(file);
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            setScanProgress(100);

            if (!res || !res.contract_data) {
                setAiMessage({ type: 'warning', text: res?.message || "Không trích xuất được dữ liệu." });
                setAiProcessing(false);
                setTimeout(() => handleCancelScan(), 40000);
                return;
            }

            const { contract_data, tenant_info } = res;
            const buildingId = tenant_info?.room?.building_id;
            const roomId = contract_data?.room_id;
            const tenantUserId = contract_data?.tenant_user_id;

            // Load data phụ thuộc
            if (buildingId) {
                try {
                    const roomRes = await getRoomsByBuildingId(buildingId);
                    setRooms(Array.isArray(roomRes) ? roomRes : roomRes.data || []);
                } catch (err) {}
            }
            if (roomId) {
                try {
                    const tenantRes = await getTenantsByRoomId(roomId);
                    setTenants(Array.isArray(tenantRes) ? tenantRes : []);
                } catch (err) {}
            }

            setTimeout(() => {
                setForm(prev => ({
                    ...prev,
                    building_id: String(buildingId || ""),
                    room_id: String(roomId || ""),
                    tenant_user_id: String(tenantUserId || ""),
                    room_number: tenant_info?.room?.room_number || "",
                    start_date: contract_data?.start_date || "",
                    end_date: contract_data?.end_date || "",
                    rent_amount: contract_data?.rent_amount || "",
                    deposit_amount: contract_data?.deposit_amount || "",
                    status: contract_data?.status || "pending",
                    note: contract_data?.note || "",
                    file: file
                }));
                setAiMessage({ type: 'success', text: "✅ Đã điền thông tin từ hợp đồng thành công!" });
                setTimeout(() => handleCancelScan(), 1500);
            }, 40000);

        } catch (error) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            setAiMessage({ type: 'danger', text: "Lỗi xử lý: " + error.message });
            setTimeout(() => handleCancelScan(), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!form.room_number || !form.tenant_user_id || !form.start_date) {
                alert("Vui lòng điền đủ thông tin bắt buộc.");
                setSubmitting(false);
                return;
            }
            await createContract(form);
            alert("Tạo hợp đồng thành công");
            navigate("/contracts");
        } catch (error) {
            alert("Lỗi: " + (error?.response?.data?.message || error?.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-contract-page-container container mt-4">
            {/* Header + AI Button */}
            <div className="create-contract-header mb-4 pb-3 border-bottom d-flex justify-content-between align-items-end">
                <div>
                    <h3 className="m-0 text-primary">
                        <i className="bi bi-file-earmark-plus me-2"></i>
                        Tạo hợp đồng mới
                    </h3>
                    <p className="text-muted mb-0 mt-1">Điền thủ công hoặc sử dụng AI để trích xuất từ PDF.</p>
                </div>

                {/* AI Import Trigger */}
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf"
                        onChange={handleAiImportFile}
                    />
                    <Button
                        className="ai-import-btn"
                        onClick={() => fileInputRef.current.click()}
                        disabled={aiProcessing}
                    >
                        {aiProcessing ? (
                            <><Spinner size="sm" animation="border" className="me-2" /> Đang xử lý...</>
                        ) : (
                            <><i className="fas fa-magic me-2"></i> Auto-fill từ PDF</>
                        )}
                    </Button>
                </div>
            </div>

            {aiMessage && !showScanner && (
                <Alert variant={aiMessage.type} onClose={() => setAiMessage(null)} dismissible className="shadow-sm">
                    {aiMessage.text}
                </Alert>
            )}

            {/* Modal Scanner */}
            <Modal show={showScanner} onHide={() => {}} centered size="lg" backdrop="static" className="scanner-modal">
                <Modal.Body className="scanner-body">
                    <button className="scanner-close-btn" onClick={handleCancelScan} title="Hủy quét">
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="scanner-container">
                        {pdfPreview && <iframe src={pdfPreview} className="pdf-preview" title="PDF Preview" />}
                        <div className="scanner-overlay">
                            {scanProgress < 100 && (
                                <div className="scan-line"
                                     style={{
                                         top: `${scanProgress}%`,
                                         background: `linear-gradient(90deg, transparent, ${currentColor}, transparent)`,
                                         boxShadow: `0 0 20px ${currentColor}, 0 0 40px ${currentColor}`
                                     }}
                                />
                            )}
                            <div className="scanner-status" style={{ borderColor: `${currentColor}4D` }}>
                                {scanProgress < 100 ? (
                                    <>
                                        <div className="spinner-circle" style={{ borderTopColor: currentColor, borderRightColor: `${currentColor}33` }}></div>
                                        <h4 className="scan-title" style={{ color: currentColor }}>AI Analysis in progress...</h4>
                                        <p className="scan-subtitle">Đang phân tích cấu trúc hợp đồng</p>
                                        <div className="progress-badge">
                                            <span className="progress-text" style={{ color: currentColor }}>{Math.floor(scanProgress)}%</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="success-icon" style={{ color: '#10b981' }}>✅</div>
                                        <h4 className="success-title">Scan Complete!</h4>
                                        <p className="success-subtitle">Dữ liệu đã sẵn sàng</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Main Form Card */}
            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
                <div className="create-contract-card card shadow-sm border-0">
                    <div className="card-body p-4">
                        <form className="contract-form" onSubmit={handleSubmit}>
                            {/* Section 1: Bất động sản */}
                            <h5 className="mb-3 text-secondary">Thông tin bất động sản</h5>
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Tòa nhà</label>
                                    {userRole === "MANAGER" ? (
                                        <input type="text" className="form-control-plaintext px-3 py-2 bg-light rounded" value={assignedBuilding ? assignedBuilding.name : "..."} disabled />
                                    ) : (
                                        <select name="building_id" className="form-select" value={form.building_id} onChange={handleBuildingChange} required>
                                            <option value="">-- Chọn tòa nhà --</option>
                                            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Số phòng</label>
                                    <select name="room_id" className="form-select" value={form.room_id || ""} onChange={handleRoomChange} required disabled={!form.building_id}>
                                        <option value="">-- Chọn phòng --</option>
                                        {rooms.map(r => (
                                            <option key={r.id || r._id || r.room_id} value={r.id || r._id || r.room_id}>Phòng {r.room_number}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Khách thuê</label>
                                    <select name="tenant_user_id" className="form-select" value={form.tenant_user_id} onChange={handleChange} required disabled={!form.room_id}>
                                        <option value="">-- Chọn khách trong phòng --</option>
                                        {tenants.map((t, idx) => (
                                            <option key={t.user_id || t.id || idx} value={t.user_id}>{t.full_name || t.name} - {t.phone}</option>
                                        ))}
                                    </select>
                                    {tenants.length === 0 && form.tenant_user_id && <small className="text-success mt-1 d-block"><i className="fas fa-check-circle me-1"></i>AI đã chọn khách (ID: {form.tenant_user_id})</small>}
                                </div>
                            </div>

                            <hr className="my-4 text-muted opacity-25" />

                            {/* Section 2: Tài chính & Thời hạn */}
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
                                    <input type="number" name="rent_amount" className="form-control" value={form.rent_amount} onChange={handleChange} placeholder="0" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Tiền cọc (VNĐ)</label>
                                    <input type="number" name="deposit_amount" className="form-control" value={form.deposit_amount} onChange={handleChange} placeholder="0" />
                                </div>
                            </div>

                            {/* Section 3: Khác */}
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Trạng thái</label>
                                    <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                                        <option value="pending">Chờ duyệt</option>
                                        <option value="active">Hiệu lực</option>
                                        <option value="terminated">Đã hủy</option>
                                    </select>
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label">Ghi chú</label>
                                    <textarea name="note" className="form-control" value={form.note} onChange={handleChange} rows={3} placeholder="Ghi chú bổ sung..." />
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div className="file-upload-section bg-light p-3 rounded-3 mb-4">
                                <h6 className="mb-3">Tệp đính kèm hợp đồng</h6>
                                <div className="row align-items-center">
                                    <div className="col-md-12">
                                        <label className="form-label small text-muted mb-1">Tải lên file PDF hoặc ảnh hợp đồng (nếu không dùng AI Scan)</label>
                                        <input type="file" name="file" accept="application/pdf,image/*" onChange={handleChange} className="form-control form-control-sm" />
                                        {form.file && <div className="mt-2 small text-success"><i className="fas fa-check-circle me-1"></i>Đã chọn: <strong>{form.file.name}</strong></div>}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="form-actions d-flex justify-content-end gap-2 pt-3 border-top">
                                <Button variant="light" className="px-4 text-secondary fw-semibold" onClick={() => navigate("/contracts")}>
                                    <i className="fas fa-times me-2"></i>Hủy bỏ
                                </Button>
                                <Button type="submit" variant="primary" className="px-4 fw-bold shadow-sm" disabled={submitting}>
                                    {submitting ? <><Spinner size="sm" animation="border" className="me-2" /> Đang lưu...</> : <><i className="fas fa-save me-2"></i>Tạo hợp đồng</>}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateContractPage;