// BWW Sheet Music Canvas Renderer
// Extracted from sheet-viewer-advanced.html

const CONFIG = {
    STAFF_LINES: 5,
    LINE_SPACING: 12,
    LEFT_MARGIN: 40,
    TOP_MARGIN: 60,
    STAFF_SPACING: 80,
    PAGE_WIDTH: 1300,
    PAGE_PADDING: 50,
};

const NOTE_PITCHES = ['LG', 'LA', 'B', 'C', 'D', 'E', 'F', 'HG', 'HA'];
const NOTE_POSITIONS = {
    'HA': -2,
    'HG': -1,
    'F': 0,
    'E': 1,
    'D': 2,
    'C': 3,
    'B': 4,
    'LA': 5,
    'LG': 6
};

const SINGLE_GRACENOTE_MAP = {
    'lgg':  'LG',
    'lag':  'LA',
    'bg':   'B',
    'cg':   'C',
    'dg':   'D',
    'eg':   'E',
    'fg':   'F',
    'gg':   'HG',
    'hgg':  'HG',
    'hagg': 'HA',
    'hag':  'HA',
    'tg':   'HA',
    'strlg': 'LG',
    'strla': 'LA',
    'strb':  'B',
    'strc':  'C',
    'strd':  'D',
    'stre':  'E',
    'strf':  'F',
    'strhg': 'HG',
    'strha': 'HA',
};

function getGracenotePitch(ornamentName) {
    const pitch = SINGLE_GRACENOTE_MAP[ornamentName];
    if (!pitch) return null;
    return pitch;
}

const MULTI_GRACENOTE_MAP = {
    'gbr': ['HG', 'LA', 'LG', 'LA', 'LG'],
    'abr': ['LA', 'LG', 'LA', 'LG'],
    'brl': ['LG', 'LA', 'LG'],
    'dblg': ['HG', 'LG', 'D'],
    'dbla': ['HG', 'LA', 'D'],
    'dbb':  ['HG', 'B',  'D'],
    'dbc':  ['HG', 'C',  'D'],
    'dbd':  ['HG', 'D',  'E'],
    'dbe':  ['HG', 'E',  'F'],
    'dbf':  ['HG', 'F',  'HG'],
    'dbhg': ['HG', 'F'],
    'dbha':  ['HA', 'HG' ],
    'hdblg': ['LG', 'D'],
    'hdbla': ['LA', 'D'],    
    'hdbb': ['B', 'D'],
    'hdbc': ['C', 'D'],
    'hdbd': ['D', 'E'],
    'hdbe': ['E', 'F'],
    'hdbf': ['F', 'HG'],
    'hdbhg': ['HG', 'HA'], 
    'gstb': ['HG', 'B', 'LG'],
    'thrd': ['LG', 'D', 'C'],
    'lhstd': ['D', 'C'],
    'grp': ['LG', 'D', 'LG'],
    'grpb': ['LG', 'B', 'LG'],
    'tar': ['LG', 'D', 'LG', 'E'],
    'pela': ['HG', 'LA', 'D', 'LA', 'LG'],
    'pelb': ['HG', 'B', 'D', 'B', 'LG'],
    'pelc': ['HG', 'C', 'D', 'C', 'LG'],
    'lpeld': ['HG', 'D', 'E', 'D', 'C'],
    'peld': ['HG', 'D', 'E', 'D', 'LG'],
    'pele': ['HG', 'E', 'F', 'E', 'LA'],
    'pelf': ['HG', 'F', 'HG', 'F', 'E'],
    'ge': ['HG','E']
};

function getMultiGracenotePitches(ornamentName) {
    return MULTI_GRACENOTE_MAP[ornamentName] || null;
}

var parsedData = null;
var renderStats = null;

function renderSheet() {
    if (!parsedData) return;

    const canvas = document.getElementById('sheetCanvas');
    const ctx = canvas.getContext('2d');

    const musicLines = parsedData.filter(e => e.type === 'musicline');
    const textBlocks = parsedData.filter(e => e.type === 'textBlock');
    const estimatedHeight = CONFIG.TOP_MARGIN * 2 + 150 + (musicLines.length * 130) + (textBlocks.length * 40);
    canvas.height = estimatedHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderStats = {
        staffLines: musicLines.length,
        notes: 0,
        ornaments: 0,
        barlines: 0,
        unknownTokens: [],
        unrenderedOrnaments: [],
        unhandledTokens: []
    };

    let yPos = CONFIG.TOP_MARGIN;

    const firstTextBlocks = [];
    let firstMusiclineIndex = -1;
    for (let i = 0; i < parsedData.length; i++) {
        if (parsedData[i].type === 'textBlock') {
            firstTextBlocks.push(parsedData[i]);
        } else if (parsedData[i].type === 'musicline') {
            firstMusiclineIndex = i;
            break;
        }
    }

    if (firstTextBlocks.length > 0) {
        for (const textBlock of firstTextBlocks) {
            yPos = drawTextBlock(ctx, textBlock, yPos);
        }
        yPos += 20;
    } else {
        yPos = drawDocumentHeader(ctx, yPos);
    }

    for (let i = 0; i < parsedData.length; i++) {
        const element = parsedData[i];

        if (firstTextBlocks.length > 0 && i < firstMusiclineIndex) {
            continue;
        }

        if (element.type === 'textBlock' && element.meta && Array.isArray(element.meta)) {
            yPos = drawTextBlock(ctx, element, yPos);
        } else if (element.type === 'musicline') {
            yPos = drawMusicLine(ctx, element, yPos);
            yPos += 50;
        }
    }

    displayStats();
}

function drawTextBlock(ctx, textBlock, y) {
    if (!textBlock.meta || !Array.isArray(textBlock.meta)) return y + 15;
    const metaType = textBlock.meta[0];
    const metaPosition = textBlock.meta[1];
    const fontFamily = textBlock.meta[4] || 'Times New Roman';
    const fontSize = parseInt(textBlock.meta[5]) || 14;
    const fontWeight = parseInt(textBlock.meta[6]) || 400;

    let fontStyle = '';
    if (fontWeight === 700) fontStyle += 'bold ';

    ctx.font = fontStyle + fontSize + 'px ' + fontFamily;
    ctx.fillStyle = '#000';

    if (metaPosition === 'L') {
        ctx.textAlign = 'left';
        ctx.fillText(textBlock.text, CONFIG.LEFT_MARGIN, y);
    } else if (metaPosition === 'C') {
        ctx.textAlign = 'center';
        ctx.fillText(textBlock.text, CONFIG.PAGE_WIDTH / 2 + CONFIG.LEFT_MARGIN, y);
    } else if (metaPosition === 'R') {
        ctx.textAlign = 'right';
        ctx.fillText(textBlock.text, CONFIG.PAGE_WIDTH + CONFIG.LEFT_MARGIN - 20, y);
    }

    return y + (fontSize + 15);
}

function drawDocumentHeader(ctx, y) {
    const tuneData = extractTuneData();

    ctx.font = 'bold 24px Georgia';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(tuneData.title || 'Untitled', CONFIG.PAGE_WIDTH / 2 + CONFIG.LEFT_MARGIN, y);

    if (tuneData.tuneType) {
        ctx.font = 'italic 14px Georgia';
        ctx.fillStyle = '#555';
        ctx.fillText(`(${tuneData.tuneType})`, CONFIG.PAGE_WIDTH / 2 + CONFIG.LEFT_MARGIN, y + 25);
    }

    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#333';

    let metaY = y + 50;
    if (tuneData.composer) {
        ctx.fillText(`Composer: ${tuneData.composer}`, CONFIG.LEFT_MARGIN, metaY);
        metaY += 18;
    }
    if (tuneData.tempo) {
        ctx.fillText(`Tempo: ${tuneData.tempo} BPM`, CONFIG.PAGE_WIDTH / 2 + CONFIG.LEFT_MARGIN, y + 50);
    }

    return y + 80;
}

function extractTuneData() {
    const data = {
        title: 'Bagpipe Medley',
        tuneType: '',
        composer: '',
        credits: '',
        tempo: '90'
    };

    for (const element of parsedData) {
        if (element.type === 'textBlock' && element.meta && Array.isArray(element.meta)) {
            const metaType = element.meta[0];
            if (metaType === 'T') data.title = element.text.trim();
            if (metaType === 'Y') data.tuneType = element.text.trim();
            if (metaType === 'M') data.composer = element.text.trim();
            if (metaType === 'Z') data.credits = element.text.trim();
        }
        if (element.type === 'header' && element.key === 'tunetempo') {
            data.tempo = element.value;
        }
    }

    return data;
}

function drawMusicLine(ctx, musicLine, startY) {
    let xPos = CONFIG.LEFT_MARGIN;
    const lineY = startY;

    drawStaffLines(ctx, lineY);

    const brackets = [];
    let currentBracket = null;

    const ties = [];
    let currentTie = null;

    const parsed = musicLine.parsedContent || [];
    const notePositions = [];
    let tempXPos = xPos;

    for (let i = 0; i < parsed.length; i++) {
        const token = parsed[i];

        if (token.type === 'clef') {
            tempXPos += 30;
        } else if (token.type === 'partStart') {
            tempXPos += 20;
            if (token.repeated) tempXPos += 12;
        } else if (token.type === 'partEnd') {
            if (token.repeated) tempXPos += 12;
            tempXPos += 20;
        } else if (token.type === 'note') {
            notePositions.push({ token, xPos: tempXPos, index: i });
            if (currentTie) {
                const posIdx = NOTE_POSITIONS[token.pitch];
                if (posIdx !== undefined) {
                    currentTie.notes.push({ x: tempXPos, noteY: lineY + (posIdx * CONFIG.LINE_SPACING / 2), pitch: token.pitch });
                }
            }
            const nextToken = parsed[i + 1];
            if (nextToken && nextToken.type === 'ornament') {
                tempXPos += 14;
            } else {
                tempXPos += 22;
            }
        } else if (token.type === 'meter') {
            tempXPos += 20;
        } else if (token.type === 'sharp') {
            tempXPos += 20;
        } else if (token.type === 'ornament') {
            if (getGracenotePitch(token.name)) {
                tempXPos += 8;
            } else if (getMultiGracenotePitches(token.name)) {
                const pitches = getMultiGracenotePitches(token.name);
                tempXPos += pitches.length * 9 + 10;
            }
        } else if (token.type === 'barline') {
            notePositions.push({ type: 'barline', index: i });
            tempXPos += 10;
        } else if (token.type === 'bracket') {
            if (token.value === "_'") {
                if (currentBracket) {
                    currentBracket.endX = tempXPos;
                    brackets.push(currentBracket);
                    currentBracket = null;
                }
            } else {
                const label = token.label || token.value.replace("'", '');
                if (currentBracket) {
                    currentBracket.endX = tempXPos;
                    brackets.push(currentBracket);
                }
                currentBracket = { number: label, startX: tempXPos, endX: tempXPos };
            }
        } else if (token.type === 'control') {
            if (token.value === '^ts') {
                currentTie = { notes: [] };
            } else if (token.value === '^te') {
                if (currentTie && currentTie.notes.length >= 2) {
                    ties.push(currentTie);
                }
                currentTie = null;
            } else if (token.value.match(/^\^t[a-z]+$/)) {
                // Pitch-specific tie (e.g. ^tf, ^tla, ^thg)
                // Find the note before and after this token
                const pitchStr = token.value.slice(2).toUpperCase();
                let prevNote = null;
                for (let j = notePositions.length - 1; j >= 0; j--) {
                    const np = notePositions[j];
                    if (np.token && np.token.pitch === pitchStr) {
                        prevNote = np;
                        break;
                    }
                }
                if (prevNote) {
                    // Look ahead for next note with same pitch
                    let nextNoteX = null;
                    let nextNoteY = null;
                    let lookXPos = tempXPos;
                    for (let j = i + 1; j < parsed.length; j++) {
                        const ft = parsed[j];
                        if (ft.type === 'note') {
                            if (ft.pitch === pitchStr) {
                                // Estimate x position
                                const posIdx = NOTE_POSITIONS[ft.pitch];
                                if (posIdx !== undefined) {
                                    nextNoteX = lookXPos;
                                    nextNoteY = lineY + (posIdx * CONFIG.LINE_SPACING / 2);
                                }
                            }
                            break;
                        }
                        // Advance lookXPos same as first pass
                        if (ft.type === 'clef') lookXPos += 30;
                        else if (ft.type === 'partStart') { lookXPos += 20; if (ft.repeated) lookXPos += 12; }
                        else if (ft.type === 'partEnd') { if (ft.repeated) lookXPos += 12; lookXPos += 20; }
                        else if (ft.type === 'meter') lookXPos += 20;
                        else if (ft.type === 'sharp') lookXPos += 20;
                        else if (ft.type === 'ornament') {
                            if (getGracenotePitch(ft.name)) lookXPos += 8;
                            else if (getMultiGracenotePitches(ft.name)) lookXPos += getMultiGracenotePitches(ft.name).length * 9 + 10;
                        }
                        else if (ft.type === 'barline') lookXPos += 10;
                    }
                    const prevPosIdx = NOTE_POSITIONS[prevNote.token.pitch];
                    if (prevPosIdx !== undefined && nextNoteX !== null) {
                        ties.push({
                            notes: [
                                { x: prevNote.xPos, noteY: lineY + (prevPosIdx * CONFIG.LINE_SPACING / 2), pitch: pitchStr },
                                { x: nextNoteX, noteY: nextNoteY, pitch: pitchStr }
                            ]
                        });
                    }
                }
            }
        }
    }

    const beamGroups = findBeamGroups(notePositions);

    const beamedNoteIndices = new Set();
    for (const group of beamGroups) {
        for (const idx of group.indices) {
            beamedNoteIndices.add(idx);
        }
    }

    let xPos2 = CONFIG.LEFT_MARGIN;

    const notePitchesInLine = [];
    for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].type === 'note') {
            notePitchesInLine.push(parsed[i].pitch);
        }
    }

    const stemEndYMap = {};
    for (const group of beamGroups) {
        const noteHeadYs = group.notes.map(note => {
            const posIndex = NOTE_POSITIONS[note.pitch];
            if (posIndex === undefined) return null;
            return lineY + (posIndex * CONFIG.LINE_SPACING / 2);
        }).filter(y => y !== null);

        if (noteHeadYs.length >= 2) {
            const stemLength = 30;
            const stemEndYs = noteHeadYs.map(y => y + stemLength);
            const minStemEndY = Math.max(...stemEndYs);

            const firstNoteY = noteHeadYs[0];
            const lastNoteY = noteHeadYs[noteHeadYs.length - 1];
            const noteDiff = lastNoteY - firstNoteY;
            const maxSlope = noteDiff * 0.15;

            for (let j = 0; j < group.indices.length; j++) {
                const noteIdx = group.indices[j];
                const xFraction = j / (group.indices.length - 1);
                const beamY = minStemEndY + (maxSlope * xFraction);
                stemEndYMap[noteIdx] = beamY;
            }
        }
    }

    const noteDotCountMap = {};
    for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].type === 'modifier' && parsed[i].value) {
            const modifierValue = parsed[i].value;
            let dotCount = 0;
            for (let j = 0; j < modifierValue.length; j++) {
                if (modifierValue[j] === "'") {
                    dotCount++;
                } else {
                    break;
                }
            }

            if (dotCount > 0) {
                for (let j = i - 1; j >= 0; j--) {
                    if (parsed[j].type === 'note') {
                        noteDotCountMap[j] = dotCount;
                        break;
                    }
                }
            }
        }
    }

    for (let i = 0; i < parsed.length; i++) {
        const token = parsed[i];

        if (token.type === 'clef') {
            drawClef(ctx, xPos2, lineY);
            xPos2 += 30;
            continue;
        }

        if (token.type === 'partStart') {
            drawSystemBar(ctx, xPos2, lineY);
            xPos2 += 10;
            if (token.repeated) {
                drawRepeatDots(ctx, xPos2, lineY);
                xPos2 += 12;
            }
            xPos2 += 10;
            continue;
        }

        if (token.type === 'meter') {
            drawMeter(ctx, xPos2, lineY, token);
            xPos2 += 20;
            continue;
        }

        if (token.type === 'sharp') {
            drawSharp(ctx, xPos2, lineY, token.accidental);
            xPos2 += 20;
            continue;
        }

        if (token.type === 'note') {
            const isBeamed = beamedNoteIndices.has(i);
            const stemEndY = stemEndYMap[i] || null;
            const dotCount = noteDotCountMap[i] || 0;
            drawNote(ctx, xPos2, lineY, token, isBeamed, stemEndY, dotCount);
            renderStats.notes++;
            const nextToken = parsed[i + 1];
            if (nextToken && nextToken.type === 'ornament') {
                xPos2 += 14;
            } else {
                xPos2 += 22;
            }
            continue;
        }

        if (token.type === 'barline') {
            const isTerminating = token.style === 'terminating' || token.barlineType === 'terminating';
            drawBarline(ctx, xPos2, lineY, isTerminating);
            renderStats.barlines++;
            xPos2 += 10;
            continue;
        }

        if (token.type === 'partEnd') {
            if (token.repeated) {
                drawRepeatDots(ctx, xPos2, lineY);
                xPos2 += 12;
            }
            drawPartEnd(ctx, xPos2, lineY);
            xPos2 += 20;
            continue;
        }

        if (token.type === 'ornament') {
            const gracenotePitch = getGracenotePitch(token.name);
            const multiPitches = getMultiGracenotePitches(token.name);
            if (gracenotePitch) {
                drawGraceNote(ctx, xPos2 - 4, lineY, gracenotePitch);
                xPos2 += 8;
            } else if (multiPitches) {
                drawMultiGraceNotes(ctx, xPos2, lineY, multiPitches);
                xPos2 += multiPitches.length * 9 + 10;
            } else {
                drawOrnamentMarker(ctx, xPos2 - 22, lineY - 35, token.name);
                renderStats.unrenderedOrnaments.push(token.name);
            }
            renderStats.ornaments++;
            continue;
        }

        if (token.type === 'unknown') {
            renderStats.unknownTokens.push(token.value);
            continue;
        }

        if (['modifier'].includes(token.type)) {
            continue;
        }

        if (token.type === 'bracket' || token.type === 'control') {
            continue;
        }

        renderStats.unhandledTokens.push(`${token.type}${token.value ? ':' + token.value : token.name ? ':' + token.name : ''}`);
    }

    drawBeams(ctx, lineY, beamGroups, notePositions);

    for (const bracket of brackets) {
        drawVoltaBracket(ctx, bracket.startX, bracket.endX, lineY, bracket.number);
    }

    for (const tie of ties) {
        drawTie(ctx, tie.notes);
    }

    return startY + 80;
}

function findBeamGroups(notePositions) {
    const beamGroups = [];
    let currentGroup = null;

    for (let i = 0; i < notePositions.length; i++) {
        const item = notePositions[i];

        if (item.type === 'barline') {
            if (currentGroup && currentGroup.indices.length > 1) {
                beamGroups.push(currentGroup);
            }
            currentGroup = null;
            continue;
        }

        const token = item.token;
        const duration = token.duration || 4;

        if (duration >= 8) {
            const direction = token.direction;

            if (direction === null || direction === undefined) {
                if (currentGroup && currentGroup.indices.length > 1) {
                    beamGroups.push(currentGroup);
                }
                currentGroup = null;
                continue;
            }

            if (currentGroup && currentGroup.notes.length > 0) {
                const lastDirection = currentGroup.notes[currentGroup.notes.length - 1].direction;
                if (lastDirection === 'l' && direction === 'r') {
                    if (currentGroup.indices.length > 1) {
                        beamGroups.push(currentGroup);
                    }
                    currentGroup = null;
                }
            }

            if (!currentGroup) {
                currentGroup = {
                    indices: [item.index],
                    xPositions: [item.xPos],
                    durations: [duration],
                    notes: [token]
                };
            } else {
                currentGroup.indices.push(item.index);
                currentGroup.xPositions.push(item.xPos);
                currentGroup.durations.push(duration);
                currentGroup.notes.push(token);
            }
        } else {
            if (currentGroup && currentGroup.indices.length > 1) {
                beamGroups.push(currentGroup);
            }
            currentGroup = null;
        }
    }

    if (currentGroup && currentGroup.indices.length > 1) {
        beamGroups.push(currentGroup);
    }

    return beamGroups;
}

function drawBeams(ctx, lineY, beamGroups, notePositions) {
    for (const group of beamGroups) {
        if (group.indices.length < 2) continue;

        const noteHeadYs = group.notes.map(note => {
            const posIndex = NOTE_POSITIONS[note.pitch];
            if (posIndex === undefined) return null;
            return lineY + (posIndex * CONFIG.LINE_SPACING / 2);
        }).filter(y => y !== null);

        if (noteHeadYs.length < 2) continue;

        const stemLength = 30;
        const stemEndYs = noteHeadYs.map(y => y + stemLength);
        const minStemEndY = Math.max(...stemEndYs);

        const firstNoteY = noteHeadYs[0];
        const lastNoteY = noteHeadYs[noteHeadYs.length - 1];
        const noteDiff = lastNoteY - firstNoteY;
        const maxSlope = noteDiff * 0.15;

        const minDuration = Math.min(...group.durations);
        const baseBeamCount = Math.floor(Math.log2(minDuration)) - 2;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';

        for (let beamIdx = 0; beamIdx < baseBeamCount; beamIdx++) {
            const beamSpacing = 4;
            const beamStartY = minStemEndY - (beamSpacing * beamIdx);
            const beamEndY = minStemEndY + maxSlope - (beamSpacing * beamIdx);

            ctx.beginPath();
            ctx.moveTo(group.xPositions[0] - 5.5, beamStartY);
            ctx.lineTo(group.xPositions[group.xPositions.length - 1] - 5.5, beamEndY);
            ctx.stroke();
        }

        const uniqueDurations = [...new Set(group.durations.filter(d => d > minDuration))].sort((a, b) => a - b);

        for (const targetDuration of uniqueDurations) {
            const beamableGroups = [];
            let i = 0;

            while (i < group.durations.length) {
                if (group.durations[i] === targetDuration) {
                    const groupStart = i;

                    while (i < group.durations.length && group.durations[i] >= targetDuration) {
                        i++;
                    }

                    const groupEnd = i - 1;

                    if (groupStart < groupEnd) {
                        beamableGroups.push({ start: groupStart, end: groupEnd, stub: false });
                    } else {
                        const noteDirection = group.notes[groupStart].direction || 'r';
                        beamableGroups.push({ start: groupStart, end: groupStart, stub: true, direction: noteDirection });
                    }
                } else {
                    i++;
                }
            }

            if (beamableGroups.length > 0) {
                const additionalBeamCount = Math.floor(Math.log2(targetDuration)) - Math.floor(Math.log2(minDuration));

                for (const bgGroup of beamableGroups) {
                    for (let additionalIdx = 0; additionalIdx < additionalBeamCount; additionalIdx++) {
                        const beamSpacing = 4;
                        const totalBeamIdx = baseBeamCount + additionalIdx;
                        const beamStartY = minStemEndY - (beamSpacing * totalBeamIdx);
                        const beamEndY = minStemEndY + maxSlope - (beamSpacing * totalBeamIdx);

                        ctx.beginPath();
                        const xStart = group.xPositions[bgGroup.start] - 5.5;

                        if (bgGroup.stub) {
                            const stubLength = 10;
                            const stubOffset = bgGroup.direction === 'l' ? -stubLength : stubLength;
                            ctx.moveTo(xStart, beamStartY);
                            ctx.lineTo(xStart + stubOffset, beamStartY);
                        } else {
                            ctx.moveTo(xStart, beamStartY);
                            ctx.lineTo(group.xPositions[bgGroup.end] - 5.5, beamEndY);
                        }
                        ctx.stroke();
                    }
                }
            }
        }
    }
}

function drawStaffLines(ctx, y) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    for (let i = 0; i < CONFIG.STAFF_LINES; i++) {
        const lineY = y + (i * CONFIG.LINE_SPACING);
        ctx.beginPath();
        ctx.moveTo(CONFIG.LEFT_MARGIN - 10, lineY);
        ctx.lineTo(CONFIG.PAGE_WIDTH + CONFIG.LEFT_MARGIN, lineY);
        ctx.stroke();
    }

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CONFIG.LEFT_MARGIN - 10, y);
    ctx.lineTo(CONFIG.PAGE_WIDTH + CONFIG.LEFT_MARGIN, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(CONFIG.LEFT_MARGIN - 10, y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING);
    ctx.lineTo(CONFIG.PAGE_WIDTH + CONFIG.LEFT_MARGIN, y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING);
    ctx.stroke();
}

function drawRepeatDots(ctx, x, y) {
    ctx.fillStyle = '#000';
    const dotRadius = 2;

    const laY = y + (5 * CONFIG.LINE_SPACING / 2);
    ctx.beginPath();
    ctx.arc(x, laY, dotRadius, 0, 2 * Math.PI);
    ctx.fill();

    const cY = y + (3 * CONFIG.LINE_SPACING / 2);
    ctx.beginPath();
    ctx.arc(x, cY, dotRadius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawMultiGraceNotes(ctx, x, y, pitches) {
    const noteSpacing = 9;
    const stemX_offset = 3.5;
    const beamY_offset = -24;

    const noteXs = [];
    const noteYs = [];
    for (let i = 0; i < pitches.length; i++) {
        const pitch = pitches[i];
        if (NOTE_POSITIONS[pitch] === undefined) continue;
        const posIndex = NOTE_POSITIONS[pitch];
        const noteY = y + (posIndex * CONFIG.LINE_SPACING / 2);
        const noteX = x + i * noteSpacing;
        noteXs.push(noteX);
        noteYs.push(noteY);

        ctx.beginPath();
        ctx.ellipse(noteX, noteY, 4.5, 3, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#000';
        ctx.fill();

        if (pitch === 'HA') {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(noteX - 6, noteY);
            ctx.lineTo(noteX + 6, noteY);
            ctx.stroke();
        }
    }

    if (noteXs.length === 0) return;

    const beamTopY = Math.min(...noteYs) + beamY_offset;

    for (let i = 0; i < noteXs.length; i++) {
        const stemX = noteXs[i] + stemX_offset;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(stemX, noteYs[i]);
        ctx.lineTo(stemX, beamTopY);
        ctx.stroke();
    }

    if (noteXs.length >= 2) {
        const firstStemX = noteXs[0] + stemX_offset;
        const lastStemX  = noteXs[noteXs.length - 1] + stemX_offset;

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        for (let b = 0; b < 3; b++) {
            const by = beamTopY + b * 4;
            ctx.beginPath();
            ctx.moveTo(firstStemX, by);
            ctx.lineTo(lastStemX, by);
            ctx.stroke();
        }
    }
}

function drawGraceNote(ctx, x, y, pitch) {
    if (NOTE_POSITIONS[pitch] === undefined) return;

    const posIndex = NOTE_POSITIONS[pitch];
    const noteY = y + (posIndex * CONFIG.LINE_SPACING / 2);

    ctx.beginPath();
    ctx.ellipse(x, noteY, 4.5, 3, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#000';
    ctx.fill();

    if (pitch === 'HA') {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 6, noteY);
        ctx.lineTo(x + 6, noteY);
        ctx.stroke();
    }

    const stemX = x + 3.5;
    const stemTopY = noteY - 18;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(stemX, noteY);
    ctx.lineTo(stemX, stemTopY);
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
        const flagY = stemTopY + (i * 4);
        ctx.beginPath();
        ctx.moveTo(stemX, flagY);
        ctx.quadraticCurveTo(stemX + 7, flagY + 2, stemX + 5, flagY + 6);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function drawPartEnd(ctx, x, y) {
    const staffHeight = (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING;
    ctx.strokeStyle = '#000';

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + staffHeight);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 5, y + staffHeight);
    ctx.stroke();
}

function drawSystemBar(ctx, x, y) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.lineTo(x + 6, y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING);
    ctx.stroke();
}

function drawClef(ctx, x, y) {
    ctx.font = '70px Georgia';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1D11E}', x, y + CONFIG.LINE_SPACING + 35);
}

function drawMeter(ctx, x, y, meter) {
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';

    const centerY = y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING / 2;

    if (meter.symbol === 'C') {
        ctx.font = '48px serif';
        ctx.fillText('\u{1D134}', x, centerY + 15);
    } else if (meter.symbol === 'C_') {
        ctx.font = '48px serif';
        ctx.fillText('\u{1D135}', x, centerY + 15);
    } else {
        ctx.font = '35px Arial';
        ctx.fillText(meter.beats || '4', x, centerY);
        ctx.fillText(meter.noteValue || '4', x, centerY + 25);
    }
}

function drawSharp(ctx, x, y, accidental) {
    const sharpPositions = {
        'f': 0.5,
        'c': 3,
        'g': 1,
        'd': 2,
        'a': 5,
        'e': 1,
        'b': 4
    };

    const posIndex = sharpPositions[accidental] || 0;
    const sharpY = y + (posIndex * CONFIG.LINE_SPACING / 2);

    ctx.font = '25px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('\u266F', x, sharpY + 5);
}

function drawNote(ctx, x, y, note, isBeamed, stemEndY, dotCount) {
    if (!note.pitch || NOTE_POSITIONS[note.pitch] === undefined) {
        return;
    }

    const posIndex = NOTE_POSITIONS[note.pitch];
    const noteY = y + (posIndex * CONFIG.LINE_SPACING / 2);
    const duration = note.duration || 4;

    const isFilled = duration >= 4;

    ctx.beginPath();
    ctx.ellipse(x, noteY, 7.5, 5, 0, 0, 2 * Math.PI);

    if (isFilled) {
        ctx.fillStyle = '#000';
        ctx.fill();
    } else {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    if (note.pitch === 'HA') {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        const ledgerLength = 10;
        ctx.beginPath();
        ctx.moveTo(x - ledgerLength, noteY);
        ctx.lineTo(x + ledgerLength, noteY);
        ctx.stroke();
    }

    if (duration >= 2) {
        const stemX = x - 5.5;
        const stemEndYPos = (isBeamed && stemEndY !== null) ? stemEndY : (noteY + 30);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(stemX, noteY);
        ctx.lineTo(stemX, stemEndYPos);
        ctx.stroke();

        if (!isBeamed && duration >= 8) {
            const flagCount = Math.floor(Math.log2(duration)) - 2;

            ctx.fillStyle = '#000';

            for (let i = 0; i < flagCount; i++) {
                const flagY = stemEndYPos + (i * 5);
                ctx.beginPath();
                ctx.moveTo(stemX, flagY);
                ctx.quadraticCurveTo(stemX + 12, flagY - 4, stemX + 8, flagY - 10);
                ctx.quadraticCurveTo(stemX + 10, flagY - 6, stemX, flagY - 4);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    if (dotCount > 0) {
        ctx.fillStyle = '#000';
        const dotRadius = 1.5;
        const dotSpacingX = 4;
        const dotStartX = x + 10;
        const dotVerticalOffset = 3;

        for (let i = 0; i < dotCount; i++) {
            const dotX = dotStartX + (i * dotSpacingX);
            const dotY = noteY + dotVerticalOffset;
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    //ctx.font = '7px Arial';
    //ctx.fillStyle = '#999';
    //ctx.textAlign = 'center';
    //ctx.fillText(note.pitch, x, noteY + 15);
}

function drawBarline(ctx, x, y, isTerminating) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = isTerminating ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (CONFIG.STAFF_LINES - 1) * CONFIG.LINE_SPACING);
    ctx.stroke();
}

function drawOrnamentMarker(ctx, x, y, ornamentName) {
    ctx.font = '9px Arial';
    ctx.fillStyle = '#cc0000';
    ctx.textAlign = 'center';
    ctx.fillText(ornamentName.substring(0, 4), x, y);
}

function drawVoltaBracket(ctx, startX, endX, staffY, number) {
    const bracketY = staffY - 35;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(startX, staffY - 5);
    ctx.lineTo(startX, bracketY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, bracketY);
    ctx.lineTo(endX, bracketY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, bracketY);
    ctx.lineTo(endX, staffY - 5);
    ctx.stroke();

    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(number, startX + 4, bracketY - 3);
}

function drawTie(ctx, notes) {
    if (notes.length < 2) return;

    const first = notes[0];
    const last = notes[notes.length - 1];

    const startX = first.x;
    const endX = last.x;
    const midX = (startX + endX) / 2;
    const baseY = Math.min(first.noteY, last.noteY);
    const curveY = baseY - 25;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, baseY - 8);
    ctx.quadraticCurveTo(midX, curveY, endX, baseY - 8);
    ctx.stroke();
}

function displayStats() {
    if (!renderStats) return;

    const statsDiv = document.getElementById('statsContainer');
    if (!statsDiv) return;

    const unknownSet = [...new Set(renderStats.unknownTokens)];
    const unrenderedSet = [...new Set(renderStats.unrenderedOrnaments)];
    const unhandledSet = [...new Set(renderStats.unhandledTokens)];

    let warningsHtml = '';
    if (unknownSet.length > 0) {
        warningsHtml += `
            <div style="background:#f8d7da;color:#721c24;padding:8px 12px;margin:4px 0;border-radius:4px;border-left:4px solid #f5c6cb;font-size:12px">
                <strong>Parser: nicht erkannte Token (${unknownSet.length}):</strong>
                ${unknownSet.map(v => `<code style="background:#fdd;padding:1px 4px;border-radius:3px;margin:2px">${v}</code>`).join(' ')}
            </div>`;
    }
    if (unrenderedSet.length > 0) {
        warningsHtml += `
            <div style="background:#fff3cd;color:#856404;padding:8px 12px;margin:4px 0;border-radius:4px;border-left:4px solid #ffc107;font-size:12px">
                <strong>Viewer: unbekannte Ornamente (${unrenderedSet.length}):</strong>
                ${unrenderedSet.map(v => `<code style="background:#ffe;padding:1px 4px;border-radius:3px;margin:2px">${v}</code>`).join(' ')}
            </div>`;
    }
    if (unhandledSet.length > 0) {
        warningsHtml += `
            <div style="background:#e8f4fd;color:#0c5460;padding:8px 12px;margin:4px 0;border-radius:4px;border-left:4px solid #bee5eb;font-size:12px">
                <strong>Renderer: nicht verarbeitete Token (${unhandledSet.length}):</strong>
                ${unhandledSet.map(v => `<code style="background:#d1ecf1;padding:1px 4px;border-radius:3px;margin:2px">${v}</code>`).join(' ')}
            </div>`;
    }

    statsDiv.innerHTML = `
        <div style="background:#e7f3ff;color:#0056b3;padding:8px 12px;border-radius:4px;border-left:4px solid #0056b3;font-size:12px;margin:4px 0">
            Notenzeilen: ${renderStats.staffLines} |
            Noten: ${renderStats.notes} |
            Ornamente: ${renderStats.ornaments} |
            Taktstriche: ${renderStats.barlines}
        </div>
        ${warningsHtml}
    `;
}
