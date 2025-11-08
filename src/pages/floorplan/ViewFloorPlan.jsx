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

/* ===== Storage ===== */
const STORAGE_KEY = "sami_floorplans_v1";
const loadAllPlans = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

/* ===== Simple SVG building (no handles) ===== */
const pathFromPoints = (pts) =>
  pts?.length ? `M${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z` : "";
const bboxOf = (pts = []) => {
  if (!pts.length) return { w: 0, h: 0 };
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
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

  const [allPlans, setAllPlans] = useState({});
  const [buildingIds, setBuildingIds] = useState([]);
  const [activeBuilding, setActiveBuilding] = useState("");
  const [floorIds, setFloorIds] = useState([]);
  const [activeFloor, setActiveFloor] = useState("");

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [gridGap, setGridGap] = useState(40);

  const nodeTypes = useMemo(
    () => ({
      building: BuildingNodeView,
      block: BlockNodeView,
      small: SmallNodeView,
    }),
    []
  );

  // Load index
  useEffect(() => {
    const data = loadAllPlans();
    setAllPlans(data);
    const bIds = Object.keys(data);
    setBuildingIds(bIds);
    setActiveBuilding(bIds[0] || "");
  }, []);

  // Update floors when building changes
  useEffect(() => {
    if (!activeBuilding) {
      setFloorIds([]);
      setActiveFloor("");
      setNodes([]);
      setEdges([]);
      return;
    }
    const fIds = Object.keys(allPlans[activeBuilding] || {}).sort(
      (a, b) => Number(a) - Number(b)
    );
    setFloorIds(fIds);
    setActiveFloor(fIds[0] || "");
  }, [activeBuilding, allPlans]);

  // Load specific plan
  useEffect(() => {
    if (!activeBuilding || !activeFloor) {
      setNodes([]);
      setEdges([]);
      return;
    }
    const plan = (allPlans[activeBuilding] || {})[activeFloor];
    if (plan) {
      const nn = (plan.nodes || []).map((n) => ({
        ...n,
        draggable: false,
        selectable: false,
        style: { ...(n.style || {}), zIndex: n.type === "building" ? 0 : 1 },
      }));
      setNodes(nn);
      setEdges(plan.edges || []);
      setGridGap(plan.meta?.gridGap ?? 40);
    } else {
      setNodes([]);
      setEdges([]);
      setGridGap(40);
    }
  }, [activeBuilding, activeFloor, allPlans]);

  const hasPlan = nodes && nodes.length > 0;

  const gotoCreate = () => {
    const qs = new URLSearchParams({
      building: activeBuilding || "",
      floor: activeFloor || "",
      mode: "create",
    }).toString();
    navigate(`/floorplan/create?${qs}`);
  };

  const gotoEdit = () => {
    if (!hasPlan) return;
    const qs = new URLSearchParams({
      building: activeBuilding,
      floor: activeFloor,
      mode: "edit",
    }).toString();
    navigate(`/floorplan/create?${qs}`);
  };

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
      {/* LEFT */}
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
                }}
                title="Tạo mới hoặc tạo nhanh tầng đang chọn"
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
                {buildingIds.length === 0 && (
                  <option value="">(Chưa có dữ liệu)</option>
                )}
                {buildingIds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
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
                  <option value="">(Chưa có dữ liệu)</option>
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
            Chế độ <b>chỉ xem</b>. Dữ liệu lấy từ lần lưu gần nhất trên trang
            tạo/chỉnh.
          </div>
        </div>
      </div>

      {/* RIGHT viewer */}
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
            Chưa có layout cho tổ hợp đã chọn.
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
