import { useEffect, useMemo, useState } from "react";
import {
  MapPin, Navigation, DoorOpen, Train, Bath, MoveVertical, ArrowUpDown,
  ChevronRight, RotateCcw, Printer, X, QrCode, Clock, Ruler, Check,
  ChevronLeft, Package,
} from "lucide-react";
import { KIND_STYLE, findNearest, findRoute, nodeOf, type Route } from "./lib/graph";
import { getStation } from "./stations";
import StationMap from "./components/StationMap";
import QrSheet from "./components/QrSheet";
import StationList from "./components/StationList";

const BRAND = { primary: "#FFC400", ink: "#16181D", sub: "#8A90A0" };

export default function App() {
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const station = getStation(params.get("station"));
  const isQr = params.get("view") === "qr";
  const calib = params.get("calib") === "1";
  const init = params.get("from");

  const [from, setFrom] = useState<string | null>(
    station && init && nodeOf(station, init) ? init : null
  );
  const [to, setTo] = useState<string | null>(null);
  const [via, setVia] = useState<"ELEVATOR" | "ESCALATOR">("ELEVATOR");
  const [picker, setPicker] = useState(false);

  const { elev, esc, needsChoice } = useMemo(() => {
    if (!station || !from || !to) return { elev: null as Route | null, esc: null as Route | null, needsChoice: false };
    const a = findRoute(station, from, to, "ELEVATOR");
    const b = findRoute(station, from, to, "ESCALATOR");
    return { elev: a, esc: b, needsChoice: !!a && !!b && a.ids.join() !== b.ids.join() };
  }, [station, from, to]);

  useEffect(() => {
    if (elev && esc) setVia(elev.seconds <= esc.seconds ? "ELEVATOR" : "ESCALATOR");
    if (to) document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [to]); // eslint-disable-line

  if (!station) return <StationList />;
  if (isQr) return <QrSheet station={station} />;

  const main = needsChoice ? (via === "ELEVATOR" ? elev : esc) : elev ?? esc;
  const ghost = needsChoice ? (via === "ELEVATOR" ? esc : elev) : null;

  const exits = station.nodes.filter((v) => v.poi === "EXIT")
    .sort((a, b) => Number(a.short) - Number(b.short));
  const boards = station.nodes.filter((v) => v.poi === "BOARD");
  const facils = station.nodes.filter((v) => v.poi === "FACILITY");
  const platforms = station.nodes.filter((v) => v.poi === "PLATFORM");
  const hasToilet = station.nodes.some((v) => v.poi === "TOILET");
  const fmt = (s: number) => Math.max(1, Math.round(s / 60));

  const goNearest = (poi: "TOILET") => {
    if (!from) return;
    const best = findNearest(station, from, poi, "ANY");
    if (best) setTo(best.node.id);
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F8] flex justify-center">
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -28 } }
        @keyframes ping { 0%{transform:scale(.6);opacity:.55} 100%{transform:scale(2.4);opacity:0} }
        .route-flow{ animation: flow 1s linear infinite }
        .ping{ animation: ping 1.8s ease-out infinite }
      `}</style>

      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-xl">
        {/* 헤더 */}
        <header className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-full bg-slate-100" style={{ color: BRAND.sub }}>
              <ChevronLeft className="w-3.5 h-3.5" /> 역 목록
            </a>
            {from && (
              <button onClick={() => { setFrom(null); setTo(null); }}
                className="flex items-center gap-1 text-[12px] px-3 py-1.5 rounded-full bg-slate-100" style={{ color: BRAND.sub }}>
                <RotateCcw className="w-3.5 h-3.5" /> 초기화
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: BRAND.primary }}>
              <Navigation className="w-5 h-5" style={{ color: BRAND.ink }} />
            </div>
            <div className="leading-tight">
              <p className="text-[17px] font-extrabold" style={{ color: BRAND.ink }}>{station.name} 길찾기</p>
              <p className="text-[11px]" style={{ color: BRAND.sub }}>{station.nameEn} Station · {station.line}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl p-4 bg-[#F7F8FB]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: BRAND.sub }} />
              <span className="text-[12px]" style={{ color: BRAND.sub }}>현재 위치</span>
            </div>
            {from ? (
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[19px] font-extrabold" style={{ color: BRAND.ink }}>
                  {nodeOf(station, from).floor} · {nodeOf(station, from).name}
                </p>
                <button onClick={() => setPicker(true)} className="text-[12px] px-2.5 py-1 rounded-lg bg-white ring-1 ring-slate-200" style={{ color: BRAND.sub }}>
                  변경
                </button>
              </div>
            ) : (
              <button onClick={() => setPicker(true)}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold"
                style={{ background: BRAND.primary, color: BRAND.ink }}>
                <QrCode className="w-4 h-4" /> 위치 선택하기
              </button>
            )}
          </div>
        </header>

        {/* 지도 */}
        <div id="map" className="px-3">
          <div className={calib ? "" : "rounded-2xl overflow-hidden ring-1 ring-slate-200"}>
            <StationMap station={station} from={from} to={to} main={main} ghost={ghost} calib={calib} />
          </div>
        </div>

        {/* 이동수단 선택 */}
        {!calib && needsChoice && elev && esc && (
          <div className="px-4 mt-3">
            <p className="text-[12px] font-bold mb-2" style={{ color: BRAND.sub }}>이동 수단 선택</p>
            <div className="grid grid-cols-2 gap-2">
              {([["ELEVATOR", elev, MoveVertical] as const, ["ESCALATOR", esc, ArrowUpDown] as const]).map(
                ([key, r, Icon]) => {
                  const on = via === key;
                  const c = KIND_STYLE[key].color;
                  const fastest = key === "ELEVATOR" ? elev.seconds <= esc.seconds : esc.seconds < elev.seconds;
                  return (
                    <button key={key} onClick={() => setVia(key)}
                      className="relative rounded-2xl p-3 text-left transition"
                      style={{ background: on ? `${c}14` : "#fff", boxShadow: on ? `inset 0 0 0 2px ${c}` : "inset 0 0 0 1px #E4E8EF" }}>
                      {fastest && (
                        <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white" style={{ background: c }}>
                          최적
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 mb-1.5">
                        <Icon className="w-4 h-4" style={{ color: c }} />
                        <span className="text-[12.5px] font-extrabold" style={{ color: BRAND.ink }}>{KIND_STYLE[key].label}</span>
                        {on && <Check className="w-3.5 h-3.5" style={{ color: c }} />}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: BRAND.sub }}>
                        <Clock className="w-3 h-3" /> 약 {fmt(r.seconds)}분
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: BRAND.sub }}>
                        <Ruler className="w-3 h-3" /> {Math.round(r.meters)} m
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* 경로 요약 */}
        {!calib && main && to && from && (
          <div className="px-4 mt-3">
            <div className="rounded-2xl p-4" style={{ background: BRAND.ink }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-extrabold text-[15px] truncate">
                    {nodeOf(station, from).name} → {nodeOf(station, to).name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#9AA1B1" }}>
                    {main.vertical ? KIND_STYLE[main.vertical].label + " 이용" : "같은 층 이동"} · {Math.round(main.meters)} m
                  </p>
                </div>
                <p className="text-2xl font-extrabold leading-none" style={{ color: BRAND.primary }}>
                  {fmt(main.seconds)}<span className="text-xs ml-0.5">분</span>
                </p>
              </div>
              <ol className="mt-3 pt-3 border-t border-white/10 space-y-2">
                {main.segs.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12.5px]">
                    <span className="w-6 h-6 rounded-lg shrink-0" style={{ background: `${KIND_STYLE[s.kind].color}26` }} />
                    <span className="text-slate-400 truncate">{nodeOf(station, s.a).name}</span>
                    <ChevronRight className="w-3 h-3 shrink-0 text-slate-600" />
                    <span className="text-white font-semibold truncate">{nodeOf(station, s.b).name}</span>
                    <span className="ml-auto text-[10.5px] text-slate-500 shrink-0">{Math.round(s.m)}m</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* 목적지 */}
        {!calib && (
          <section className="px-4 pt-6 pb-10">
            <h2 className="text-[15px] font-extrabold mb-3" style={{ color: BRAND.ink }}>어디로 갈까요?</h2>

            {!from && (
              <p className="mb-3 text-[12.5px] rounded-xl bg-amber-50 text-amber-800 px-3 py-2.5">
                현재 위치를 먼저 설정해 주세요. 역사 내 QR을 촬영하면 자동으로 설정됩니다.
              </p>
            )}

            {hasToilet && (
              <div className="grid grid-cols-1 gap-2 mb-5">
                <Quick disabled={!from} on={!!to && nodeOf(station, to)?.poi === "TOILET"}
                  onClick={() => goNearest("TOILET")} icon={<Bath className="w-5 h-5" />} title="가장 가까운" sub="화장실" />
              </div>
            )}

            {platforms.length > 0 && (
              <>
                <p className="text-[12px] font-bold mb-2" style={{ color: BRAND.sub }}>
                  승강장 {platforms.length > 1 && "· 방면 선택"}
                </p>
                <div className="grid grid-cols-1 gap-2 mb-5">
                  {platforms.map((v) => (
                    <button key={v.id} disabled={!from} onClick={() => setTo(v.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                        to === v.id ? "" : "bg-white ring-1 ring-slate-200"
                      } ${!from ? "opacity-40" : "active:scale-[0.98]"}`}
                      style={to === v.id ? { background: BRAND.primary } : undefined}>
                      <span className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                        <Train className="w-4 h-4 text-sky-600" />
                      </span>
                      <span className="flex-1 min-w-0 text-left">
                        <span className="block text-[10px]" style={{ color: to === v.id ? "#6B5B00" : BRAND.sub }}>
                          {v.floor} 승강장
                        </span>
                        <span className="block font-bold text-[14px] truncate" style={{ color: BRAND.ink }}>
                          {v.name}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: BRAND.sub }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-[12px] font-bold mb-2" style={{ color: BRAND.sub }}>출구</p>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {exits.map((v) => (
                <button key={v.id} disabled={!from} onClick={() => setTo(v.id)}
                  className={`rounded-xl py-3 font-extrabold text-[15px] transition ${
                    to === v.id ? "" : "bg-white ring-1 ring-slate-200"
                  } ${!from ? "opacity-40" : "active:scale-[0.96]"}`}
                  style={to === v.id ? { background: BRAND.primary, color: BRAND.ink } : { color: BRAND.ink }}>
                  <DoorOpen className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: BRAND.sub }} />
                  {v.short}
                </button>
              ))}
            </div>

            {boards.length > 0 && (
              <>
                <p className="text-[12px] font-bold mb-2" style={{ color: BRAND.sub }}>지하철 승차 위치</p>
                <div className="grid grid-cols-1 gap-2 mb-5">
                  {boards.map((v) => (
                    <button key={v.id} disabled={!from} onClick={() => setTo(v.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                        to === v.id ? "" : "bg-white ring-1 ring-slate-200"
                      } ${!from ? "opacity-40" : "active:scale-[0.98]"}`}
                      style={to === v.id ? { background: BRAND.primary } : undefined}>
                      <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[13px] font-extrabold text-blue-600">
                        {v.short}
                      </span>
                      <span className="font-bold text-[14px]" style={{ color: BRAND.ink }}>{v.name}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BRAND.sub }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {facils.length > 0 && (
              <>
                <p className="text-[12px] font-bold mb-2" style={{ color: BRAND.sub }}>편의시설</p>
                <div className="grid grid-cols-1 gap-2">
                  {facils.map((v) => (
                    <button key={v.id} disabled={!from} onClick={() => setTo(v.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                        to === v.id ? "" : "bg-white ring-1 ring-slate-200"
                      } ${!from ? "opacity-40" : "active:scale-[0.98]"}`}
                      style={to === v.id ? { background: BRAND.primary } : undefined}>
                      <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Package className="w-4 h-4" style={{ color: BRAND.sub }} />
                      </span>
                      <span className="font-bold text-[14px]" style={{ color: BRAND.ink }}>{v.name}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BRAND.sub }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <a href={`/?station=${station.id}&view=qr`}
              className="mt-8 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: BRAND.sub }}>
              <Printer className="w-3.5 h-3.5" /> QR 인쇄 페이지
            </a>
          </section>
        )}
      </div>

      {/* 위치 선택 시트 */}
      {picker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPicker(false)} />
          <div className="fixed z-50 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-3xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-extrabold" style={{ color: BRAND.ink }}>현재 위치 선택</h3>
              <button onClick={() => setPicker(false)}><X className="w-5 h-5" style={{ color: BRAND.sub }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-[52vh] overflow-y-auto">
              {station.qrPoints.map((id) => {
                const v = nodeOf(station, id);
                if (!v) return null;
                return (
                  <button key={id} onClick={() => { setFrom(id); setTo(null); setPicker(false); }}
                    className="rounded-2xl px-3 py-3 text-left ring-1 ring-slate-200 active:bg-slate-50">
                    <p className="text-[10px]" style={{ color: BRAND.sub }}>{v.floor}</p>
                    <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>{v.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Quick({ icon, title, sub, onClick, disabled, on }: {
  icon: React.ReactNode; title: string; sub: string;
  onClick: () => void; disabled?: boolean; on?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-2xl p-4 text-left transition ${on ? "" : "bg-white ring-1 ring-slate-200"} ${disabled ? "opacity-40" : "active:scale-[0.97]"}`}
      style={on ? { background: "#FFC400" } : undefined}>
      <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-white/70 text-[#16181D]">{icon}</span>
      <p className="text-[11px]" style={{ color: on ? "#6B5B00" : "#8A90A0" }}>{title}</p>
      <p className="text-[15px] font-extrabold text-[#16181D]">{sub}</p>
    </button>
  );
}
