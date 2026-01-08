import React, { useState, useEffect } from "react";
import { Form, Button, Card, Row, Col, Spinner, Alert, InputGroup, Badge } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { getAddendumById, updateAddendum } from "../../services/api/addendum";
import {
    ArrowLeft, Upload, FileEarmarkText,
    CurrencyDollar, CalendarDate, JournalCheck,
    ClockHistory, ExclamationTriangle, FileEarmarkPdf
} from "react-bootstrap-icons";
import "./CreateAddendumPage.css";

// --- CẤU HÌNH ---
const FIELD_DEFINITIONS = [
    { key: 'rent_amount', label: 'Giá thuê phòng', type: 'number', icon: <CurrencyDollar/>, suffix: 'VNĐ' },
    { key: 'duration_months', label: 'Thời gian gia hạn', type: 'number', icon: <ClockHistory/>, suffix: 'Tháng' },
    { key: 'deposit_amount', label: 'Tiền đặt cọc', type: 'number', icon: <JournalCheck/>, suffix: 'VNĐ' },
    { key: 'payment_cycle_months', label: 'Chu kỳ thanh toán', type: 'number', icon: <JournalCheck/>, suffix: 'Tháng/lần' },
    { key: 'start_date', label: 'Ngày bắt đầu (Sửa đổi)', type: 'date', icon: <CalendarDate/>, suffix: '' },
    { key: 'penalty_rate', label: 'Mức phạt vi phạm', type: 'number', icon: <CurrencyDollar/>, suffix: '%' }
];

const ADDENDUM_TYPES = [
    { value: 'extension', label: 'Gia hạn hợp đồng', desc: 'Kéo dài thời gian thuê theo số tháng', autoFields: ['duration_months'] },
    { value: 'rent_adjustment', label: 'Điều chỉnh giá thuê', desc: 'Tăng hoặc giảm giá tiền thuê', autoFields: ['rent_amount'] },
    { value: 'deposit_adjustment', label: 'Điều chỉnh tiền cọc', desc: 'Thay đổi số tiền đặt cọc', autoFields: ['deposit_amount'] },
    { value: 'payment_terms_change', label: 'Thay đổi ĐK thanh toán', desc: 'Chu kỳ đóng tiền hoặc mức phạt', autoFields: ['payment_cycle_months', 'penalty_rate'] },
    { value: 'early_termination', label: 'Chấm dứt trước hạn', desc: 'Gửi yêu cầu thanh lý hợp đồng', autoFields: [] },
    { value: 'general_amendment', label: 'Điều chỉnh hỗn hợp', desc: 'Sửa đổi nhiều nội dung cùng lúc', autoFields: [] }
];

const EditAddendumPage = () => {
    const navigate = useNavigate();

    const { id: contractIdParam, aid } = useParams();

    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [contract, setContract] = useState(null);
    const [originalAddendum, setOriginalAddendum] = useState(null);

    // Form State
    const [addendumType, setAddendumType] = useState("");
    const [effectiveFrom, setEffectiveFrom] = useState("");
    const [effectiveTo, setEffectiveTo] = useState("");
    const [note, setNote] = useState("");

    // Changes State
    const [selectedFields, setSelectedFields] = useState([]);
    const [newValues, setNewValues] = useState({});

    // Files State
    const [files, setFiles] = useState([]);
    const [existingFile, setExistingFile] = useState(null);

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            // [FIX 1] Kiểm tra 'aid' thay vì 'id'
            if (!aid) return;

            setLoading(true);
            try {
                // [FIX 1] Gọi API với 'aid'
                const data = await getAddendumById(aid);
                setOriginalAddendum(data);

                if (!['pending_approval', 'rejected'].includes(data.status)) {
                    setError(`Không thể chỉnh sửa phụ lục ở trạng thái: ${data.status}`);
                    return;
                }

                // Set thông tin Contract để hiển thị giá trị cũ
                if (data.contract) {
                    setContract(data.contract);
                }

                // Fill Form Data
                setAddendumType(data.addendum_type);
                setEffectiveFrom(data.effective_from ? data.effective_from.split('T')[0] : "");
                setEffectiveTo(data.effective_to ? data.effective_to.split('T')[0] : "");
                setNote(data.note || "");

                // Fill File Data
                if (data.s3_key) {
                    setExistingFile({
                        name: data.file_name,
                        url: data.file_url
                    });
                }

                // Fill Changes Snapshot
                let parsedChanges = data.changes_snapshot;
                if (typeof parsedChanges === 'string') {
                    try { parsedChanges = JSON.parse(parsedChanges); } catch (e) {}
                }

                if (parsedChanges) {
                    const { previous_values, ...realChanges } = parsedChanges;
                    const keys = Object.keys(realChanges);
                    setSelectedFields(keys);
                    setNewValues(realChanges);
                }

            } catch (err) {
                console.error(err);
                setError("Không thể tải thông tin phụ lục hoặc phụ lục không tồn tại.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [aid]); // [FIX 1] Dependency là 'aid'

    // --- HANDLERS ---
    const formatCurrentValue = (key, val) => {
        if (val === undefined || val === null) return "N/A";
        if (key.includes('date')) return new Date(val).toLocaleDateString('vi-VN');
        if (key.includes('amount')) return Number(val).toLocaleString('vi-VN') + " ₫";
        if (key === 'payment_cycle_months' || key === 'duration_months') return val + " tháng";
        if (key === 'penalty_rate') return val + "%";
        return val;
    };

    const handleFieldToggle = (fieldKey) => {
        // Chỉ cho phép toggle nếu là general_amendment, nhưng type đang bị disable nên logic này chỉ chạy khi type gốc là general
        if (addendumType !== 'general_amendment') return;
        if (selectedFields.includes(fieldKey)) {
            setSelectedFields(prev => prev.filter(k => k !== fieldKey));
            const updatedValues = { ...newValues };
            delete updatedValues[fieldKey];
            setNewValues(updatedValues);
        } else {
            setSelectedFields(prev => [...prev, fieldKey]);
        }
    };

    const handleValueChange = (key, value) => {
        setNewValues(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    // --- SUBMIT UPDATE ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (!effectiveFrom && addendumType !== 'early_termination') {
                throw new Error("Vui lòng chọn ngày hiệu lực.");
            }

            if (addendumType !== 'early_termination' && selectedFields.length === 0) {
                throw new Error("Vui lòng chọn ít nhất một nội dung thay đổi.");
            }

            const changesObj = {};
            if (addendumType !== 'early_termination') {
                for (const key of selectedFields) {
                    const val = newValues[key];
                    if (val === undefined || val === null || String(val).trim() === "") {
                        const label = FIELD_DEFINITIONS.find(f => f.key === key)?.label;
                        throw new Error(`Trường bắt buộc: Vui lòng nhập giá trị cho "${label}".`);
                    }
                    changesObj[key] = val;
                }
            }

            if (changesObj.duration_months && contract?.end_date) {
                const oldEndDate = new Date(contract.end_date);
                const monthsToAdd = parseInt(changesObj.duration_months);
                if (!isNaN(monthsToAdd) && monthsToAdd > 0) {
                    const newEndDate = new Date(oldEndDate);
                    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);
                    changesObj.end_date = newEndDate.toISOString();
                }
            }

            const payload = {
                contract_id: contract.contract_id,
                addendum_type: addendumType,
                effective_from: effectiveFrom,
                effective_to: effectiveTo || null,
                note: note || "",
                changes: JSON.stringify(changesObj),
                files: files
            };

            // [FIX 1] Update dùng 'aid'
            await updateAddendum(aid, payload);

            alert("Cập nhật phụ lục thành công!");
            navigate(-1);

        } catch (err) {
            console.error(err);
            setError(err.message || "Có lỗi xảy ra khi cập nhật phụ lục.");
            window.scrollTo(0, 0);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><Spinner animation="border" variant="primary"/></div>;
    }

    const isTermination = addendumType === 'early_termination';

    return (
        <div className="create-addendum-container">
            {/* HEADER */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <Button variant="light" className="border shadow-sm" onClick={() => navigate(-1)}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h4 className="mb-0 fw-bold">
                        {isTermination ? <span className="text-danger">Cập Nhật Yêu Cầu Thanh Lý</span> : 'Cập Nhật Phụ Lục'}
                    </h4>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <span>#{originalAddendum?.addendum_number}</span>
                        <span>•</span>
                        <span>Hợp đồng: #{contract?.contract_number}</span>
                        <Badge bg={originalAddendum?.status === 'rejected' ? 'danger' : 'warning'} className="ms-2">
                            {originalAddendum?.status === 'rejected' ? 'Đã bị từ chối' : 'Chờ duyệt'}
                        </Badge>
                    </div>
                </div>
            </div>

            {error && <Alert variant="danger" className="shadow-sm border-danger">
                <ExclamationTriangle className="me-2"/> {error}
            </Alert>}

            {!error && (
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col lg={isTermination ? 12 : 8}>
                            {/* 1. CẤU HÌNH NGHIỆP VỤ */}
                            <Card className={`shadow-sm mb-4 border-0 ${isTermination ? 'border-top border-danger border-4' : ''}`}>
                                <Card.Header className="bg-white py-3">
                                    <h6 className="mb-0 fw-bold text-primary">1. Cấu hình nghiệp vụ</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row className="g-3">
                                        {/* Contract - Read Only */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Hợp đồng gốc</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={`#${contract?.contract_number} - ${contract?.tenant?.user?.full_name || 'Khách thuê'}`}
                                                    disabled
                                                    className="bg-light fw-bold text-dark"
                                                />
                                            </Form.Group>
                                        </Col>

                                        {/* Addendum Type */}
                                        <Col md={12}>
                                            <Form.Group>
                                                <Form.Label>Loại nghiệp vụ</Form.Label>
                                                {/* [FIX 2] Disabled để không cho đổi loại addendum */}
                                                <Form.Select
                                                    value={addendumType}
                                                    disabled={true}
                                                    className="fw-bold text-primary bg-light"
                                                >
                                                    {ADDENDUM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                </Form.Select>
                                                <Form.Text className="text-muted">
                                                    Loại nghiệp vụ không thể thay đổi khi cập nhật.
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>

                                        {!isTermination && (
                                            <>
                                                <Col md={6}>
                                                    <Form.Group className="mt-2">
                                                        <Form.Label>Ngày hiệu lực <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control
                                                            type="date"
                                                            value={effectiveFrom}
                                                            onChange={e => setEffectiveFrom(e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mt-2">
                                                        <Form.Label>Ngày hết hiệu lực <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control
                                                            type="date"
                                                            value={effectiveTo}
                                                            onChange={e => setEffectiveTo(e.target.value)}
                                                            min={effectiveFrom}
                                                            required
                                                        />
                                                        <Form.Text className="text-muted small">
                                                            Mặc định theo HĐ gốc hoặc giá trị cũ.
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            </>
                                        )}
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* 2. CHI TIẾT THAY ĐỔI */}
                            {!isTermination && (
                                <Card className="shadow-sm mb-4 border-0">
                                    <Card.Header className="bg-white py-3">
                                        <h6 className="mb-0 fw-bold text-primary">2. Chi tiết thay đổi</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-wrap gap-2 mb-4">
                                            {FIELD_DEFINITIONS.map(field => {
                                                const isActive = selectedFields.includes(field.key);
                                                // General logic ẩn hiện các field
                                                if (addendumType !== 'general_amendment' && !isActive) return null;
                                                return (
                                                    <div
                                                        key={field.key}
                                                        className={`
                                                        d-flex align-items-center gap-2 px-3 py-2 rounded-pill border
                                                        ${isActive ? 'bg-primary text-white border-primary' : 'bg-white text-secondary'}
                                                    `}
                                                        // Disable click nếu không phải general
                                                        style={{ cursor: addendumType === 'general_amendment' ? 'pointer' : 'default', opacity: 1 }}
                                                        onClick={() => handleFieldToggle(field.key)}
                                                    >
                                                        {field.icon} <span>{field.label}</span>
                                                        {addendumType === 'general_amendment' && isActive && <span className="ms-1">×</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {selectedFields.length > 0 ? (
                                            <div className="d-flex flex-column gap-3">
                                                {selectedFields.map(key => {
                                                    const fieldConfig = FIELD_DEFINITIONS.find(f => f.key === key);
                                                    if (!fieldConfig) return null;
                                                    return (
                                                        <div key={key} className="p-3 bg-light rounded border">
                                                            <Row className="align-items-center">
                                                                <Col md={5}>
                                                                    <div className="fw-bold text-dark">{fieldConfig.label}</div>
                                                                    <div className="small text-muted mt-1">
                                                                        {/* [FIX 3] Hiển thị giá trị cũ từ Contract */}
                                                                        Giá trị cũ (HĐ): <span className="fw-medium text-dark">{formatCurrentValue(key, contract?.[key])}</span>
                                                                    </div>
                                                                </Col>
                                                                <Col md={1} className="text-center text-muted">➔</Col>
                                                                <Col md={6}>
                                                                    <InputGroup className="has-validation">
                                                                        <Form.Control
                                                                            type={fieldConfig.type}
                                                                            value={newValues[key] || ''}
                                                                            onChange={e => handleValueChange(key, e.target.value)}
                                                                            placeholder="Nhập giá trị mới"
                                                                            required
                                                                        />
                                                                        {fieldConfig.suffix && <InputGroup.Text>{fieldConfig.suffix}</InputGroup.Text>}
                                                                    </InputGroup>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Alert variant="warning" className="text-center border-0 bg-warning-subtle">
                                                <ExclamationTriangle className="me-2"/>
                                                Vui lòng chọn ít nhất một nội dung thay đổi.
                                            </Alert>
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        {/* 3. LÝ DO / TÀI LIỆU */}
                        <Col lg={isTermination ? 12 : 4}>
                            <Card className="shadow-sm mb-4 border-0">
                                <Card.Header className="bg-white py-3">
                                    <h6 className="mb-0 fw-bold text-primary">
                                        {isTermination ? '2. Thông tin bắt buộc' : '3. Tài liệu & Ghi chú'}
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label className={isTermination ? "fw-bold text-danger" : ""}>
                                            {isTermination ? "Lý do chấm dứt *" : "Ghi chú"}
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            placeholder="Nhập ghi chú..."
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            required={isTermination}
                                            className={isTermination ? "border-danger" : ""}
                                        />
                                    </Form.Group>

                                    {!isTermination && (
                                        <Form.Group className="mb-3">
                                            <Form.Label>Văn bản đính kèm</Form.Label>

                                            {existingFile && files.length === 0 && (
                                                <div className="mb-2 p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                                                    <div className="text-truncate d-flex align-items-center gap-2">
                                                        <FileEarmarkPdf className="text-danger"/>
                                                        <span className="small fw-bold">{existingFile.name}</span>
                                                    </div>
                                                    <Badge bg="secondary">File hiện tại</Badge>
                                                </div>
                                            )}

                                            <div className="file-upload-wrapper text-center p-4 border border-dashed rounded bg-light">
                                                <input
                                                    type="file"
                                                    id="file-upload"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="d-none"
                                                    accept=".pdf,image/*"
                                                />
                                                <label htmlFor="file-upload" className="cursor-pointer w-100">
                                                    <Upload size={24} className="mb-2 text-primary"/>
                                                    <div className="fw-medium">
                                                        {files.length > 0 ? 'Thay đổi file' : 'Tải file mới'}
                                                    </div>
                                                    <small className="text-muted d-block mt-1">
                                                        (Tải file mới sẽ thay thế file cũ)
                                                    </small>
                                                </label>
                                            </div>
                                            {files.length > 0 && (
                                                <div className="mt-3 bg-white border rounded p-2">
                                                    {Array.from(files).map((f, i) => (
                                                        <div key={i} className="d-flex align-items-center gap-2 text-success small mb-1">
                                                            <FileEarmarkText/> <span className="text-truncate">{f.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </Form.Group>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end gap-3 mt-5 pt-3 border-top">
                        <Button variant="light" onClick={() => navigate(-1)} className="px-4">
                            Hủy bỏ
                        </Button>
                        <Button
                            type="submit"
                            variant={isTermination ? "danger" : "primary"}
                            className="px-4 fw-bold"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <> <Spinner size="sm" className="me-2" /> Đang lưu... </>
                            ) : (
                                "Lưu Thay Đổi"
                            )}
                        </Button>
                    </div>
                </Form>
            )}
            <div style={{height: 80}}></div>
        </div>
    );
};

export default EditAddendumPage;