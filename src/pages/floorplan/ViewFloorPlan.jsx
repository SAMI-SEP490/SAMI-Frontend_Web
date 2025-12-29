import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";

import { listBuildings } from "../../services/api/building";
import {
  listFloorPlans,
  getFloorPlanDetail,
  deleteFloorPlan,
} from "../../services/api/floorplan";

/* ===== Simple SVG building (no handles) ===== */
const pathFromPoints = (pts) =>
  pts?.length ? `M${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z` : "";
const bboxOf = (pts = []) => {
  if (!pts.length) return { w: 0, h: 0 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { w: maxX - minX, h: maxY - minY };
};

function BuildingNodeView({ data }) {
  const {
    points = [],
    stroke = "#334155",
    fill = "rgba(59,130,246,.06)",
  } = data || {};
  const { w, h } = bboxOf(points);
  return (
    <div style={{ width: w, height: h }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <path
          d={pathFromPoints(points)}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          shapeRendering="crispEdges"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}

function BlockNodeView({ data }) {
  const { label = "Phòng", w = 120, h = 80, color = "#1e40af" } = data || {};
  return (
    <div
      style={{
        width: w,
        height: h,
        border: `2px solid ${color}`,
        background: "#eef2ff",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        color: "#0f172a",
      }}
    >
      {label}
    </div>
  );
}

function SmallNodeView({ data }) {
  const {
    label = "Icon",
    w = 70,
    h = 40,
    color = "#64748b",
    bg = "#f1f5f9",
  } = data || {};
  return (
    <div
      style={{
        width: w,
        height: h,
        padding: "6px 10px",
        borderRadius: 10,
        border: `2px solid ${color}`,
        background: bg,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </div>
  );
}

function ViewerInner() {
  const navigate = useNavigate();

  // ======= State chọn tòa & tầng =======
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  const [activeBuilding, setActiveBuilding] = useState("");

  // danh sách plan mới nhất cho từng tầng của tòa đang chọn
  const [plansByFloor, setPlansByFloor] = useState({}); // { '1': {plan_id,...}, ... }
  const [floorIds, setFloorIds] = useState([]);
  const [activeFloor, setActiveFloor] = useState("");

  // ======= Data vẽ ReactFlow =======
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [gridGap, setGridGap] = useState(40);

  const [loadingPlan, setLoadingPlan] = useState(false);

  const nodeTypes = useMemo(
    () => ({
      building: BuildingNodeView,
      block: BlockNodeView,
      small: SmallNodeView,
    }),
    []
  );

  const hasPlan = nodes && nodes.length > 0;

  // ===================== 1. Lấy danh sách tòa nhà =====================
  useEffect(() => {
    let canceled = false;

    async function fetchBuildings() {
      try {
        setLoadingBuildings(true);
        setBuildingError("");

        const data = await listBuildings();
        if (canceled) return;

        const arr = Array.isArray(data) ? data : [];
        setBuildings(arr);

        if (arr.length > 0) {
          const firstId = String(arr[0].building_id);
          setActiveBuilding((prev) => prev || firstId);
        }
      } catch (err) {
        if (canceled) return;
        console.error(err);
        setBuildingError(err?.message || "Không thể tải danh sách tòa nhà");
      } finally {
        if (!canceled) setLoadingBuildings(false);
      }
    }

    fetchBuildings();

    return () => {
      canceled = true;
    };
  }, []);

  // eslint-disable-next-line no-unused-vars
  const activeBuildingObj = useMemo(
    () =>
      buildings.find((b) => String(b.building_id) === String(activeBuilding)) ||
      null,
    [buildings, activeBuilding]
  );

  // ===================== 2. Lấy danh sách floor plan theo tòa =====================
  useEffect(() => {
    let canceled = false;

    async function fetchPlansForBuilding() {
      if (!activeBuilding) {
        setPlansByFloor({});
        setFloorIds([]);
        setActiveFloor("");
        setNodes([]);
        setEdges([]);
        return;
      }

      try {
        setLoadingPlan(true);

        const buildingIdInt = parseInt(activeBuilding, 10);
        if (!buildingIdInt || Number.isNaN(buildingIdInt)) {
          setPlansByFloor({});
          setFloorIds([]);
          setActiveFloor("");
          setNodes([]);
          setEdges([]);
          return;
        }

        // Gọi GET /floor-plan?building_id=... để lấy danh sách,
        // service BE đã order version desc nên bản ghi đầu tiên của mỗi floor là version mới nhất
        const { items } = await listFloorPlans({
          building_id: buildingIdInt,
          page: 1,
          limit: 200,
        });

        // Gộp về "phiên bản mới nhất cho mỗi tầng"
        const latestByFloor = {};
        for (const plan of items || []) {
          const floorKey = String(plan.floor_number ?? "");
          if (!floorKey) continue;
          if (!latestByFloor[floorKey]) {
            latestByFloor[floorKey] = plan; // vì items đã sort version desc
          }
        }

        const floors = Object.keys(latestByFloor).sort(
          (a, b) => Number(a) - Number(b)
        );

        if (canceled) return;

        setPlansByFloor(latestByFloor);
        setFloorIds(floors);

        // Nếu tầng đang chọn không còn trong list thì auto chọn tầng đầu tiên có layout
        if (!floors.includes(activeFloor)) {
          setActiveFloor(floors[0] || "");
        }
      } catch (err) {
        if (canceled) return;
        console.error(err);
        setPlansByFloor({});
        setFloorIds([]);
        setActiveFloor("");
        setNodes([]);
        setEdges([]);
      } finally {
        if (!canceled) setLoadingPlan(false);
      }
    }

    fetchPlansForBuilding();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuilding]);

  // ===================== 3. Lấy chi tiết layout cho tòa + tầng đang chọn =====================
  useEffect(() => {
    let canceled = false;

    async function fetchPlanDetail() {
      if (!activeBuilding || !activeFloor) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const summary = plansByFloor[activeFloor];
      if (!summary || !summary.plan_id) {
        setNodes([]);
        setEdges([]);
        return;
      }

      try {
        setLoadingPlan(true);

        const detail = await getFloorPlanDetail(summary.plan_id);
        if (canceled) return;

        const layout = detail?.layout || {};
        const rawNodes = Array.isArray(layout.nodes) ? layout.nodes : [];
        const rawEdges = Array.isArray(layout.edges) ? layout.edges : [];

        const nn = rawNodes.map((n) => ({
          ...n,
          draggable: false,
          selectable: false,
          style: { ...(n.style || {}), zIndex: n.type === "building" ? 0 : 1 },
        }));

        setNodes(nn);
        setEdges(rawEdges);
        setGridGap(layout.meta?.gridGap ?? 40);
      } catch (err) {
        if (canceled) return;
        console.error(err);
        setNodes([]);
        setEdges([]);
      } finally {
        if (!canceled) setLoadingPlan(false);
      }
    }

    fetchPlanDetail();

    return () => {
      canceled = true;
    };
  }, [activeBuilding, activeFloor, plansByFloor]);

  // ===================== 4. Điều hướng sang màn Create/Edit =====================
  const maxFloor = floorIds.length ? Math.max(...floorIds.map(Number)) : 0;
  const activePlan = plansByFloor[activeFloor];

  const gotoCreate = () => {
    const nextFloor = maxFloor + 1;

    if (nextFloor > 20) {
      alert("Tòa nhà đã đạt tối đa 20 tầng, không thể tạo thêm.");
      return;
    }

    const qs = new URLSearchParams({
      building: activeBuilding || "",
      floor: String(nextFloor),
      mode: "create",
    }).toString();

    navigate(`/floorplan/create?${qs}`);
  };

  const gotoEdit = () => {
    if (!hasPlan) return;
    const summary = plansByFloor[activeFloor];
    if (!summary || !summary.plan_id) return;
    navigate(`/floorplan/edit/${summary.plan_id}`);
  };

  // ====== ✅ THÊM: chỉ xóa tầng cao nhất ======
  const canDeleteFloor =
    activePlan &&
    Number(activeFloor) === maxFloor &&
    activePlan.is_published === false;

  const handleDeleteFloor = async () => {
    if (!canDeleteFloor) return;

    const ok = window.confirm(
      `Chỉ được xóa tầng cao nhất.\nBạn có chắc muốn xóa tầng ${activeFloor}?`
    );
    if (!ok) return;

    await deleteFloorPlan(activePlan.plan_id);

    // reload đơn giản, tránh lệch state
    window.location.reload();
  };

  // ===================== RENDER UI =====================
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 16,
        height: "calc(100vh - 140px)",
        padding: 16,
      }}
    >
      {/* LEFT: chọn tòa & tầng */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>Chọn bản vẽ đã lưu</div>

            {/* ====== ACTION BUTTONS ====== */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={gotoCreate}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#10b981",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
                title={`Tạo tầng ${maxFloor + 1}`}
              >
                Tạo mới
              </button>

              <button
                onClick={gotoEdit}
                disabled={!hasPlan}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: hasPlan ? "#0ea5e9" : "#94a3b8",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  cursor: hasPlan ? "pointer" : "not-allowed",
                }}
                title="Chỉnh sửa tầng đã có"
              >
                Chỉnh sửa
              </button>

              {/* ====== ✅ NÚT XÓA TẦNG CAO NHẤT ====== */}
              {canDeleteFloor && (
                <button
                  onClick={handleDeleteFloor}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Chỉ được xóa tầng cao nhất"
                >
                  Xóa tầng
                </button>
              )}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <label style={{ fontWeight: 600 }}>Tòa nhà</label>
              <select
                value={activeBuilding}
                onChange={(e) => setActiveBuilding(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 4,
                }}
              >
                {loadingBuildings && <option value="">Đang tải...</option>}
                {!loadingBuildings && buildings.length === 0 && (
                  <option value="">(Chưa có dữ liệu)</option>
                )}
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.name || `Tòa #${b.building_id}`}
                  </option>
                ))}
              </select>
              {buildingError && (
                <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>
                  {buildingError}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>Tầng</label>
              <select
                value={activeFloor}
                onChange={(e) => setActiveFloor(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 4,
                }}
              >
                {floorIds.length === 0 && (
                  <option value="">(Chưa có layout)</option>
                )}
                {floorIds.map((f) => (
                  <option key={f} value={f}>
                    Tầng {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>
            Chế độ <b>chỉ xem</b>. Dữ liệu lấy từ bản vẽ mới nhất đã lưu trên
            backend cho tòa nhà / tầng đang chọn.
          </div>
        </div>
      </div>

      {/* RIGHT: Viewer ReactFlow */}
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
          position: "relative",
        }}
      >
        {!hasPlan ? (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "#64748b",
            }}
          >
            {loadingPlan
              ? "Đang tải layout..."
              : "Chưa có layout cho tổ hợp đã chọn."}
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll
            zoomOnScroll
            fitView
          >
            <Background color="#e5e7eb" gap={gridGap} />
            <MiniMap pannable zoomable />
            <Controls showInteractive />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export default function ViewFloorPlan() {
  return (
    <ReactFlowProvider>
      <ViewerInner />
    </ReactFlowProvider>
  );
}
