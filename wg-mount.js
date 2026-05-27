// ===== wg-mount.js — bootstrap: window-resize hook, all bind* calls, dash-tab handler, initial render + fetch sequence =====
// Extracted from index.html lines 4525-4604.
// WGI-M3: bootstrap is nu gewrapped in WidgetGridInit(). Auto-call gated door
// window.WIDGET_GRID_DEFER_INIT — standalone V8 (test-index.html) heeft de flag
// niet en boot dus auto. D&D Within zet de flag op true vóór de scripts laden
// en triggert init handmatig via WidgetGrid.mount() in M4.

function WidgetGridInit() {
  window.addEventListener('resize', () => {
    // Bij window-resize: responsive-scalen + columnPxWidths hercomputeren
    // (fontSize verandert mee, dus measureText geeft andere px-waardes).
    applyResponsive();
    applyResponsiveWidth();
    applyResponsiveHeight();
    recomputeAllWidgets();
    render();
    alignSidebarTop();
  });

  bindInputs();
  bindResponsiveInputs();
  bindStyleInputs();
  bindWidgetPanelInputs();
  bindTabs();
  bindSettingsToggles();
  bindExportWidget();
  // V11 Phase 3: right sidebar bindings
  bindRightSidebar();
  // V9: paginanavigatie + character-dropdown (characterSelect is now in right sidebar, binding stays)
  document.getElementById('characterSelect')?.addEventListener('change', (e) => selectCharacter(e.target.value));
  document.getElementById('pageNav')?.addEventListener('click', (e) => {
    const arrow = e.target.closest('[data-page-arrow]');
    if (arrow) { goToPage(state.currentPage + (arrow.dataset.pageArrow === 'next' ? 1 : -1)); return; }
    const dot = e.target.closest('[data-page-dot]');
    if (dot) goToPage(parseInt(dot.dataset.pageDot, 10));
  });
  bindSidebar();
  renderSidebar();
  applyStyle();

  // V11: situatie-tabs — volledig lifecycle met per-tab state.
  document.querySelectorAll('.dash-tab').forEach(t => {
    t.addEventListener('click', () => {
      const situation = t.dataset.situation;
      if (!situation) return;
      if (dragHandle) return; // drag-guard: ignore click during active drag
      if (situation === state.activeSituation) return; // already active, no-op
      // lazy-init the target situation slot
      ensureSituation(state.device, situation);
      state.activeSituation = situation;
      clearSelection();
      // toggle active class on tabs
      document.querySelectorAll('.dash-tab').forEach(o => o.classList.toggle('active', o === t));
      // render the new tab
      recomputeAllWidgets();
      render();
      renderSidebar();
      alignSidebarTop();
      // map-data: fetch if new tab has map widgets and cache is empty
      if (state.widgets.some(w => widgetKind(w) === 'map') && !WG_MAPS_CACHE) fetchMapsData();
      // pulse sidebar if tab is empty (feedback to user)
      if (!state.widgets.length) pulseSidebar();
    });
  });
  // V11: set initial device class before any render
  state.device = currentDevice();
  // ensure the initial situation slot exists
  ensureSituation(state.device, state.activeSituation);
  // V9: responsive eerst (zet dashTile/dashMinSpacing op de viewport-waarden),
  // PAS DAARNA setDevView/render — anders normaliseert de eerste render op
  // verkeerde tpp/rpp en krimpen spans onterecht.
  applyResponsive();
  applyResponsiveWidth();
  applyResponsiveHeight();
  setDevView(state.config.devView);
  setShowDashboardInfo(state.config.showDashboardInfo);
  render();
  // V9: één dashboard-brede character + lijst voor de dropdown.
  renderCharacterSelect();          // init met huidige id alvast
  fetchCharacterList();              // populeer dropdown async
  fetchCharacterData(state.characterId);
  // V11 Phase 2: load dashboards from Firebase on boot
  loadDashboards(state.characterId);
  // V11: pulse sidebar on initial open as onboarding hint (overridden if dashboards load)
  pulseSidebar();
  // Lijn de bovenste category-knop uit op de canvas-top.
  alignSidebarTop();
}

// Expose for D&D Within mount-API (M4 will call this from app.js postRenderEffects).
if (typeof window !== 'undefined') {
  window.WidgetGridInit = WidgetGridInit;
}

// Auto-boot unless deferred (standalone V8 = auto; D&D Within = deferred).
if (typeof window === 'undefined' || !window.WIDGET_GRID_DEFER_INIT) {
  WidgetGridInit();
}
