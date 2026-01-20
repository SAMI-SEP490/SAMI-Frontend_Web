// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createContract, processContractWithAI } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getEmptyRoomsByBuildingId } from "@/services/api/rooms.js";
// [UPDATE] Import lookupTenant
import { lookupTenant } from "@/services/api/tenants.js";
import { Button, Spinner, Alert, Modal, Row, Col, Card, Image } from "react-bootstrap";
import {
    Building, Person, CashCoin, CalendarDate, FileEarmarkText,
    Magic, XLg, CheckCircleFill, FileEarmarkPdf, FileEarmarkImage,
    Search, Telephone, CardText, PersonBadge, ArrowLeft
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
    // [UPDATE] Bỏ state tenants list, thêm state cho search
    const [assignedBuilding, setAssignedBuilding] = useState(null);

    // [NEW] Tenant Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [foundTenant, setFoundTenant] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // [NEW] Danh sách gợi ý từ API
    const [showDropdown, setShowDropdown] = useState(false);
    const [errors, setErrors] = useState({});

    // Form State
    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "",
        tenant_user_id: "", // Sẽ được set khi tìm thấy tenant
        start_date: new Date().toISOString().split('T')[0],
        duration_months: 12,
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        penalty_rate: 0.05,
        payment_cycle_months: 1,
        status: "pending",
        note: "",
        files: []
    });

    const validateForm = () => {
        const newErrors = {}; // Object chứa lỗi

        // 1. Validate File
        if (!form.files || form.files.length === 0) {
            newErrors.files = "Vui lòng tải lên ít nhất 1 file hợp đồng.";
        }

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

            // Tạo mốc 14 ngày trước
            const minDate = new Date();
            minDate.setDate(today.getDate() - 14);
            minDate.setHours(0, 0, 0, 0);

            const maxFutureDate = new Date();
            maxFutureDate.setMonth(today.getMonth() + 1);
            maxFutureDate.setHours(0, 0, 0, 0);

            if (startDate < minDate) {
                newErrors.start_date = "Ngày bắt đầu không được cũ hơn 14 ngày so với hiện tại.";
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

        const duration = parseInt(form.duration_months);
        const cycle = parseInt(form.payment_cycle_months);
        if (cycle > duration) {
            newErrors.payment_cycle_months = `Chu kỳ thanh toán (${cycle} tháng) không được lớn hơn thời hạn hợp đồng (${duration} tháng).`;
        }

        // [UPDATE 4] Validate Penalty (Max 0.055%)
        const rate = parseFloat(form.penalty_rate);
        if (isNaN(rate) || rate < 0 || rate > 0.055) {
            newErrors.penalty_rate = "Tỷ lệ phạt không được quá 0.055%/ngày (theo quy định lãi suất).";
        }
        return newErrors;
    };
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

    useEffect(() => {
        // Chỉ tìm kiếm khi đã chọn tòa nhà và chuỗi tìm kiếm đủ dài (>3 ký tự)
        if (!searchQuery || searchQuery.length < 3 || !form.building_id || foundTenant) {
            return;
        }

        const timer = setTimeout(() => {
            handleSearchTenant(searchQuery); // Gọi hàm tìm kiếm
        }, 600); // Delay 600ms chờ người dùng gõ xong

        return () => clearTimeout(timer);
    }, [searchQuery, form.building_id]);
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
        // [UPDATE] Không gọi getTenantsByRoomId nữa
    };

    const handleSearchTenant = async (queryInput = searchQuery) => {
        if (!queryInput.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        if (!form.building_id) return;

        setSearchLoading(true);
        try {
            const results = await lookupTenant(queryInput, form.building_id);

            if (Array.isArray(results) && results.length > 0) {
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
            // [QUAN TRỌNG] Luôn hiện dropdown sau khi tìm kiếm xong,
            // dù có kết quả hay không, để hiển thị thông báo "Không tìm thấy"
            setShowDropdown(true);

        } catch (err) {
            console.error(err);
            setSearchResults([]);
            setShowDropdown(true); // Vẫn hiện dropdown để báo lỗi hoặc trống
        } finally {
            setSearchLoading(false);
        }
    };
    const handleSelectTenant = (tenant) => {
        setFoundTenant(tenant); // Lưu người được chọn
        setForm(prev => ({...prev, tenant_user_id: tenant.user_id})); // Gán vào form
        setSearchQuery(tenant.full_name || tenant.phone); // Điền tên/sđt vào ô input cho đẹp
        setShowDropdown(false); // Ẩn dropdown
        setSearchResults([]); // Xóa kết quả tìm kiếm thừa
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
        if (errors.files) {
            setErrors(prev => ({ ...prev, files: null }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (errors.files) {
            setErrors(prev => ({ ...prev, files: null }));
        }
    };

    const formatCurrency = (value) => {
        if (!value) return "";
        // Xóa các ký tự không phải số để đảm bảo an toàn
        const number = Number(String(value).replace(/\D/g, ""));
        return new Intl.NumberFormat("vi-VN").format(number);
    };

    // 2. Hàm xử lý khi người dùng nhập tiền
    const handleCurrencyChange = (e) => {
        const { name, value } = e.target;

        // Chỉ lấy số (0-9), loại bỏ dấu chấm/phẩy và chữ cái
        const rawValue = value.replace(/\D/g, "");

        setForm(prev => ({ ...prev, [name]: rawValue }));

        // Xóa lỗi nếu có
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- AI HANDLER ---
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

            if (buildingId) await getEmptyRoomsByBuildingId(buildingId).then(r => setRooms(Array.isArray(r) ? r : r.data || [])).catch(()=>{});

            // [UPDATE] Logic xử lý Tenant từ AI
            if (tenant_info) {
                // Nếu AI trả về thông tin tenant, ta set luôn vào state tìm thấy
                // Để hiện thẻ thông tin luôn
                setFoundTenant({
                    user_id: tenant_info.user_id,
                    full_name: tenant_info.full_name,
                    phone: tenant_info.phone,
                    id_number: tenant_info.id_number,
                    email: tenant_info.email,
                    avatar_url: tenant_info.avatar_url || null
                });
                // Điền SĐT vào ô search để đẹp UI
                setSearchQuery(tenant_info.phone || tenant_info.id_number || "");
            }

            setForm(prev => ({
                ...prev,
                building_id: String(buildingId || ""),
                room_id: String(roomId || ""),
                tenant_user_id: String(contract_data?.tenant_user_id || ""),
                start_date: contract_data?.start_date || prev.start_date,
                duration_months: contract_data?.duration_months || 12,
                rent_amount: contract_data?.rent_amount || "",
                deposit_amount: contract_data?.deposit_amount || "",
                penalty_rate: contract_data?.penalty_rate || 0.1,
                payment_cycle_months: contract_data?.payment_cycle_months || 1,
                note: contract_data?.note || "",
                files: [file]
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

        // 1. Validate
        const validationErrors = validateForm();

        // 2. Nếu có lỗi (Object không rỗng) -> Set state lỗi và dừng submit
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // Optional: Scroll lên đầu trang hoặc tới lỗi đầu tiên
            return;
        }

        // 3. Nếu không có lỗi -> Submit
        setSubmitting(true);
        try {
            // ... (Logic gọi API giữ nguyên như cũ) ...
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

            await createContract(formData);
            alert("Tạo hợp đồng thành công!");
            navigate("/contracts");
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || "Có lỗi xảy ra";
            // Nếu backend trả về lỗi cụ thể cho field nào đó, bạn có thể map vào đây
            alert("Lỗi server: " + message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-contract-page-container container mt-4">

            {/* HEADER */}
            <div className="page-header">
                <div>
                    <Button variant="light" className="border shadow-sm" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </Button>
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

                            {/* [UPDATE] CỘT CHỌN KHÁCH THUÊ MỚI */}
                            <Col md={4} className="position-relative"> {/* Thêm position-relative để căn dropdown */}
                                <label className="form-label">Khách thuê <span className="required">*</span></label>

                                <div className="input-group">
        <span className="input-group-text bg-light">
            {searchLoading ? <Spinner size="sm"/> : <Search />}
        </span>
                                    <input
                                        type="text"
                                        // [FIX LỖI REACT]: Thêm || "" để đảm bảo không bao giờ bị undefined
                                        className={`form-control ${errors.tenant_user_id ? 'is-invalid' : ''}`}
                                        placeholder="Nhập SĐT, Tên hoặc CCCD..."
                                        value={searchQuery || ""}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            // Nếu xóa trắng thì reset tenant đã chọn
                                            if (e.target.value === "") {
                                                setFoundTenant(null);
                                                setForm(prev => ({...prev, tenant_user_id: ""}));
                                            }
                                        }}
                                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                        // Tắt autocomplete mặc định của trình duyệt đè lên
                                        autoComplete="off"
                                        disabled={!!foundTenant} // Khóa khi đã chọn (muốn tìm lại phải bấm nút X)
                                    />
                                    {/* Nút Xóa/Bỏ chọn */}
                                    {(foundTenant || searchQuery) && (
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => {
                                                handleClearTenant(); // Nhớ đảm bảo hàm này reset cả searchQuery, foundTenant
                                                setSearchResults([]);
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <XLg />
                                        </Button>
                                    )}
                                </div>

                                {/* [NEW] DROPDOWN GỢI Ý */}
                                {showDropdown && !foundTenant && (
                                    <div className="list-group position-absolute w-100 shadow-lg" style={{zIndex: 1000, maxHeight: '300px', overflowY: 'auto', top: '75px'}}>

                                        {/* TRƯỜNG HỢP 1: CÓ DỮ LIỆU */}
                                        {searchResults.length > 0 ? (
                                            searchResults.map((t) => (
                                                <button
                                                    key={t.user_id}
                                                    type="button"
                                                    className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                                                    onClick={() => handleSelectTenant(t)}
                                                >
                                                    <div style={{width: 30, height: 30, background: '#eee', borderRadius: '50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink: 0}}>
                                                        {t.avatar_url ? <img src={t.avatar_url} alt="" style={{width:'100%', height:'100%', borderRadius:'50%'}}/> : <b>{t.full_name?.charAt(0)}</b>}
                                                    </div>
                                                    <div className="flex-grow-1 text-start">
                                                        <div className="fw-bold small">{t.full_name}</div>
                                                        <div className="text-muted" style={{fontSize: '0.8rem'}}>
                                                            {t.phone} - {t.id_number}
                                                        </div>
                                                    </div>
                                                    {t.room && (
                                                        <span className="badge bg-info text-dark">P.{t.room.room_number}</span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            /* TRƯỜNG HỢP 2: KHÔNG TÌM THẤY (SEARCH RESULTS RỖNG) */
                                            <div className="list-group-item text-center py-3 text-muted">
                                                <Search size={24} className="mb-2 text-secondary opacity-50"/>
                                                <p className="mb-0 small">Không tìm thấy khách thuê nào.</p>
                                                <small className="fst-italic opacity-75">Vui lòng kiểm tra lại SĐT hoặc CCCD.</small>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ERROR MESSAGE */}
                                {errors.tenant_user_id && <div className="text-danger small mt-1">{errors.tenant_user_id}</div>}

                                {/* THẺ THÔNG TIN (USER CARD) - GIỮ NGUYÊN HOẶC CẢI TIẾN NHẸ */}
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
                                                <div className="text-success fs-4 me-2">
                                                    <CheckCircleFill />
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                                <input type="hidden" name="tenant_user_id" value={form.tenant_user_id} required />
                            </Col>
                        </Row>

                        {/* SECTION 2: TERMS */}
                        <div className="form-section-title"><CalendarDate/> Thời hạn & Chu kỳ</div>
                        <Row className="mb-4">
                            <Col md={4}>
                                <label className="form-label">Ngày bắt đầu <span className="required">*</span></label>
                                <input
                                    type="date"
                                    name="start_date"
                                    className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                                    value={form.start_date}
                                    onChange={handleChange}
                                />
                                {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                            </Col>

                            <Col md={4}>
                                <label className="form-label">Thời hạn (Tháng) <span className="required">*</span></label>
                                <input
                                    type="number"
                                    name="duration_months"
                                    className={`form-control ${errors.duration_months ? 'is-invalid' : ''}`}
                                    value={form.duration_months}
                                    onChange={handleChange}
                                    min="1"
                                />
                                {errors.duration_months && <div className="invalid-feedback">{errors.duration_months}</div>}
                            </Col>

                            <Col md={4}>
                                <label className="form-label">Ngày kết thúc (Dự kiến)</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.end_date ? 'is-invalid' : ''}`} // Hiển thị đỏ nếu ngày kết thúc sai
                                    value={form.end_date}
                                    readOnly
                                />
                                {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                            </Col>
                        </Row>
                        <Row className="mb-4">
                            <Col md={6}>
                                <label className="form-label">Chu kỳ thanh toán (Tháng) <span className="required">*</span></label>
                                <select
                                    name="payment_cycle_months"
                                    // [SỬA LẠI DÒNG NÀY] Thêm điều kiện check lỗi để hiện class is-invalid
                                    className={`form-select ${errors.payment_cycle_months ? 'is-invalid' : ''}`}
                                    value={form.payment_cycle_months}
                                    onChange={handleChange}
                                >
                                    <option value="1">1 tháng / lần</option>
                                    <option value="2">2 tháng / lần</option>
                                    <option value="3">3 tháng / lần</option>
                                    <option value="6">6 tháng / lần</option>
                                </select>
                                {errors.payment_cycle_months && <div className="invalid-feedback">{errors.payment_cycle_months}</div>}
                            </Col>
                        </Row>

                        {/* SECTION 3: FINANCE */}
                        <div className="form-section-title"><CashCoin/> Tài chính & Điều khoản</div>
                        <Row className="mb-4">
                            <Col md={4}>
                                <label className="form-label">Giá thuê (VNĐ) <span className="required">*</span></label>
                                <div className="input-group has-validation">
                                    <input
                                        type="text" // [SỬA] Đổi thành text để hiện dấu chấm
                                        name="rent_amount"
                                        className={`form-control ${errors.rent_amount ? 'is-invalid' : ''}`}

                                        // [SỬA] Format giá trị hiển thị
                                        value={formatCurrency(form.rent_amount)}

                                        // [SỬA] Dùng hàm xử lý riêng
                                        onChange={handleCurrencyChange}

                                        placeholder="Ví dụ: 5.000.000"
                                        maxLength={15} // Giới hạn độ dài để tránh số quá lớn
                                    />
                                    <span className="input-group-text">₫</span>
                                    {errors.rent_amount && <div className="invalid-feedback">{errors.rent_amount}</div>}
                                </div>
                            </Col>

                            <Col md={4}>
                                <label className="form-label">Tiền đặt cọc (VNĐ)</label>
                                <div className="input-group has-validation">
                                    <input
                                        type="text" // [SỬA]
                                        name="deposit_amount"
                                        className={`form-control ${errors.deposit_amount ? 'is-invalid' : ''}`}

                                        // [SỬA]
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
                                <label className="form-label">Phạt quá hạn (%) <span className="required">*</span></label>
                                <div className="input-group has-validation">
                                    <input
                                        type="number"
                                        name="penalty_rate"
                                        className={`form-control ${errors.penalty_rate ? 'is-invalid' : ''}`}
                                        value={form.penalty_rate}
                                        onChange={handleChange}
                                        step="0.001"
                                        max="0.055"
                                    />
                                    <span className="input-group-text">% / ngày</span>
                                    {errors.penalty_rate && <div className="invalid-feedback">{errors.penalty_rate}</div>}
                                </div>
                            </Col>
                        </Row>

                        {/* SECTION 4: FILE & NOTE */}
                        <div className="form-section-title"><FileEarmarkText/> Hồ sơ đính kèm</div>
                        <Row className="mb-4">
                            <Col md={6}>
                                <label className="form-label">File Hợp đồng (PDF / Nhiều ảnh)</label>
                                <div className="file-upload-area" onClick={() => document.getElementById('manual-file').click()} style={{cursor:'pointer'}}>
                                    <input id="manual-file" type="file" name="file" accept=".pdf,image/*" multiple hidden onChange={handleFileChange} />
                                    <div className="text-muted">Nhấn để tải file (1 PDF hoặc nhiều Ảnh)</div>

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
                                {errors.files && <div className="text-danger small mt-1">{errors.files}</div>}
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

            {/* SCANNER MODAL (Giữ nguyên) */}
            <Modal show={showScanner} centered size="lg" backdrop="static" className="scanner-modal">
                {/* ... (Giữ nguyên nội dung modal) */}
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