// src/pages/contract/CreateContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContract } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { Button, Spinner } from "react-bootstrap";
import "./CreateContractPage.css";
import {getAccessToken} from "@/services/http.js";

function CreateContractPage() {
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [buildings, setBuildings] = useState([]);
    const [assignedBuilding, setAssignedBuilding] = useState(null); // when manager
    const [form, setForm] = useState({
        building_id: "",
        room_number: "",
        tenant_name: "",
        start_date: "",
        end_date: "",
        rent_amount: "",
        deposit_amount: "",
        status: "pending",
        note: "",
        file: null
    });

    // --- GET ROLE FROM JWT ---
    useEffect(() => {
        try {
            const token = getAccessToken();
            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                const role = decoded.role || decoded.userRole || "";
                setUserRole(role.toUpperCase());
                console.log("🔑 User Role from JWT:", role.toUpperCase());
            }
        } catch (error) {
            console.error("❌ Error parsing JWT:", error);
        }
    }, []);

    useEffect(() => {
        async function fetchBuildings() {
            setLoading(true);
            try {
                // If manager, use assigned list; else get full list
                if (userRole === "MANAGER") {
                    const res = await listAssignedBuildings();
                    const assignedList = Array.isArray(res) ? res : res?.data;

                    if (Array.isArray(assignedList) && assignedList.length > 0) {
                        const b = assignedList[0];
                        setAssignedBuilding(b);
                        setForm(prev => ({
                            ...prev,
                            building_id: b.building_id
                        }));
                    } else {
                        setAssignedBuilding(null);
                    }
                } else {
                    const res = await listBuildings();
                    // res may be array or object with items
                    const items = Array.isArray(res) ? res : (res.items || []);
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
            // validate basic
            if (!form.room_number || !form.tenant_name || !form.start_date) {
                alert("Vui lòng điền ít nhất: tên khách, số phòng và ngày bắt đầu.");
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

            {loading ? (
                <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
                <form className="contract-form" onSubmit={handleSubmit}>

                    <div className="form-row">
                        <label>Tòa nhà</label>
                        {userRole === "MANAGER" ? (
                            <input type="text" className="form-control" value={assignedBuilding ? assignedBuilding.name : "Không có tòa nhà được phân công"} disabled />
                        ) : (
                            <select
                                name="building_id"
                                className="form-control"
                                value={form.building_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Chọn tòa nhà --</option>
                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="form-row">
                        <label>Số phòng</label>
                        <input type="text" name="room_number" className="form-control" value={form.room_number} onChange={handleChange} required />
                    </div>

                    <div className="form-row">
                        <label>Tên khách thuê</label>
                        <input type="text" name="tenant_name" className="form-control" value={form.tenant_name} onChange={handleChange} required />
                    </div>

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
                        <label>File hợp đồng (pdf / ảnh)</label>
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
