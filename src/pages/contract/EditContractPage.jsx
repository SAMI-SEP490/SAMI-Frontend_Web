// src/pages/contract/EditContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, fetchContractFileBlob } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getEmptyRoomsByBuildingId } from "@/services/api/rooms.js";
import { lookupTenant } from "@/services/api/tenants.js";

import { Button, Spinner, Alert, Row, Col, Card, Image } from "react-bootstrap";
import {
    Building, CalendarDate, CashCoin, FileEarmarkText,
    CheckCircleFill, XLg, Search, Telephone, PersonBadge,
    FileEarmarkPdf, FileEarmarkImage, PencilSquare, Save, BoxArrowUpRight, ArrowLeft
} from "react-bootstrap-icons";
import "./EditContractPage.css"; // Dùng chung CSS với trang Create hoặc file này
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

    // --- SEARCH STATES (Giống CreatePage) ---
    const [searchQuery, setSearchQuery] = useState("");
    const [foundTenant, setFoundTenant] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [assignedBuilding, setAssignedBuilding] = useState(null);
    const [errors, setErrors] = useState({}); // State lỗi validation

    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "",
        tenant_user_id: "",
        start_date: "",
        duration_months: 12,
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        penalty_rate: 0.1,
        payment_cycle_months: 1,
        status: "pending",
        note: "",
        files: []
    });

    // --- HELPERS: CURRENCY FORMAT ---
    const formatCurrency = (value) => {
        if (!value && value !== 0) return "";
        const number = Number(String(value).replace(/\D/g, ""));
        return new Intl.NumberFormat("vi-VN").format(number);
    };

    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;
        const rawValue = value.replace(/\D/g, "");
        setForm(prev => ({ ...prev, [name]: rawValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    // --- VALIDATION LOGIC ---
    const validateForm = () => {
        const newErrors = {}; // Object chứa lỗi

        // 2. Validate Room & Tenant
        if (!form.building_id) newErrors.building_id = "Vui lòng chọn tòa nhà.";
        if (!form.room_id) newErrors.room_id = "Vui lòng chọn phòng.";
        if (!form.tenant_user_id) newErrors.tenant_user_id = "Vui lòng tìm kiếm và xác nhận khách thuê.";

        // 3. Validate Rent
        const rent = parseFloat(form.rent_amount);
        if (!form.rent_amount || isNaN(rent) || rent <= 0) {
            newErrors.rent_amount = "Tiền thuê phải là số dương lớn hơn 0.";
        } else if (rent > 1000000000) {
            newErrors.rent_amount = "Tiền thuê quá lớn (giới hạn 1 tỷ).";
        }

        // 4. Validate Deposit
        const deposit = form.deposit_amount ? parseFloat(form.deposit_amount) : 0;
        if (deposit < 0) {
            newErrors.deposit_amount = "Tiền cọc không được là số âm.";
        } else if (rent > 0 && deposit > rent * 12) { // Chỉ check chéo khi rent hợp lệ
            newErrors.deposit_amount = "Tiền cọc không được vượt quá 1 năm tiền nhà.";
        }

        // 5. Validate Dates
        if (!form.start_date) {
            newErrors.start_date = "Vui lòng chọn ngày bắt đầu.";
        } else {
            // [NEW] Check ngày bắt đầu không quá cũ (6 tháng)
            const startDate = new Date(form.start_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Tạo mốc 6 tháng trước
            const minDate = new Date();
            minDate.setMonth(today.getMonth() - 6);
            minDate.setHours(0, 0, 0, 0);

            const maxFutureDate = new Date();
            maxFutureDate.setMonth(today.getMonth() + 1);
            maxFutureDate.setHours(0, 0, 0, 0);

            if (startDate < minDate) {
                newErrors.start_date = "Ngày bắt đầu không được quá 6 tháng trong quá khứ.";
            } else if (startDate > maxFutureDate) {
                newErrors.start_date = "Ngày bắt đầu không được vượt quá 1 tháng kể từ hôm nay.";
            }
        }

        if (!form.duration_months) {
            newErrors.duration_months = "Vui lòng nhập thời hạn.";
        } else if (parseInt(form.duration_months) > 60) {
            // [NEW] Check thời hạn tối đa 5 năm
            newErrors.duration_months = "Thời hạn thuê tối đa là 60 tháng (5 năm).";
        }


        // Check End Date Tương lai
        if (form.end_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(form.end_date);
            if (endDate <= today) {
                // Lỗi này có thể hiển thị ở start_date hoặc duration_months tùy bạn
                newErrors.end_date = "Ngày kết thúc phải ở tương lai. Kiểm tra lại ngày bắt đầu hoặc thời hạn.";
            }
        }

        // 6. Validate Penalty
        const rate = parseFloat(form.penalty_rate);
        if (isNaN(rate) || rate < 0.01 || rate > 1) {
            newErrors.penalty_rate = "Tỷ lệ phạt phải từ 0.01% đến 1%.";
        }

        return newErrors;
    };
    // --- EFFECT: Calculate End Date ---
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

    // --- EFFECT: Debounce Search Tenant ---
    useEffect(() => {
        // Chỉ tìm khi có building_id, chuỗi > 3 ký tự và chưa chốt tenant
        if (!searchQuery || searchQuery.length < 3 || !form.building_id || foundTenant) {
            return;
        }

        const timer = setTimeout(() => {
            handleSearchTenant(searchQuery);
        }, 600);

        return () => clearTimeout(timer);
    }, [searchQuery, form.building_id]);

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
        async function init() {
            setLoading(true);
            try {
                const data = await getContractById(id);
                setContract(data);

                const currentBuildingId = data.building_id ?? data.buildingId ?? data.building?.id ?? "";
                const currentRoomNum = data.room_number ?? data.room ?? "";

                // Load Tenant Info
                if (data.tenant_user_id) {
                    setFoundTenant({
                        user_id: data.tenant_user_id,
                        full_name: data.tenant_name,
                        phone: data.tenant_phone,
                        id_number: data.tenant_id_number || "...",
                        avatar_url: data.tenant_avatar || null
                    });
                    // Set tên để hiển thị đẹp, nhưng không trigger search vì foundTenant đã set
                    setSearchQuery(data.tenant_phone || data.tenant_name || "");
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

                // Load Rooms (Include current occupied room)
                let tempRooms = [];
                if (currentBuildingId) {
                    const rRes = await getEmptyRoomsByBuildingId(currentBuildingId);
                    tempRooms = Array.isArray(rRes) ? rRes : rRes.data || [];

                    const currentRoomInList = tempRooms.find(r => r.room_id === data.room_id);
                    if (!currentRoomInList) {
                        tempRooms.push({
                            room_id: data.room_id,
                            room_number: currentRoomNum,
                            status: 'occupied'
                        });
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
                console.error("Load error:", error);
                alert("Không tải được dữ liệu.");
            } finally {
                setLoading(false);
            }
        }
        if(userRole || userRole === "") init();
    }, [id, userRole]);

    const handleBuildingChange = async (e) => {
        const bId = e.target.value;

        // 1. Reset Form: Cập nhật Building, đồng thời XÓA Room và Tenant
        setForm(prev => ({
            ...prev,
            building_id: bId,
            room_number: "",
            room_id: "",
            tenant_user_id: "" // [NEW] Reset ID khách thuê trong form
        }));

        // 2. Reset UI/State liên quan
        setRooms([]);
        setFoundTenant(null);   // [NEW] Bỏ chọn khách hiện tại
        setSearchQuery("");     // [NEW] Xóa chữ trong ô tìm kiếm
        setSearchResults([]);   // [NEW] Xóa danh sách gợi ý cũ
        setShowDropdown(false); // [NEW] Ẩn dropdown

        // 3. Gọi API lấy danh sách phòng mới
        if (bId) {
            try {
                const res = await getEmptyRoomsByBuildingId(bId);
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
        }));
    };

    const handleSearchTenant = async (queryInput = searchQuery) => {
        if (!queryInput.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        if (!form.building_id) return; // Chỉ tìm khi đã có toà nhà để lọc nếu cần

        setSearchLoading(true);
        try {
            const results = await lookupTenant(queryInput, form.building_id);
            if (Array.isArray(results) && results.length > 0) {
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
            setShowDropdown(true);
        } catch (err) {
            console.error(err);
            setSearchResults([]);
            setShowDropdown(true);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectTenant = (tenant) => {
        setFoundTenant(tenant);
        setForm(prev => ({...prev, tenant_user_id: tenant.user_id}));
        setSearchQuery(tenant.full_name || tenant.phone);
        setShowDropdown(false);
        setSearchResults([]);
        if (errors.tenant_user_id) setErrors(prev => ({...prev, tenant_user_id: null}));
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
        if(errors.files) setErrors(prev => ({...prev, files: null}));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if(errors[name]) setErrors(prev => ({...prev, [name]: null}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Validate
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // 2. Submit
        setSubmitting(true);
        try {
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
            alert("Cập nhật thành công!");
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
        <div className="create-contract-page-container container mt-4">
            {/* HEADER */}
            <div className="edit-contract-header mb-4 pb-3 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <Button variant="light" className="border shadow-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h3 className="m-0 text-primary">
                            <PencilSquare className="me-2"/>
                            Chỉnh sửa hợp đồng #{contract?.contract_number || id}
                        </h3>
                        <p className="text-muted mb-0 mt-1">Cập nhật thông tin chi tiết và tệp đính kèm.</p>
                    </div>
                </div>
                <div className="badge bg-light text-dark border px-3 py-2">
                    Trạng thái: <strong>{contract?.status?.toUpperCase()}</strong>
                </div>
            </div>

            <div className="form-card">
                <form className="needs-validation" onSubmit={handleSubmit}>

                    {/* SECTION 1: INFO */}
                    <div className="form-section-title"><Building/> Thông tin bất động sản</div>
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <label className="form-label">Tòa nhà <span className="required">*</span></label>
                            {userRole === "MANAGER" ? (
                                <input type="text" className="form-control" value={assignedBuilding?.name || contract?.building_name} disabled />
                            ) : (
                                <select name="building_id" className={`form-select ${errors.building_id ? 'is-invalid' : ''}`} value={form.building_id} onChange={handleBuildingChange} required>
                                    <option value="">-- Chọn tòa nhà --</option>
                                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            )}
                            {errors.building_id && <div className="invalid-feedback">{errors.building_id}</div>}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Số phòng <span className="required">*</span></label>
                            <select name="room_id" className={`form-select ${errors.room_id ? 'is-invalid' : ''}`} value={form.room_id} onChange={handleRoomChange} required>
                                <option value="">-- Chọn phòng --</option>
                                {rooms.map(r => (
                                    <option key={r.room_id} value={r.room_id}>
                                        Phòng {r.room_number} {r.status === 'occupied' && r.room_id === parseInt(form.room_id) ? "(Hiện tại)" : ""}
                                    </option>
                                ))}
                            </select>
                            {errors.room_id && <div className="invalid-feedback">{errors.room_id}</div>}
                        </div>

                        {/* SEARCH TENANT [UPDATED UI] */}
                        <div className="col-md-4 position-relative">
                            <label className="form-label">Khách thuê <span className="required">*</span></label>
                            <div className="input-group">
                                <span className="input-group-text bg-light">
                                    {searchLoading ? <Spinner size="sm"/> : <Search />}
                                </span>
                                <input
                                    type="text"
                                    className={`form-control ${errors.tenant_user_id ? 'is-invalid' : ''}`}
                                    placeholder="Nhập SĐT, Tên hoặc CCCD..."
                                    value={searchQuery || ""}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        if (e.target.value === "") {
                                            setFoundTenant(null);
                                            setForm(prev => ({...prev, tenant_user_id: ""}));
                                        }
                                    }}
                                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                    autoComplete="off"
                                    disabled={!!foundTenant}
                                />
                                {(foundTenant || searchQuery) && (
                                    <Button variant="outline-secondary" onClick={() => {
                                        handleClearTenant();
                                        setSearchResults([]);
                                        setShowDropdown(false);
                                    }}>
                                        <XLg />
                                    </Button>
                                )}
                            </div>

                            {/* DROPDOWN */}
                            {showDropdown && !foundTenant && (
                                <div className="list-group position-absolute w-100 shadow-lg" style={{zIndex: 1000, maxHeight: '300px', overflowY: 'auto', top: '75px'}}>
                                    {searchResults.length > 0 ? (
                                        searchResults.map((t) => (
                                            <button key={t.user_id} type="button" className="list-group-item list-group-item-action d-flex align-items-center gap-2" onClick={() => handleSelectTenant(t)}>
                                                <div style={{width: 30, height: 30, background: '#eee', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0}}>
                                                    {t.avatar_url ? <img src={t.avatar_url} alt="" style={{width:'100%', height:'100%', borderRadius:'50%'}}/> : <b>{t.full_name?.charAt(0)}</b>}
                                                </div>
                                                <div className="flex-grow-1 text-start">
                                                    <div className="fw-bold small">{t.full_name}</div>
                                                    <div className="text-muted" style={{fontSize: '0.8rem'}}>{t.phone} - {t.id_number}</div>
                                                </div>
                                                {t.room && <span className="badge bg-info text-dark">P.{t.room.room_number}</span>}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="list-group-item text-center py-3 text-muted">
                                            <Search size={24} className="mb-2 text-secondary opacity-50"/>
                                            <p className="mb-0 small">Không tìm thấy khách thuê nào.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.tenant_user_id && <div className="text-danger small mt-1">{errors.tenant_user_id}</div>}

                            {/* TENANT INFO CARD */}
                            {foundTenant && (
                                <Card className="tenant-info-card border-success mt-2 shadow-sm animate__animated animate__fadeIn">
                                    <Card.Body className="p-2">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar-placeholder bg-success-subtle text-success">
                                                {foundTenant.avatar_url ? (
                                                    <Image src={foundTenant.avatar_url} roundedCircle style={{width:40, height:40, objectFit:'cover'}} />
                                                ) : (
                                                    <span className="fw-bold fs-5">{foundTenant.full_name?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <div className="fw-bold text-success text-truncate">{foundTenant.full_name}</div>
                                                <div className="small text-secondary d-flex align-items-center gap-2">
                                                    <span><Telephone size={10}/> {foundTenant.phone}</span>
                                                    <span>|</span>
                                                    <span><PersonBadge size={10}/> {foundTenant.id_number || "--"}</span>
                                                </div>
                                            </div>
                                            <div className="text-success fs-4 me-2"><CheckCircleFill /></div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: FINANCE */}
                    <div className="form-section-title"><CalendarDate/> Thời hạn & Tài chính</div>
                    <Row className="mb-4">
                        <Col md={3}>
                            <label className="form-label">Ngày bắt đầu <span className="required">*</span></label>
                            <input type="date" name="start_date" className={`form-control ${errors.start_date ? 'is-invalid' : ''}`} value={form.start_date} onChange={handleChange} />
                            {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                        </Col>
                        <Col md={3}>
                            <label className="form-label">Thời hạn (Tháng) <span className="required">*</span></label>
                            <input type="number" name="duration_months" className={`form-control ${errors.duration_months ? 'is-invalid' : ''}`} value={form.duration_months} onChange={handleChange} min="1" />
                            {errors.duration_months && <div className="invalid-feedback">{errors.duration_months}</div>}
                        </Col>
                        <Col md={3}>
                            <label className="form-label">Ngày kết thúc (Dự kiến)</label>
                            <input type="text" className="form-control" value={form.end_date} readOnly />
                        </Col>
                        <Col md={3}>
                            <label className="form-label">Chu kỳ thanh toán</label>
                            <select name="payment_cycle_months" className="form-select" value={form.payment_cycle_months} onChange={handleChange}>
                                <option value="1">1 tháng / lần</option>
                                <option value="3">3 tháng / lần</option>
                                <option value="6">6 tháng / lần</option>
                                <option value="12">1 năm / lần</option>
                            </select>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col md={4}>
                            <label className="form-label">Tiền thuê (VNĐ) <span className="required">*</span></label>
                            <div className="input-group has-validation">
                                <input
                                    type="text"
                                    name="rent_amount"
                                    className={`form-control ${errors.rent_amount ? 'is-invalid' : ''}`}
                                    value={formatCurrency(form.rent_amount)}
                                    onChange={handleCurrencyChange}
                                    placeholder="Ví dụ: 5.000.000"
                                    maxLength={15}
                                />
                                <span className="input-group-text">₫</span>
                                {errors.rent_amount && <div className="invalid-feedback">{errors.rent_amount}</div>}
                            </div>
                        </Col>
                        <Col md={4}>
                            <label className="form-label">Tiền cọc (VNĐ)</label>
                            <div className="input-group has-validation">
                                <input
                                    type="text"
                                    name="deposit_amount"
                                    className={`form-control ${errors.deposit_amount ? 'is-invalid' : ''}`}
                                    value={formatCurrency(form.deposit_amount)}
                                    onChange={handleCurrencyChange}
                                    placeholder="0"
                                    maxLength={15}
                                />
                                <span className="input-group-text">₫</span>
                                {errors.deposit_amount && <div className="invalid-feedback">{errors.deposit_amount}</div>}
                            </div>
                        </Col>
                        <Col md={4}>
                            <label className="form-label">Phạt quá hạn (%)</label>
                            <div className="input-group has-validation">
                                <input type="number" name="penalty_rate" className={`form-control ${errors.penalty_rate ? 'is-invalid' : ''}`} value={form.penalty_rate} onChange={handleChange} step="0.01" />
                                <span className="input-group-text">%</span>
                                {errors.penalty_rate && <div className="invalid-feedback">{errors.penalty_rate}</div>}
                            </div>
                        </Col>
                    </Row>

                    {/* SECTION 3: STATUS & FILE */}
                    <div className="form-section-title"><FileEarmarkText/> Hồ sơ & Trạng thái</div>
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <label className="form-label">Trạng thái hợp đồng</label>
                            <select name="status" className="form-select" value={form.status} onChange={handleChange} disabled>
                                <option value="pending">Chờ duyệt</option>
                                <option value="rejected">Bị từ chối</option>
                                <option value="active">Hiệu lực (Active)</option>
                            </select>
                        </div>
                        <div className="col-md-8">
                            <label className="form-label">Ghi chú bổ sung</label>
                            <textarea name="note" className="form-control" value={form.note} onChange={handleChange} rows={2} placeholder="Nhập ghi chú..." />
                        </div>
                    </div>

                    <div className="file-upload-section bg-light p-3 rounded-3 mb-4 border dashed-border">
                        <h6 className="mb-3 d-flex align-items-center gap-2"><FileEarmarkText/> Tệp đính kèm hợp đồng</h6>
                        <div className="row align-items-center">
                            <div className="col-md-7">
                                <label className="form-label small text-muted mb-1">Tải file mới để thay thế (Không bắt buộc):</label>
                                <input type="file" name="file" accept=".pdf,image/*" multiple onChange={handleFileChange} className={`form-control ${errors.files ? 'is-invalid' : ''}`} />
                                {errors.files && <div className="invalid-feedback">{errors.files}</div>}

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
                    <div className="d-flex justify-content-end gap-3 pt-3 border-top">
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
    );
}

export default EditContractPage;