(function () {
    const rawText = document.body?.innerText || '';

    if (!rawText || rawText.length < 20) return;
    if (!looksLikeBww(rawText)) return;

    try {
        parsedData = parseBww(rawText);

        // Replace page with canvas renderer
        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0;padding:20px;background:#fafbfc;font-family:sans-serif;';

        const statsDiv = document.createElement('div');
        statsDiv.id = 'statsContainer';
        document.body.appendChild(statsDiv);

        const canvas = document.createElement('canvas');
        canvas.id = 'sheetCanvas';
        canvas.width = 1400;
        canvas.height = 1600;
        canvas.style.cssText = 'display:block;background:white;border:1px solid #dee2e6;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        document.body.appendChild(canvas);

        renderSheet();
    } catch (err) {
        console.error('BWW Render Error:', err);
    }

    function looksLikeBww(text) {
        return (
            text.includes('Bagpipe Reader') ||
            text.includes('TuneTempo') ||
            (text.includes('&') && text.includes('!'))
        );
    }
})();