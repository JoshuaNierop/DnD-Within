// ===== wg-mobile.js — phone mode for the widget-grid dashboards =====
// On phones (< 700px, DWMobile in mobile.js) the free-form canvas becomes one
// column: every widget spans the full width, heights follow the content, the
// font is larger and the situation tabs are swipeable screens. The layout is
// derived from the DESKTOP dashboard each time it loads and is never saved —
// the desktop stays the place where players arrange widgets; the phone
// mirrors it. Hooks: wg-state.js applyResponsive (config), wg-render.js
// render (layout + after-render), wg-firebase.js loadDashboards/saveDashboards,
// wg-events.js onPointerDown (no select/drag gestures on phones).

function wgMobileActive() {
  if (typeof DWMobile !== 'undefined' && DWMobile && DWMobile.isMobile) return DWMobile.isMobile();
  return window.innerWidth < WG_BP_MOBILE;
}

// Phone grid: small tiles so a full-width widget is 15+ units wide, roomier
// spacing between the stacked cards, and a readable font.
const WG_MOBILE_CFG = { dashTile: 20, dashMinSpacing: 8, fontSize: 13 };
function wgMobileApplyConfig() { Object.assign(state.config, WG_MOBILE_CFG); }

// Fallback per tab when the desktop has nothing there (phone-only players).
const WG_MOBILE_DEFAULTS = {
  character: {
    character: ['hpBase', 'abilityScores', 'savingThrows', 'skills', 'classResource', 'featuresActive', 'featuresPassive', 'basicInfo', 'profilePicture'],
    social:    ['basicInfo'],
    exploring: ['map', 'skills'],
    combat:    ['hpBase', 'conditions', 'turnActions', 'attacks', 'spellSlots', 'preparedSpells', 'classResource'],
    inventory: ['inventory'],
  },
  dm: { social: [], exploring: ['map'], combat: ['combatTracker'], ambient: [] },
};
// Reading order on the phone: HP first (what you touch most at the table),
// the portrait last (a full-width hero image shouldn't eat the first screen).
const WG_MOBILE_FIRST = ['hpBase'];
const WG_MOBILE_LAST  = ['profilePicture'];

// Build the mobile slots from the desktop (or tablet) slots. Called after
// loadDashboards filled state.dashboardsByDevice, and when the device class
// flips to 'mobile' at runtime.
function wgMobileDeriveAll() {
  const ctx = state.context === 'dm' ? 'dm' : 'character';
  for (const sit of wgSituations()) {
    const slot = makeSituationState();
    const desk = state.dashboardsByDevice.desktop[sit];
    const tab  = state.dashboardsByDevice.tablet[sit];
    const src = (desk && desk.widgets && desk.widgets.length) ? desk.widgets
              : ((tab && tab.widgets && tab.widgets.length) ? tab.widgets : null);
    let list;
    if (src) {
      // Column-major reading order of the desktop layout — page-safe without
      // knowing how wide the desktop page was.
      list = src.slice()
        .sort((a, b) => (a.globalCol - b.globalCol) || (a.startRowIdx - b.startRowIdx))
        .map(serializeWidget);
      slot.derived = 'desktop';
    } else {
      list = ((WG_MOBILE_DEFAULTS[ctx] || {})[sit] || []).map(type => ({ type }));
      slot.derived = list.length ? 'default' : 'empty';
    }
    // Legacy/unknown widget types would render as Ability Scores — skip them here.
    list = list.filter(s => WG_WIDGET_TYPES[s.type]);
    const rank = s => WG_MOBILE_FIRST.indexOf(s.type) >= 0 ? 0 : (WG_MOBILE_LAST.indexOf(s.type) >= 0 ? 2 : 1);
    list = list.map((s, i) => ({ s, i }))
      .sort((a, b) => (rank(a.s) - rank(b.s)) || (a.i - b.i))
      .map(o => o.s);
    slot.widgets = list.map(widgetFromSaved);
    state.dashboardsByDevice.mobile[sit] = slot;
  }
}

// One column: every widget full width at the top of the previous one; height
// follows the content (info boxes reflow to the new width). Replaces the
// normalize/collision/page pipeline of render() on phones.
function wgMobileLayout() {
  const tile = state.config.dashTile;
  const sp   = state.config.dashMinSpacing;
  // Provisional tall dashboard so rowsPerPage() never caps the content fit.
  state.dashboard.height = 100000;
  const tpp = Math.max(1, tilesPerPage());
  const prev = state.activeWidgetIdx;
  let row = 0;
  for (let i = 0; i < state.widgets.length; i++) {
    const w = state.widgets[i];
    w.globalCol = 0;
    w.spanUnits = tpp;
    w.startRowIdx = row;
    state.activeWidgetIdx = i;
    const kind = widgetKind(w);
    if (kind === 'map')        w.spanUnitsY = Math.max(6, Math.round(tpp * 0.72));
    else if (kind === 'image') w.spanUnitsY = Math.max(6, tpp);
    else compactSpanUnitsY(false);
    if (!(w.spanUnitsY >= 1)) w.spanUnitsY = 1;
    row += w.spanUnitsY;
  }
  state.activeWidgetIdx = prev;
  // Exact height → flexLayout keeps the spacing at dashMinSpacing.
  state.dashboard.height = row > 0 ? row * (tile + sp) + sp : tile + 2 * sp;
  state.currentPage = 0;
}

// Empty-tab message under the canvas (the desktop pulses the sidebar instead).
function wgMobileAfterRender() {
  const wrap = document.querySelector('.character-page .canvas-wrap');
  if (!wrap) return;
  let box = wrap.querySelector('.wgm-empty');
  const slot = state.dashboardsByDevice.mobile[state.activeSituation];
  const derived = slot && slot.derived;
  if (state.widgets.length || !derived) {
    if (box) box.remove();
    return;
  }
  if (!box) {
    box = document.createElement('div');
    box.className = 'wgm-empty';
    wrap.appendChild(box);
  }
  const tabName = state.activeSituation.charAt(0).toUpperCase() + state.activeSituation.slice(1);
  box.innerHTML = '<strong>' + tabName + '</strong>Nothing on this tab yet. Add widgets to it on a desktop — your phone shows the same ones, stacked.';
}

// ---- Swipe between situations ----
function wgMobileSwitchSituation(dir) {
  const tabs = Array.prototype.slice.call(document.querySelectorAll('.character-page .dash-tab'));
  const cur = tabs.findIndex(t => t.classList.contains('active'));
  const next = cur + dir;
  const wrap = document.querySelector('.character-page .canvas-wrap');
  if (next < 0 || next >= tabs.length) {
    if (wrap) { wrap.classList.remove('wgm-bounce'); void wrap.offsetWidth; wrap.classList.add('wgm-bounce'); }
    return;
  }
  try { if (navigator.vibrate) navigator.vibrate(6); } catch (e) {}
  const outCls = dir > 0 ? 'wgm-out-left' : 'wgm-out-right';
  const inCls  = dir > 0 ? 'wgm-in-right' : 'wgm-in-left';
  const go = () => {
    tabs[next].click();   // the regular tab handler renders the new situation
    wgMobileRevealTab(tabs[next]);
    const pane = document.querySelector('.character-page .wg-main-scroll');
    if (pane) pane.scrollTop = 0;
    const w2 = document.querySelector('.character-page .canvas-wrap');
    if (!w2) return;
    w2.classList.remove('wgm-out-left', 'wgm-out-right', 'wgm-in-left', 'wgm-in-right');
    void w2.offsetWidth;
    w2.classList.add(inCls);
    w2.addEventListener('animationend', () => w2.classList.remove(inCls), { once: true });
  };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!wrap || reduce) { go(); return; }
  wrap.classList.add(outCls);
  let done = false;
  const fin = () => { if (done) return; done = true; wrap.classList.remove(outCls); go(); };
  wrap.addEventListener('animationend', fin, { once: true });
  setTimeout(fin, 220);
}

function wgMobileRevealTab(tab) {
  if (!tab || !tab.scrollIntoView) return;
  try { tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) {}
}

(function wgMobileBindSwipe() {
  let sw = null;
  document.addEventListener('pointerdown', (e) => {
    sw = null;
    if (!wgMobileActive() || e.pointerType === 'mouse') return;
    const pane = e.target.closest && e.target.closest('.character-page .wg-main-scroll');
    if (!pane) return;
    // Inputs and HTML widgets (combat tracker, inventory) keep their own gestures.
    if (e.target.closest('foreignObject, input, textarea, select, button, .wg-tooltip')) return;
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId, done: false };
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (!sw || sw.done || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { sw.done = true; return; }   // vertical scroll wins
    if (Math.abs(dx) > 56 && Math.abs(dx) > 1.8 * Math.abs(dy)) {
      sw.done = true;
      wgMobileSwitchSituation(dx < 0 ? 1 : -1);
    }
  }, true);
  const end = () => { sw = null; };
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);
  // A tapped tab scrolls itself into the middle of the strip.
  document.addEventListener('click', (e) => {
    if (!wgMobileActive()) return;
    const tab = e.target.closest && e.target.closest('.character-page .dash-tab');
    if (tab) setTimeout(() => wgMobileRevealTab(tab), 0);
  });
})();
