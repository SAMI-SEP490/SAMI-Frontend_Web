// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createContract, processContractWithAI } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getRoomsByBuildingId } from "@/services/api/rooms.js";
import { getTenantsByRoomId } from "@/services/api/tenants.js";
import { Button, Spinner, Alert, Modal, Row, Col } from "react-bootstrap";
import {
    Building, Person, CashCoin, CalendarDate, FileEarmarkText,
    Magic, XLg, CheckCircleFill, FileEarmarkPdf, FileEarmarkImage
} from "react-bootstrap-icons";
import { getAccessToken } from "@/services/http.js";
import "./CreateContractPage.css";

function CreateContractPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const scanIntervalRef = useRef(null);

    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // AI States
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiMessage, setAiMessage] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);

    // Data Selects
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [assignedBuilding, setAssignedBuilding] = useState(null);

    // Form State
    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "",
        tenant_user_id: "",
        start_date: new Date().toISOString().split('T')[0],
        duration_months: 12,
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        penalty_rate: 0.1, // Default hợp lệ (0.01 - 1)
        payment_cycle_months: 1,
        status: "pending",
        note: "",
        files: [] // Đổi từ 'file' sang 'files' (array)
    });

    // --- EFFECT: Calculate End Date automatically ---
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

    // --- COLOR HELPER FOR SCANNER ---
    const getScanColor = (progress) => {
        if (progress < 35) return "#ef4444";
        if (progress < 75) return "#f59e0b";
        return "#10b981";
    };
    const currentColor = getScanColor(scanProgress);

    // --- INIT DATA ---
    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            try {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                setUserRole((decoded.role || decoded.userRole || "").toUpperCase());
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        async function fetchBuildings() {
            setLoading(true);
            try {
                if (userRole === "MANAGER") {
                    const res = await listAssignedBuildings();
                    const list = Array.isArray(res) ? res : res?.data;
                    if (list?.length > 0) {
                        setAssignedBuilding(list[0]);
                        handleBuildingChange({ target: { value: list[0].building_id } });
                    }
                } else {
                    const res = await listBuildings();
                    const items = Array.isArray(res) ? res : (res.items || []);
                    setBuildings(items.map(x => ({ id: x.id ?? x.building_id, name: x.name })));
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        }
        fetchBuildings();
    }, [userRole]);

    // --- HANDLERS ---
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
        const selectedRoom = rooms.find(r => String(r.room_id) === String(rId));
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

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length === 0) return;

        // Logic check loại file
        const hasPDF = selectedFiles.some(f => f.type === "application/pdf");

        if (hasPDF) {
            // Nếu có PDF, chỉ được phép chọn 1 file
            if (selectedFiles.length > 1) {
                alert("Nếu chọn PDF, bạn chỉ được phép tải lên 1 file duy nhất.");
                // Reset input
                e.target.value = "";
                return;
            }
        }
        // Nếu toàn là ảnh thì cho phép nhiều (không cần check else vì input accept đã filter)

        setForm(prev => ({ ...prev, files: selectedFiles }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // --- AI HANDLER (Import only support Single PDF usually) ---
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
            setScanProgress(prev => (prev >= 90 ? (prev < 95 ? prev + 0.5 : 95) : prev + Math.random() * 5));
        }, 300);

        try {
            const res = await processContractWithAI(file);
            clearInterval(scanIntervalRef.current);
            setScanProgress(100);

            if (!res?.contract_data) throw new Error("Không tìm thấy dữ liệu hợp đồng.");

            const { contract_data, tenant_info } = res;

            const buildingId = tenant_info?.room?.building_id;
            const roomId = contract_data?.room_id;

            if (buildingId) await getRoomsByBuildingId(buildingId).then(r => setRooms(Array.isArray(r) ? r : r.data || [])).catch(()=>{});
            if (roomId) await getTenantsByRoomId(roomId).then(t => setTenants(Array.isArray(t) ? t : [])).catch(()=>{});

            setForm(prev => ({
                ...prev,
                building_id: String(buildingId || ""),
                room_id: String(roomId || ""),
                tenant_user_id: String(contract_data?.tenant_user_id || ""),
                start_date: contract_data?.start_date || prev.start_date,
                duration_months: contract_data?.duration_months || 12,
                rent_amount: contract_data?.rent_amount || "",
                deposit_amount: contract_data?.deposit_amount || "",
                penalty_rate: contract_data?.penalty_rate || 0.1, // Default valid
                payment_cycle_months: contract_data?.payment_cycle_months || 1,
                note: contract_data?.note || "",
                files: [file] // AI import overrides files with the imported PDF
            }));

            setAiMessage({ type: 'success', text: "Đã trích xuất dữ liệu thành công!" });
            setTimeout(() => handleCancelScan(), 800);

        } catch (error) {
            clearInterval(scanIntervalRef.current);
            setAiMessage({ type: 'danger', text: error.message });
            setTimeout(() => handleCancelScan(), 2000);
        }
    };

    const handleCancelScan = () => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        setAiProcessing(false);
        setShowScanner(false);
        setScanProgress(0);
        if (pdfPreview) URL.revokeObjectURL(pdfPreview);
        setPdfPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Validation Manual
            if (!form.room_id || !form.tenant_user_id) throw new Error("Vui lòng chọn phòng và khách thuê.");

            const rate = parseFloat(form.penalty_rate);
            if (isNaN(rate) || rate < 0.01 || rate > 1) {
                throw new Error("Tỷ lệ phạt phải từ 0.01% đến 1%.");
            }

            // Create Contract with FormData to handle multiple files
            // Note: API wrapper function 'createContract' needs to handle FormData correctly
            // If you use JSON normally, you need to change to FormData here.

            // Assuming createContract in api/contracts handles FormData conversion
            // OR we construct FormData here and pass it.
            // Let's assume we pass the raw object and the API utility handles it,
            // BUT usually for files we need manual FormData construction.

            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (key === 'files') {
                    form.files.forEach(file => {
                        formData.append('contract_file', file); // Use same key 'contract_file' multiple times
                    });
                } else {
                    formData.append(key, form[key]);
                }
            });

            await createContract(formData); // Passing FormData
            alert("Tạo hợp đồng thành công!");
            navigate("/contracts");
        } catch (error) {
            alert("Lỗi: " + (error?.response?.data?.message || error?.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-contract-page-container container mt-4">

            {/* HEADER */}
            <div className="page-header">
                <div>
                    <h2>Tạo hợp đồng mới</h2>
                    <p>Thiết lập thông tin hợp đồng thuê phòng cho khách hàng.</p>
                </div>
                <div>
                    <input ref={fileInputRef} type="file" hidden accept=".pdf" onChange={handleAiImportFile} />
                    <Button className="ai-import-btn d-flex align-items-center gap-2" onClick={() => fileInputRef.current.click()} disabled={aiProcessing}>
                        {aiProcessing ? <Spinner size="sm"/> : <Magic />} Auto-fill từ PDF
                    </Button>
                </div>
            </div>

            {aiMessage && !showScanner && (
                <Alert variant={aiMessage.type} onClose={() => setAiMessage(null)} dismissible>
                    {aiMessage.text}
                </Alert>
            )}

            {loading ? <div className="text-center py-5"><Spinner animation="border"/></div> : (
                <div className="form-card">
                    <form onSubmit={handleSubmit}>

                        {/* SECTION 1: INFO */}
                        <div className="form-section-title"><Building/> Thông tin Bất động sản</div>
                        <Row className="mb-4">
                            <Col md={4}>
                                <label className="form-label">Tòa nhà <span className="required">*</span></label>
                                {userRole === "MANAGER" ? (
                                    <input className="form-control" value={assignedBuilding?.name || "..."} disabled />
                                ) : (
                                    <select name="building_id" className="form-select" value={form.building_id} onChange={handleBuildingChange} required>
                                        <option value="">-- Chọn tòa nhà --</option>
                                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                )}
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Phòng <span className="required">*</span></label>
                                <select name="room_id" className="form-select" value={form.room_id} onChange={handleRoomChange} required disabled={!form.building_id}>
                                    <option value="">-- Chọn phòng --</option>
                                    {rooms.map(r => <option key={r.room_id} value={r.room_id}>Phòng {r.room_number}</option>)}
                                </select>
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Khách thuê <span className="required">*</span></label>
                                <select name="tenant_user_id" className="form-select" value={form.tenant_user_id} onChange={handleChange} required disabled={!form.room_id}>
                                    <option value="">-- Chọn khách --</option>
                                    {tenants.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name} ({t.phone})</option>)}
                                </select>
                            </Col>
                        </Row>

                        {/* SECTION 2: TERMS */}
                        <div className="form-section-title"><CalendarDate/> Thời hạn & Chu kỳ</div>
                        <Row className="mb-4">
                            <Col md={4}>
                                <label className="form-label">Ngày bắt đầu <span className="required">*</span></label>
                                <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} required />
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Thời hạn (Tháng) <span className="required">*</span></label>
                                <input type="number" name="duration_months" className="form-control" value={form.duration_months} onChange={handleChange} min="1" required />
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Ngày kết thúc (Dự kiến)</label>
                                <input type="text" className="form-control" value={form.end_date} readOnly />
                            </Col>
                        </Row>
                        <Row className="mb-4">
                            <Col md={6}>
                                <label className="form-label">Chu kỳ thanh toán (Tháng) <span className="required">*</span></label>
                                <select name="payment_cycle_months" className="form-select" value={form.payment_cycle_months} onChange={handleChange}>
                                    <option value="1">1 tháng / lần</option>
                                    <option value="2">2 tháng / lần</option>
                                    <option value="3">3 tháng / lần</option>
                                    <option value="6">6 tháng / lần</option>
                                    <option value="12">1 năm / lần</option>
                                </select>
                            </Col>
                        </Row>

                        {/* SECTION 3: FINANCE */}
                        <div className="form-section-title"><CashCoin/> Tài chính & Điều khoản</div>
                        <Row className="mb-4">
                            <Col md={4}>
                                <label className="form-label">Giá thuê (VNĐ) <span className="required">*</span></label>
                                <div className="input-group">
                                    <input type="number" name="rent_amount" className="form-control" value={form.rent_amount} onChange={handleChange} required placeholder="Ví dụ: 5000000" />
                                    <span className="input-group-text">₫</span>
                                </div>
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Tiền đặt cọc (VNĐ)</label>
                                <div className="input-group">
                                    <input type="number" name="deposit_amount" className="form-control" value={form.deposit_amount} onChange={handleChange} placeholder="0" />
                                    <span className="input-group-text">₫</span>
                                </div>
                            </Col>
                            <Col md={4}>
                                <label className="form-label">Phạt quá hạn (%) <span className="required">*</span></label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        name="penalty_rate"
                                        className="form-control"
                                        value={form.penalty_rate}
                                        onChange={handleChange}
                                        min="0.01"
                                        max="1"
                                        step="0.01"
                                        required
                                    />
                                    <span className="input-group-text">% / ngày</span>
                                </div>
                                <small className="text-muted" style={{fontSize: '11px'}}>Từ 0.01% - 1%</small>
                            </Col>
                        </Row>

                        {/* SECTION 4: FILE & NOTE */}
                        <div className="form-section-title"><FileEarmarkText/> Hồ sơ đính kèm</div>
                        <Row className="mb-4">
                            <Col md={6}>
                                <label className="form-label">File Hợp đồng (PDF / Nhiều ảnh)</label>
                                <div className="file-upload-area" onClick={() => document.getElementById('manual-file').click()} style={{cursor:'pointer'}}>
                                    {/* Enable multiple files */}
                                    <input id="manual-file" type="file" name="file" accept=".pdf,image/*" multiple hidden onChange={handleFileChange} />
                                    <div className="text-muted">Nhấn để tải file (1 PDF hoặc nhiều Ảnh)</div>

                                    {/* Display selected files */}
                                    {form.files && form.files.length > 0 && (
                                        <div className="mt-2 text-start d-inline-block">
                                            {form.files.map((f, idx) => (
                                                <div key={idx} className="file-info">
                                                    {f.type === 'application/pdf' ? <FileEarmarkPdf/> : <FileEarmarkImage/>}
                                                    {f.name}
                                                </div>
                                            ))}
                                            <div className="text-center mt-1 text-success small fw-bold">
                                                <CheckCircleFill/> Đã chọn {form.files.length} file
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>
                            <Col md={6}>
                                <label className="form-label">Ghi chú bổ sung</label>
                                <textarea name="note" className="form-control" rows={3} value={form.note} onChange={handleChange} placeholder="Ghi chú thêm về hợp đồng..."></textarea>
                            </Col>
                        </Row>

                        {/* ACTIONS */}
                        <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                            <Button variant="light" onClick={() => navigate("/contracts")} className="px-4">Hủy bỏ</Button>
                            <Button type="submit" variant="primary" className="px-4 fw-bold" disabled={submitting}>
                                {submitting ? <><Spinner size="sm" className="me-2"/> Đang lưu...</> : "Tạo Hợp Đồng"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* SCANNER MODAL */}
            <Modal show={showScanner} centered size="lg" backdrop="static" className="scanner-modal">
                <Modal.Body className="scanner-body">
                    <button className="scanner-close-btn" onClick={handleCancelScan}><XLg/></button>
                    <div className="scanner-container">
                        {pdfPreview && (
                            form.files?.[0]?.type?.startsWith('image/')
                                ? <img src={pdfPreview} className="pdf-preview" style={{objectFit:'contain'}} alt="preview"/>
                                : <iframe src={pdfPreview} className="pdf-preview" title="preview"/>
                        )}
                        <div className="scanner-overlay">
                            <div className="scan-line" style={{ top: `${scanProgress}%`, color: currentColor }} />
                            <div className="scanner-status" style={{borderColor: `${currentColor}40`}}>
                                {scanProgress < 100 ? (
                                    <>
                                        <Spinner animation="border" style={{color: currentColor, width:'3rem', height:'3rem'}} className="mb-3"/>
                                        <h5 style={{color: currentColor}}>AI đang phân tích...</h5>
                                        <div className="text-white-50 small mb-2">Đang đọc cấu trúc hợp đồng</div>
                                        <h2 style={{color: currentColor}}>{Math.floor(scanProgress)}%</h2>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleFill size={50} className="text-success mb-3"/>
                                        <h4 className="text-success">Hoàn tất!</h4>
                                        <p className="text-white-50">Đang điền dữ liệu...</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default CreateContractPage;