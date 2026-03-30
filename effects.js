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

// === Dice Hand System ===
var DiceHand = {
    hand: [],      // dice in hand: [{die: 20}, {die: 6}, ...]
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
        this.results = null;
        this.render();
    },

    roll: function() {
        if (this.hand.length === 0) return;
        this.results = [];
        for (var i = 0; i < this.hand.length; i++) {
            var die = this.hand[i].die;
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

        // Pool buttons
        html += '<div class="dice-pool">';
        var dice = [4, 6, 8, 10, 12, 20, 100];
        for (var i = 0; i < dice.length; i++) {
            html += '<button class="dice-pool-btn" data-action="dice-add" data-die="' + dice[i] + '">d' + dice[i] + '</button>';
        }
        html += '</div>';

        // Hand
        if (this.hand.length > 0) {
            html += '<div class="dice-hand">';
            html += '<span class="dice-hand-label">Hand:</span>';
            for (var i = 0; i < this.hand.length; i++) {
                html += '<span class="dice-chip" data-action="dice-remove-hand" data-idx="' + i + '">d' + this.hand[i].die + '</span>';
            }
            html += '</div>';
            html += '<div class="dice-hand-actions">';
            html += '<button class="btn btn-primary btn-sm" data-action="dice-roll-hand">Roll (' + this.hand.length + ')</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="dice-reset">Reset</button>';
            html += '</div>';
        }

        // Results
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
            html += '</div></div>';
        }

        if (this.hand.length === 0 && !this.results) {
            html += '<p class="text-dim" style="text-align:center;font-size:0.8rem;margin-top:0.5rem;">Click dice to add to hand</p>';
        }

        panel.innerHTML = html;
    }
};
