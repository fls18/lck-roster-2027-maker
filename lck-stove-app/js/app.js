(function () {
'use strict';

const D = window.STOVE_DATA;
const TEAMS = D.TEAMS;
const TM = Object.fromEntries(TEAMS.map(t => [t.id, t]));
const POS = ['TOP', 'JGL', 'MID', 'BOT', 'SPT'];
const STORE_KEY = 'lck-stove-2027';

/* ================= 저장 ================= */
const DEFAULTS = {
  font: 16, theme: 'dark', nameLang: 'ko',
  order: TEAMS.map(t => t.id), fav: {}, hidden: {},
  showCoach: true, showAcad: false, favFirst: false, showYear: true,
  unlockAll: false,   // true면 2027+ 계약 선수도 자유 이동
};
let S = { settings: { ...DEFAULTS }, assign: {}, custom: [] };

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      S = { settings: { ...DEFAULTS, ...(o.settings || {}) }, assign: o.assign || {}, custom: o.custom || [] };
    }
  } catch (e) { /* 저장소를 쓸 수 없는 환경 */ }
  S.settings.order = [...new Set([...S.settings.order.filter(id => TM[id]), ...TEAMS.map(t => t.id)])];
}
let storageOk = true;
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); storageOk = true; }
  catch (e) { if (storageOk) toast('이 브라우저에서는 저장이 되지 않습니다'); storageOk = false; }
}
// 브라우저가 저장 공간을 임의로 지우지 않도록 요청
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ================= 인물 ================= */
let PEOPLE = [];
function buildPeople() {
  PEOPLE = [];
  for (const tid of Object.keys(D.ROSTERS)) {
    const r = D.ROSTERS[tid];
    PEOPLE.push({ id: 'hc-' + tid, name: r.hc, pos: 'HC', team: tid, squad: '1', end: null, role: 'coach' });
    for (const [n, p, sq, end] of r.p) {
      PEOPLE.push({ id: (tid + '-' + n).toLowerCase(), name: n, pos: p, team: tid, squad: String(sq), end, role: 'player' });
    }
  }
  for (const [n, p, note] of D.FREE) PEOPLE.push({ id: 'free-' + n.toLowerCase(), name: n, pos: p, team: null, squad: '1', end: null, role: 'player', note });
  for (const c of S.custom) PEOPLE.push({ ...c, team: null, squad: '1', end: null, role: c.pos === 'HC' ? 'coach' : 'player', custom: true });
  for (const [tid, n, note] of (D.RETIRED || [])) {
    const p = PEOPLE.find(x => x.id === (tid + '-' + n).toLowerCase());
    if (p) { p.retiredDefault = true; p.retireNote = note; }
  }
}
const byId = id => PEOPLE.find(p => p.id === id);
const isLocked = p => p.role === 'player' && p.end && p.end >= 2027;   // 2027+ 계약자
const canMove = p => !isLocked(p) || S.settings.unlockAll;            // 잠금 해제 시 모두 이동 가능

function getA(p) {
  const a = S.assign[p.id];
  if (isLocked(p) && !S.settings.unlockAll) {
    if (a && a.retired) return { team: null, squad: '1', retired: true };
    return { team: p.team, squad: (a && a.team === p.team && a.squad) || p.squad };
  }
  if (a) return a;
  if (p.retiredDefault) return { team: null, squad: '1', retired: true };
  if ((p.role === 'coach' || isLocked(p)) && p.team) return { team: p.team, squad: p.squad };
  return { team: null, squad: '1' };
}
const isRetired = p => !!getA(p).retired;
function setA(p, team, squad) {
  if (!canMove(p) && team !== p.team) { toast(`${p.name}은(는) ${p.end}년까지 계약 — 설정에서 '계약 잠금 해제'를 켜면 옮길 수 있어요`); return false; }
  S.assign[p.id] = { team, squad: p.role === 'coach' ? '1' : (squad || '1') };
  save(); return true;
}
function setRetired(p, on) {
  if (on) S.assign[p.id] = { team: null, squad: '1', retired: true };
  else S.assign[p.id] = { team: (isLocked(p) && !S.settings.unlockAll) ? p.team : null, squad: p.squad || '1' };
  save();
}

/* ================= 유틸 ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const teamName = t => S.settings.nameLang === 'en' ? t.en : t.ko;
const posColor = p => `var(--${POS.includes(p) ? p : (p === 'HC' ? 'HC' : 'ETC')})`;
const posText = p => p === 'HC' ? '감독' : (p === 'ETC' ? '기타' : p);
function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#17181f' : '#ffffff';
}
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
function visibleTeams() {
  let ids = S.settings.order.filter(id => !S.settings.hidden[id]);
  if (S.settings.favFirst) ids = [...ids.filter(i => S.settings.fav[i]), ...ids.filter(i => !S.settings.fav[i])];
  return ids.map(id => TM[id]);
}
function countsFA() {
  const fa = PEOPLE.filter(p => p.role === 'player' && !isLocked(p) && (!p.team || S.settings.showAcad || p.squad === '1'));
  let und = 0, stay = 0, moved = 0;
  for (const p of fa) { const a = getA(p); if (a.retired) continue; if (!a.team) und++; else if (a.team === p.team) stay++; else moved++; }
  return { total: fa.length, und, stay, moved };
}

/* ================= 테마 · 글자 ================= */
function applyLook() {
  const root = document.documentElement;
  root.dataset.theme = S.settings.theme;
  root.style.fontSize = S.settings.font + 'px';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = S.settings.theme === 'light' ? '#f3f4f7' : '#1b1c2b';
  $('#bTheme').innerHTML = S.settings.theme === 'light' ? '<i class="ic-moon"></i>' : '<i class="ic-sun"></i>';
  $('#bTheme').title = S.settings.theme === 'light' ? '다크 모드로' : '라이트 모드로';
}

/* ================= 렌더: 팀 카드 ================= */
function chip(p) {
  const a = getA(p), locked = isLocked(p), moved = p.team !== a.team;
  let cls = 'chip';
  if (p.role === 'coach') cls += ' coach';
  else if (!locked) cls += ' fa' + (moved ? ' new' : '');
  else if (moved) cls += ' new';
  const from = moved ? `<span class="from">${p.team || (p.custom ? '신규' : 'FA')}</span>` : '';
  const yr = locked && S.settings.showYear ? `<span class="yr">~${String(p.end).slice(2)}</span>` : '';
  return `<span class="${cls}" draggable="true" data-pid="${p.id}" title="${esc(p.name)}${p.note ? ' · ' + esc(p.note) : ''}"><span class="nm">${esc(p.name)}</span>${locked ? '<i class="ic-lock"></i>' : ''}${yr}${from}</span>`;
}
function zone(t, squad, members) {
  const rows = POS.map(pos => {
    const ps = members.filter(p => p.pos === pos);
    const empty = squad === '1' ? '<span class="vacant main">공석</span>' : '<span class="vacant">—</span>';
    return `<div class="pos-row" style="--pc:${posColor(pos)}"><span class="pos-label">${pos}</span><div class="chips">${ps.length ? ps.map(chip).join('') : empty}</div></div>`;
  }).join('');
  const etc = members.filter(p => !POS.includes(p.pos));
  const etcRow = etc.length ? `<div class="pos-row" style="--pc:var(--ETC)"><span class="pos-label">기타</span><div class="chips">${etc.map(chip).join('')}</div></div>` : '';
  return `<div class="zone" data-team="${t.id}" data-squad="${squad}"><div class="zone-label"><span>${squad === '1' ? '1군' : '2군'}</span><span>${members.length}명</span></div>${rows}${etcRow}</div>`;
}
function renderGrid() {
  const html = visibleTeams().map(t => {
    const mem = PEOPLE.filter(p => p.role === 'player' && getA(p).team === t.id);
    const m1 = mem.filter(p => getA(p).squad === '1'), m2 = mem.filter(p => getA(p).squad === '2');
    const fixed = m1.filter(p => isLocked(p) && p.team === t.id).length;
    const fav = !!S.settings.fav[t.id];
    const coaches = PEOPLE.filter(p => p.role === 'coach' && getA(p).team === t.id);
    const coachRow = S.settings.showCoach
      ? `<div class="card-coach" style="--pc:var(--HC)"><span class="pos-label" style="padding-top:0">감독</span><div class="chips">${coaches.length ? coaches.map(chip).join('') : '<span class="vacant main" style="padding:0">공석</span>'}</div></div>` : '';
    return `<article class="card${fav ? ' fav' : ''}" style="--tc:${t.color};--tc-tx:${readableOn(t.color)}" data-team="${t.id}">
      <div class="card-head">
        <span class="card-code">${t.id}</span>
        <div class="card-title"><div class="card-name" title="${esc(t.en)}">${esc(teamName(t))}</div><div class="card-meta">1군 ${m1.length}명 · 고정 ${fixed}명</div></div>
        <button class="star${fav ? ' on' : ''}" data-fav="${t.id}" aria-label="즐겨찾기"><i class="${fav ? 'ic-star' : 'ic-star-o'}"></i></button>
      </div>
      ${coachRow}${zone(t, '1', m1)}${S.settings.showAcad ? zone(t, '2', m2) : ''}
    </article>`;
  }).join('');
  $('#grid').innerHTML = html || '<p class="empty-note">표시할 팀이 없습니다. 설정에서 숨긴 팀을 다시 켜 주세요.</p>';
}

/* ================= 렌더: 선수 명단 ================= */
const filt = { q: '', pos: 'ALL', onlyFA: false, onlyUndec: false };
function status(p) {
  const a = getA(p);
  if (a.retired) return '<span class="item-status retired">은퇴</span>';
  if (isLocked(p) && a.team === p.team) return `<span class="item-status"><i class="ic-lock"></i>~${p.end}${a.squad !== p.squad ? (a.squad === '2' ? ' 2군' : ' 1군') : ''}</span>`;
  if (!a.team) return '<span class="item-status undecided">미정</span>';
  const sq = p.role === 'player' && a.squad === '2' ? ' 2군' : '';
  if (a.team === p.team) return `<span class="item-status stay">잔류${sq}</span>`;
  return `<span class="item-status moved">→ ${a.team}${sq}</span>`;
}
function pass(p) {
  if (p.role === 'coach' && !S.settings.showCoach) return false;
  if (p.role === 'player' && p.team && p.squad === '2' && !S.settings.showAcad) return false;
  if (filt.pos !== 'ALL') { if (filt.pos === 'HC' ? p.role !== 'coach' : p.pos !== filt.pos) return false; }
  if (filt.onlyFA && isLocked(p)) return false;
  if (filt.onlyUndec && (isLocked(p) || getA(p).team || isRetired(p))) return false;
  if (filt.q && !p.name.toLowerCase().includes(filt.q.toLowerCase())) return false;
  return true;
}
const sortKey = p => (p.role === 'coach' ? 0 : 100) + (p.squad === '2' ? 50 : 0) + ['TOP', 'JGL', 'MID', 'BOT', 'SPT', 'ETC'].indexOf(p.pos);
function item(p) {
  return `<div class="item${!canMove(p) ? ' locked' : ''}${isRetired(p) ? ' is-retired' : ''}" data-pid="${p.id}" draggable="${canMove(p) && !isRetired(p) ? 'true' : 'false'}" style="--pc:${posColor(p.pos)}">
    <span class="item-pos">${posText(p.pos)}</span><span class="item-name">${esc(p.name)}</span>
    ${p.role === 'player' && p.team && p.squad === '2' ? '<span class="item-tag">2군</span>' : ''}${p.note ? `<span class="item-tag">${esc(p.note)}</span>` : ''}${p.retireNote && isRetired(p) ? `<span class="item-tag" title="${esc(p.retireNote)}">은퇴 시사</span>` : ''}
    ${status(p)}${p.custom ? `<button class="item-remove" data-remove="${p.id}" aria-label="삭제"><i class="ic-x"></i></button>` : ''}</div>`;
}
function renderList() {
  let html = '';
  for (const t of visibleTeams()) {
    const ps = PEOPLE.filter(p => p.team === t.id && pass(p)).sort((a, b) => sortKey(a) - sortKey(b));
    if (!ps.length) continue;
    const fa = PEOPLE.filter(p => p.team === t.id && p.role === 'player' && !isLocked(p) && (S.settings.showAcad || p.squad === '1')).length;
    html += `<section class="group" style="--tc:${t.color}"><div class="group-head">${S.settings.fav[t.id] ? '<i class="ic-star"></i>' : ''}${esc(teamName(t))}<span class="count">계약 만료 ${fa}</span></div>${ps.map(item).join('')}</section>`;
  }
  const free = PEOPLE.filter(p => !p.team && pass(p));
  if (free.length) html += `<section class="group" style="--tc:var(--line-2)"><div class="group-head">무소속 · 직접 추가<span class="count">${free.length}</span></div>${free.map(item).join('')}</section>`;
  $('#list').innerHTML = html || '<p class="empty-note">조건에 맞는 선수가 없습니다.</p>';
}
function renderFilters() {
  const opts = ['ALL', ...POS, ...(S.settings.showCoach ? ['HC'] : [])];
  if (!opts.includes(filt.pos)) filt.pos = 'ALL';
  $('#pf').innerHTML = opts.map(o => `<button class="${filt.pos === o ? 'on' : ''}" data-pf="${o}">${o === 'ALL' ? '전체' : o === 'HC' ? '감독' : o}</button>`).join('');
}
function renderTop() {
  const c = countsFA();
  $('#summary').innerHTML = `계약 만료 <b>${c.total}</b> · 미정 <b class="u">${c.und}</b> · 잔류 <b>${c.stay}</b> · 이적 <b class="m">${c.moved}</b>`;
  $('#tgCoach').checked = S.settings.showCoach;
  $('#tgAcad').checked = S.settings.showAcad;
}
function render() { renderTop(); renderFilters(); renderGrid(); renderList(); }

/* ================= 시트 ================= */
const sheetWrap = $('#sheet'), sheet = sheetWrap.querySelector('.sheet');
let sheetState = null;
function openSheet(html, wide) {
  sheet.className = 'sheet' + (wide ? ' wide' : '');
  sheet.innerHTML = html; sheetWrap.classList.add('open'); sheetWrap.setAttribute('aria-hidden', 'false');
}
function closeSheet() { sheetWrap.classList.remove('open'); sheetWrap.setAttribute('aria-hidden', 'true'); sheetState = null; }
const closeBtn = '<button class="sheet-close" data-close aria-label="닫기"><i class="ic-x"></i></button>';

function openAssign(id) {
  const p = byId(id); if (!p) return;
  const a = getA(p), locked = isLocked(p);
  if (!sheetState || sheetState.id !== id) sheetState = { kind: 'assign', id, squad: a.team ? a.squad : (p.team ? p.squad : '1') };
  const origin = p.team ? teamName(TM[p.team]) + (p.role === 'player' && p.squad === '2' ? ' 2군' : '') : (p.note || '무소속');
  const contract = locked ? `${p.end}년까지 계약` : (p.role === 'coach' ? '감독' : (p.team ? '2026.11.16 계약 만료' : ''));
  const retireBtn = p.role === 'player' ? (a.retired ? '<button class="btn primary" data-unretire>현역 복귀</button>' : '<button class="btn" data-retire>은퇴 처리</button>') : '';
  let h = `<div class="sheet-head"><div><div class="sheet-title">${esc(p.name)}</div><div class="sheet-sub">${posText(p.pos)} · 2026 ${esc(origin)}${contract ? ' · ' + contract : ''}</div></div>${closeBtn}</div>`;

  if (a.retired) {
    h += `<p class="note">은퇴로 분류된 선수입니다${p.retireNote ? ` (${esc(p.retireNote)})` : ''}. 팀 카드에 나오지 않으며, '현역 복귀'를 누르면 다시 배치할 수 있어요.</p><div class="sheet-actions">${retireBtn}</div>`;
  } else if (!canMove(p)) {
    h += `<p class="note">2027년 이후까지 계약된 선수라 다른 팀으로 옮길 수 없습니다. 같은 팀 안에서 1군·2군만 바꿀 수 있어요. 설정에서 <b>계약 잠금 해제</b>를 켜면 자유롭게 옮길 수 있습니다.</p>
      <h3>소속</h3><div class="seg" data-lsq>
        <button class="${a.squad === '1' ? 'on' : ''}" data-setsq="1">1군</button><button class="${a.squad === '2' ? 'on' : ''}" data-setsq="2">2군</button></div>
      <div class="sheet-actions">${retireBtn}</div>`;
  } else {
    if (p.role === 'player' && S.settings.showAcad) {
      h += `<h3>어디로 보낼까요</h3><div class="seg" style="margin-bottom:8px"><button class="${sheetState.squad === '1' ? 'on' : ''}" data-pick-sq="1">1군</button><button class="${sheetState.squad === '2' ? 'on' : ''}" data-pick-sq="2">2군</button></div>`;
    } else {
      h += '<h3>어디로 보낼까요</h3>';
    }
    h += '<div class="team-pick">' + visibleTeams().map(t => {
      const cur = a.team === t.id;
      const tag = cur ? '현재' : (t.id === p.team ? '원소속' : '');
      return `<button data-to="${t.id}" class="${cur ? 'current' : ''}" style="--tc:${t.color}"><span class="sw"></span>${esc(teamName(t))}${tag ? `<span class="cur-label">${tag}</span>` : ''}</button>`;
    }).join('') + '</div>';
    h += `<div class="sheet-actions">${a.team ? `<button class="btn" data-release>${locked ? '팀에서 빼기' : '미정으로 돌리기'}</button>` : ''}${locked && a.team !== p.team ? '<button class="btn" data-backhome>원소속 복귀</button>' : ''}${retireBtn}</div>`;
  }
  openSheet(h);
}

function openSettings() {
  const s = S.settings;
  const h = `<div class="sheet-head"><div><div class="sheet-title">설정</div><div class="sheet-sub">이 기기에 자동 저장됩니다</div></div>${closeBtn}</div>
    <h3>화면 모드</h3>
    <div class="seg"><button class="${s.theme === 'dark' ? 'on' : ''}" data-theme-set="dark">다크</button><button class="${s.theme === 'light' ? 'on' : ''}" data-theme-set="light">라이트</button></div>
    <h3>글자 크기</h3>
    <div class="row"><input type="range" class="range" id="sFont" min="12" max="22" step="1" value="${s.font}"><span id="sFontV" style="width:3em;text-align:right">${s.font}px</span><button class="btn" data-font-reset>기본</button></div>
    <h3>팀 이름</h3>
    <div class="seg"><button class="${s.nameLang === 'ko' ? 'on' : ''}" data-lang="ko">한글</button><button class="${s.nameLang === 'en' ? 'on' : ''}" data-lang="en">영문</button></div>
    <h3>표시</h3>
    <div class="row" style="gap:16px">
      <label class="check sm"><input type="checkbox" data-opt="showCoach" ${s.showCoach ? 'checked' : ''}><span>감독</span></label>
      <label class="check sm"><input type="checkbox" data-opt="showAcad" ${s.showAcad ? 'checked' : ''}><span>2군(CL) 로스터</span></label>
      <label class="check sm"><input type="checkbox" data-opt="showYear" ${s.showYear ? 'checked' : ''}><span>계약 연도</span></label>
      <label class="check sm"><input type="checkbox" data-opt="favFirst" ${s.favFirst ? 'checked' : ''}><span>즐겨찾기 팀 먼저</span></label>
    </div>
    <h3>계약 잠금</h3>
    <label class="check sm"><input type="checkbox" data-opt="unlockAll" ${s.unlockAll ? 'checked' : ''}><span>계약 잠금 해제 — 2027년 이후까지 계약된 선수도 자유롭게 이동</span></label>
    <div class="row" style="margin-top:8px"><button class="btn" data-relock>잠금 선수 전원 원소속으로</button></div>
    <p class="note" style="margin-top:6px">잠금을 다시 켜면 옮겼던 계약 선수는 원소속팀에 표시되고, 옮긴 기록은 남아 있다가 잠금을 풀면 다시 나타납니다.</p>
    <h3>팀 순서 · 즐겨찾기 · 숨기기</h3>
    <div class="order-list" id="orderList">${orderHTML()}</div>
    <h3>앱으로 설치</h3>
    <div class="row"><button class="btn" data-install>${deferredInstall ? '홈 화면에 설치' : '설치 방법 보기'}</button></div>
    <p class="note" id="installNote" style="margin-top:8px"></p>
    <h3>데이터</h3>
    <div class="row"><button class="btn" data-export>내보내기</button><button class="btn" data-import>불러오기</button><button class="btn danger" data-reset>전체 초기화</button></div>
    <div id="ioBox" style="margin-top:10px"></div>
    <p class="note" style="margin-top:14px">배치·즐겨찾기·글자 크기 등은 이 기기 브라우저에 저장됩니다. 다른 기기로 옮길 때는 내보내기/불러오기를 쓰세요.<br>로스터 기준일 ${D.DATA_DATE} · Riot 글로벌 계약 DB 집계. 1군/2군 구분과 감독 정보는 언론 보도 기준입니다.</p>`;
  sheetState = { kind: 'settings' };
  openSheet(h, true);
}
function orderHTML() {
  const s = S.settings;
  return s.order.map((id, i) => {
    const t = TM[id], fav = !!s.fav[id], hid = !!s.hidden[id];
    return `<div class="order-item${hid ? ' hidden-team' : ''}" style="--tc:${t.color}"><span class="bar"></span><span class="nm">${esc(teamName(t))}</span>
      <button class="mini-btn${fav ? ' on' : ''}" data-ofav="${id}" aria-label="즐겨찾기"><i class="${fav ? 'ic-star' : 'ic-star-o'}"></i></button>
      <button class="mini-btn" data-ohide="${id}">${hid ? '보이기' : '숨김'}</button>
      <button class="mini-btn" data-oup="${i}" ${i === 0 ? 'disabled' : ''} aria-label="위로">▲</button>
      <button class="mini-btn" data-odn="${i}" ${i === s.order.length - 1 ? 'disabled' : ''} aria-label="아래로">▼</button></div>`;
  }).join('');
}

/* ================= 동작 ================= */
function place(id, team, squad) {
  const p = byId(id); if (!p) return;
  if (setA(p, team, squad)) {
    toast(team ? `${p.name} → ${teamName(TM[team])}${p.role === 'player' && squad === '2' ? ' 2군' : ''}${team === p.team ? ' (잔류)' : ''}` : `${p.name} → 미정`);
    render();
  }
}
function lineupText() {
  const lines = ['2027 LCK 스토브리그 예상 로스터'];
  for (const t of visibleTeams()) {
    const mem = PEOPLE.filter(p => p.role === 'player' && getA(p).team === t.id && getA(p).squad === '1');
    const line = POS.map(pos => { const n = mem.filter(p => p.pos === pos).map(p => p.name); return `${pos} ${n.length ? n.join('/') : '?'}`; }).join(' · ');
    const hc = PEOPLE.filter(p => p.role === 'coach' && getA(p).team === t.id).map(p => p.name).join(', ');
    lines.push(`${teamName(t)} — ${line}${S.settings.showCoach ? ` · 감독 ${hc || '?'}` : ''}`);
  }
  return lines.join('\n');
}

document.addEventListener('click', e => {
  const el = e.target;
  // 탭바
  const tab = el.closest('.tabbar [data-tab]');
  if (tab) {
    document.body.dataset.tab = tab.dataset.tab;
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b === tab));
    window.scrollTo(0, 0); return;
  }
  if (el.closest('[data-open="settings"]') || el.closest('#bSet')) { openSettings(); return; }

  // 시트 내부
  if (el.closest('.sheet')) { onSheetClick(e); return; }
  if (el === sheetWrap) { closeSheet(); return; }

  const fav = el.closest('[data-fav]');
  if (fav) { const id = fav.dataset.fav; S.settings.fav[id] = !S.settings.fav[id]; save(); render(); return; }
  const rm = el.closest('[data-remove]');
  if (rm) {
    const id = rm.dataset.remove; S.custom = S.custom.filter(c => c.id !== id); delete S.assign[id];
    buildPeople(); save(); render(); return;
  }
  const pf = el.closest('[data-pf]');
  if (pf) { filt.pos = pf.dataset.pf; renderFilters(); renderList(); return; }
  const target = el.closest('.chip[data-pid], .item[data-pid]');
  if (target) { sheetState = null; openAssign(target.dataset.pid); return; }
});

function onSheetClick(e) {
  const el = e.target;
  if (el.closest('[data-close]')) { closeSheet(); return; }
  const st = sheetState;
  if (st && st.kind === 'assign') {
    const p = byId(st.id);
    let b;
    if ((b = el.closest('[data-pick-sq]'))) { st.squad = b.dataset.pickSq; openAssign(st.id); return; }
    if ((b = el.closest('[data-setsq]'))) { setA(p, p.team, b.dataset.setsq); render(); openAssign(st.id); return; }
    if ((b = el.closest('[data-to]'))) { const sq = S.settings.showAcad ? st.squad : '1'; closeSheet(); place(st.id, b.dataset.to, sq); return; }
    if (el.closest('[data-release]')) { closeSheet(); place(st.id, null, '1'); return; }
    if (el.closest('[data-backhome]')) { closeSheet(); place(st.id, p.team, p.squad); return; }
    if (el.closest('[data-retire]')) { setRetired(p, true); closeSheet(); render(); toast(`${p.name} 은퇴 처리`); return; }
    if (el.closest('[data-unretire]')) { setRetired(p, false); render(); openAssign(st.id); toast(`${p.name} 현역 복귀`); return; }
    return;
  }
  if (st && st.kind === 'settings') {
    const s = S.settings; let b;
    if ((b = el.closest('[data-theme-set]'))) { s.theme = b.dataset.themeSet; save(); applyLook(); openSettings(); return; }
    if ((b = el.closest('[data-lang]'))) { s.nameLang = b.dataset.lang; save(); render(); openSettings(); return; }
    if (el.closest('[data-font-reset]')) { s.font = 16; save(); applyLook(); openSettings(); return; }
    if ((b = el.closest('[data-ofav]'))) { s.fav[b.dataset.ofav] = !s.fav[b.dataset.ofav]; }
    else if ((b = el.closest('[data-ohide]'))) { s.hidden[b.dataset.ohide] = !s.hidden[b.dataset.ohide]; }
    else if ((b = el.closest('[data-oup]'))) { const i = +b.dataset.oup; [s.order[i - 1], s.order[i]] = [s.order[i], s.order[i - 1]]; }
    else if ((b = el.closest('[data-odn]'))) { const i = +b.dataset.odn; [s.order[i + 1], s.order[i]] = [s.order[i], s.order[i + 1]]; }
    else if (el.closest('[data-install]')) { install(); return; }
    else if (el.closest('[data-relock]')) {
      for (const p of PEOPLE) if (isLocked(p) && S.assign[p.id] && !S.assign[p.id].retired) delete S.assign[p.id];
      save(); render(); toast('계약 선수를 모두 원소속팀으로 돌렸습니다'); return;
    }
    else if (el.closest('[data-export]')) { showExport(); return; }
    else if (el.closest('[data-import]')) { showImport(); return; }
    else if (el.closest('[data-reset]')) { showReset(); return; }
    else if ((b = el.closest('[data-io-apply]'))) { doImport(); return; }
    else if ((b = el.closest('[data-io-copy]'))) { copyText($('#ioText').value, '복사했습니다'); return; }
    else if ((b = el.closest('[data-reset-yes]'))) {
      S = { settings: { ...DEFAULTS, fav: {}, hidden: {}, order: TEAMS.map(t => t.id) }, assign: {}, custom: [] };
      buildPeople(); save(); applyLook(); render(); closeSheet(); toast('초기화했습니다'); return;
    }
    else return;
    save(); $('#orderList').innerHTML = orderHTML(); render();
  }
}
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.opt) {
    S.settings[el.dataset.opt] = el.checked; save(); render();
    if (el.dataset.opt === 'unlockAll') toast(el.checked ? '계약 잠금 해제 — 모든 선수를 옮길 수 있어요' : '계약 잠금 — 계약 선수는 원소속팀에 고정됩니다');
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'sFont') { S.settings.font = +e.target.value; $('#sFontV').textContent = S.settings.font + 'px'; save(); applyLook(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function showExport() {
  const txt = JSON.stringify({ app: 'lck-stove-2027', v: D.DATA_VERSION, settings: S.settings, assign: S.assign, custom: S.custom });
  $('#ioBox').innerHTML = `<textarea id="ioText" readonly>${esc(txt)}</textarea><div class="row" style="margin-top:8px"><button class="btn" data-io-copy>복사</button><span class="note">다른 기기의 '불러오기'에 붙여넣으면 그대로 옮겨집니다.</span></div>`;
}
function showImport() {
  $('#ioBox').innerHTML = `<textarea id="ioText" placeholder="내보낸 텍스트를 붙여넣으세요"></textarea><div class="row" style="margin-top:8px"><button class="btn primary" data-io-apply>적용</button></div>`;
}
function doImport() {
  try {
    const o = JSON.parse($('#ioText').value);
    S = { settings: { ...DEFAULTS, ...(o.settings || {}) }, assign: o.assign || {}, custom: o.custom || [] };
    S.settings.order = [...new Set([...S.settings.order.filter(id => TM[id]), ...TEAMS.map(t => t.id)])];
    buildPeople(); save(); applyLook(); render(); closeSheet(); toast('불러왔습니다');
  } catch (err) { toast('형식이 올바르지 않습니다'); }
}
function showReset() {
  $('#ioBox').innerHTML = `<div class="row"><span class="note" style="color:var(--red)">배치, 추가한 선수, 설정이 모두 처음 상태로 돌아갑니다.</span><button class="btn danger" data-reset-yes>초기화</button></div>`;
}
async function copyText(txt, okMsg) {
  try { await navigator.clipboard.writeText(txt); toast(okMsg); }
  catch (err) {
    openSheet(`<div class="sheet-head"><div><div class="sheet-title">복사하기</div><div class="sheet-sub">자동 복사가 막혀 있어 직접 선택해 주세요</div></div>${closeBtn}</div><textarea readonly>${esc(txt)}</textarea>`);
    sheetState = { kind: 'copy' };
  }
}

/* 툴바 */
$('#tgCoach').addEventListener('change', e => { S.settings.showCoach = e.target.checked; save(); render(); });
$('#tgAcad').addEventListener('change', e => { S.settings.showAcad = e.target.checked; save(); render(); });
$('#bTheme').addEventListener('click', () => { S.settings.theme = S.settings.theme === 'light' ? 'dark' : 'light'; save(); applyLook(); });
$('#bStay').addEventListener('click', () => {
  for (const p of PEOPLE) if (p.role === 'player' && p.team && !isLocked(p) && !isRetired(p)) S.assign[p.id] = { team: p.team, squad: p.squad };
  save(); render(); toast('계약 만료 선수를 모두 원소속팀 잔류로 설정했습니다');
});
$('#bClear').addEventListener('click', () => {
  for (const p of PEOPLE) if (p.role === 'player' && !isLocked(p) && !(S.assign[p.id] && S.assign[p.id].retired)) delete S.assign[p.id];
  save(); render(); toast('계약 만료 선수를 모두 미정으로 돌렸습니다');
});
$('#bCopy').addEventListener('click', () => copyText(lineupText(), '라인업을 복사했습니다'));
$('#q').addEventListener('input', e => { filt.q = e.target.value.trim(); renderList(); });
$('#onlyFA').addEventListener('change', e => { filt.onlyFA = e.target.checked; renderList(); });
$('#onlyUndec').addEventListener('change', e => { filt.onlyUndec = e.target.checked; renderList(); });
$('#addf').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#addn').value.trim(); if (!n) return;
  const pos = $('#addp').value;
  S.custom.push({ id: 'cus-' + Date.now().toString(36), name: n, pos });
  if (pos === 'HC') S.settings.showCoach = true;
  buildPeople(); save(); $('#addn').value = ''; render();
  toast(`${n} 추가 — 명단 맨 아래 '무소속'에서 눌러 배치하세요`);
});

/* ================= 드래그 앤 드롭 (마우스) ================= */
let dragId = null;
document.addEventListener('dragstart', e => {
  const el = e.target.closest && e.target.closest('[data-pid]'); if (!el) return;
  dragId = el.dataset.pid; el.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', dragId); } catch (err) {}
  requestAnimationFrame(() => {
    document.querySelectorAll('.zone').forEach(z => z.classList.add('drop-ready'));
  });
});
document.addEventListener('dragend', () => {
  dragId = null;
  document.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging'));
  document.querySelectorAll('.zone').forEach(z => z.classList.remove('drop-ready', 'drop-over'));
  $('#roster').classList.remove('drop-over');
});
document.addEventListener('dragover', e => {
  if (!dragId) return;
  const z = e.target.closest('.zone'), r = e.target.closest('#roster');
  if (z || r) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
  document.querySelectorAll('.zone.drop-over').forEach(x => { if (x !== z) x.classList.remove('drop-over'); });
  if (z) z.classList.add('drop-over');
  $('#roster').classList.toggle('drop-over', !!r && canMove(byId(dragId)));
});
document.addEventListener('drop', e => {
  if (!dragId) return;
  const z = e.target.closest('.zone'), r = e.target.closest('#roster'), id = dragId;
  if (z) { e.preventDefault(); place(id, z.dataset.team, z.dataset.squad); }
  else if (r) { e.preventDefault(); if (canMove(byId(id))) place(id, null, '1'); }
});

/* ================= 앱 설치 (PWA) ================= */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
async function install() {
  const note = $('#installNote');
  if (deferredInstall) {
    deferredInstall.prompt();
    const r = await deferredInstall.userChoice.catch(() => null);
    deferredInstall = null;
    if (note) note.textContent = r && r.outcome === 'accepted' ? '설치했습니다. 홈 화면에서 실행하세요.' : '';
    return;
  }
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (note) note.innerHTML = ios
    ? 'Safari 하단의 공유 버튼 → <b>홈 화면에 추가</b>를 누르세요.'
    : '브라우저 메뉴(⋮)에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르세요. 주소가 https여야 설치할 수 있습니다.';
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

/* ================= 시작 ================= */
load(); buildPeople(); applyLook(); render();
})();
