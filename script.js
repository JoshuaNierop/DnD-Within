// Floating particles
(function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const isRen = document.body.classList.contains('page-ren');
    const isSaya = document.body.classList.contains('page-saya');

    const colors = isRen
        ? ['#22d3ee', '#0891b2', '#67e8f9']
        : isSaya
        ? ['#f472b6', '#db2777', '#f9a8d4']
        : ['#22d3ee', '#f472b6', '#f0c040'];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];

        Object.assign(particle.style, {
            width: size + 'px',
            height: size + 'px',
            background: color,
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animationDelay: Math.random() * 8 + 's',
            animationDuration: (Math.random() * 6 + 5) + 's',
            boxShadow: `0 0 ${size * 3}px ${color}`
        });

        container.appendChild(particle);
    }
})();
