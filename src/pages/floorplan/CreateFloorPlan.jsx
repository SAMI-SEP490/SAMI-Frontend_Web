import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

/* ================= Storage helpers ================= */
const STORAGE_KEY = "sami_floorplans_v1";
const loadAllPlans = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};
const saveAllPlans = (obj) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
const saveSinglePlan = (buildingId, floorId, plan) => {
  const all = loadAllPlans();
  const next = {
    ...all,
    [buildingId]: { ...(all[buildingId] || {}), [floorId]: plan },
  };
  saveAllPlans(next);
};
const loadSinglePlan = (buildingId, floorId) =>
  (loadAllPlans()[buildingId] || {})[floorId] || null;

/* ================= Geometry helpers ================= */
const pathFromPoints = (pts) =>
  pts?.length ? `M${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z` : "";
const bboxOf = (pts) => {
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
};
const scalePointsToBox = (pts, newW, newH) => {
  const { minX, minY, w, h } = bboxOf(pts);
  const sx = w ? newW / w : 1,
    sy = h ? newH / h : 1;
  return pts.map((p) => ({
    x: minX + (p.x - minX) * sx,
    y: minY + (p.y - minY) * sy,
  }));
};
const snap = (v, g = 20) => Math.round(v / g) * g;

/* Shapes (world units = px) */
const rectPoints = (W, H) => [
  { x: 0, y: 0 },
  { x: W, y: 0 },
  { x: W, y: H },
  { x: 0, y: H },
];
const lPoints = (W, H, t) => [
  { x: 0, y: 0 },
  { x: t, y: 0 },
  { x: t, y: H - t },
  { x: W, y: H - t },
  { x: W, y: H },
  { x: 0, y: H },
];
const uPoints = (W, H, t) => [
  { x: 0, y: 0 },
  { x: t, y: 0 },
  { x: t, y: H - t },
  { x: W - t, y: H - t },
  { x: W - t, y: 0 },
  { x: W, y: 0 },
  { x: W, y: H },
  { x: 0, y: H },
];
const tPoints = (W, H, t) => {
  const c = (W - t) / 2;
  return [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: t },
    { x: c + t, y: t },
    { x: c + t, y: H },
    { x: c, y: H },
    { x: c, y: t },
    { x: 0, y: t },
  ];
};

/* ================= Small utilities ================= */
function useDrag(callback) {
  return (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX,
      startY = e.clientY;
    const onMove = (me) => callback(me.clientX - startX, me.clientY - startY);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

const Icon = ({ name, size = 16 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
  };
  switch (name) {
    case "door":
      return (
        <svg {...common}>
          <path d="M5 3h10a1 1 0 0 1 1 1v16h-2V6H7v14H5V4a1 1 0 0 1 1-1Z" />
          <circle cx="9.5" cy="12" r="1" />
        </svg>
      );
    case "stairs":
      return (
        <svg {...common}>
          <path d="M5 19h14v2H3V9h2v10Zm4-4h3v3h2v-5h3V8h2V6h-5v3h-3v3H9v3Z" />
        </svg>
      );
    case "elevator":
      return (
        <svg {...common}>
          <path d="M7 3h10a2 2 0 0 1 2 2v14H5V5a2 2 0 0 1 2-2Zm8 4h2v10h-2V7Zm-8 0h2v10H7V7Zm4 0h2v10h-2V7Z" />
        </svg>
      );
    case "exit":
      return (
        <svg {...common}>
          <path d="M10 4h2v6h6v4h-6v6h-2V4Zm-6 8 5-5v10l-5-5Z" />
        </svg>
      );
    case "extinguisher":
      return (
        <svg {...common}>
          <path d="M13 6h3V5l4-2-4-2v1h-3a3 3 0 0 0-3 3v1H8a2 2 0 0 0-2 2v12a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V8a2 2 0 0 0-2-2h-1V6Zm-1 3v11H9V9h3Z" />
        </svg>
      );
    case "clinic":
      return (
        <svg {...common}>
          <path d="M11 3h2v4h4v2h-4v4h-2V9H7V7h4V3Z" />
          <path d="M5 13h14v8H5v-8Zm2 2v4h10v-4H7Z" />
        </svg>
      );
    case "room":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      );
    case "corridor":
      return (
        <svg {...common}>
          <rect x="3" y="10" width="18" height="4" rx="1" />
        </svg>
      );
    default:
      return null;
  }
};

function EditableLabel({ text, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  useEffect(() => {
    if (!editing) setVal(text);
  }, [text, editing]);
  const start = (e) => {
    e.stopPropagation();
    setEditing(true);
  };
  const commit = () => {
    const t = (val || "").trim();
    onCommit?.(t || text);
    setEditing(false);
  };
  const cancel = () => {
    setVal(text);
    setEditing(false);
  };
  return (
    <div
      onDoubleClick={start}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {editing ? (
        <input
          className="nodrag"
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          style={{
            padding: "2px 6px",
            border: "1px solid #94a3b8",
            borderRadius: 6,
            background: "#fff",
            minWidth: 60,
          }}
        />
      ) : (
        <span style={{ userSelect: "none" }}>{text}</span>
      )}
    </div>
  );
}

/* ================= Node renderers ================= */
function BuildingNode({ data }) {
  const {
    points,
    stroke = "#334155",
    fill = "rgba(59,130,246,.06)",
    grid = 40,
    onChangePoints,
  } = data || {};
  const pts = points;

  const Handle = ({ x, y, onDrag }) => (
    <circle
      className="nodrag"
      cx={x}
      cy={y}
      r={7}
      fill="#fff"
      stroke="#2563eb"
      strokeWidth="2"
      style={{ cursor: "grab" }}
      onMouseDown={useDrag((dx, dy) => onDrag(dx, dy))}
    />
  );

  const moveVertex = (idx, dx, dy) => {
    const next = pts.map((p, i) =>
      i === idx ? { x: snap(p.x + dx, grid), y: snap(p.y + dy, grid) } : p
    );
    onChangePoints?.(next);
  };

  const { w, h } = bboxOf(pts);
  return (
    <div style={{ width: w, height: h }}>
      <svg width={w} height={h} style={{ display: "block" }}>
        <path
          d={pathFromPoints(pts)}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          shapeRendering="crispEdges"
          pointerEvents="none"
        />
        <path
          className="building__drag"
          d={pathFromPoints(pts)}
          fill="none"
          stroke="transparent"
          strokeWidth="16"
          style={{ pointerEvents: "stroke", cursor: "move" }}
        />
        {pts.map((p, i) => (
          <Handle
            key={i}
            x={p.x}
            y={p.y}
            onDrag={(dx, dy) => moveVertex(i, dx, dy)}
          />
        ))}
      </svg>
    </div>
  );
}

function BlockNode({ data }) {
  const {
    label = "Phòng",
    w = 120,
    h = 80,
    color = "#1e40af",
    icon = "room",
    onChangeLabel,
  } = data || {};
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
        gap: 8,
        fontWeight: 700,
        color: "#0f172a",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#fff",
          border: `2px solid ${color}`,
          color,
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <EditableLabel text={label} onCommit={(t) => onChangeLabel?.(t)} />
    </div>
  );
}

function SmallNode({ data }) {
  const {
    label = "Icon",
    w = 70,
    h = 40,
    bg = "#fef3c7",
    color = "#92400e",
    icon = "door",
    onChangeLabel,
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
        gap: 6,
        color,
      }}
    >
      <Icon name={icon} size={16} />
      <EditableLabel text={label} onCommit={(t) => onChangeLabel?.(t)} />
    </div>
  );
}

/* ================= Editor ================= */
function FloorplanEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const wrapRef = useRef(null);
  const rf = useReactFlow();

  // Query params -> ưu tiên nếu có
  const qpBuilding = searchParams.get("building");
  const qpFloor = searchParams.get("floor");

  const [activeBuilding, setActiveBuilding] = useState(qpBuilding || "A");
  const [activeFloor, setActiveFloor] = useState(qpFloor || "1");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [gridGap, setGridGap] = useState(40);
  const [pxPerMeter, setPxPerMeter] = useState(80);
  const [selectedId, setSelectedId] = useState(null);

  const nodeTypes = useMemo(
    () => ({ building: BuildingNode, block: BlockNode, small: SmallNode }),
    []
  );

  // Load khi đổi tòa/tầng
  const comboKey = `${activeBuilding}::${activeFloor}`;
  const prevKeyRef = useRef(comboKey);
  useEffect(() => {
    if (prevKeyRef.current === comboKey) return;
    const plan = loadSinglePlan(activeBuilding, activeFloor);
    if (plan) {
      setNodes(plan.nodes || []);
      setEdges(plan.edges || []);
      if (plan.meta) {
        setPxPerMeter(plan.meta.pxPerMeter ?? 80);
        setGridGap(plan.meta.gridGap ?? 40);
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
    setSelectedId(null);
    prevKeyRef.current = comboKey;
  }, [comboKey, activeBuilding, activeFloor, setNodes]);

  // Mount lần đầu
  useEffect(() => {
    const plan = loadSinglePlan(activeBuilding, activeFloor);
    if (plan) {
      setNodes(plan.nodes || []);
      setEdges(plan.edges || []);
      if (plan.meta) {
        setPxPerMeter(plan.meta.pxPerMeter ?? 80);
        setGridGap(plan.meta.gridGap ?? 40);
      }
    }
  }, []);

  // Inject callbacks cho các node (để đổi text / kéo đỉnh)
  const injectNodeCallbacks = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === "building") {
          return {
            ...n,
            style: { ...(n.style || {}), zIndex: 0 },
            data: {
              ...n.data,
              grid: gridGap,
              onChangePoints: (nextPts) =>
                setNodes((curr) =>
                  curr.map((m) =>
                    m.id === n.id
                      ? { ...m, data: { ...m.data, points: nextPts } }
                      : m
                  )
                ),
            },
          };
        }
        if (n.type === "block" || n.type === "small") {
          return {
            ...n,
            style: { ...(n.style || {}), zIndex: 1 },
            data: {
              ...n.data,
              onChangeLabel: (txt) =>
                setNodes((curr) =>
                  curr.map((m) =>
                    m.id === n.id
                      ? { ...m, data: { ...m.data, label: txt } }
                      : m
                  )
                ),
            },
          };
        }
        return n;
      })
    );
  }, [gridGap, setNodes]);
  useEffect(() => {
    setTimeout(injectNodeCallbacks, 0);
  }, [injectNodeCallbacks]);

  const onConnect = useCallback(
    (p) => setEdges((eds) => addEdge({ ...p, type: "smoothstep" }, eds)),
    []
  );
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Thả item từ palette → tạo node
  const addNodeFromType = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/sami-node");
      if (!type) return;

      const bounds = wrapRef.current.getBoundingClientRect();
      const position = rf.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });
      const id = Math.random().toString(36).slice(2, 9);

      const W = 18 * pxPerMeter,
        H = 10 * pxPerMeter;
      const t = Math.max(16, Math.round(Math.min(W, H) * 0.16));
      const buildingBase = (pts) => ({
        id: "building",
        type: "building",
        position: { x: 60, y: 40 },
        draggable: true,
        dragHandle: ".building__drag",
        selectable: true,
        style: { zIndex: 0 },
        data: { points: pts, grid: gridGap },
      });

      const conf = {
        "building-rect": buildingBase(rectPoints(W, H)),
        "building-L": buildingBase(lPoints(W, H, t)),
        "building-U": buildingBase(uPoints(W, H, t)),
        "building-T": buildingBase(tPoints(W, H, t)),

        room: {
          id,
          type: "block",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Phòng",
            w: 4 * pxPerMeter,
            h: 3 * pxPerMeter,
            color: "#1e40af",
            icon: "room",
          },
        },
        corridor: {
          id,
          type: "block",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Hành lang",
            w: 6 * pxPerMeter,
            h: 2 * pxPerMeter,
            color: "#475569",
            icon: "corridor",
          },
        },
        door: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Cửa",
            w: 70,
            h: 40,
            bg: "#e0f2fe",
            color: "#0369a1",
            icon: "door",
          },
        },
        stairs: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Cầu thang",
            w: 90,
            h: 44,
            bg: "#fce7f3",
            color: "#be185d",
            icon: "stairs",
          },
        },
        elevator: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Thang máy",
            w: 90,
            h: 44,
            bg: "#ede9fe",
            color: "#6d28d9",
            icon: "elevator",
          },
        },
        exit: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Lối thoát",
            w: 90,
            h: 44,
            bg: "#dcfce7",
            color: "#16a34a",
            icon: "exit",
          },
        },
        ext: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Bình cứu hoả",
            w: 110,
            h: 44,
            bg: "#fee2e2",
            color: "#dc2626",
            icon: "extinguisher",
          },
        },
        clinic: {
          id,
          type: "small",
          position,
          style: { zIndex: 1 },
          data: {
            label: "Y tế",
            w: 80,
            h: 44,
            bg: "#fef3c7",
            color: "#92400e",
            icon: "clinic",
          },
        },
      };

      const cfg = conf[type];
      if (!cfg) return;

      if (type.startsWith("building-")) {
        setNodes((nds) => [cfg, ...nds.filter((n) => n.id !== "building")]);
        setSelectedId("building");
        setTimeout(injectNodeCallbacks, 0);
      } else {
        if (cfg.type === "block" || cfg.type === "small") {
          cfg.data.onChangeLabel = (txt) =>
            setNodes((curr) =>
              curr.map((m) =>
                m.id === id ? { ...m, data: { ...m.data, label: txt } } : m
              )
            );
        }
        setNodes((nds) => nds.concat(cfg));
        setSelectedId(id);
      }
    },
    [pxPerMeter, rf, gridGap, setNodes, injectNodeCallbacks]
  );

  // Kích thước đối tượng đang chọn (m)
  const selectedNode = nodes.find((n) => n.id === selectedId);
  let lengthM = null,
    widthM = null;
  if (selectedNode?.type === "building") {
    const box = bboxOf(selectedNode.data.points);
    lengthM = box.w / pxPerMeter;
    widthM = box.h / pxPerMeter;
  } else if (selectedNode) {
    lengthM = (selectedNode.data.w || 0) / pxPerMeter;
    widthM = (selectedNode.data.h || 0) / pxPerMeter;
  }
  const updateSizeMeters = (field, m) => {
    if (!selectedNode) return;
    if (selectedNode.type === "building") {
      const pts = selectedNode.data.points,
        box = bboxOf(pts);
      const newW = field === "w" ? m * pxPerMeter : box.w;
      const newH = field === "h" ? m * pxPerMeter : box.h;
      const scaled = scalePointsToBox(pts, newW, newH);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === "building"
            ? { ...n, data: { ...n.data, points: scaled } }
            : n
        )
      );
    } else {
      const px = Math.max(0, Number(m || 0) * pxPerMeter);
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedId ? { ...n, data: { ...n.data, [field]: px } } : n
        )
      );
    }
  };

  /* -------- AUTO SAVE -------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const plan = {
        nodes,
        edges,
        meta: { pxPerMeter, gridGap, savedAt: Date.now() },
      };
      saveSinglePlan(activeBuilding, activeFloor, plan);
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, pxPerMeter, gridGap, activeBuilding, activeFloor]);

  const handleSaveClick = () => {
    const plan = {
      nodes,
      edges,
      meta: { pxPerMeter, gridGap, savedAt: Date.now() },
    };
    saveSinglePlan(activeBuilding, activeFloor, plan);
    alert(`Đã lưu layout: ${activeBuilding} - Tầng ${activeFloor}`);
  };
  const handleLoadClick = () => {
    const plan = loadSinglePlan(activeBuilding, activeFloor);
    if (!plan) {
      alert("Chưa có layout đã lưu cho tổ hợp này.");
      return;
    }
    setNodes(plan.nodes || []);
    setEdges(plan.edges || []);
    if (plan.meta) {
      setPxPerMeter(plan.meta.pxPerMeter ?? 80);
      setGridGap(plan.meta.gridGap ?? 40);
    }
    setSelectedId(null);
    setTimeout(injectNodeCallbacks, 0);
  };

  /* ===== Palette items ===== */
  const items = [
    { type: "building-rect", label: "Tòa nhà (Rect)", icon: "room" },
    { type: "building-L", label: "Tòa nhà (L-shape)", icon: "room" },
    { type: "building-U", label: "Tòa nhà (U-shape)", icon: "room" },
    { type: "building-T", label: "Tòa nhà (T-shape)", icon: "room" },
    { type: "room", label: "Phòng", icon: "room" },
    { type: "corridor", label: "Hành lang", icon: "corridor" },
    { type: "door", label: "Cửa", icon: "door" },
    { type: "stairs", label: "Cầu thang", icon: "stairs" },
    { type: "elevator", label: "Thang máy", icon: "elevator" },
    { type: "exit", label: "Lối thoát", icon: "exit" },
    { type: "ext", label: "Bình cứu hoả", icon: "extinguisher" },
    { type: "clinic", label: "Y tế", icon: "clinic" },
  ];

  const onDragStart = useCallback((e, type) => {
    e.dataTransfer.setData("application/sami-node", type);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  /* ==== Palette preview for building shapes ==== */
  const miniPath = (type) => {
    const W = 38,
      H = 26,
      t = 6;
    const shift = (pts) => pts.map((p) => ({ x: p.x + 1, y: p.y + 1 }));
    const toD = (pts) => `M${pts.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;
    if (type === "building-rect") return toD(shift(rectPoints(W - 2, H - 2)));
    if (type === "building-L") return toD(shift(lPoints(W - 2, H - 2, t)));
    if (type === "building-U") return toD(shift(uPoints(W - 2, H - 2, t)));
    if (type === "building-T") return toD(shift(tPoints(W - 2, H - 2, t)));
    return "";
  };
  const PaletteItemIcon = ({ type, icon }) => {
    if (type.startsWith("building-")) {
      return (
        <svg width="38" height="26" style={{ flex: "0 0 auto" }}>
          <rect x="0" y="0" width="38" height="26" rx="6" fill="#f8fafc" />
          <path
            d={miniPath(type)}
            fill="#eef2ff"
            stroke="#60a5fa"
            strokeWidth="2"
          />
        </svg>
      );
    }
    return (
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #cbd5e1",
          color: "#0ea5e9",
          flex: "0 0 auto",
        }}
      >
        <Icon name={icon || "room"} size={16} />
      </span>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "340px 1fr",
        gap: 16,
        height: "calc(100vh - 140px)",
        padding: 16,
      }}
    >
      {/* LEFT */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto auto auto auto auto 1fr",
          gap: 12,
        }}
      >
        {/* Header actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate("/floorplan/view")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#e2e8f0",
              color: "#0f172a",
              fontWeight: 700,
              border: "1px solid #cbd5e1",
            }}
          >
            ← Quay lại View
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSaveClick}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "#0ea5e9",
                color: "#fff",
                fontWeight: 700,
                border: "none",
              }}
            >
              Lưu layout
            </button>
            <button
              onClick={handleLoadClick}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "#e2e8f0",
                color: "#0f172a",
                fontWeight: 700,
                border: "1px solid #cbd5e1",
              }}
            >
              Tải layout đã lưu
            </button>
          </div>
        </div>

        {/* Tổ hợp tòa/tầng */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Khu vực bản vẽ</div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <label style={{ fontWeight: 600 }}>Tòa nhà</label>
              <input
                value={activeBuilding}
                onChange={(e) => setActiveBuilding(e.target.value)}
                placeholder="VD: A"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 4,
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Tầng</label>
              <input
                value={activeFloor}
                onChange={(e) => setActiveFloor(e.target.value)}
                placeholder="VD: 3"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 4,
                }}
              />
            </div>
          </div>
          <div style={{ color: "#64748b", marginTop: 8, fontSize: 12 }}>
            Tổ hợp <b>{activeBuilding}</b>–<b>T{activeFloor}</b> sẽ tự lưu khi
            thao tác. Bạn cũng có thể nhấn <b>Lưu layout</b>.
          </div>
        </div>

        {/* Giá trị */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Giá trị</div>
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Tỉ lệ (px/m)</label>
              <input
                type="text"
                inputMode="numeric"
                value={String(pxPerMeter)}
                onChange={(e) => {
                  const t = e.target.value.replace(/[^\d]/g, "");
                  setPxPerMeter(Number(t || 0));
                }}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "6px 10px",
                  marginTop: 4,
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600 }}>Grid (px)</label>
              <input
                type="text"
                inputMode="numeric"
                value={String(gridGap)}
                onChange={(e) => {
                  const t = e.target.value.replace(/[^\d]/g, "");
                  setGridGap(Number(t || 0));
                }}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "6px 10px",
                  marginTop: 4,
                }}
              />
            </div>
          </div>
        </div>

        {/* Kích thước đối tượng chọn */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Kích thước đối tượng chọn (m)
          </div>
          {selectedId ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label style={{ fontWeight: 600 }}>Dài</label>
                <input
                  type="text"
                  value={lengthM ?? ""}
                  onChange={(e) =>
                    updateSizeMeters("w", Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "6px 10px",
                    marginTop: 4,
                  }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600 }}>Rộng</label>
                <input
                  type="text"
                  value={widthM ?? ""}
                  onChange={(e) =>
                    updateSizeMeters("h", Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "6px 10px",
                    marginTop: 4,
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b" }}>
              Hãy click chọn một đối tượng trên canvas…
            </div>
          )}
        </div>

        {/* Palette */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Biểu tượng / Hình toà nhà
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((i) => (
              <div
                key={i.type}
                draggable
                onDragStart={(e) => onDragStart(e, i.type)}
                style={{
                  userSelect: "none",
                  cursor: "grab",
                  padding: "10px 12px",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 8,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <PaletteItemIcon type={i.type} icon={i.icon} />
                <span>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CANVAS */}
      <div
        ref={wrapRef}
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={addNodeFromType}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag={[2]}
          panOnScroll={false}
          zoomOnScroll={false}
          onSelectionChange={({ nodes: sel }) =>
            setSelectedId(sel?.[0]?.id || null)
          }
        >
          <Background color="#e5e7eb" gap={gridGap} />
          <MiniMap pannable zoomable />
          <Controls showInteractive />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function CreateFloorPlan() {
  return (
    <ReactFlowProvider>
      <FloorplanEditor />
    </ReactFlowProvider>
  );
}
