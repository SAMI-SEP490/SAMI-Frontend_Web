// src/pages/floorplan/CreateFloorPlan.jsx
import { useCallback, useMemo, useState, useEffect } from "react";
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

import { listBuildings } from "../../services/api/building";
import {
  createFloorPlan,
  getNextFloorNumber,
} from "../../services/api/floorplan";

const API_BASE = "/api/floor-plan";

/* ---------- helpers vẽ shape ---------- */
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

const snap = (v, g = 20) => Math.round(v / g) * g;

const pathFromPoints = (pts) =>
  pts?.length ? `M${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z` : "";

const bboxOf = (pts) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
};

const scalePointsToBox = (pts, newW, newH) => {
  const { minX, minY, w, h } = bboxOf(pts);
  const sx = w ? newW / w : 1;
  const sy = h ? newH / h : 1;
  return pts.map((p) => ({
    x: minX + (p.x - minX) * sx,
    y: minY + (p.y - minY) * sy,
  }));
};

/* ---------- drag util cho handle ---------- */
function useDrag(callback) {
  return (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (me) => callback(me.clientX - startX, me.clientY - startY);
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
}

/* ---------- icon + label ---------- */
const Icon = ({ name, size = 16 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
  };
  switch (name) {
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
            minWidth: 70,
            fontSize: 13,
          }}
        />
      ) : (
        <span style={{ userSelect: "none", fontSize: 13 }}>{text}</span>
      )}
    </div>
  );
}

/* ---------- Node components ---------- */
function BuildingNode({ data }) {
  const {
    points,
    stroke = "#334155",
    fill = "rgba(59,130,246,.06)",
    grid = 40,
    onChangePoints,
  } = data || {};
  const pts = points || [];

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

/* =================== EDITOR =================== */
function FloorplanEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rf = useReactFlow();

  const qpBuilding = searchParams.get("building");
  const qpFloor = searchParams.get("floor");

  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  const [activeBuilding, setActiveBuilding] = useState(qpBuilding || "");
  const [activeFloor, setActiveFloor] = useState(qpFloor || "1");
  const [nextFloorFromDB, setNextFloorFromDB] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [gridGap, setGridGap] = useState(40);
  const [pxPerMeter, setPxPerMeter] = useState(80);
  const [selectedId, setSelectedId] = useState(null);

  const nodeTypes = useMemo(
    () => ({
      building: BuildingNode,
      block: BlockNode,
      small: SmallNode,
      roomNode: BlockNode,
    }),
    []
  );
  
  const activeBuildingObj = useMemo(
    () =>
      buildings.find(
        (b) => String(b.building_id) === String(activeBuilding || "")
      ),
    [buildings, activeBuilding]
  );
  // ===== FLOOR RULE =====
  const nextFloor = nextFloorFromDB ?? 1;
  const isMaxFloorReached = nextFloor > 20;

  const floorOptions = useMemo(() => {
    if (!nextFloorFromDB || nextFloorFromDB <= 1) return [];
    return Array.from({ length: nextFloorFromDB - 1 }, (_, i) => String(i + 1));
  }, [nextFloorFromDB]);
  useEffect(() => {
    if (floorOptions.length > 0) {
      if (!floorOptions.includes(String(activeFloor))) {
        setActiveFloor(floorOptions[0]);
      }
    }
  }, [floorOptions, activeFloor]);

  useEffect(() => {
    if (!activeBuilding) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getNextFloorNumber(activeBuilding);
        if (cancelled) return;

        setNextFloorFromDB(data.next_floor_number);
        setActiveFloor(String(data.next_floor_number));
      } catch (err) {
        console.error("Get next floor error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeBuilding]);

  // load list building
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
          // Kiểm tra xem activeBuilding hiện tại có khớp ID tòa nào không
          const exists = arr.some(
            (b) => String(b.building_id) === String(activeBuilding)
          );
          const isNumeric = /^\d+$/.test(String(activeBuilding));

          // Nếu đang là "A" / "" / hoặc ID không tồn tại -> set về tòa đầu tiên
          if (!exists || !isNumeric) {
            setActiveBuilding(String(arr[0].building_id));
          }
        }
      } catch (err) {
        if (canceled) return;
        setBuildingError(err?.message || "Không thể tải danh sách tòa nhà");
      } finally {
        if (!canceled) setLoadingBuildings(false);
      }
    }

    fetchBuildings();
    return () => {
      canceled = true;
    };
  }, [activeBuilding]);

  // eslint-disable-next-line no-unused-vars
  const comboKey = `${activeBuilding || "NO_BUILDING"}-${
    activeFloor || "NO_FLOOR"
  }`;

  const injectCallbacks = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => {
        // ===== BUILDING =====
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

        // ===== BLOCK / SMALL =====
        if (n.type === "block" || n.type === "small") {
          return {
            ...n,
            style: { ...(n.style || {}), zIndex: 1 },
            data: {
              ...n.data,
              onChangeLabel: (txt) =>
                setNodes((curr) =>
                  curr.map((m) => {
                    if (m.id !== n.id) return m;

                    // ===== ROOM =====
                    if (m.type === "block" && m.data?.icon === "room") {
                      const roomNumber = String(txt ?? "").replace(/\D/g, "");

                      return {
                        ...m,
                        data: {
                          ...m.data,
                          label: roomNumber || "Nhập số phòng",
                          room_number: roomNumber,
                        },
                      };
                    }

                    // ===== OTHER =====
                    return {
                      ...m,
                      data: { ...m.data, label: txt },
                    };
                  })
                ),
            },
          };
        }

        return n;
      })
    );
  }, [gridGap, setNodes]);

  useEffect(() => {
    // CREATE MODE: luôn khởi tạo canvas trống
    setNodes([]);
    setEdges([]);

    // đảm bảo callback được gắn
    setTimeout(() => {
      injectCallbacks();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBuilding]);

  useEffect(() => {
    injectCallbacks();
  }, [injectCallbacks]);

  /* ---------- Drag từ palette sang canvas ---------- */
  const addNodeFromType = useCallback(
    (event) => {
      event.preventDefault();

      const type =
        event.dataTransfer.getData("application/sami-node") ||
        event.dataTransfer.getData("application/reactflow") ||
        event.dataTransfer.getData("text/plain");

      if (!type) return;

      const pos = rf.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      console.log("DROP NODE:", type, pos);

      const id = Math.random().toString(36).slice(2, 9);

      const W = 16 * pxPerMeter;
      const H = 10 * pxPerMeter;
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
          position: pos,
          style: { zIndex: 1 },
          data: {
            room_number: "",
            label: "Nhập số phòng", // 👈 QUAN TRỌNG
            w: 4 * pxPerMeter,
            h: 3 * pxPerMeter,
            size: 4 * 3,
            color: "#1e40af",
            icon: "room",
          },
        },
        corridor: {
          id,
          type: "block",
          position: pos,
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
          position: pos,
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
          position: pos,
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
          position: pos,
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
          position: pos,
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
          position: pos,
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
          position: pos,
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
        setTimeout(injectCallbacks, 0);
      } else {
        setNodes((nds) => nds.concat(cfg));
        setSelectedId(id);
        setTimeout(injectCallbacks, 0);
      }
    },
    [pxPerMeter, rf, gridGap, injectCallbacks, setNodes]
  );

  const selectedNode = nodes.find((n) => n.id === selectedId);
  const isRoomSelected = !!(
    selectedNode &&
    selectedNode.type === "block" &&
    selectedNode.data?.icon === "room"
  );
  let lengthM = null;
  let widthM = null;

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
      const pts = selectedNode.data.points;
      const box = bboxOf(pts);
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

  const validateRoomNodesBeforeSave = (nodesList) => {
    const roomNodes = (nodesList || []).filter(
      (n) => n?.type === "block" && n?.data?.icon === "room"
    );

    if (roomNodes.length === 0) return null;

    const seen = new Set();
    for (const n of roomNodes) {
      const roomNo = String(n?.data?.room_number || "").trim();
      if (!roomNo) {
        return "Vui lòng nhập số phòng cho tất cả các phòng trước khi lưu!";
      }
      if (seen.has(roomNo)) {
        return `Số phòng "${roomNo}" đang bị trùng trên canvas. Vui lòng đổi lại trước khi lưu!`;
      }
      seen.add(roomNo);
    }
    return null;
  };

  const handleSaveToAPI = async () => {
    try {
      if (!activeBuilding) {
        alert("Vui lòng chọn tòa nhà trước khi lưu layout");
        return;
      }
      if (!activeFloor) {
        alert("Vui lòng chọn tầng trước khi lưu layout");
        return;
      }
      if (isMaxFloorReached) {
        alert("Không thể tạo thêm tầng. Tòa nhà đã đạt tối đa 20 tầng.");
        return;
      }

      const buildingId = parseInt(activeBuilding, 10);
      const floorNumber = nextFloor;

      if (!buildingId || Number.isNaN(buildingId)) {
        alert("Không xác định được tòa nhà, hãy chọn lại tòa nhà.");
        return;
      }
      if (Number.isNaN(floorNumber)) {
        alert("Số tầng không hợp lệ, hãy nhập lại.");
        return;
      }

      const roomErr = validateRoomNodesBeforeSave(nodes);
      if (roomErr) {
        alert(roomErr);
        return;
      }

      const buildingName = activeBuildingObj?.name || `#${String(buildingId)}`;

      const payload = {
        building_id: buildingId,
        floor_number: floorNumber,
        name: `Tòa ${buildingName} - Tầng ${activeFloor}`,
        layout: {
          nodes,
          edges,
          meta: { pxPerMeter, gridGap, savedAt: Date.now() },
        },
      };

      await createFloorPlan(payload);
      alert("Đã lưu layout lên hệ thống!");
      navigate("/floorplan/view");
    } catch (err) {
      console.error(err);

      const rawMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Đã xảy ra lỗi khi lưu sơ đồ tầng.";

      let displayMessage = rawMessage;

      if (
        rawMessage.includes("Floor plan already exists") ||
        rawMessage.includes("already exists for building")
      ) {
        const match = rawMessage.match(/floor\s+(\d+)/i);
        const floor = match ? match[1] : activeFloor;

        displayMessage = `Tầng ${floor} đã có sơ đồ. Vui lòng chuyển sang chức năng chỉnh sửa sơ đồ tầng.`;
      }

      alert(displayMessage);
    }
  };
  const paletteItems = [
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
    e.dataTransfer.setData("text/plain", type);
    e.dataTransfer.setData("application/sami-node", type);
    e.dataTransfer.effectAllowed = "move";
    console.log("DRAG START:", type);
  }, []);

  const cardStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 4,
    color: "#0f172a",
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px minmax(0, 1fr)",
        gap: 16,
        padding: "16px 20px 24px",
        alignItems: "flex-start",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: "auto auto auto auto auto 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <button
            onClick={() => navigate("/floorplan/view")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#e2e8f0",
              color: "#0f172a",
              fontWeight: 600,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            ← Quay lại View
          </button>
          <button
            onClick={handleSaveToAPI}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "#0ea5e9",
              color: "#ffffff",
              fontWeight: 700,
              border: "none",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            Lưu layout
          </button>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            Khu vực bản vẽ
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label style={labelStyle}>Tòa nhà</label>
              <select
                style={inputStyle}
                value={activeBuilding}
                onChange={(e) => setActiveBuilding(e.target.value)}
              >
                {loadingBuildings && <option value="">Đang tải...</option>}
                {!loadingBuildings && buildings.length === 0 && (
                  <option value="">Không có tòa nhà</option>
                )}
                {!loadingBuildings &&
                  buildings.map((b) => (
                    <option key={b.building_id} value={b.building_id}>
                      {b.name || `Tòa #${b.building_id}`}
                    </option>
                  ))}
              </select>
              {buildingError && (
                <div
                  style={{
                    color: "#b91c1c",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {buildingError}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600 }}>Tầng</label>
              <input
                value={
                  isMaxFloorReached
                    ? "Đã đạt tối đa 20 tầng"
                    : `Tầng ${nextFloor}`
                }
                disabled
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginTop: 4,
                  background: "#f1f5f9",
                  fontWeight: 600,
                }}
              />
            </div>
          </div>
          <div
            style={{
              color: "#64748b",
              marginTop: 8,
              fontSize: 12,
              lineHeight: 1.4,
            }}
          >
            Layout cho{" "}
            <b>{activeBuildingObj?.name || `Tòa #${activeBuilding || "-"}`}</b>{" "}
            – <b>Tầng {activeFloor}</b> sẽ được lưu lên hệ thống khi bạn nhấn{" "}
            <b>Lưu layout</b>.
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            Giá trị
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label style={labelStyle}>Tỉ lệ (px/m)</label>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                value={String(pxPerMeter)}
                onChange={(e) => {
                  const t = e.target.value.replace(/[^\d]/g, "");
                  setPxPerMeter(Number(t || 0));
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Grid (px)</label>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                value={String(gridGap)}
                onChange={(e) => {
                  const t = e.target.value.replace(/[^\d]/g, "");
                  setGridGap(Number(t || 0));
                }}
              />
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            Kích thước đối tượng (m)
          </div>
          {selectedId ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {isRoomSelected && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Số phòng</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={selectedNode?.data?.room_number || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedId
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  room_number: v,
                                  label: v
                                    ? `Phòng ${v}`
                                    : n.data?.label || "Phòng",
                                },
                              }
                            : n
                        )
                      );
                    }}
                    placeholder="VD: 101"
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Dài</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={lengthM ?? ""}
                  onChange={(e) =>
                    updateSizeMeters("w", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Rộng</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={widthM ?? ""}
                  onChange={(e) =>
                    updateSizeMeters("h", Number(e.target.value))
                  }
                />
              </div>
            </div>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Hãy chọn một đối tượng trên canvas để chỉnh kích thước…
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, maxHeight: "100%", overflow: "auto" }}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              fontSize: 14,
              color: "#0f172a",
            }}
          >
            Biểu tượng / Hình tòa nhà
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {paletteItems.map((i) => (
              <div
                key={i.type}
                draggable
                onDragStart={(e) => onDragStart(e, i.type)}
                style={{
                  userSelect: "none",
                  cursor: "grab",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px dashed #cbd5e1",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "999px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0ea5e9",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={i.icon} size={14} />
                </span>
                <span>{i.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT CANVAS */}
      <div
        style={{
          width: "100%",
          height: 620, // 👈 thêm
          minHeight: 620, // 👈 thêm cho chắc
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "0 2px 4px rgba(15,23,42,0.06)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(p) =>
            setEdges((eds) => addEdge({ ...p, type: "smoothstep" }, eds))
          }
          fitView
          panOnDrag={[2]}
          panOnScroll={false}
          zoomOnScroll={false}
          style={{ width: "100%", height: "100%" }}
          onSelectionChange={({ nodes: sel }) =>
            setSelectedId(sel?.[0]?.id || null)
          }
          onDrop={(event) => {
            console.log("ReactFlow onDrop");
            addNodeFromType(event);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
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
