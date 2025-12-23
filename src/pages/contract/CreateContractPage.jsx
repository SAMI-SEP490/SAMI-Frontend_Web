// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContract } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { getRoomsByBuildingId } from "@/services/api/rooms.js";
import { getTenantsByRoomId } from "@/services/api/tenants.js";

import { Button, Spinner } from "react-bootstrap";
import "./CreateContractPage.css";
import { getAccessToken } from "@/services/http.js";

function CreateContractPage() {
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Data lists
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);     // Danh sách phòng theo tòa
    const [tenants, setTenants] = useState([]); // Danh sách khách theo phòng

    const [assignedBuilding, setAssignedBuilding] = useState(null);

    const [form, setForm] = useState({
        building_id: "",
        room_number: "", // Lưu số phòng để gửi backend
        room_id: "",     // Lưu ID phòng để fetch tenants
        tenant_name: "",
        start_date: "",
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        status: "pending",
        note: "",
        file: null
    });

    // --- 1. GET ROLE ---
    useEffect(() => {
        try {
            const token = getAccessToken();
            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                const role = decoded.role || decoded.userRole || "";
                setUserRole(role.toUpperCase());
            }
        } catch (error) {
            console.error("❌ Error parsing JWT:", error);
        }
    }, []);

    // --- 2. LOAD BUILDINGS ---
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
                        // Tự động chọn tòa nhà và trigger load phòng
                        handleBuildingChange({ target: { value: b.building_id } });
                    } else {
                        setAssignedBuilding(null);
                    }
                } else {
                    const res = await listBuildings();
                    const items = Array.isArray(res) ? res : (res.items || []);
                    // Map đúng ID cho building
                    setBuildings(items.map(x => ({ id: x.id ?? x.building_id ?? x._id, name: x.name ?? x.building_name })));
                }
            } catch (error) {
                console.error("Lỗi lấy tòa nhà:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchBuildings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole]);

    // --- 3. HANDLE SELECT CHANGE ---

    // Khi chọn Tòa -> Load Phòng
    const handleBuildingChange = async (e) => {
        const bId = e.target.value;
        setForm(prev => ({
            ...prev,
            building_id: bId,
            room_number: "", room_id: "",
            tenant_name: ""
        }));
        setRooms([]);
        setTenants([]);

        if (bId) {
            try {
                const res = await getRoomsByBuildingId(bId);
                setRooms(Array.isArray(res) ? res : res.data || []);
            } catch (err) {
                console.error("Lỗi tải phòng:", err);
            }
        }
    };

    // Khi chọn Phòng -> Load Khách
    const handleRoomChange = async (e) => {
        const rId = e.target.value;

        // SỬA: Tìm object phòng bao gồm cả check room_id
        const selectedRoom = rooms.find(r => (r.id || r._id || r.room_id) == rId);

        setForm(prev => ({
            ...prev,
            room_id: rId,
            room_number: selectedRoom ? selectedRoom.room_number : "",
            tenant_name: ""
        }));
        setTenants([]);

        if (rId) {
            try {
                const res = await getTenantsByRoomId(rId);
                // SỬA: Service đã unwrap, chỉ cần check mảng
                setTenants(Array.isArray(res) ? res : []);
            } catch (err) {
                console.error("Lỗi tải khách thuê:", err);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setForm(prev => ({ ...prev, file: files?.[0] ?? null }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!form.room_number || !form.tenant_name || !form.start_date) {
                alert("Vui lòng điền đủ thông tin bắt buộc.");
                setSubmitting(false);
                return;
            }
            await createContract(form);
            alert("Tạo hợp đồng thành công");
            navigate("/contracts");
        } catch (error) {
            console.error("Create error:", error);
            alert("Tạo hợp đồng thất bại: " + (error?.message || ""));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-contract-page container">
            <h3>Tạo hợp đồng mới</h3>
            {loading ? <Spinner animation="border" /> : (
                <form className="contract-form" onSubmit={handleSubmit}>

                    {/* 1. CHỌN TÒA NHÀ */}
                    <div className="form-row">
                        <label>Tòa nhà</label>
                        {userRole === "MANAGER" ? (
                            <input type="text" className="form-control" value={assignedBuilding ? assignedBuilding.name : "..."} disabled />
                        ) : (
                            <select name="building_id" className="form-control" value={form.building_id} onChange={handleBuildingChange} required>
                                <option value="">-- Chọn tòa nhà --</option>
                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        )}
                    </div>

                    {/* 2. CHỌN PHÒNG (Lọc theo tòa) */}
                    <div className="form-row">
                        <label>Số phòng</label>
                        <select
                            name="room_id"
                            className="form-control"
                            value={form.room_id || ""}
                            onChange={handleRoomChange}
                            required
                            disabled={!form.building_id}
                        >
                            <option value="">-- Chọn phòng --</option>
                            {rooms.map(r => (
                                // SỬA: Thêm r.room_id vào key và value để tránh lỗi undefined
                                <option
                                    key={r.id || r._id || r.room_id}
                                    value={r.id || r._id || r.room_id}
                                >
                                    Phòng {r.room_number}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 3. CHỌN KHÁCH THUÊ (Lọc theo phòng) */}
                    <div className="form-row">
                        <label>Tên khách thuê</label>
                        <select
                            name="tenant_name"
                            className="form-control"
                            value={form.tenant_name}
                            onChange={handleChange}
                            required
                            disabled={!form.room_id}
                        >
                            <option value="">-- Chọn khách trong phòng --</option>
                            {tenants.map((t, idx) => (
                                // SỬA: Sử dụng t.user_id làm key (theo API trả về)
                                <option
                                    key={t.user_id || t.id || idx}
                                    value={t.full_name || t.name}
                                >
                                    {t.full_name || t.name} - {t.phone}
                                </option>
                            ))}
                        </select>
                        {tenants.length === 0 && form.room_id && (
                            <small className="text-muted">Phòng này hiện chưa có thông tin khách thuê.</small>
                        )}
                    </div>

                    {/* Các trường còn lại giữ nguyên */}
                    <div className="form-row form-inline">
                        <div>
                            <label>Ngày bắt đầu</label>
                            <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Ngày kết thúc</label>
                            <input type="date" name="end_date" className="form-control" value={form.end_date} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row form-inline">
                        <div>
                            <label>Tiền thuê</label>
                            <input type="number" name="rent_amount" className="form-control" value={form.rent_amount} onChange={handleChange} />
                        </div>
                        <div>
                            <label>Tiền cọc</label>
                            <input type="number" name="deposit_amount" className="form-control" value={form.deposit_amount} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <label>Trạng thái</label>
                        <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                            <option value="pending">Chờ duyệt</option>
                            <option value="active">Hiệu lực</option>
                            <option value="terminated">Đã hủy</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Ghi chú</label>
                        <textarea name="note" className="form-control" value={form.note} onChange={handleChange} rows={3} />
                    </div>

                    <div className="form-row">
                        <label>File hợp đồng</label>
                        <input type="file" name="file" accept="application/pdf,image/*" onChange={handleChange} />
                    </div>

                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => navigate("/contracts")}>Hủy</Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? <><Spinner size="sm" animation="border" /> Đang lưu...</> : "Tạo hợp đồng"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default CreateContractPage;