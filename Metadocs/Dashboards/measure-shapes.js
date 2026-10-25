// Fitted-shape measurement harness — runs INSIDE the app (browser), on any
// character page, at the device whose grid you want to measure (tablet: a
// portrait viewport 700–1023 px wide; desktop: ≥ 1280 px).
//
//   const json = await wgMeasureShapes();          // all party members
//   → save as Metadocs/Dashboards/fitted-shapes-<device>.json
//
// For every character × widget type it builds the widget off-screen with the
// app's own code (rows, measured box size, padding), then lists the fitted
// shapes [wTiles, hTiles, boxesPerRow, boxRows]: per boxes-per-row the
// narrowest width and the exact height. Tiles are taken at the MINIMUM pitch
// (tile + min spacing), so a shape that fits here fits on every screen of that
// device class. GROWTH adds headroom for content that grows with level
// (spells, features, resources) so a level-up does not immediately overflow.
(function () {
  const TYPES = ['abilityScores', 'skills', 'basicInfo', 'hpBase', 'longRest', 'savingThrows', 'conditions',
    'preparedSpells', 'spellSlots', 'levelUp', 'classResource', 'featureList', 'featuresActive', 'featuresPassive',
    'inventory', 'attacks', 'turnActions'];
  // Extra boxes on top of today's count, and a width factor for list widgets
  // whose longest name can change.
  const GROWTH = {
    preparedSpells: { add: 2, wide: 1.08 }, featureList: { add: 2, wide: 1.08 },
    featuresActive: { add: 1, wide: 1.08 }, featuresPassive: { add: 1, wide: 1.08 },
    classResource: { add: 1, wide: 1.08 }, spellSlots: { add: 1 }, attacks: { add: 1, wide: 1.08 },
    turnActions: { add: 1 }, inventory: { add: 3 },
  };

  function measureType(type, maxCols, maxRows) {
    const w = widgetFromSaved({ type, globalCol: 0, startRowIdx: 0, spanUnits: 6, spanUnitsY: 6 });
    state.widgets.push(w);
    try {
      return withWidget(w, () => {
        const kind = widgetKind(w);
        const g = GROWTH[type] || {};
        const { dashTile: tile, dashMinSpacing: sp } = state.config;
        const px = s => s * tile + (s - 1) * sp;
        const contentH = s => { w.spanUnitsY = s; return widgetContentPxHFor(s); };
        if (kind === 'inventory') {
          const n = invItemsForChar().length + (g.add || 0);
          const pad = w.cfg.widgetPadding ?? 6, boxMin = w.cfg.boxMinPx || 138;
          const shapes = [], seen = new Set();
          for (let s = 1; s <= maxCols; s++) {
            const perRow = Math.max(1, Math.floor((px(s) - 2 * pad + INV_FIT.gapPx) / (boxMin + INV_FIT.gapPx)));
            if (px(s) - 2 * pad < boxMin || seen.has(perRow)) continue;
            seen.add(perRow);
            const rows = Math.ceil(Math.max(n, 1) / perRow);
            const need = INV_FIT.headPx + 2 * pad + INV_FIT.summaryPx + rows * INV_FIT.textRowPx + (rows - 1) * INV_FIT.gapPx;
            w.spanUnits = s;
            let h = INV_FIT.minSpanY; while (h <= maxRows && contentH(h) < need) h++;
            if (h <= maxRows) shapes.push([s, h, perRow, rows]);
          }
          return { count: n, box: [boxMin, INV_FIT.textRowPx], shapes };
        }
        if (kind !== 'infobox') return null;
        buildRowsFromSource(w);
        recomputeDataLayout();
        const real = w.data.rows.length;
        if (!real) return { count: 0, box: [0, 0], shapes: [] };
        const count = real + (g.add || 0);
        const boxW = Math.ceil(w.layout.boxPxW * (g.wide || 1)), boxH = w.layout.boxPxH;
        const pad = w.cfg.widgetPadding || 0, gap = w.cfg.infoBoxSpacing || 0;
        const shapes = [], seen = new Set();
        for (let n = 1; n <= count; n++) {
          const rows = Math.ceil(count / n), perRow = Math.ceil(count / rows);
          if (seen.has(rows)) continue;
          let s = 1; while (s <= maxCols && fitCount(px(s), boxW, pad, gap) < perRow) s++;
          if (s > maxCols) break;
          seen.add(rows);
          w.spanUnits = s;
          const need = rows * boxH + 2 * pad + (rows - 1) * gap;
          let h = 1; while (h <= maxRows && contentH(h) < need) h++;   // contentH includes the (1- or 2-line) title bar
          if (h <= maxRows) shapes.push([s, h, perRow, rows]);
        }
        return { count: real, grow: g.add || 0, box: [boxW, boxH], shapes };
      });
    } finally {
      state.widgets.splice(state.widgets.indexOf(w), 1);
    }
  }

  window.wgMeasureShapes = async function ({ chars, maxCols = 26, maxRows = 40 } = {}) {
    const ids = chars || Object.keys(WG_DEFAULT_LAYOUTS).filter(id => !id.startsWith('_'));
    const prevChar = state.characterId;
    // Load first: fetchCharacterData renders, which must not happen while the
    // layout below is swapped out (999 tiles → a frozen page).
    for (const id of ids) await fetchCharacterData(id);
    // Minimum pitch: spacing = dashMinSpacing on both axes.
    const realH = dashLayout, realV = dashVLayout;
    const minLayout = () => ({ tileCount: 999, spacing: state.config.dashMinSpacing, valid: true });
    dashLayout = minLayout; dashVLayout = minLayout;
    const out = { device: state.device, tile: state.config.dashTile, minSpacing: state.config.dashMinSpacing,
      fontSize: state.config.fontSize, tpp: realH().tileCount, rows: realV().tileCount,
      vw: innerWidth, vh: innerHeight, measured: new Date().toISOString().slice(0, 10), chars: {} };
    try {
      for (const id of ids) {
        state.characterId = id;
        const res = {};
        for (const t of TYPES) { const m = measureType(t, maxCols, maxRows); if (m) res[t] = m; }
        out.chars[id] = res;
      }
    } finally {
      dashLayout = realH; dashVLayout = realV;
      state.characterId = prevChar;
      render();
    }
    return out;
  };
})();
