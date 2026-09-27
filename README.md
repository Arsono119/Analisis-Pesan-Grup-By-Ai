# Analisis-Pesan-Grup-By-Ai

Bot WhatsApp (library [Baileys](https://github.com/WhiskeySockets/Baileys)) untuk **memantau pesan grup** berdasarkan keyword, lalu **meneruskan (forward) alert** ke nomor target. Cocok untuk memantau grup yang ramai tanpa harus baca semua pesan.

## Fitur

- Pantau pesan teks semua grup yang diikuti akun bot, termasuk **caption gambar**.
- Deteksi juga **pesan yang diedit** (via event upsert & update).
- Kalau pesan mengandung keyword → kirim alert `🔴 keyword` + pengirim + isi pesan ke nomor target (dengan mention).
- **Anti-duplikat**: pesan yang sama tidak dikirim ulang dalam 5 menit.
- Command `ping` → balas `🏓 Pong! Bot aktif.` (kirim ke chat pribadi bot).

## Syarat

- Node.js 18+ (`node --version`)
- Nomor WhatsApp yang mau dijadikan akun bot

## Instalasi

```bash
git clone https://github.com/Arsono119/Analisis-Pesan-Grup-By-Ai.git
cd Analisis-Pesan-Grup-By-Ai
npm install
```

## Konfigurasi

Edit `config.js`:

```js
module.exports = {
    sesiLogin: 'sesi_login',     // folder penyimpanan sesi login
    nomorHP: '628xxxxxxxxxx',    // nomor WhatsApp akun bot (tanpa +)
    pesanAktif: '\n🎉 BOT ANALISIS GRUP AKTIF!',

    keywords: {
        'urgent': ['628xxxxxxxxxx@s.whatsapp.net'],   // keyword → nomor penerima alert
        'penting': ['628xxxxxxxxxx@s.whatsapp.net'],
    }
};
```

- `nomorHP`: nomor akun bot (format internasional tanpa `+`).
- `keywords`: nama keyword (huruf kecil) → daftar nomor WhatsApp penerima alert (format `62...@s.whatsapp.net`).
- Lihat `config.example.js` sebagai template bersih.

## Menjalankan

```bash
node index.js
```

1. Akan muncul **kode pairing 8 digit** (contoh: `XXXX-XXXX`).
2. Di HP: WhatsApp → ⋮ → **Linked Devices** → **Link a device** → masukkan kode.
3. Berhasil kalau muncul: `🎉 BOT ANALISIS GRUP AKTIF!`

### Biarkan jalan di background

```bash
nohup node index.js > wa.log 2>&1 &
```

Di Termux (Android): pasang `pkg install nodejs git` dulu, dan jalankan `termux-wake-lock` agar proses tidak mati saat layar mati.

## Cara Pakai

1. Masukkan akun bot ke grup yang mau dipantau (atau bot otomatis memproses semua grup yang sudah diikuti akun itu).
2. Setiap pesan grup yang mengandung keyword → nomor target menerima:
   ```
   🔴 keyword
   👤 @pengirim
   💬 isi pesan
   ```
3. Tes koneksi: kirim `ping` ke chat pribadi bot → dibalas `🏓 Pong! Bot aktif.`
4. Update bot ke versi terbaru:
   ```bash
   git pull
   npm install
   node index.js
   ```

## Catatan

- Sesi login tersimpan di folder `sesi_login/` (sudah masuk `.gitignore`, aman tidak ter-upload).
- Jangan jalankan lebih dari satu instance dengan sesi yang sama.
- Baileys adalah library tidak resmi — gunakan untuk keperluan pribadi/edukasi dan waspada risiko pemblokiran akun WhatsApp.
