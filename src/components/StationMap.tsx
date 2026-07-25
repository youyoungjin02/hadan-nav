import { useRef, useState } from "react";
import { Copy, Crosshair } from "lucide-react";
import { KIND_STYLE, nodeOf, type Route, type SNode, type Station } from "../lib/graph";

type Coords = Record<string, { x: number; y: number }>;

function Pin({ node, kind, label }: { node: SNode; kind: "from" | "to"; label: string }) {
  const below = node.y < 13;
  const color = kind === "from" ? "#2F6BFF" : "#F31260";
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
      {kind === "from" && <span className="absolute inset-0 m-auto w-4 h-4 rounded-full ping" style={{ background: color }} />}
      <div className="relative w-[14px] h-[14px] rounded-full ring-[3px] ring-white shadow-lg" style={{ background: color }} />
      <div className={`absolute left-1/2 -translate-x-1/2 flex items-center flex-col ${below ? "top-3 flex-col-reverse" : "bottom-3"}`}>
        <span className="px-2 py-[3px] rounded-lg text-[10px] font-bold text-white whitespace-nowrap shadow-lg" style={{ background: color }}>
          {label}
        </span>
        <span className="w-0 h-0 border-x-[4px] border-x-transparent"
          style={below ? { borderBottom: `5px solid ${color}` } : { borderTop: `5px solid ${color}` }} />
      </div>
    </div>
  );
}

export default function StationMap({
  station, from, to, main, ghost, calib,
}: {
  station: Station;
  from: string | null;
  to: string | null;
  main: Route | null;
  ghost: Route | null;
  calib: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coords>(() =>
    Object.fromEntries(station.nodes.map((v) => [v.id, { x: v.x, y: v.y }]))
  );
  const [editing, setEditing] = useState(station.nodes[0]?.id ?? "");
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const at = (id: string) => (calib ? coords[id] : nodeOf(station, id));
  const nodeAt = (id: string): SNode => ({ ...nodeOf(station, id), ...at(id) });

  const onClick = (e: React.MouseEvent) => {
    if (!calib || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
    setCoords((c) => ({ ...c, [editing]: { x, y } }));
    const i = station.nodes.findIndex((v) => v.id === editing);
    if (i >= 0 && i < station.nodes.length - 1) setEditing(station.nodes[i + 1].id);
  };

  const onMove = (e: React.MouseEvent) => {
    if (!calib || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    setHover({
      x: +(((e.clientX - r.left) / r.width) * 100).toFixed(1),
      y: +(((e.clientY - r.top) / r.height) * 100).toFixed(1),
    });
  };

  const exportCode = station.nodes
    .map((v) => {
      const c = coords[v.id];
      const tail = v.poi ? `, "${v.poi}"${v.short ? `, "${v.short}"` : ""}` : "";
      return `    nd("${v.id}", "${v.name}", "${v.floor}", ${c.x}, ${c.y}${tail}),`;
    })
    .join("\n");

  const lines = (r: Route, animate: boolean, width: number, opacity: number) =>
    r.segs.map((s, i) => (
      <line key={`${animate ? "m" : "g"}${i}`} className={animate ? "route-flow" : undefined}
        x1={at(s.a).x} y1={at(s.a).y} x2={at(s.b).x} y2={at(s.b).y}
        stroke={KIND_STYLE[s.kind].color} strokeWidth={width} strokeLinecap="round"
        strokeDasharray={animate ? "6 8" : "3 5"} opacity={opacity} vectorEffect="non-scaling-stroke" />
    ));

  return (
    <>
      <div ref={boxRef} onClick={onClick} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        className={`relative w-full select-none ${calib ? "cursor-crosshair" : ""}`}>
        <img src={station.image} alt={`${station.name} 안내도`} className="w-full h-auto block" draggable={false} />

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {calib && station.edges.map((e, i) => (
            <line key={i} x1={at(e.a).x} y1={at(e.a).y} x2={at(e.b).x} y2={at(e.b).y}
              stroke={KIND_STYLE[e.kind].color} strokeWidth={2} opacity={0.5} vectorEffect="non-scaling-stroke" />
          ))}
          {ghost && lines(ghost, false, 4, 0.35)}
          {main && (
            <>
              <polyline points={main.ids.map((i) => `${at(i).x},${at(i).y}`).join(" ")} fill="none"
                stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round"
                opacity={0.9} vectorEffect="non-scaling-stroke" />
              {main.segs.map((s, i) => (
                <line key={`b${i}`} x1={at(s.a).x} y1={at(s.a).y} x2={at(s.b).x} y2={at(s.b).y}
                  stroke={KIND_STYLE[s.kind].color} strokeWidth={5} strokeLinecap="round"
                  opacity={0.3} vectorEffect="non-scaling-stroke" />
              ))}
              {lines(main, true, 5, 1)}
            </>
          )}
        </svg>

        {main?.ids.map((id) =>
          id === from || id === to ? null : (
            <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-white ring-2 ring-[#2F6BFF] z-10"
              style={{ left: `${at(id).x}%`, top: `${at(id).y}%` }} />
          )
        )}

        {calib && station.nodes.map((v) => (
          <div key={v.id} className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${coords[v.id].x}%`, top: `${coords[v.id].y}%` }}>
            <div className={`w-[9px] h-[9px] rounded-full ring-2 ring-white ${editing === v.id ? "bg-fuchsia-600 outline outline-2 outline-offset-2 outline-fuchsia-500" : "bg-slate-900"}`} />
            <span className={`absolute left-1/2 -translate-x-1/2 top-3 whitespace-nowrap text-[8px] font-bold px-1 rounded ${editing === v.id ? "bg-fuchsia-600 text-white" : "bg-white/85 text-slate-700"}`}>
              {v.id}
            </span>
          </div>
        ))}

        {calib && hover && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-fuchsia-600 text-white text-[11px] font-mono z-30">
            x: {hover.x} / y: {hover.y}
          </div>
        )}

        {!calib && from && <Pin node={nodeAt(from)} kind="from" label="현재 위치" />}
        {!calib && to && <Pin node={nodeAt(to)} kind="to" label={nodeOf(station, to).name} />}
      </div>

      {calib && (
        <div className="mt-3 rounded-2xl ring-2 ring-fuchsia-500 bg-fuchsia-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crosshair className="w-4 h-4 text-fuchsia-600" />
            <h3 className="text-sm font-bold text-fuchsia-800">좌표 보정 모드 — {station.name}</h3>
          </div>
          <p className="text-[12px] text-fuchsia-900 mb-3">
            노드를 고르고 도면의 실제 위치를 클릭하세요. 클릭하면 다음 노드로 자동 이동합니다.
          </p>
          <div className="flex flex-wrap gap-1 mb-3 max-h-32 overflow-y-auto">
            {station.nodes.map((v) => (
              <button key={v.id} onClick={(e) => { e.stopPropagation(); setEditing(v.id); }}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold ring-1 ${
                  editing === v.id ? "bg-fuchsia-600 text-white ring-fuchsia-600" : "bg-white text-slate-700 ring-slate-300"
                }`}>
                {v.id}
              </button>
            ))}
          </div>
          <textarea readOnly value={exportCode} onFocus={(e) => e.currentTarget.select()}
            className="w-full h-40 text-[10px] font-mono p-2 rounded-xl ring-1 ring-slate-300 bg-white" />
          <button onClick={() => navigator.clipboard?.writeText(exportCode)}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 text-white font-bold py-2.5 text-[13px]">
            <Copy className="w-4 h-4" /> nodes 배열 복사
          </button>
        </div>
      )}
    </>
  );
}
