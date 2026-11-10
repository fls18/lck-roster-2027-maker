/*
 * LCK 2027 스토브리그 시뮬레이터 — 로스터 데이터
 * 기준: Riot 글로벌 계약 데이터베이스(GCD) 집계, 2026-11-08
 * 계약 만료 2026 = 2026.11.16 만료(FA). 2027 이상 = 이적 불가(고정).
 *
 * 데이터를 고칠 때는 이 파일만 수정하면 됩니다.
 * 형식: [닉네임, 포지션(TOP/JGL/MID/BOT/SPT/ETC), 1군=1 · 2군=2, 계약 만료 연도]
 * 데이터를 크게 바꿨다면 DATA_VERSION 숫자를 올려 주세요.
 */
window.STOVE_DATA = {
  DATA_VERSION: 2,
  DATA_DATE: '2026.11.10',
  TEAMS: [
    { id: 'GEN', ko: '젠지',          en: 'Gen.G',               color: '#B8922A' },
    { id: 'HLE', ko: '한화생명',      en: 'Hanwha Life Esports', color: '#EC6A1F' },
    { id: 'T1',  ko: 'T1',            en: 'T1',                  color: '#D3172E' },
    { id: 'DK',  ko: '디플러스 기아', en: 'Dplus KIA',           color: '#12A89C' },
    { id: 'KT',  ko: 'kt 롤스터',     en: 'kt Rolster',          color: '#E8483F' },
    { id: 'BFX', ko: 'BNK 피어엑스',  en: 'BNK FEARX',           color: '#F2B705' },
    { id: 'BRO', ko: '한진 브리온',   en: 'HANJIN BRION',        color: '#1F8A5B' },
    { id: 'NS',  ko: '농심 레드포스', en: 'Nongshim RedForce',   color: '#C2412C' },
    { id: 'KRX', ko: '키움 DRX',      en: 'KIWOOM DRX',          color: '#3366E0' },
    { id: 'DNS', ko: 'DN 수퍼스',     en: 'DN SOOPers',          color: '#7656E0' },
  ],
  ROSTERS: {
    GEN: { hc: '유상욱 (Ryu)', p: [
      ['Kiin','TOP',1,2026],['Canyon','JGL',1,2026],['Chovy','MID',1,2027],['Ruler','BOT',1,2027],['Duro','SPT',1,2027],
      ['Ripple','TOP',2,2026],['Courage','JGL',2,2026],['Kemish','MID',2,2026],['MUDAI','BOT',2,2026],['Lumos','SPT',2,2026],['SIRIUSS','SPT',2,2026]] },
    HLE: { hc: '윤성영 (Homme)', p: [
      ['Zeus','TOP',1,2026],['Kanavi','JGL',1,2026],['Zeka','MID',1,2027],['Gumayusi','BOT',1,2027],['Delight','SPT',1,2027],
      ['Panther','TOP',2,2026],['Jackal','JGL',2,2026],['Cracker','MID',2,2026],['Valiant','MID',2,2026],['Pyeonsik','BOT',2,2026],['Bluffing','SPT',2,2026]] },
    T1: { hc: '임재현 (Tom, 대행)', p: [
      ['Doran','TOP',1,2026],['Oner','JGL',1,2028],['Faker','MID',1,2029],['Peyz','BOT',1,2028],['Keria','SPT',1,2029],
      ['Haetae','TOP',2,2026],['Guardian','TOP',2,2026],['Painter','JGL',2,2026],['Carim','JGL',2,2026],['Guti','MID',2,2026],
      ['Cypher','BOT',2,2026],['Eclipse','BOT',2,2026],['Jinbeom','BOT',2,2026],['Cloud','SPT',2,2026]] },
    DK: { hc: '김대호 (cvMax)', p: [
      ['Siwoo','TOP',1,2027],['Lucid','JGL',1,2027],['ShowMaker','MID',1,2026],['Smash','BOT',1,2026],['Career','SPT',1,2027],
      ['Jaehyuk','TOP',2,2027],['Nevid','TOP',2,2027],['Solid','JGL',2,2029],['Garden','MID',2,2026],['Wayne','BOT',2,2026],['Loopy','SPT',2,2026]] },
    KT: { hc: '고동빈 (Score)', p: [
      ['PerfecT','TOP',1,2028],['Cuzz','JGL',1,2027],['Bdd','MID',1,2028],['Jiwoo','BOT',1,2026],['FenRir','BOT',1,2027],['Effort','SPT',1,2026],['Ghost','SPT',1,2026],
      ['Sero','TOP',2,2027],['Sylvie','JGL',2,2026],['Hwichan','MID',2,2027],['Pollu','SPT',2,2026]] },
    BFX: { hc: '박준석', p: [
      ['Clear','TOP',1,2026],['Raptor','JGL',1,2026],['VicLa','MID',1,2026],['Daystar','MID',1,2026],['Taeyoon','BOT',1,2026],['Kellin','SPT',1,2026],
      ['Kangin','TOP',2,2026],['Grizzly','JGL',2,2026],['Zephyr','JGL',2,2026],['MG','MID',2,2026],['Slayer','BOT',2,2026],['Luon','SPT',2,2026]] },
    BRO: { hc: '김상수 (Ssong)', p: [
      ['Casting','TOP',1,2027],['GIDEON','JGL',1,2027],['Roamer','MID',1,2027],['Teddy','BOT',1,2027],['Namgung','SPT',1,2027],
      ['DDahyuk','TOP',2,2026],['Tempester','MID',2,2026],['Pungyeon','MID',2,2026],['OddEye','BOT',2,2026],['PlanB','SPT',2,2026]] },
    NS: { hc: '최인규', p: [
      ['Kingen','TOP',1,2026],['Sponge','JGL',1,2026],['Scout','MID',1,2026],['Diable','BOT',1,2026],['Lehends','SPT',1,2026],['Pleata','SPT',1,2026],
      ['Janus','TOP',2,2027],['MihawK','JGL',2,2027],['Calix','MID',2,2026],['SeTab','MID',2,2026],['Lucy','BOT',2,2026]] },
    KRX: { hc: '조재읍 (Joker)', p: [
      ['Rich','TOP',1,2026],['Willer','JGL',1,2026],['Vincenzo','JGL',1,2026],['Ucal','MID',1,2026],['Aiming','BOT',1,2026],['Andil','SPT',1,2026],
      ['Frog','TOP',2,2026],['Winner','JGL',2,2026],['AKaJe','MID',2,2028],['LazyFeel','BOT',2,2028],['Minous','SPT',2,2026],['Raise','ETC',2,2026],['Saroo','ETC',2,2026]] },
    DNS: { hc: '주영달', p: [
      ['DuDu','TOP',1,2026],['Pyosik','JGL',1,2026],['Sharvel','JGL',1,2026],['Clozer','MID',1,2026],['deokdam','BOT',1,2027],['Peter','SPT',1,2026],
      ['Lancer','TOP',2,2026],['DDoIV','JGL',2,2026],['Flip','MID',2,2027],['Enosh','BOT',2,2026],['Life','SPT',2,2026],['Quantum','SPT',2,2026]] },
  },
  // 무소속 (전역 예정 등): [닉네임, 포지션, 메모]
  // ※ 은퇴한 선수는 여기 넣지 마세요. (BeryL: 2025 시즌을 끝으로 은퇴 → 제외)
  FREE: [
    ['Deft','BOT','11.18 전역'],
    ['Rascal','TOP','12월 전역'],
  ],
  // 은퇴(예정) 선수: 처음부터 '은퇴'로 분류되어 팀에 배치되지 않습니다.
  // 화면에서 '현역 복귀'를 누르면 다시 배치할 수 있습니다.
  // [팀ID, 닉네임, 메모]
  RETIRED: [
    ['NS','Lehends','2026 시즌을 끝으로 은퇴 시사'],
  ],
};
