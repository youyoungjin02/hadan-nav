import { ChevronRight, Navigation, MapPin } from "lucide-react";
import { STATIONS } from "../stations";

export default function StationList() {
  return (
    <div className="min-h-screen w-full bg-[#F4F5F8] flex justify-center">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-xl">
        <header className="px-5 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#FFC400" }}>
              <Navigation className="w-5 h-5 text-[#16181D]" />
            </div>
            <div className="leading-tight">
              <p className="text-[17px] font-extrabold text-[#16181D]">역사 내 길찾기</p>
              <p className="text-[11px] text-[#8A90A0]">Station Indoor Navigation</p>
            </div>
          </div>
          <h1 className="text-[26px] font-extrabold leading-snug text-[#16181D]">
            어느 역에서<br />길을 찾으시나요?
          </h1>
          <p className="mt-2 text-[13px] text-[#8A90A0]">
            역을 선택하거나, 역사 내 QR을 촬영하면 바로 열립니다.
          </p>
        </header>

        <section className="px-4 pb-10">
          <div className="grid grid-cols-1 gap-2.5">
            {STATIONS.map((s) => (
              <a key={s.id} href={`/?station=${s.id}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-4 ring-1 ring-slate-200 bg-white active:scale-[0.99] transition">
                <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `${s.color}1A` }}>
                  <MapPin className="w-5 h-5" style={{ color: s.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[16px] font-extrabold text-[#16181D]">{s.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: s.color }}>
                      {s.line}
                    </span>
                  </span>
                  <span className="block text-[11.5px] text-[#8A90A0] mt-0.5">
                    {s.nameEn} Station · 출구 {s.nodes.filter((n) => n.poi === "EXIT").length}개
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-[#8A90A0] shrink-0" />
              </a>
            ))}
          </div>

          <p className="mt-6 text-center text-[11px] text-[#8A90A0]">
            역은 계속 추가됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
