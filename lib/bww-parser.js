
function parseBww(text) {
  const datastructure = parseFilestructure(text);
  const result = []  
  for (const element of datastructure.elements) {
    if (element.type === "musicline") {
      const musicData = processMusicline(element.content);
      console.log("Parsed musicline:", musicData);
      element.parsedContent = musicData;
    }
    result.push(element);
  
  }
return result;
}
function processMusicline(line) {
  const tokens = line.split(/\s+/);
  const elements = [];
  
  for (const token of tokens) {
    const parsed = parseToken(token);
    if (parsed) {
      elements.push(parsed);
    }
  }
  
  return elements;
}

/**
 * Parst einen einzelnen Token aus einer Musikzeile
 * Erkennt: Noten, Vorzeichen, Ornamente, Bar-Lines, Part-Symbole, Taktart, etc.
 */
function parseToken(token) {
  // ===== CLEF (Notenschlüssel) =====
  if (token === "&") {
    return { type: "clef" };
  }

  // ===== NOTES (Noten mit Dauer) =====
  // Gültige Noten: LG, LA, B, C, D, E, F, G, HA, HG (9 total)
  // Format: [Note][direction]?_[Duration]
  // direction: r/l = Fähnchenrichtung bei Achteln, Sechzehnteln, etc.
  // Beispiele: Dr_16 (D rechts 16tel), LA_8 (LA Achtelnote), HGl_16 (HG links 16tel)
  const noteMatch = token.match(/^(LG|LA|[BCDEFG]|HA|HG)([lr])?_(\d+)$/);
  if (noteMatch) {
    const [, pitch, direction, duration] = noteMatch;
    return {
      type: "note",
      pitch: pitch,
      direction: direction || null,  // 'r' = right (rechts), 'l' = left (links)
      duration: parseInt(duration, 10)
    };
  }

  // ===== SHARPS (Vorzeichen #) =====
  // Format: sharp[note]
  // Beispiele: sharpf, sharpc, sharpe
  if (token.startsWith("sharp")) {
    const accidental = token.substring(5);
    return {
      type: "sharp",
      accidental: accidental
    };
  }

  // ===== FLATS (Vorzeichen b) =====
  // Format: flat[note]
  // Beispiele: flatb, flate, flata
  if (token.startsWith("flat")) {
    const accidental = token.substring(4);
    return {
      type: "flat",
      accidental: accidental
    };
  }

  // ===== ORNAMENTS (Verzierungen) =====
  const ornaments = [
     "bg", "cg","dg", "eg", "fg" , "gg", "tg", 
    "grp", "tar", 
    "thrd", 
    "brl", "gbr", "abr",
    "dbl",
    "gstb",
    "strlg", "strla", "strb", "strc", "strd", "strf", "stre", "strhg",
    "dblg", "dbla", "dbb", "dbc", "dbd","dbe", "dbf", "dbhg","dbha", 
    "hdblg", "hdbla", "hdbb", "hdbc", "hdbd", "hdbe", "hdbf", "hdbhg", "hdha",
    "pellg","pella", "pelb", "pelc", "lpeld", "peld", "pele", "pelf", "pelhg",
    "lhstd", 
  ];
  
  if (ornaments.includes(token.toLowerCase())) {
    return {
      type: "ornament",
      name: token.toLowerCase()
    };
  }

  // ===== MODIFIERS (Modifizierer nach Noten) =====
  // Format: '[note]
  // Beispiele: 'e, 'a, 'ha, 'la, 'hg, 'lg, 'd, 'f, 'b
  if (token.match(/^'[a-z]+$/)) {
    return {
      type: "modifier",
      value: token
    };
  }

  // ===== METER (Taktart) =====
  // Format: X_Y
  // Beispiele: 4_4, 3_4, 2_4, 6_8
  if (token.includes("_") && /^\d+_\d+$/.test(token)) {
    const [beats, noteValue] = token.split("_");
    return {
      type: "meter",
      beats: parseInt(beats, 10),
      noteValue: parseInt(noteValue, 10)
    };
  }

  // ===== CONTROL SYMBOLS (Kontroll-Symbole) =====
  // Format: ^[symbol]
  // Beispiele: ^ts, ^te, ^3f
  if (token.match(/^\^[a-z0-9]+$/)) {
    return {
      type: "control",
      value: token
    };
  }

  // ===== BAR LINES (Taktstrich) =====
  if (token === "!") {
    return {
      type: "barline",
      style: "standard"
    };
  }

  if (token === "!t") {
    return {
      type: "barline",
      style: "terminating"
    };
  }

  // ===== START OF PART (Part-Anfang) =====
  if (token === "I!''") {
    return {
      type: "partStart",
      repeated: true
    };
  }

  if (token === "I!") {
    return {
      type: "partStart",
      repeated: false
    };
  }

  // ===== END OF PART (Part-Ende) =====
  if (token === "''!I") {
    return {
      type: "partEnd",
      repeated: true
    };
  }

  if (token === "!I") {
    return {
      type: "partEnd",
      repeated: false
    };
  }

  // ===== REPEAT BRACKETS (Wiederholungsmarker) =====
  // Beispiele: '1, '2, '24 (2 of 4), '12 (1 of 2), _'
  if (token === "_'") {
    return {
      type: "bracket",
      value: token
    };
  }
  if (token.match(/^'[0-9]+$/)) {
    const digits = token.slice(1);
    if (digits.length === 1) {
      // Simple bracket: '1, '2
      return {
        type: "bracket",
        value: token,
        label: digits
      };
    } else if (digits.length === 2) {
      // Compound bracket: '24 → "2 of 4"
      return {
        type: "bracket",
        value: token,
        label: digits[0] + ' of ' + digits[1]
      };
    }
    return {
      type: "bracket",
      value: token,
      label: digits
    };
  }

  // ===== COMMON TIME SIGNATURE =====
  if (token === "C") {
    return {
      type: "meter",
      beats: 4,
      noteValue: 4,
      symbol: "C"
    };
  }

  // ===== ALLA BREVE (Cut Time) =====
  if (token === "C_") {
    return {
      type: "meter",
      beats: 2,
      noteValue: 2,
      symbol: "C_"
    };
  }

  // ===== UNKNOWN TOKEN =====
  return {
    type: "unknown",
    value: token
  };
}

function parseFilestructure(text) {
  const lines = text.split(/\r?\n/);

  const result = {
    elements: []
  };

  let currentSection = "header";
  let currentMusicline = "";
  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isFileHeader(line)) {
      const fileHeader = parseFileHeader(line);
      result.elements.push({ type: "fileHeader", ...fileHeader });
      continue;
    }

    if (isHeaderLine(line)) {
      const { key, value } = parseHeader(line);
      result.elements.push({ type: "header", key, value });

      continue;
    }

    if (line.startsWith('"')) {
      const block = parseTextBlock(line);
      result.elements.push({ type: "textBlock", ...block });
      continue;
    }
  currentSection = "musicline";

  if (line.includes("!t") || line.includes("!I")){
    currentMusicline += line;
    currentMusicline = normalizeWhitespace(currentMusicline);
    result.elements.push({ type: "musicline", content: currentMusicline.trim() });
    currentMusicline = "";
  }else{
    currentMusicline += line + " ";
  }
}
return result;
}

function isHeaderLine(line) {
  return /^[A-Za-z]+,/.test(line);
}

function parseHeader(line) {
  const [keyRaw, ...rest] = line.split(",");
  return {
    key: keyRaw.toLowerCase(),
    value: rest.join(",").trim()
  };
}

function parseTextBlock(line) {
  const match = line.match(/^"(.+?)",\((.+)\)$/);

  if (!match) {
    return { raw: line };
  }

  const [, text, meta] = match;

  return {
    text,
    meta: meta.split(",")
  };
}

/**
 * Normalisiert Whitespace in einer Zeile
 * - Ersetzt Tabs durch Spaces
 * - Ersetzt mehrere aufeinanderfolgende Spaces durch einen einzelnen Space
 * Beispiel: "gg  LAr_8\t'la\tBl_16" → "gg LAr_8 'la Bl_16"
 */
function normalizeWhitespace(line) {
  return line
    .replace(/\t+/g, "\t")        // Ersetze Tabs durch einen einzelnen Tab
    .replace(/\s+/g, " ");      // Ersetze mehrere Spaces durch einen
}

/**
 * Prüft, ob eine Zeile der Datei-Header ist
 * Format: "Bagpipe Reader:1.0"
 */
function isFileHeader(line) {
  return /^[A-Za-z\s]+:\d+\.\d+$/.test(line);
}

/**
 * Parst den Datei-Header
 * Format: "Bagpipe Reader:1.0"
 * Returns: { application: "Bagpipe Reader", version: "1.0" }
 */
function parseFileHeader(line) {
  const match = line.match(/^([A-Za-z\s]+):(\d+\.\d+)$/);
  
  if (!match) {
    return { application: line, version: null };
  }

  const [, application, version] = match;

  return {
    application: application.trim(),
    version: version
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseBww,
  };
}
