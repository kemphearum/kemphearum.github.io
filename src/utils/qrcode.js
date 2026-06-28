/**
 * Minimal, dependency-free QR Code generator (byte mode).
 *
 * Implements the QR Code Model 2 encoding algorithm (versions 1–40, all four
 * error-correction levels) sufficient to encode a URL and render it as an SVG
 * string. Used by the printable /resume page so the QR works fully offline and
 * print-safe — no runtime third-party request. Algorithm follows the public
 * ISO/IEC 18004 reference (Reed–Solomon ECC, mask selection by penalty score).
 */

const ECC = {
    L: { ordinal: 0, formatBits: 1 },
    M: { ordinal: 1, formatBits: 0 },
    Q: { ordinal: 2, formatBits: 3 },
    H: { ordinal: 3, formatBits: 2 }
};

const MIN_VERSION = 1;
const MAX_VERSION = 40;

// ECC codewords per block, indexed [eccOrdinal][version] (index 0 unused).
const ECC_CODEWORDS_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
];

// Number of error-correction blocks, indexed [eccOrdinal][version].
const NUM_ERROR_CORRECTION_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
];

const getBit = (value, i) => ((value >>> i) & 1) !== 0;

const utf8Bytes = (str) => {
    const out = [];
    for (const ch of String(str)) {
        const code = ch.codePointAt(0);
        if (code < 0x80) out.push(code);
        else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        else if (code < 0x10000) out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        else out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
    return out;
};

const getNumRawDataModules = (version) => {
    let result = (16 * version + 128) * version + 64;
    if (version >= 2) {
        const numAlign = Math.floor(version / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (version >= 7) result -= 36;
    }
    return result;
};

const getNumDataCodewords = (version, ecl) =>
    Math.floor(getNumRawDataModules(version) / 8)
    - ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];

const reedSolomonMultiply = (x, y) => {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
};

const reedSolomonComputeDivisor = (degree) => {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < degree; j++) {
            result[j] = reedSolomonMultiply(result[j], root);
            if (j + 1 < degree) result[j] ^= result[j + 1];
        }
        root = reedSolomonMultiply(root, 0x02);
    }
    return result;
};

const reedSolomonComputeRemainder = (data, divisor) => {
    const result = new Uint8Array(divisor.length);
    for (const b of data) {
        const factor = b ^ result[0];
        result.copyWithin(0, 1);
        result[result.length - 1] = 0;
        for (let i = 0; i < result.length; i++) {
            result[i] ^= reedSolomonMultiply(divisor[i], factor);
        }
    }
    return result;
};

const addEccAndInterleave = (data, version, ecl) => {
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version];
    const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
        const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
        const dat = Array.from(data.slice(k, k + datLen));
        k += datLen;
        const ecc = Array.from(reedSolomonComputeRemainder(dat, rsDiv));
        if (i < numShortBlocks) dat.push(0);
        blocks.push(dat.concat(ecc));
    }

    const result = [];
    for (let i = 0; i < blocks[0].length; i++) {
        for (let j = 0; j < blocks.length; j++) {
            if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
                result.push(blocks[j][i]);
            }
        }
    }
    return result;
};

const getAlignmentPatternPositions = (version) => {
    if (version === 1) return [];
    const numAlign = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) {
        result.splice(1, 0, pos);
    }
    return result;
};

const encodeToCodewords = (bytes, ecl) => {
    let version = MIN_VERSION;
    for (; ; version++) {
        const capacityBits = getNumDataCodewords(version, ecl) * 8;
        const ccBits = version < 10 ? 8 : 16;
        const usedBits = 4 + ccBits + 8 * bytes.length;
        if (usedBits <= capacityBits) break;
        if (version >= MAX_VERSION) throw new Error('QR data too long');
    }

    const bb = [];
    const appendBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
    };

    appendBits(0x4, 4); // byte mode indicator
    appendBits(bytes.length, version < 10 ? 8 : 16);
    for (const b of bytes) appendBits(b, 8);

    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    appendBits(0, Math.min(4, dataCapacityBits - bb.length)); // terminator
    while (bb.length % 8 !== 0) bb.push(0);
    for (let pad = 0xec; bb.length < dataCapacityBits; pad ^= 0xec ^ 0x11) appendBits(pad, 8);

    const dataCodewords = new Uint8Array(bb.length / 8);
    bb.forEach((bit, i) => {
        dataCodewords[i >>> 3] |= bit << (7 - (i & 7));
    });

    return { version, codewords: addEccAndInterleave(dataCodewords, version, ecl) };
};

const buildModules = (version, ecl, allCodewords) => {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

    const setFn = (x, y, dark) => {
        modules[y][x] = dark;
        isFunction[y][x] = true;
    };

    const drawFinder = (x, y) => {
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                const dist = Math.max(Math.abs(dx), Math.abs(dy));
                const xx = x + dx;
                const yy = y + dy;
                if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
                    setFn(xx, yy, dist !== 2 && dist !== 4);
                }
            }
        }
    };

    const drawAlignment = (x, y) => {
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
            }
        }
    };

    const drawFormatBits = (mask) => {
        const data = (ecl.formatBits << 3) | mask;
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        const bits = ((data << 10) | rem) ^ 0x5412;

        for (let i = 0; i <= 5; i++) setFn(8, i, getBit(bits, i));
        setFn(8, 7, getBit(bits, 6));
        setFn(8, 8, getBit(bits, 7));
        setFn(7, 8, getBit(bits, 8));
        for (let i = 9; i < 15; i++) setFn(14 - i, 8, getBit(bits, i));

        for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, getBit(bits, i));
        for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, getBit(bits, i));
        setFn(8, size - 8, true);
    };

    const drawVersion = () => {
        if (version < 7) return;
        let rem = version;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
        const bits = (version << 12) | rem;
        for (let i = 0; i < 18; i++) {
            const bit = getBit(bits, i);
            const a = size - 11 + (i % 3);
            const b = Math.floor(i / 3);
            setFn(a, b, bit);
            setFn(b, a, bit);
        }
    };

    // Function patterns
    for (let i = 0; i < size; i++) {
        setFn(6, i, i % 2 === 0);
        setFn(i, 6, i % 2 === 0);
    }
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);

    const alignPos = getAlignmentPatternPositions(version);
    const numAlign = alignPos.length;
    for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
            if (!((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0))) {
                drawAlignment(alignPos[i], alignPos[j]);
            }
        }
    }

    drawFormatBits(0);
    drawVersion();

    // Data + ECC codewords (zigzag)
    let bitIdx = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
                const x = right - j;
                const upward = ((right + 1) & 2) === 0;
                const y = upward ? size - 1 - vert : vert;
                if (!isFunction[y][x] && bitIdx < allCodewords.length * 8) {
                    modules[y][x] = getBit(allCodewords[bitIdx >>> 3], 7 - (bitIdx & 7));
                    bitIdx++;
                }
            }
        }
    }

    return { modules, isFunction, size, drawFormatBits };
};

const applyMask = (modules, isFunction, mask) => {
    const size = modules.length;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (isFunction[y][x]) continue;
            let invert = false;
            switch (mask) {
                case 0: invert = (x + y) % 2 === 0; break;
                case 1: invert = y % 2 === 0; break;
                case 2: invert = x % 3 === 0; break;
                case 3: invert = (x + y) % 3 === 0; break;
                case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
                case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
                case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
                case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
                default: break;
            }
            if (invert) modules[y][x] = !modules[y][x];
        }
    }
};

const finderPenaltyCountPatterns = (rh) => {
    const n = rh[1];
    const core = n > 0 && rh[2] === n && rh[3] === n * 3 && rh[4] === n && rh[5] === n;
    return (core && rh[0] >= n * 4 && rh[6] >= n ? 1 : 0)
        + (core && rh[6] >= n * 4 && rh[0] >= n ? 1 : 0);
};

const finderPenaltyAddHistory = (currentRunLength, rh, size) => {
    if (rh[0] === 0) currentRunLength += size;
    rh.pop();
    rh.unshift(currentRunLength);
};

const finderPenaltyTerminateAndCount = (currentRunColor, currentRunLength, rh, size) => {
    if (currentRunColor) {
        finderPenaltyAddHistory(currentRunLength, rh, size);
        currentRunLength = 0;
    }
    currentRunLength += size;
    finderPenaltyAddHistory(currentRunLength, rh, size);
    return finderPenaltyCountPatterns(rh, size);
};

const getPenaltyScore = (modules) => {
    const size = modules.length;
    const N1 = 3;
    const N2 = 3;
    const N3 = 40;
    const N4 = 10;
    let result = 0;

    for (let y = 0; y < size; y++) {
        let runColor = false;
        let runLen = 0;
        const rh = [0, 0, 0, 0, 0, 0, 0];
        for (let x = 0; x < size; x++) {
            if (modules[y][x] === runColor) {
                runLen++;
                if (runLen === 5) result += N1;
                else if (runLen > 5) result++;
            } else {
                finderPenaltyAddHistory(runLen, rh, size);
                if (!runColor) result += finderPenaltyCountPatterns(rh, size) * N3;
                runColor = modules[y][x];
                runLen = 1;
            }
        }
        result += finderPenaltyTerminateAndCount(runColor, runLen, rh, size) * N3;
    }

    for (let x = 0; x < size; x++) {
        let runColor = false;
        let runLen = 0;
        const rh = [0, 0, 0, 0, 0, 0, 0];
        for (let y = 0; y < size; y++) {
            if (modules[y][x] === runColor) {
                runLen++;
                if (runLen === 5) result += N1;
                else if (runLen > 5) result++;
            } else {
                finderPenaltyAddHistory(runLen, rh, size);
                if (!runColor) result += finderPenaltyCountPatterns(rh, size) * N3;
                runColor = modules[y][x];
                runLen = 1;
            }
        }
        result += finderPenaltyTerminateAndCount(runColor, runLen, rh, size) * N3;
    }

    for (let y = 0; y < size - 1; y++) {
        for (let x = 0; x < size - 1; x++) {
            const c = modules[y][x];
            if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
                result += N2;
            }
        }
    }

    let dark = 0;
    for (const row of modules) for (const v of row) if (v) dark++;
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * N4;

    return result;
};

/**
 * Builds the QR Code module matrix for `text`.
 * @param {string} text
 * @param {('L'|'M'|'Q'|'H')} [eccLevel='M']
 * @returns {boolean[][]} square matrix; true = dark module
 */
export const generateQrMatrix = (text, eccLevel = 'M') => {
    const ecl = ECC[eccLevel] || ECC.M;
    const { version, codewords } = encodeToCodewords(utf8Bytes(text), ecl);

    let bestMatrix = null;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
        const { modules, isFunction, drawFormatBits } = buildModules(version, ecl, codewords);
        drawFormatBits(mask);
        applyMask(modules, isFunction, mask);
        const penalty = getPenaltyScore(modules);
        if (penalty < bestPenalty) {
            bestPenalty = penalty;
            bestMatrix = modules;
        }
    }
    return bestMatrix;
};

/**
 * Renders `text` as a self-contained SVG QR Code string.
 * @param {string} text
 * @param {Object} [options]
 * @param {('L'|'M'|'Q'|'H')} [options.ecc='M']
 * @param {number} [options.margin=4] quiet-zone width in modules
 * @param {string} [options.dark='#000000']
 * @param {string} [options.light='#ffffff']
 * @returns {string} SVG markup
 */
export const generateQrSvg = (text, options = {}) => {
    const { ecc = 'M', margin = 4, dark = '#000000', light = '#ffffff' } = options;
    const modules = generateQrMatrix(text, ecc);
    const size = modules.length;
    const dim = size + margin * 2;

    let path = '';
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (modules[y][x]) path += `M${x + margin},${y + margin}h1v1h-1z`;
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="QR code">`
        + `<rect width="${dim}" height="${dim}" fill="${light}"/>`
        + `<path d="${path}" fill="${dark}"/></svg>`;
};

export default generateQrSvg;
