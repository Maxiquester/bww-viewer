const statusEl = document.getElementById('status');

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab === 'sheet' ? 'tabSheet' : 'tabSource';
        document.getElementById(target).classList.add('active');
    });
});

async function main() {
    const params = new URLSearchParams(location.search);
    const src = params.get('src');

    if (!src) {
        statusEl.textContent = 'Keine BWW-Datei angegeben.';
        statusEl.classList.add('error');
        return;
    }

    statusEl.textContent = 'Lade ' + decodeURIComponent(src) + ' …';

    try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();

        document.getElementById('bwwText').value = text;

        parsedData = parseBww(text);

        const musicLines = parsedData.filter(e => e.type === 'musicline').length;
        const notes = parsedData.filter(e => e.type === 'musicline')
            .reduce((sum, ml) => sum + (ml.parsedContent?.filter(t => t.type === 'note').length || 0), 0);

        statusEl.textContent = 'Geladen: ' + musicLines + ' Zeilen, ' + notes + ' Noten';
        renderSheet();

        // Download-Button aktivieren
        const dlBtn = document.getElementById('downloadBtn');
        dlBtn.style.display = '';
        dlBtn.onclick = () => {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = decodeURIComponent(src).split('/').pop() || 'tune.bww';
            a.click();
            URL.revokeObjectURL(url);
        };
    } catch (err) {
        statusEl.textContent = 'Fehler: ' + err.message;
        statusEl.classList.add('error');
        console.error('BWW load error:', err);
    }
}

main();