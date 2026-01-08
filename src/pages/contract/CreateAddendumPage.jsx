import React, { useState, useEffect, useMemo } from "react";
import { Form, Button, Card, Row, Col, Spinner, Alert, InputGroup } from "react-bootstrap";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { listContracts, getContractById, requestTermination } from "../../services/api/contracts";
import { createAddendum } from "../../services/api/addendum";
import {
    ArrowLeft, Upload, FileEarmarkText,
    CurrencyDollar, CalendarDate, JournalCheck,
    ClockHistory,
    XCircle,
    ExclamationTriangle
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
    {
        value: 'extension',
        label: 'Gia hạn hợp đồng',
        desc: 'Kéo dài thời gian thuê theo số tháng',
        autoFields: ['duration_months']
    },
    {
        value: 'rent_adjustment',
        label: 'Điều chỉnh giá thuê',
        desc: 'Tăng hoặc giảm giá tiền thuê hàng tháng',
        autoFields: ['rent_amount']
    },
    {
        value: 'deposit_adjustment',
        label: 'Điều chỉnh tiền cọc',
        desc: 'Thay đổi số tiền đặt cọc giữ chỗ',
        autoFields: ['deposit_amount']
    },
    {
        value: 'payment_terms_change',
        label: 'Thay đổi điều khoản thanh toán',
        desc: 'Chu kỳ đóng tiền hoặc mức phạt',
        autoFields: ['payment_cycle_months', 'penalty_rate']
    },
    {
        value: 'early_termination',
        label: 'Chấm dứt trước hạn',
        desc: 'Gửi yêu cầu thanh lý hợp đồng',
        autoFields: []
    },
    {
        value: 'general_amendment',
        label: 'Điều chỉnh hỗn hợp (Tùy chọn)',
        desc: 'Sửa đổi nhiều nội dung cùng lúc',
        autoFields: []
    }
];

const CreateAddendumPage = () => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const queryId = searchParams.get('contractId');
    const initialContractId = paramId || queryId || "";

    // --- STATE ---
    const [contracts, setContracts] = useState([]);
    const [loadingContracts, setLoadingContracts] = useState(false);

    // Form State
    const [selectedContractId, setSelectedContractId] = useState(initialContractId);
    const [addendumType, setAddendumType] = useState("extension");

    // Date States
    const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [effectiveTo, setEffectiveTo] = useState("");

    // Note đóng vai trò là "Reason" khi terminate hoặc "Note" khi tạo addendum
    const [note, setNote] = useState("");

    // Changes State
    const [selectedFields, setSelectedFields] = useState(['duration_months']);
    const [newValues, setNewValues] = useState({});
    const [files, setFiles] = useState([]);

    // UI State
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // --- INIT DATA ---
    useEffect(() => {
        const initData = async () => {
            setLoadingContracts(true);
            try {
                if (initialContractId) {
                    const contractData = await getContractById(initialContractId);
                    setContracts([contractData]);
                    setSelectedContractId(String(contractData.contract_id));
                } else {
                    const res = await listContracts({ status: 'active' });
                    setContracts(Array.isArray(res) ? res : (res.items || []));
                }
            } catch (err) {
                console.error(err);
                setError("Không thể tải thông tin hợp đồng.");
            } finally {
                setLoadingContracts(false);
            }
        };
        initData();
    }, [initialContractId]);

    const selectedContract = useMemo(() => {
        if (!contracts.length || !selectedContractId) return null;
        return contracts.find(c => String(c.contract_id) === String(selectedContractId));
    }, [contracts, selectedContractId]);

    // --- HELPER: CamelCase Converter ---
    const toCamel = (s) => {
        return s.replace(/([-_][a-z])/ig, ($1) => {
            return $1.toUpperCase().replace('-', '').replace('_', '');
        });
    };

    // --- FILL VALUE LOGIC ---
    const fillCurrentValue = (fieldKey) => {
        if (!selectedContract) return;
        let val = selectedContract[fieldKey];
        if (val === undefined) val = selectedContract[toCamel(fieldKey)];
        if (fieldKey.includes('date') && val) val = val.split('T')[0];
        if (val !== undefined && val !== null) {
            setNewValues(prev => ({ ...prev, [fieldKey]: val }));
        }
    };

    // --- AUTO SELECT FIELDS & DEFAULTS ---

    // 1. Reset fields khi đổi loại Addendum
    useEffect(() => {
        const typeConfig = ADDENDUM_TYPES.find(t => t.value === addendumType);
        if (typeConfig) {
            if (addendumType !== 'general_amendment') {
                setSelectedFields(typeConfig.autoFields);
            } else {
                setSelectedFields([]);
            }
        }
        setNote("");
    }, [addendumType]);

    // 2. Điền giá trị cũ cho các trường thay đổi
    useEffect(() => {
        if (selectedContract && selectedFields.length > 0) {
            selectedFields.forEach(key => {
                if (newValues[key] === undefined) fillCurrentValue(key);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContract, selectedFields]);

    // 3. [MỚI] Tự động set Ngày hết hiệu lực (Effective To) bằng ngày kết thúc hợp đồng
    useEffect(() => {
        if (selectedContract && selectedContract.end_date) {
            // Chỉ set nếu effectiveTo đang trống để tránh ghi đè người dùng nhập
            if (!effectiveTo) {
                setEffectiveTo(selectedContract.end_date.split('T')[0]);
            }
        } else if (!selectedContract) {
            setEffectiveTo("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContract]);

    // --- HANDLERS ---
    const handleFieldToggle = (fieldKey) => {
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

    // --- SUBMIT LOGIC ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (!selectedContractId) throw new Error("Vui lòng chọn hợp đồng.");

            // === CASE 1: TERMINATION ===
            if (addendumType === 'early_termination') {
                if (!note || note.trim() === "") {
                    throw new Error("Vui lòng nhập lý do chấm dứt hợp đồng.");
                }

                await requestTermination(selectedContractId, {
                    reason: note
                });

                alert("Đã gửi yêu cầu thanh lý thành công!");
                if (paramId) navigate(`/contracts/${paramId}`);
                else navigate("/contracts");
                return;
            }

            // === CASE 2: ADDENDUM ===
            // [VALIDATION] Check Effective From
            if (!effectiveFrom) {
                throw new Error("Vui lòng chọn ngày hiệu lực.");
            }

            if (selectedFields.length === 0) throw new Error("Vui lòng chọn ít nhất một nội dung thay đổi.");

            const changesObj = {};
            // [VALIDATION] Loop qua các trường đã chọn và check rỗng
            for (const key of selectedFields) {
                const val = newValues[key];
                if (val === undefined || val === null || String(val).trim() === "") {
                    const label = FIELD_DEFINITIONS.find(f => f.key === key)?.label;
                    throw new Error(`Trường bắt buộc: Vui lòng nhập giá trị cho "${label}".`);
                }
                changesObj[key] = val;
            }

            // Logic tính end_date khi gia hạn (Giữ nguyên)
            if (changesObj.duration_months && selectedContract?.end_date) {
                const oldEndDate = new Date(selectedContract.end_date);
                const monthsToAdd = parseInt(changesObj.duration_months);
                if (!isNaN(monthsToAdd) && monthsToAdd > 0) {
                    const newEndDate = new Date(oldEndDate);
                    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);
                    changesObj.end_date = newEndDate.toISOString();
                }
            }

            const payload = {
                contract_id: selectedContractId,
                addendum_type: addendumType,
                effective_from: effectiveFrom,
                note: note || "",
                effective_to: effectiveTo || null, // Có thể null, nhưng mặc định đã điền từ useEffect
                changes: JSON.stringify(changesObj),
                files: files
            };

            await createAddendum(payload);
            alert("Tạo phụ lục thành công!");
            if (paramId) navigate(`/contracts/${paramId}/addendum`);
            else navigate("/addendums");

        } catch (err) {
            console.error(err);
            setError(err.message || "Có lỗi xảy ra khi tạo phụ lục.");
            // Scroll to top to see error
            window.scrollTo(0, 0);
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrentValue = (key, val) => {
        if (val === undefined || val === null) return "N/A";
        if (key.includes('date')) return new Date(val).toLocaleDateString('vi-VN');
        if (key.includes('amount')) return Number(val).toLocaleString('vi-VN') + " ₫";
        if (key === 'payment_cycle_months' || key === 'duration_months') return val + " tháng";
        if (key === 'penalty_rate') return val + "%";
        return val;
    };

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
                        {isTermination ? <span className="text-danger">Yêu Cầu Thanh Lý Hợp Đồng</span> : 'Lập Phụ Lục Hợp Đồng'}
                    </h4>
                    <div className="text-muted small">
                        {selectedContract ? `HĐ #${selectedContract.contract_number}` : "Tạo mới"}
                    </div>
                </div>
            </div>

            {error && <Alert variant="danger" className="shadow-sm border-danger">
                <ExclamationTriangle className="me-2"/> {error}
            </Alert>}

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
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Hợp đồng gốc <span className="text-danger">*</span></Form.Label>
                                            <Form.Select
                                                value={selectedContractId}
                                                onChange={e => setSelectedContractId(e.target.value)}
                                                disabled={!!initialContractId}
                                                className={!!initialContractId ? "bg-light fw-bold text-dark" : ""}
                                                required
                                            >
                                                <option value="">-- Chọn hợp đồng --</option>
                                                {contracts.map(c => (
                                                    <option key={c.contract_id} value={c.contract_id}>
                                                        #{c.contract_number} - {c.tenant_name || 'Khách thuê'}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label>Loại nghiệp vụ <span className="text-danger">*</span></Form.Label>
                                            <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                                                {ADDENDUM_TYPES.map(type => (
                                                    <div
                                                        key={type.value}
                                                        onClick={() => setAddendumType(type.value)}
                                                        className={`
                                                            p-3 border rounded cursor-pointer transition-all 
                                                            ${addendumType === type.value ? 'ring-2' : 'hover-bg-light'}
                                                            ${addendumType === type.value && type.value === 'early_termination' ? 'bg-danger-subtle border-danger' : ''}
                                                            ${addendumType === type.value && type.value !== 'early_termination' ? 'bg-primary-subtle border-primary' : ''}
                                                        `}
                                                        style={{ borderWidth: addendumType === type.value ? '2px' : '1px' }}
                                                    >
                                                        <div className={`fw-bold d-flex align-items-center gap-2 ${type.value === 'early_termination' ? 'text-danger' : 'text-dark'}`}>
                                                            {type.value === 'early_termination' ? <XCircle /> : <div className={`rounded-circle p-1 ${addendumType === type.value ? 'bg-primary' : 'bg-secondary'}`} style={{width: 10, height: 10}}></div>}
                                                            {type.label}
                                                        </div>
                                                        <div className="small text-muted mt-1">{type.desc}</div>
                                                    </div>
                                                ))}
                                            </div>
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
                                                    {/* Đã xóa label (Tùy chọn) để người dùng hiểu đây là field quan trọng, mặc dù code vẫn cho phép null nhưng logic mặc định đã điền */}
                                                    <Form.Label>Ngày hết hiệu lực <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={effectiveTo}
                                                        onChange={e => setEffectiveTo(e.target.value)}
                                                        min={effectiveFrom}
                                                        required // Bắt buộc nhập trên giao diện
                                                    />
                                                    <Form.Text className="text-muted small">
                                                        Mặc định là ngày kết thúc của HĐ gốc.
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
                                    {!selectedContractId ? (
                                        <div className="text-center py-4 text-muted bg-light rounded">Vui lòng chọn hợp đồng trước</div>
                                    ) : (
                                        <>
                                            <div className="d-flex flex-wrap gap-2 mb-4">
                                                {FIELD_DEFINITIONS.map(field => {
                                                    const isActive = selectedFields.includes(field.key);
                                                    const isLocked = addendumType !== 'general_amendment';
                                                    if (isLocked && !isActive) return null;
                                                    return (
                                                        <div
                                                            key={field.key}
                                                            className={`
                                                                d-flex align-items-center gap-2 px-3 py-2 rounded-pill border
                                                                ${isActive ? 'bg-primary text-white border-primary' : 'bg-white text-secondary'}
                                                                ${isLocked ? 'opacity-100' : 'cursor-pointer'}
                                                            `}
                                                            onClick={() => handleFieldToggle(field.key)}
                                                            style={{ cursor: isLocked ? 'default' : 'pointer' }}
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
                                                                            Hiện tại: <span className="fw-medium text-dark">{formatCurrentValue(key, selectedContract?.[key])}</span>
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
                                                                                required // Bắt buộc nhập HTML5
                                                                            />
                                                                            {fieldConfig.suffix && <InputGroup.Text>{fieldConfig.suffix}</InputGroup.Text>}
                                                                            <Form.Control.Feedback type="invalid">
                                                                                Vui lòng nhập giá trị
                                                                            </Form.Control.Feedback>
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
                                                    Vui lòng chọn ít nhất một nội dung để thay đổi.
                                                </Alert>
                                            )}
                                        </>
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
                                        placeholder={isTermination ? "Nhập lý do chấm dứt hợp đồng..." : "Tóm tắt nội dung thay đổi..."}
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        required={isTermination}
                                        className={isTermination ? "border-danger" : ""}
                                    />
                                    {isTermination && <Form.Text className="text-danger">* Thông tin này sẽ được gửi trong yêu cầu thanh lý.</Form.Text>}
                                </Form.Group>

                                {!isTermination && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Văn bản đính kèm</Form.Label>
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
                                                <div className="fw-medium">Tải file lên</div>
                                                <small className="text-muted d-block mt-1">PDF, Ảnh (Max 10MB)</small>
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

                {/* FOOTER ACTIONS */}
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
                            <> <Spinner size="sm" className="me-2" /> Đang xử lý... </>
                        ) : (
                            isTermination ? "Gửi Yêu Cầu" : "Tạo Phụ Lục"
                        )}
                    </Button>
                </div>
            </Form>

            <div style={{height: 80}}></div>
        </div>
    );
};

export default CreateAddendumPage;