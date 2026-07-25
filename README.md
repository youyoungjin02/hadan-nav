# 역사 내 길찾기 (Station Indoor Navigation)

QR 촬영 → 현재 위치 자동 설정 → 목적지 선택 → 엘리베이터 / 에스컬레이터 경로 비교

## 실행

```
npm install
npm run dev -- --host     # 폰에서 확인
npm run build
vercel --prod
```

## URL

| 주소 | 화면 |
|---|---|
| `/` | 역 목록 |
| `/?station=hadan` | 하단역 길찾기 |
| `/?station=hadan&from=EXIT_1` | 현재 위치가 1번 출구로 설정된 상태 (QR이 여는 주소) |
| `/?station=hadan&view=qr` | QR 인쇄 페이지 |
| `/?station=hadan&calib=1` | 좌표 보정 모드 |

## 새 역 추가하기

1. `public/<역id>.png` 에 안내도 이미지를 넣는다
2. `src/stations/<역id>.ts` 를 `hadan.ts` 를 복사해 작성한다
   - `imageRatio` = 이미지 높이 / 너비
   - `metersPerPct` = 가로 1% 당 실제 거리(m). 양 끝 지점의 실제 거리 ÷ 두 지점의 가로 % 차이
   - 좌표는 대충 넣어두고 `calibrated: false` 로 둔다
3. `src/stations/index.ts` 의 `STATIONS` 배열에 추가한다
4. `/?station=<역id>&calib=1` 접속 → 노드를 순서대로 클릭 → `nodes 배열 복사` → 역 파일에 붙여넣기
5. `calibrated: true` 로 변경

`src/lib/graph.ts` 와 `src/components/*` 는 역을 추가해도 수정할 필요가 없습니다.

## 노드 규칙

| poi | 용도 |
|---|---|
| `EXIT` | 출구 그리드에 표시 (`short` 에 번호) |
| `TOILET` | "가장 가까운 화장실" 계산 대상 (여러 개 가능) |
| `PLATFORM` | 승강장 바로가기 |
| `BOARD` | 승차 위치 목록 |
| `FACILITY` | 편의시설 목록 |
| (없음) | 경로 계산용 통로 노드 |

엣지 종류는 `FLAT` / `ELEVATOR` / `ESCALATOR` 세 가지입니다.
같은 층 사이는 `FLAT`, 층 간 이동만 `ELEVATOR` 또는 `ESCALATOR` 로 지정하면
앱이 두 경로를 각각 계산해 비교 카드를 띄웁니다.
