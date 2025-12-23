// src/pages/contract/EditContractPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, fetchContractFileBlob } from "../../services/api/contracts";
import { listBuildings, listAssignedBuildings } from "@/services/api/building.js";
import { Button, Spinner } from "react-bootstrap";
import "./EditContractPage.css";

function EditContractPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [userRole, setUserRole] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [contract, setContract] = useState(null);

    const [buildings, setBuildings] = useState([]);
    const [assignedBuilding, setAssignedBuilding] = useState(null); // for manager

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

    useEffect(() => {
        try {
            const token = localStorage.getItem("access_token") || "";
            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                const role = decoded.role || decoded.userRole || "";
                setUserRole(role.toUpperCase());
            }
        } catch (err) {
            // ignore
        }
    }, []);

    useEffect(() => {
        async function init() {
            setLoading(true);
            try {
                const data = await getContractById(id);
                setContract(data);
                setForm({
                    building_id: data.building_id ?? data.buildingId ?? data.building?.id ?? "",
                    room_number: data.room_number ?? data.room ?? "",
                    tenant_name: data.tenant_name ?? data.tenantName ?? "",
                    start_date: data.start_date ? data.start_date.slice(0,10) : "",
                    end_date: data.end_date ? data.end_date.slice(0,10) : "",
                    rent_amount: data.rent_amount ?? data.rentAmount ?? "",
                    deposit_amount: data.deposit_amount ?? data.depositAmount ?? "",
                    status: data.status ?? "pending",
                    note: data.note ?? "",
                    file: null
                });

                // fetch building lists / assigned
                if (userRole === "MANAGER") {
                    const assigned = await listAssignedBuildings();
                    if (Array.isArray(assigned) && assigned.length > 0) {
                        setAssignedBuilding(assigned[0]);
                        // enforce building id if assigned differs
                        setForm(prev => ({ ...prev, building_id: assigned[0].building_id }));
                    }
                } else {
                    const bRes = await listBuildings();
                    const items = Array.isArray(bRes) ? bRes : (bRes.items || []);
                    setBuildings(items.map(x => ({ id: x.id ?? x.building_id ?? x._id, name: x.name ?? x.building_name })));
                }
            } catch (error) {
                console.error("Load contract error:", error);
                alert("Không tải được hợp đồng.");
            } finally {
                setLoading(false);
            }
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, userRole]);

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
            // If manager, ensure building_id equals assigned building
            if (userRole === "MANAGER" && assignedBuilding) {
                form.building_id = assignedBuilding.building_id;
            }

            await updateContract(id, form);
            alert("Cập nhật hợp đồng thành công");
            navigate("/contracts");
        } catch (error) {
            console.error("Update error:", error);
            alert("Cập nhật thất bại: " + (error?.message || ""));
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

    if (loading) {
        return <div className="container py-4 text-center"><Spinner animation="border" /></div>;
    }

    return (
        <div className="edit-contract-page container">
            <h3>Chỉnh sửa hợp đồng #{contract?.contract_id ?? id}</h3>

            <form className="contract-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <label>Tòa nhà</label>
                    {userRole === "MANAGER" ? (
                        <input type="text" className="form-control" value={assignedBuilding ? assignedBuilding.name : contract?.building_name || "N/A"} disabled />
                    ) : (
                        <select name="building_id" className="form-control" value={form.building_id} onChange={handleChange} required>
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
                        <option value="expired">Hết hạn</option>
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
                        <div className="mt-2">
                            <Button variant="outline-primary" size="sm" onClick={handlePreviewFile}>Xem file hiện tại</Button>
                        </div>
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
