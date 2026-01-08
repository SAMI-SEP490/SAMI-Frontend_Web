// src/pages/addendum/CreateAddendumPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Form, Button, Card, Row, Col, Spinner, Alert, InputGroup } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listContracts } from "../../services/api/contracts";
import { createAddendum } from "../../services/api/addendum";
import {
    ArrowLeft, Upload, FileEarmarkText,
    CurrencyDollar, CalendarDate, JournalCheck
} from "react-bootstrap-icons";
import "./CreateAddendumPage.css";

// Định nghĩa các trường có thể thay đổi trong hợp đồng (Mapping với Backend Service)
const CHANGE_FIELDS = [
    { key: 'rent_amount', label: 'Giá thuê phòng', type: 'number', icon: <CurrencyDollar/>, suffix: 'VNĐ' },
    { key: 'end_date', label: 'Ngày kết thúc (Gia hạn)', type: 'date', icon: <CalendarDate/>, suffix: '' },
    { key: 'deposit_amount', label: 'Tiền đặt cọc', type: 'number', icon: <JournalCheck/>, suffix: 'VNĐ' },
    { key: 'payment_cycle_months', label: 'Chu kỳ thanh toán', type: 'number', icon: <JournalCheck/>, suffix: 'Tháng/lần' },
    { key: 'start_date', label: 'Ngày bắt đầu (Điều chỉnh)', type: 'date', icon: <CalendarDate/>, suffix: '' },
    { key: 'penalty_rate', label: 'Mức phạt vi phạm', type: 'number', icon: <CurrencyDollar/>, suffix: '%' }
];

const CreateAddendumPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedContractId = searchParams.get('contractId');

    // --- STATE ---
    const [contracts, setContracts] = useState([]);
    const [loadingContracts, setLoadingContracts] = useState(false);

    // Form State
    const [selectedContractId, setSelectedContractId] = useState(preSelectedContractId || "");
    const [addendumType, setAddendumType] = useState("amendment"); // extension, price_adjustment, etc.
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState("");

    // Changes State (Quản lý các trường được chọn để thay đổi)
    const [selectedFields, setSelectedFields] = useState([]); // Array of keys: ['rent_amount', 'end_date']
    const [newValues, setNewValues] = useState({}); // { rent_amount: 5000000, ... }

    // Files
    const [files, setFiles] = useState([]);

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // --- INIT ---
    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        setLoadingContracts(true);
        try {
            // Chỉ lấy hợp đồng đang Active để tạo phụ lục
            const res = await listContracts({ status: 'active' });
            setContracts(Array.isArray(res) ? res : (res.items || []));
        } catch (err) {
            console.error(err);
            setError("Không thể tải danh sách hợp đồng.");
        } finally {
            setLoadingContracts(false);
        }
    };

    // Lấy thông tin chi tiết hợp đồng đang chọn
    const selectedContract = useMemo(() => {
        return contracts.find(c => String(c.contract_id) === String(selectedContractId));
    }, [contracts, selectedContractId]);

    // --- HANDLERS ---

    // Toggle checkbox chọn trường thay đổi
    const handleFieldSelection = (fieldKey) => {
        if (selectedFields.includes(fieldKey)) {
            setSelectedFields(prev => prev.filter(k => k !== fieldKey));
            const updatedValues = { ...newValues };
            delete updatedValues[fieldKey];
            setNewValues(updatedValues);
        } else {
            setSelectedFields(prev => [...prev, fieldKey]);
            // Pre-fill giá trị hiện tại nếu có
            if (selectedContract && selectedContract[fieldKey]) {
                let val = selectedContract[fieldKey];
                if (fieldKey.includes('date')) val = val.split('T')[0];
                setNewValues(prev => ({ ...prev, [fieldKey]: val }));
            }
        }
    };

    const handleValueChange = (key, value) => {
        setNewValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (!selectedContractId) throw new Error("Vui lòng chọn hợp đồng.");
            if (selectedFields.length === 0) throw new Error("Vui lòng chọn ít nhất một nội dung thay đổi.");

            // 1. Build changes object
            const changesObj = {};
            selectedFields.forEach(key => {
                if (!newValues[key]) throw new Error(`Vui lòng nhập giá trị mới cho ${key}`);
                changesObj[key] = newValues[key];
            });

            // 2. Build Form Data (để gửi Multipart)
            // Sử dụng object thông thường, addendum.js service sẽ convert sang FormData
            const payload = {
                contract_id: selectedContractId,
                addendum_type: addendumType,
                effective_from: effectiveFrom,
                note: note,
                changes: changesObj, // Backend service sẽ stringify cái này
                files: files // Backend service sẽ map vào key 'addendum_file'
            };

            await createAddendum(payload);

            alert("Tạo phụ lục thành công! Vui lòng chờ khách thuê xác nhận.");
            navigate("/addendums"); // Quay về danh sách phụ lục

        } catch (err) {
            setError(err.message || "Có lỗi xảy ra khi tạo phụ lục.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- HELPER RENDER ---
    const formatCurrentValue = (key, val) => {
        if (!val && val !== 0) return "N/A";
        if (key.includes('date')) return new Date(val).toLocaleDateString('vi-VN');
        if (key.includes('amount')) return val.toLocaleString('vi-VN') + " ₫";
        return val;
    };

    return (
        <div className="create-addendum-container">
            {/* HEADER */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <Button variant="light" className="border shadow-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h4 className="mb-0 fw-bold">Lập Phụ Lục Hợp Đồng</h4>
                    <div className="text-muted small">Điều chỉnh thông tin hoặc gia hạn hợp đồng thuê</div>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Row>
                    {/* LEFT COLUMN: Main Info */}
                    <Col lg={8}>
                        <Card className="shadow-sm mb-4 border-0">
                            <Card.Header className="bg-white py-3">
                                <h6 className="mb-0 fw-bold text-primary">1. Thông tin chung</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Chọn Hợp đồng gốc <span className="text-danger">*</span></Form.Label>
                                            <Form.Select
                                                value={selectedContractId}
                                                onChange={e => setSelectedContractId(e.target.value)}
                                                disabled={!!preSelectedContractId}
                                            >
                                                <option value="">-- Chọn hợp đồng --</option>
                                                {contracts.map(c => (
                                                    <option key={c.contract_id} value={c.contract_id}>
                                                        #{c.contract_number} - {c.tenant_name} (P.{c.room_number})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {loadingContracts && <div className="form-text text-muted"><Spinner size="sm"/> Đang tải...</div>}
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Loại phụ lục</Form.Label>
                                            <Form.Select value={addendumType} onChange={e => setAddendumType(e.target.value)}>
                                                <option value="amendment">Điều chỉnh (Sửa đổi điều khoản)</option>
                                                <option value="extension">Gia hạn hợp đồng</option>
                                                <option value="termination">Thanh lý sớm (Có điều kiện)</option>
                                                <option value="other">Khác</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Ngày hiệu lực <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={effectiveFrom}
                                                onChange={e => setEffectiveFrom(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm mb-4 border-0">
                            <Card.Header className="bg-white py-3">
                                <h6 className="mb-0 fw-bold text-primary">2. Nội dung thay đổi</h6>
                                <div className="small text-muted">Chọn các mục cần điều chỉnh và nhập giá trị mới.</div>
                            </Card.Header>
                            <Card.Body>
                                {!selectedContract ? (
                                    <div className="text-center py-4 text-muted bg-light rounded">
                                        Vui lòng chọn hợp đồng trước để xem các trường thông tin.
                                    </div>
                                ) : (
                                    <>
                                        {/* List of Checkboxes */}
                                        <div className="d-flex flex-wrap gap-3 mb-4">
                                            {CHANGE_FIELDS.map(field => (
                                                <div
                                                    key={field.key}
                                                    className={`selection-chip ${selectedFields.includes(field.key) ? 'active' : ''}`}
                                                    onClick={() => handleFieldSelection(field.key)}
                                                >
                                                    {field.icon} {field.label}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Inputs for Selected Fields */}
                                        {selectedFields.length > 0 ? (
                                            <div className="changes-inputs">
                                                {selectedFields.map(key => {
                                                    const fieldConfig = CHANGE_FIELDS.find(f => f.key === key);
                                                    return (
                                                        <div key={key} className="change-row fade-in">
                                                            <div className="change-label">
                                                                <span className="fw-bold">{fieldConfig.label}</span>
                                                                <div className="current-val-badge">
                                                                    Hiện tại: {formatCurrentValue(key, selectedContract[key])}
                                                                </div>
                                                            </div>
                                                            <div className="change-arrow">➔</div>
                                                            <div className="change-input">
                                                                <InputGroup>
                                                                    <Form.Control
                                                                        type={fieldConfig.type}
                                                                        value={newValues[key] || ''}
                                                                        onChange={e => handleValueChange(key, e.target.value)}
                                                                        placeholder="Giá trị mới"
                                                                        required
                                                                    />
                                                                    {fieldConfig.suffix && <InputGroup.Text>{fieldConfig.suffix}</InputGroup.Text>}
                                                                </InputGroup>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-muted fst-italic text-center small">Chưa chọn nội dung thay đổi nào.</div>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT COLUMN: Files & Note */}
                    <Col lg={4}>
                        <Card className="shadow-sm mb-4 border-0">
                            <Card.Header className="bg-white py-3">
                                <h6 className="mb-0 fw-bold text-primary">3. Tài liệu đính kèm</h6>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>File văn bản đã ký (nếu có)</Form.Label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden-input"
                                            accept=".pdf,image/*"
                                        />
                                        <label htmlFor="file-upload" className="upload-box">
                                            <Upload size={24} className="mb-2 text-primary"/>
                                            <div>Click để tải file lên</div>
                                            <small className="text-muted">(PDF, Ảnh)</small>
                                        </label>
                                    </div>
                                    {files.length > 0 && (
                                        <div className="mt-2">
                                            <strong className="small">File đã chọn:</strong>
                                            <ul className="list-unstyled small ps-2 mt-1">
                                                {Array.from(files).map((f, i) => (
                                                    <li key={i} className="text-success"><FileEarmarkText/> {f.name}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white py-3">
                                <h6 className="mb-0 fw-bold text-primary">4. Ghi chú</h6>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        placeholder="Nhập lý do điều chỉnh hoặc ghi chú thêm..."
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* FOOTER ACTIONS */}
                <div className="form-actions-footer">
                    <Button variant="light" className="px-4" onClick={() => navigate("/addendums")}>
                        Hủy bỏ
                    </Button>
                    <Button type="submit" variant="primary" className="px-5 shadow-sm" disabled={submitting}>
                        {submitting ? <><Spinner size="sm" /> Đang xử lý...</> : "Tạo Phụ Lục"}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default CreateAddendumPage;