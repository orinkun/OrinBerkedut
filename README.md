# ORIN Ultra — Termux Fix

Versi ini TIDAK memakai `better-sqlite3`, karena package tersebut membutuhkan native build dan sering gagal di Termux/Android.

Data akun/order disimpan sementara di `data.json`.

## Instalasi baru di Termux
cd ~/storage/downloads
unzip orin_ultra_termux_fix.zip -d ~/orin-ultra-fix
cd ~/orin-ultra-fix
cp .env.example .env
nano .env

Lalu:
npm install
npm start

Buka http://localhost:3000

## Jika sebelumnya memakai folder orin-ultra lama
Jangan jalankan `npm install` di folder lama. Gunakan folder `orin-ultra-fix` ini agar `better-sqlite3` tidak ikut terinstall.

## Penting
- API key hanya di `.env`.
- `data.json` berisi data akun/order; untuk produksi gunakan database server yang proper.
- Session memory store cocok untuk testing lokal, bukan produksi.

## V3 UI
- Entrance animation saat pertama dibuka
- Ripple/click animation pada tombol
- Modal login/register pop animation
- Validasi email .com di browser dan server
- Tombol Hubungi Admin/WhatsApp tetap tersembunyi sampai status pembayaran `paid`/`settlement`

## V4 fixes
- Memperbaiki regex validasi email `.com` di frontend.
- Branding produk menjadi Alight Motion Premium.
- Jika email saat daftar sudah terdaftar, UI mengarahkan user ke tab Login.
- Menambahkan catatan agar penjualan/distribusi akun sesuai hak dan ketentuan layanan.

## V5 ULTRA
- Cinematic hero with orbit rings and ambient glow
- Interactive mouse glow and floating particles
- Product showcase for Alight Motion Premium
- Hover lift + light-sweep cards
- Scroll reveal animations
- Premium checkout presentation
