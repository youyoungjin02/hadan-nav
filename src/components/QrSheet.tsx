import QRCode from "react-qr-code";
import { Printer } from "lucide-react";
import { nodeOf, type Station } from "../lib/graph";

export default function QrSheet({ station }: { station: Station }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = (id: string) => `${origin}/?station=${station.id}&from=${id}`;

  return (
    <div className="min-h-screen bg-white p-8">
      <style>{`@media print { .no-print{display:none} .qr-card{break-inside:avoid} }`}</style>

      <div className="no-print mb-6 flex items-center gap-3">
        <button onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold text-[#16181D]"
          style={{ background: "#FFC400" }}>
          <Printer className="w-4 h-4" /> 인쇄하기
        </button>
        <a href={`/?station=${station.id}`} className="text-sm text-slate-500 underline">지도로 돌아가기</a>
        <a href="/" className="text-sm text-slate-500 underline">역 목록</a>
      </div>

      <h1 className="text-2xl font-extrabold mb-1">{station.name} 위치 QR</h1>
      <p className="text-sm text-slate-500 mb-6">
        각 지점에 부착하세요. 휴대폰 기본 카메라로 촬영하면 해당 위치가 설정된 지도가 열립니다.
      </p>

      <div className="grid grid-cols-3 gap-5">
        {station.qrPoints.map((id) => {
          const nodeItem = nodeOf(station, id);
          if (!nodeItem) return null;
          return (
            <div key={id} className="qr-card rounded-2xl border-2 border-slate-200 p-4 text-center">
              <div className="text-[10px] font-bold tracking-widest text-slate-400">
                {station.nameEn.toUpperCase()} STATION
              </div>
              <div className="text-base font-extrabold mb-3 text-[#16181D]">
                {nodeItem.floor} · {nodeItem.name}
              </div>
              <QRCode value={url(id)} size={150} />
              <div className="mt-2 text-[9px] text-slate-400 break-all">{url(id)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
