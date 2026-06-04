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
    draft: { title: '', content: '', category: 'other', tags: [], tagCat: 'other' },
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

        var cats = (typeof TAG_CATEGORIES !== 'undefined') ? TAG_CATEGORIES : [{id:'other',icon:'\ud83d\udccc',name:'Overig',color:'#8a8a9a'}];

        var html = '';

        // Quick add form
        html += '<div class="qnotes-form">';
        html += '<input type="text" id="qnote-title" class="qnotes-input" placeholder="Titel..." value="' + (this.draft.title || '').replace(/"/g, '&quot;') + '">';
        html += '<textarea id="qnote-content" class="qnotes-textarea" placeholder="Schrijf iets...">' + (this.draft.content || '').replace(/</g, '&lt;') + '</textarea>';
        html += '<div class="qnotes-cats">';
        for (var i = 0; i < cats.length; i++) {
            var c = cats[i];
            var active = (this.draft.category === c.id) ? ' active' : '';
            html += '<button type="button" class="qnotes-cat' + active + '" data-action="qnote-cat" data-cat="' + c.id + '" style="--cat-color:' + c.color + '" title="' + c.name + '">' + c.icon + '</button>';
        }
        html += '</div>';

        // Tags with categories
        html += '<div class="qnotes-tags-section">';
        html += '<div class="qnotes-tags-list">';
        for (var ti = 0; ti < this.draft.tags.length; ti++) {
            var tagObj = this.draft.tags[ti];
            var tagCat = null;
            for (var tci = 0; tci < cats.length; tci++) { if (cats[tci].id === tagObj.category) { tagCat = cats[tci]; break; } }
            if (!tagCat) tagCat = cats[cats.length - 1];
            var safeText = tagObj.text.replace(/</g, '&lt;');
            html += '<span class="qnotes-tag-chip" style="--cat-color:' + tagCat.color + '">' + tagCat.icon + ' ' + safeText + '<button type="button" class="qnotes-tag-remove" data-action="qnote-remove-tag" data-tag-idx="' + ti + '" title="Verwijderen">&times;</button></span>';
        }
        html += '</div>';
        html += '<div class="qnotes-tag-add">';
        html += '<select class="qnotes-input qnotes-tag-cat" id="qnote-tag-cat">';
        for (var tci2 = 0; tci2 < cats.length; tci2++) {
            var sel = (this.draft.tagCat === cats[tci2].id) ? ' selected' : '';
            html += '<option value="' + cats[tci2].id + '"' + sel + '>' + cats[tci2].icon + ' ' + cats[tci2].name + '</option>';
        }
        html += '</select>';
        html += '<input type="text" class="qnotes-input qnotes-tag-text" id="qnote-tag-text" placeholder="Tag...">';
        html += '<button type="button" class="btn btn-ghost btn-sm qnotes-tag-add-btn" data-action="qnote-add-tag">+</button>';
        html += '</div>';
        html += '</div>';

        html += '<div class="qnotes-actions">';
        html += '<button class="btn btn-primary btn-sm qnotes-save" data-action="qnote-save">Opslaan</button>';
        html += '<a class="btn btn-ghost btn-sm" href="/notes">Alle notities</a>';
        html += '</div>';
        if (this.justSaved) {
            html += '<div class="qnotes-toast">Opgeslagen ✓</div>';
        }
        html += '</div>';

        // Recent notes
        if (recent.length > 0) {
            html += '<div class="qnotes-recent">';
            html += '<div class="qnotes-recent-label">Recent</div>';
            for (var ri = 0; ri < recent.length; ri++) {
                var n = recent[ri];
                var cat = null;
                for (var ci = 0; ci < cats.length; ci++) { if (cats[ci].id === n.tagCategory) { cat = cats[ci]; break; } }
                if (!cat) cat = cats[cats.length - 1];
                var safeTitle = (n.title || 'Zonder titel').replace(/</g, '&lt;');
                html += '<a class="qnotes-item" href="/notes/view-' + n.id + '" style="--cat-color:' + cat.color + '">';
                html += '<span class="qnotes-item-icon">' + cat.icon + '</span>';
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
        var tagCatEl = document.getElementById('qnote-tag-cat');
        var tagTextEl = document.getElementById('qnote-tag-text');
        if (titleEl) titleEl.addEventListener('input', function() { self.draft.title = this.value; });
        if (contentEl) contentEl.addEventListener('input', function() { self.draft.content = this.value; });
        if (tagCatEl) tagCatEl.addEventListener('change', function() { self.draft.tagCat = this.value; });
        if (tagTextEl) {
            tagTextEl.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); self.addTag(); }
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

    setCategory: function(cat) {
        this.draft.category = cat;
        this.render();
    },

    addTag: function() {
        var tagTextEl = document.getElementById('qnote-tag-text');
        var tagCatEl = document.getElementById('qnote-tag-cat');
        if (!tagTextEl) return;
        var txt = tagTextEl.value.trim();
        if (!txt) return;
        var cat = tagCatEl ? tagCatEl.value : (this.draft.tagCat || 'other');
        this.draft.tags.push({ text: txt, category: cat });
        this.draft.tagCat = cat;
        this.render();
        var newInput = document.getElementById('qnote-tag-text');
        if (newInput) newInput.focus();
    },

    removeTag: function(idx) {
        if (idx >= 0 && idx < this.draft.tags.length) {
            this.draft.tags.splice(idx, 1);
            this.render();
        }
    },

    save: function() {
        var titleEl = document.getElementById('qnote-title');
        var contentEl = document.getElementById('qnote-content');
        var title = titleEl ? titleEl.value.trim() : '';
        var content = contentEl ? contentEl.value : '';
        if (!title && !content.trim()) return;
        if (!title) title = content.trim().split('\n')[0].slice(0, 40);

        if (typeof getNotesData !== 'function' || typeof saveNotesData !== 'function') return;
        var data = getNotesData();
        var now = Date.now();
        var note = {
            id: 'n' + now,
            title: title,
            content: content,
            tags: this.draft.tags.slice(),
            tagCategory: this.draft.category || 'other',
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

        this.draft = { title: '', content: '', category: this.draft.category, tags: [], tagCat: this.draft.tagCat || 'other' };
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

        panel.innerHTML = html;
    }
};
