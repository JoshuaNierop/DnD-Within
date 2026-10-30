// ============================================================
// D&D Within — Visual Effects Engine
// ============================================================

// === Portrait Glow Ring ===
// Rotating conic-gradient with tapered thickness. Pure CSS via class.
var GlowRing = {
    apply: function(portraitWrap, color) {
        if (!portraitWrap) return;
        portraitWrap.style.setProperty('--ring-color', color || 'var(--accent)');
        portraitWrap.classList.add('glow-ring');
    },
    remove: function(portraitWrap) {
        if (!portraitWrap) return;
        portraitWrap.classList.remove('glow-ring');
    }
};

// === Auto-growing textarea ===
function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Grow every .auto-grow textarea inside `root` (default document) so existing
// content fits without a scrollbar — call after rendering/opening an editor.
function autoGrowAll(root) {
    var scope = root || document;
    var tas = scope.querySelectorAll ? scope.querySelectorAll('textarea.auto-grow') : [];
    for (var i = 0; i < tas.length; i++) autoGrowTextarea(tas[i]);
}

// === Quick Notes Panel ===
// Small floating panel (mirror of DiceHand) — lets user drop a quick note from any page
var QuickNotes = {
    draft: { title: '', content: '', mentions: [] },
    justSaved: false,

    render: function() {
        var panel = document.getElementById('notes-panel-content');
        if (!panel) return;
        if (typeof getNotesData !== 'function') {
            panel.innerHTML = '<p class="text-dim" style="text-align:center;padding:0.5rem;">Notes unavailable</p>';
            return;
        }

        var data = getNotesData();
        var notes = (data.notes || []).slice();
        notes.sort(function(a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return (b.updated || 0) - (a.updated || 0);
        });
        var recent = notes.slice(0, 4);

        var html = '';

        // Quick add form
        html += '<div class="qnotes-form">';
        html += '<input type="text" id="qnote-title" class="qnotes-input" placeholder="Title..." value="' + (this.draft.title || '').replace(/"/g, '&quot;') + '">';
        html += '<textarea id="qnote-content" class="qnotes-textarea" placeholder="Write something...">' + (this.draft.content || '').replace(/</g, '&lt;') + '</textarea>';

        html += '<div class="qnotes-actions">';
        html += '<button class="btn btn-primary btn-sm qnotes-save" data-action="qnote-save">Save</button>';
        html += '<a class="btn btn-ghost btn-sm" href="/notes">All notes</a>';
        html += '</div>';
        if (this.justSaved) {
            html += '<div class="qnotes-toast">Saved ✓</div>';
        }
        html += '</div>';

        // Recent notes
        if (recent.length > 0) {
            html += '<div class="qnotes-recent">';
            html += '<div class="qnotes-recent-label">Recent</div>';
            for (var ri = 0; ri < recent.length; ri++) {
                var n = recent[ri];
                var safeTitle = (n.title || 'Untitled').replace(/</g, '&lt;');
                html += '<a class="qnotes-item" href="/notes/view-' + n.id + '" style="--cat-color:var(--accent)">';
                html += '<span class="qnotes-item-icon">📝</span>';
                html += '<span class="qnotes-item-title">' + safeTitle + '</span>';
                html += '</a>';
            }
            html += '</div>';
        }

        panel.innerHTML = html;

        // Wire live draft updates so content persists while typing even across re-renders
        var self = this;
        var titleEl = document.getElementById('qnote-title');
        var contentEl = document.getElementById('qnote-content');
        if (titleEl) titleEl.addEventListener('input', function() { self.draft.title = this.value; });
        if (contentEl) {
            // Restore the @-mention id→name map so it survives panel re-renders;
            // the mentions.js autocomplete reads/writes data-mentions on this field.
            contentEl.dataset.mentions = JSON.stringify(self.draft.mentions || []);
            contentEl.addEventListener('input', function() {
                self.draft.content = this.value;
                try { self.draft.mentions = JSON.parse(this.dataset.mentions || '[]'); } catch (_) {}
            });
        }

        if (this.justSaved) {
            this.justSaved = false;
            setTimeout(function() {
                var toast = panel.querySelector('.qnotes-toast');
                if (toast) toast.classList.add('fade');
            }, 50);
        }
    },

    save: function() {
        var titleEl = document.getElementById('qnote-title');
        var contentEl = document.getElementById('qnote-content');
        var title = titleEl ? titleEl.value.trim() : '';
        // Expand "@Name" mentions into canonical [[type:id|Name]] tokens so they
        // render as clickable links on the notes page (renderRichText).
        var content = contentEl
            ? ((typeof mentionsFieldToTokens === 'function') ? mentionsFieldToTokens(contentEl) : contentEl.value)
            : '';
        if (!title && !content.trim()) return;
        // Fallback title from the visible text (with "@Name", not raw tokens).
        if (!title) {
            var display = contentEl ? contentEl.value : content;
            title = display.trim().split('\n')[0].slice(0, 40);
        }

        if (typeof getNotesData !== 'function' || typeof saveNotesData !== 'function') return;
        var data = getNotesData();
        var now = Date.now();
        var note = {
            id: 'n' + now,
            title: title,
            content: content,
            layout: 'text-only',
            image: null,
            images: [],
            checklist: [],
            created: now,
            updated: now,
            pinned: false
        };
        data.notes = data.notes || [];
        data.notes.push(note);
        saveNotesData(data);

        this.draft = { title: '', content: '', mentions: [] };
        this.justSaved = true;
        this.render();
    }
};

// === Dice Hand System ===
var DiceHand = {
    hand: [],      // dice in hand: [{die: 20}, {die: 6}, ...]
    lastHand: [],  // remembers last rolled set for re-rolling
    results: null,  // null = not rolled, [{die:20, value:15}, ...]

    add: function(die) {
        this.hand.push({ die: die });
        this.results = null;
        this.render();
    },

    remove: function(idx) {
        this.hand.splice(idx, 1);
        this.results = null;
        this.render();
    },

    removeResult: function(idx) {
        if (!this.results) return;
        this.hand.push({ die: this.results[idx].die });
        this.results.splice(idx, 1);
        if (this.results.length === 0) this.results = null;
        this.render();
    },

    reset: function() {
        this.hand = [];
        this.lastHand = [];
        this.results = null;
        this.render();
    },

    roll: function() {
        var source = this.hand.length > 0 ? this.hand : this.lastHand;
        if (source.length === 0) return;
        this.lastHand = source.slice();
        this.results = [];
        for (var i = 0; i < source.length; i++) {
            var die = source[i].die;
            this.results.push({ die: die, value: Math.floor(Math.random() * die) + 1 });
        }
        this.hand = [];
        this.render();
        if (typeof DiceLog !== 'undefined') DiceLog.post(this.results);
    },

    getTotal: function() {
        if (!this.results) return 0;
        var t = 0;
        for (var i = 0; i < this.results.length; i++) t += this.results[i].value;
        return t;
    },

    render: function() {
        var panel = document.getElementById('dice-panel-content');
        if (!panel) return;

        var html = '';

        // Top area — grows upward with results/hand/actions (stays anchored above fixed pool)
        html += '<div class="dice-top">';

        // Results (topmost)
        if (this.results && this.results.length > 0) {
            var total = this.getTotal();
            html += '<div class="dice-results">';
            html += '<div class="dice-total">' + total + '</div>';
            html += '<div class="dice-result-chips">';
            for (var i = 0; i < this.results.length; i++) {
                var r = this.results[i];
                var isMax = r.value === r.die;
                var isMin = r.value === 1;
                html += '<span class="dice-result-chip' + (isMax ? ' max' : '') + (isMin ? ' min' : '') + '" data-action="dice-remove-result" data-idx="' + i + '" title="Click to return to pool">';
                html += 'd' + r.die + ': <b>' + r.value + '</b>';
                html += '</span>';
            }
            html += '</div>';
            html += '</div>';
        }

        // Hand chips
        if (this.hand.length > 0) {
            html += '<div class="dice-hand">';
            html += '<span class="dice-hand-label">Hand:</span>';
            for (var i = 0; i < this.hand.length; i++) {
                html += '<span class="dice-chip" data-action="dice-remove-hand" data-idx="' + i + '">d' + this.hand[i].die + '</span>';
            }
            html += '</div>';
        }

        // Empty state hint
        if (this.hand.length === 0 && !this.results) {
            html += '<p class="text-dim dice-empty-hint">Click dice below to add to hand</p>';
        }

        html += '</div>'; // /.dice-top

        // Bottom area — fixed: pool + roll/reset. Stays anchored so buttons never shift.
        html += '<div class="dice-bottom">';

        // Pool buttons
        html += '<div class="dice-pool">';
        var dice = [4, 6, 8, 10, 12, 20, 100];
        for (var i = 0; i < dice.length; i++) {
            html += '<button class="dice-pool-btn" data-action="dice-add" data-die="' + dice[i] + '">d' + dice[i] + '</button>';
        }
        html += '</div>';

        // Actions row — always present so layout is stable
        var hasRollable = this.hand.length > 0;
        var hasReset = this.hand.length > 0 || (this.results && this.results.length > 0);
        var canReroll = !hasRollable && this.results && this.lastHand && this.lastHand.length > 0;
        var rollLabel = hasRollable
            ? 'Roll (' + this.hand.length + ')'
            : (canReroll ? 'Re-roll' : 'Roll');
        var rollDisabled = !hasRollable && !canReroll ? ' disabled' : '';
        html += '<div class="dice-hand-actions">';
        html += '<button class="btn btn-primary btn-sm dice-roll-btn" data-action="dice-roll-hand"' + rollDisabled + '>' + rollLabel + '</button>';
        html += '<button class="btn btn-ghost btn-sm dice-reset-btn" data-action="dice-reset"' + (hasReset ? '' : ' disabled') + '>Reset</button>';
        html += '</div>';

        html += '</div>'; // /.dice-bottom

        if (typeof DiceLog !== 'undefined') html += DiceLog.html();

        panel.innerHTML = html;
        if (typeof DiceLog !== 'undefined') DiceLog.bind(panel);
    }
};

// === Shared dice log ===
// Rolls from the dice panel go to dw/rolls/<campaign>/<pushId> so the whole
// table sees them. The panel polls the last entries while it is open.
var DiceLog = {
    entries: [],
    timer: null,
    LIMIT: 25,

    isShared: function() {
        try { return localStorage.getItem('dw_dice_share') !== 'false'; } catch (e) { return true; }
    },
    setShared: function(on) {
        try { localStorage.setItem('dw_dice_share', on ? 'true' : 'false'); } catch (e) {}
    },
    url: function(suffix) {
        var camp = (typeof getActiveCampaign === 'function') ? getActiveCampaign() : 'valoria';
        return FIREBASE_DB + '/dw/rolls/' + encodeURIComponent(camp) + '.json' + (suffix || '');
    },
    rollerName: function() {
        if (typeof isDMMode === 'function' && isDMMode()) return 'DM';
        var uid = (typeof currentUserId === 'function') ? currentUserId() : null;
        var u = uid && typeof getUserData === 'function' ? getUserData(uid) : null;
        var charId = u && u.characters && u.characters[0];
        var cfg = charId && typeof loadCharConfig === 'function' ? loadCharConfig(charId) : null;
        return (cfg && cfg.name) || (u && u.name) || uid || 'Someone';
    },

    post: function(results) {
        if (!this.isShared() || !results || !results.length || typeof FIREBASE_DB === 'undefined') return;
        var counts = {};
        results.forEach(function(r) { counts[r.die] = (counts[r.die] || 0) + 1; });
        var dice = Object.keys(counts).sort(function(a, b) { return b - a; }).map(function(d) { return counts[d] + 'd' + d; }).join(' + ');
        var total = results.reduce(function(a, r) { return a + r.value; }, 0);
        var entry = {
            by: (typeof currentUserId === 'function' && currentUserId()) || 'guest',
            name: this.rollerName(),
            dice: dice,
            values: results.map(function(r) { return r.value; }),
            total: total,
            at: Date.now()
        };
        var self = this;
        this.entries.push(Object.assign({ id: 'local' + entry.at }, entry));
        this.renderList();
        var send = function() {
            return fetch(dwAuthUrl(self.url()), { method: 'POST', body: JSON.stringify(entry), headers: { 'Content-Type': 'application/json' } });
        };
        (typeof dwRefreshIdToken === 'function' ? dwRefreshIdToken().catch(function() {}) : Promise.resolve())
            .then(send)
            .then(function(res) { if (!res.ok) throw new Error('HTTP ' + res.status); return self.fetch(); })
            .catch(function() { if (typeof showToast === 'function') showToast('Could not share the roll', 'error'); });
    },

    fetch: function() {
        var self = this;
        if (typeof FIREBASE_DB === 'undefined') return Promise.resolve();
        return fetch(dwAuthUrl(this.url('?orderBy=%22$key%22&limitToLast=' + this.LIMIT)))
            .then(function(res) { return res.ok ? res.json() : null; })
            .then(function(data) {
                if (!data) return;
                self.entries = Object.keys(data).sort().map(function(k) { return Object.assign({ id: k }, data[k]); });
                self.renderList();
            })
            .catch(function() {});
    },

    start: function() {
        if (this.timer) return;
        var self = this;
        this.fetch();
        this.timer = setInterval(function() {
            var panel = document.getElementById('dice-panel');
            if (!panel || panel.style.display === 'none' || document.hidden) { if (!panel || panel.style.display === 'none') self.stop(); return; }
            self.fetch();
        }, 4000);
    },
    stop: function() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
    },

    timeLabel: function(ms) {
        var d = new Date(ms);
        var sameDay = new Date().toDateString() === d.toDateString();
        var hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
        return sameDay ? hm : (d.getDate() + '/' + (d.getMonth() + 1) + ' ' + hm);
    },

    html: function() {
        var h = '<div class="dice-log">';
        h += '<div class="dice-log-head"><span>Party rolls</span>';
        h += '<label class="dice-log-share" title="Send your rolls to the party log"><input type="checkbox" data-dice-share' + (this.isShared() ? ' checked' : '') + '> Share mine</label></div>';
        h += '<div class="dice-log-list" id="dice-log-list"></div>';
        h += '</div>';
        return h;
    },
    renderList: function() {
        var list = document.getElementById('dice-log-list');
        if (!list) return;
        if (!this.entries.length) { list.innerHTML = '<p class="text-dim dice-log-empty">No rolls yet</p>'; return; }
        var self = this;
        list.innerHTML = this.entries.slice().reverse().map(function(e) {
            var vals = Array.isArray(e.values) && e.values.length > 1 ? ' <span class="dice-log-vals">(' + e.values.map(Number).join(', ') + ')</span>' : '';
            return '<div class="dice-log-row"><span class="dice-log-who">' + escapeHtml(String(e.name || '?')) + '</span>' +
                '<span class="dice-log-dice">' + escapeHtml(String(e.dice || '')) + vals + '</span>' +
                '<b class="dice-log-total">' + escapeHtml(String(e.total)) + '</b>' +
                '<span class="dice-log-time">' + self.timeLabel(e.at || 0) + '</span></div>';
        }).join('');
    },
    bind: function(panel) {
        var self = this;
        var box = panel.querySelector('[data-dice-share]');
        if (box) box.addEventListener('change', function() { self.setShared(box.checked); });
        this.renderList();
        this.start();
    }
};
