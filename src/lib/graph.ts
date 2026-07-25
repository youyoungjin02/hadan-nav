/* ------------------------------------------------------------------------
 * 역 공통 그래프 엔진 — 특정 역에 의존하지 않습니다.
 * 새 역을 추가할 때 이 파일은 수정할 필요가 없습니다.
 * ---------------------------------------------------------------------- */

export type Kind = "FLAT" | "ELEVATOR" | "ESCALATOR";
export type Poi = "EXIT" | "TOILET" | "PLATFORM" | "BOARD" | "FACILITY";

export interface SNode {
  id: string;
  name: string;
  /** 층 표기 (예: "B1", "B2", "B3") */
  floor: string;
  /** 배경 이미지 대비 0~100 % 좌표 */
  x: number;
  y: number;
  poi?: Poi;
  /** 출구 번호 등 짧은 라벨 */
  short?: string;
}

export interface SEdge { a: string; b: string; kind: Kind }

export interface Station {
  id: string;
  name: string;
  nameEn: string;
  line: string;
  /** 노선 색 (목록 화면 뱃지) */
  color: string;
  /** public 폴더 기준 이미지 경로 */
  image: string;
  /** 이미지 높이 / 너비 */
  imageRatio: number;
  /** 가로 1 % 당 실제 거리(m) */
  metersPerPct: number;
  nodes: SNode[];
  edges: SEdge[];
  /** QR 스티커를 부착할 노드 목록 */
  qrPoints: string[];
  /** 좌표 보정 완료 여부 */
  calibrated: boolean;
}

/* ---------- 역 정의 파일용 헬퍼 ---------- */
export const nd = (
  id: string, name: string, floor: string, x: number, y: number,
  poi?: Poi, short?: string
): SNode => ({ id, name, floor, x, y, poi, short });

export const eg = (a: string, b: string, kind: Kind = "FLAT"): SEdge => ({ a, b, kind });

export const KIND_STYLE: Record<Kind, { label: string; color: string }> = {
  FLAT: { label: "도보", color: "#2F6BFF" },
  ELEVATOR: { label: "엘리베이터", color: "#12A150" },
  ESCALATOR: { label: "에스컬레이터", color: "#F5A524" },
};

/* ====================================================================== */

interface Index { map: Record<string, SNode>; adj: Map<string, SEdge[]> }
const cache = new Map<string, Index>();

function indexOf(st: Station): Index {
  const hit = cache.get(st.id);
  if (hit) return hit;
  const map = Object.fromEntries(st.nodes.map((v) => [v.id, v]));
  const adj = new Map<string, SEdge[]>();
  const put = (k: string, v: SEdge) => { if (!adj.has(k)) adj.set(k, []); adj.get(k)!.push(v); };
  for (const e of st.edges) {
    if (!map[e.a] || !map[e.b]) { console.warn(`[${st.id}] 잘못된 엣지:`, e); continue; }
    put(e.a, e);
    put(e.b, { a: e.b, b: e.a, kind: e.kind });
  }
  const idx = { map, adj };
  cache.set(st.id, idx);
  return idx;
}

export const nodeOf = (st: Station, id: string) => indexOf(st).map[id];

export function metersBetween(st: Station, a: SNode, b: SNode) {
  const dx = a.x - b.x;
  const dy = (a.y - b.y) * st.imageRatio;
  return Math.hypot(dx, dy) * st.metersPerPct;
}

function costOf(st: Station, e: SEdge) {
  if (e.kind === "ELEVATOR") return { m: 11, s: 60 };
  if (e.kind === "ESCALATOR") return { m: 9, s: 28 };
  const idx = indexOf(st);
  const m = metersBetween(st, idx.map[e.a], idx.map[e.b]);
  return { m, s: m / 1.15 };
}

export interface Seg { a: string; b: string; kind: Kind; m: number; s: number }
export interface Route {
  ids: string[]; segs: Seg[]; meters: number; seconds: number; vertical: Kind | null;
}
export type Via = "ELEVATOR" | "ESCALATOR" | "ANY";

export function findRoute(st: Station, start: string, goal: string, via: Via): Route | null {
  const { map, adj } = indexOf(st);
  if (!map[start] || !map[goal] || start === goal) return null;
  const allow = (k: Kind) => k === "FLAT" || via === "ANY" || k === via;

  const dist = new Map<string, number>();
  const prev = new Map<string, { n: string; e: SEdge }>();
  const done = new Set<string>();
  st.nodes.forEach((v) => dist.set(v.id, Infinity));
  dist.set(start, 0);

  for (;;) {
    let cur: string | null = null;
    let best = Infinity;
    for (const [id, v] of dist) if (!done.has(id) && v < best) { best = v; cur = id; }
    if (cur === null || cur === goal) break;
    done.add(cur);
    for (const e of adj.get(cur) ?? []) {
      if (done.has(e.b) || !allow(e.kind)) continue;
      const next = best + costOf(st, e).s;
      if (next < (dist.get(e.b) ?? Infinity)) { dist.set(e.b, next); prev.set(e.b, { n: cur, e }); }
    }
  }
  if (!isFinite(dist.get(goal) ?? Infinity)) return null;

  const segs: Seg[] = [];
  const ids = [goal];
  let cur = goal;
  while (cur !== start) {
    const p = prev.get(cur);
    if (!p) return null;
    const c = costOf(st, p.e);
    segs.unshift({ a: p.n, b: cur, kind: p.e.kind, m: c.m, s: c.s });
    ids.unshift(p.n);
    cur = p.n;
  }
  return {
    ids, segs,
    meters: segs.reduce((t, s) => t + s.m, 0),
    seconds: segs.reduce((t, s) => t + s.s, 0),
    vertical: segs.find((s) => s.kind !== "FLAT")?.kind ?? null,
  };
}

/** 같은 종류 시설이 여러 곳일 때 가장 빠른 곳 */
export function findNearest(st: Station, start: string, poi: Poi, via: Via) {
  let best: { node: SNode; route: Route } | null = null;
  for (const c of st.nodes.filter((v) => v.poi === poi)) {
    const r = findRoute(st, start, c.id, via);
    if (r && (!best || r.seconds < best.route.seconds)) best = { node: c, route: r };
  }
  return best;
}
