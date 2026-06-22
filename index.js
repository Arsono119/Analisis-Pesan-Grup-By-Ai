const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const config = require('./config');
const { analisisPesan, cekDuplikat } = require('./fitur/analyzer');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sesiLogin);
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'info' }),
        browser: ['Ubuntu', 'Chrome', '120.0'],
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            if (!config.nomorHP) {
                console.log('\n⚠️  Isi nomorHP di config.js untuk pairing code.');
                return;
            }
            console.log('\n═══════════════════════════════════════════');
            console.log('  KODE PAIRING WHATSAPP');
            console.log('  Buka WhatsApp > Titik 3 > Linked Devices');
            console.log('═══════════════════════════════════════════\n');
            try {
                let code = await sock.requestPairingCode(config.nomorHP);
                code = code.match(/.{1,4}/g).join('-');
                console.log(`  Kode: ${code}`);
            } catch (err) {
                console.log(`  Gagal: ${err.message}`);
            }
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('\n⚠️  Koneksi terputus, reconnect...');
                startBot();
            } else {
                console.log('\n❌ Logout dari WhatsApp, jalankan ulang bot.');
            }
        } else if (connection === 'open') {
            console.log(config.pesanAktif);
        }
    });

    function prosesPesan(msg) {
        if (!msg.message || msg.key.fromMe) return;

        const teks = msg.message.conversation ||
                     msg.message.extendedTextMessage?.text ||
                     msg.message.imageMessage?.caption || "";
        if (!teks) return;

        const id = msg.key.remoteJid;
        const pengirim = msg.key.participant || id;

        if (id.endsWith('@g.us')) {
            const cocok = analisisPesan(teks);
            for (const { keyword, targets } of cocok) {
                for (const target of targets) {
                    if (cekDuplikat(id, keyword, target, teks)) continue;
                    sock.sendMessage(target, {
                        text: `🔴 ${keyword}\n👤 @${pengirim.split('@')[0]}\n💬 ${teks}`,
                        mentions: [pengirim]
                    });
                }
            }
        } else {
            const cmd = teks.trim().toLowerCase();

            if (cmd === 'ping') {
                return sock.sendMessage(id, { text: '🏓 Pong! Bot aktif.' });
            }
        }
    }

    sock.ev.on('messages.upsert', async (m) => {
        for (const msg of m.messages) {
            const proto = msg.message?.protocolMessage;
            if (proto?.type === 0 && proto.editedMessage) {
                console.log('✏️ EDIT via protocolMessage');
                prosesPesan({ key: msg.key, message: proto.editedMessage });
                return;
            }
        }
        prosesPesan(m.messages[0]);
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const { key, update } of updates) {
            const wrapper = update.message || update.msg;
            if (!wrapper) continue;
            const inner = wrapper.editedMessage?.message || wrapper;
            prosesPesan({ key, message: inner });
        }
    });
}

startBot();
