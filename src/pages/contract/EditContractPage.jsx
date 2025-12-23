// src/pages/contract/EditContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, fetchContractFileBlob } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
// Import API
import { getRoomsByBuildingId } from "@/services/api/rooms.js";
import { getTenantsByRoomId } from "@/services/api/tenants.js";

import { Button, Spinner } from "react-bootstrap";
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
    const [rooms, setRooms] = useState([]);     // Rooms list
    const [tenants, setTenants] = useState([]); // Tenants list

    const [assignedBuilding, setAssignedBuilding] = useState(null);

    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        room_id: "", // Cần thêm field này để quản lý dropdown
        tenant_name: "",
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
                // 1. Load Contract
                const data = await getContractById(id);
                setContract(data);

                const currentBuildingId = data.building_id ?? data.buildingId ?? data.building?.id ?? "";
                const currentRoomNum = data.room_number ?? data.room ?? "";

                let tempRooms = [];
                let foundRoomId = "";

                // 2. Load Buildings (Logic Manager/Admin)
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

                // 3. Load Rooms for the current building
                if (currentBuildingId) {
                    const rRes = await getRoomsByBuildingId(currentBuildingId);
                    tempRooms = Array.isArray(rRes) ? rRes : rRes.data || [];
                    setRooms(tempRooms);

                    // Tìm ID của phòng dựa trên số phòng (vì contract trả về số phòng)
                    const matchRoom = tempRooms.find(r => r.room_number == currentRoomNum);
                    if (matchRoom) {
                        // SỬA: Thêm matchRoom.room_id vào đây
                        foundRoomId = matchRoom.id || matchRoom._id || matchRoom.room_id;
                    }
                }

                // 4. Load Tenants for the current room
                if (foundRoomId) {
                    const tRes = await getTenantsByRoomId(foundRoomId);
                    // Service đã xử lý unwrap, tRes chính là mảng tenants
                    setTenants(Array.isArray(tRes) ? tRes : []);
                }
                // 5. Set Form
                setForm({
                    building_id: currentBuildingId,
                    room_number: currentRoomNum,
                    room_id: foundRoomId, // set ID để dropdown hiển thị đúng
                    tenant_name: data.tenant_name ?? "",
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
        if(userRole || userRole === "") init(); // Chạy khi role đã xác định
    }, [id, userRole]);

    // Xử lý thay đổi Building (giống trang Create)
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

    // Xử lý thay đổi Room
    const handleRoomChange = async (e) => {
        const rId = e.target.value;
        // SỬA: Thêm so sánh với r.room_id
        const selectedRoom = rooms.find(r => (r.id || r._id || r.room_id) == rId);
        setForm(prev => ({
            ...prev,
            room_id: rId,
            room_number: selectedRoom ? selectedRoom.room_number : "",
            tenant_name: ""
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
            // Note: consumer can close the tab; we don't keep a modal here
        } catch (error) {
            alert("Không preview được file.");
        }
    };

    if (loading) return <div className="text-center py-4"><Spinner animation="border" /></div>;

    return (
        <div className="edit-contract-page container">
            <h3>Chỉnh sửa hợp đồng #{contract?.contract_id ?? id}</h3>
            <form className="contract-form" onSubmit={handleSubmit}>

                {/* 1. TÒA NHÀ */}
                <div className="form-row">
                    <label>Tòa nhà</label>
                    {userRole === "MANAGER" ? (
                        <input type="text" className="form-control" value={assignedBuilding?.name || contract?.building_name} disabled />
                    ) : (
                        <select name="building_id" className="form-control" value={form.building_id} onChange={handleBuildingChange} required>
                            <option value="">-- Chọn tòa nhà --</option>
                            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    )}
                </div>

                {/* 2. PHÒNG */}
                <div className="form-row">
                    <label>Số phòng</label>
                    <select name="room_id" className="form-control" value={form.room_id} onChange={handleRoomChange} required>
                        <option value="">-- Chọn phòng --</option>
                        {rooms.map(r => (
                            // SỬA: Thêm r.room_id vào key và value
                            <option
                                key={r.id || r._id || r.room_id}
                                value={r.id || r._id || r.room_id}
                            >
                                Phòng {r.room_number}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 3. KHÁCH THUÊ */}
                <div className="form-row">
                    <label>Tên khách thuê</label>
                    <select
                        name="tenant_name"
                        className="form-control"
                        value={form.tenant_name}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Chọn khách trong phòng --</option>
                        {tenants.map((t, idx) => (
                            // SỬA: API trả về 'user_id' và 'full_name'
                            // Sử dụng t.user_id làm key
                            // Sử dụng t.full_name để hiển thị và làm value
                            <option
                                key={t.user_id || t.id || idx}
                                value={t.full_name || t.name || ""}
                            >
                                {t.full_name || t.name} - {t.phone} {/* Thêm sđt để dễ phân biệt nếu muốn */}
                            </option>
                        ))}

                        {/* Fallback nếu danh sách rỗng nhưng form đang có dữ liệu cũ */}
                        {tenants.length === 0 && form.tenant_name && (
                            <option value={form.tenant_name}>{form.tenant_name} (Hiện tại)</option>
                        )}
                    </select>
                </div>

                {/* Các trường còn lại giữ nguyên như file cũ */}
                <div className="form-row form-inline">
                    <div>
                        <label>Ngày bắt đầu</label>
                        <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} />
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
                    <label>File hợp đồng (nếu muốn thay)</label>
                    <input type="file" name="file" accept="application/pdf,image/*" onChange={handleChange} />
                    {contract?.has_file && (
                        <div className="mt-2"><Button variant="outline-primary" size="sm" onClick={handlePreviewFile}>Xem file hiện tại</Button></div>
                    )}
                </div>

                <div className="form-actions">
                    <Button variant="secondary" onClick={() => navigate("/contracts")}>Hủy</Button>
                    <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? <><Spinner size="sm" animation="border" /> Đang lưu...</> : "Cập nhật"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default EditContractPage;