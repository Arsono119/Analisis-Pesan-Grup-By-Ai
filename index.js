const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
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

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n═══════════════════════════════════════════');
            console.log('  SCAN QR CODE INI DENGAN WHATSAPP KAMU');
            console.log('  Buka WhatsApp > Titik 3 > Linked Devices');
            console.log('═══════════════════════════════════════════\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('\n⚠️  Koneksi terputus, reconnect...');
                startBot();
            } else {
                console.log('\n❌ Logout dari WhatsApp, scan QR lagi.');
            }
        } else if (connection === 'open') {
            console.log(config.pesanAktif);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
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
                    const pesanSingkat = teks.length > 80 ? teks.slice(0, 80) + '...' : teks;
                    await sock.sendMessage(target, {
                        text: `🔴 ${keyword}\n👤 @${pengirim.split('@')[0]}\n💬 ${pesanSingkat}`,
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
    });
}

startBot();
