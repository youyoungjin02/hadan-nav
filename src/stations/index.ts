import type { Station } from "../lib/graph";
import { hadan } from "./hadan";
import { busan } from "./busan";
import { dadaepo } from "./dadaepo";
import { haeundae } from "./haeundae";

/* ------------------------------------------------------------------------
 * 역 레지스트리
 *
 * ★ 새 역 추가 방법 (3단계)
 *   1) public/<역id>.gif  로 안내도 이미지를 넣는다
 *   2) src/stations/<역id>.ts  를 기존 역 파일을 복사해 작성한다
 *   3) 아래 STATIONS 배열에 import 해서 추가한다
 *
 *   좌표는 /?station=<역id>&calib=1 보정 모드에서 클릭으로 찍으면 됩니다.
 * ---------------------------------------------------------------------- */

export const STATIONS: Station[] = [hadan, busan, dadaepo, haeundae];

export const getStation = (id: string | null): Station | undefined =>
  STATIONS.find((s) => s.id === id);
