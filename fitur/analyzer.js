const config = require('../config');

const terkirim = new Map();
const TTL = 5 * 60 * 1000;

function getKey(grupId, keyword, target) {
    return `${grupId}:${keyword}:${target}`;
}

function analisisPesan(teks) {
    const lower = teks.toLowerCase();
    const hasil = [];

    for (const [keyword, targets] of Object.entries(config.keywords)) {
        if (lower.includes(keyword)) {
            hasil.push({ keyword, targets });
        }
    }

    return hasil;
}

function cleanup() {
    const now = Date.now();
    for (const [key, entry] of terkirim) {
        if (now - entry.time >= TTL) terkirim.delete(key);
    }
}

function cekDuplikat(grupId, keyword, target, teks) {
    const key = getKey(grupId, keyword, target);
    const entry = terkirim.get(key);
    if (entry && entry.text === teks && Date.now() - entry.time < TTL) return true;
    terkirim.set(key, { text: teks, time: Date.now() });
    return false;
}

setInterval(cleanup, TTL);

module.exports = { analisisPesan, cekDuplikat };
