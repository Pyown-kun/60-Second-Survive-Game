# DESAIN.md — Last 60 Seconds: Survival Arena

> Dokumen spesifikasi produk dan desain untuk dibaca oleh Claude Code sebelum mengubah atau melanjutkan kode.
> Bahasa UI game: Indonesia. Nama produk dan label teknis boleh menggunakan bahasa Inggris.
> Target: prototype game browser yang bisa dijalankan lokal dan dideploy ke Vercel/Netlify.

## 1. Ringkasan Produk

**Last 60 Seconds: Survival Arena** adalah game survival arena 2D top-down. Pemain memilih satu karakter dengan statistik dan warna visual berbeda, lalu bertahan selama 60 detik dari gelombang monster. Karakter bergerak dengan keyboard, sedangkan arah tembakan dikendalikan pemain dengan mouse dan menembak dengan klik kiri. Setelah timer 60 detik habis, pemain yang masih hidup menghadapi boss fight; menang hanya jika boss dikalahkan. Pemain mengumpulkan koin, XP, dan item pemulihan, naik level, memilih upgrade, lalu melihat ringkasan hasil permainan.

### Pilar desain
1. **Langsung dimainkan:** dari menu utama menuju gameplay maksimal dua klik.
2. **Karakter punya identitas:** karakter yang dipilih harus terlihat di menu, HUD, dan arena; statistiknya memengaruhi gameplay.
3. **Baca situasi dengan cepat:** health, waktu, wave, XP, kills, dan koin mudah dipahami.
4. **Replayability:** spawn musuh, drop item, dan pilihan upgrade memberi variasi setiap ronde.
5. **Browser-first:** tidak memerlukan akun, backend, atau aset eksternal agar prototype dapat dimainkan.

## 2. Teknologi dan Batasan

- React + TypeScript untuk menu, HUD, pemilihan karakter, layar jeda, upgrade, dan hasil.
- Vite sebagai development server dan bundler.
- HTML Canvas 2D untuk arena, karakter, musuh, proyektil, efek, dan latar.
- CSS biasa untuk UI responsif; hindari menambah UI framework kecuali diminta.
- Lucide React untuk ikon antarmuka.
- Tidak perlu server/backend untuk prototype.
- Jangan mengandalkan URL gambar eksternal untuk sprite inti. Gunakan Canvas/CSS atau aset lokal.
- Jangan mengubah proyek menjadi game 3D.

## 3. Cara Menjalankan

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
npm run preview
```

Konfigurasi deployment Vercel/Netlify:
- Build command: `npm run build`
- Output directory: `dist`

## 4. Arah Visual

### Tema
Pixel-art-inspired sci-fi survival, cyberpunk yang suram, dengan aksen neon biru/cyan. Walaupun prototype menggunakan bentuk Canvas/CSS untuk sprite, hasil akhirnya harus terasa seperti arcade game yang konsisten.

### Palet warna

| Token | Warna | Penggunaan |
|---|---|---|
| Background | `#050B16` | Latar aplikasi |
| Panel | `#09182A` | Panel dan kartu |
| Panel terang | `#10243B` | Modal / panel fokus |
| Border | `#183B5D` | Garis pembatas |
| Cyan | `#50D9FF` | Aksi utama, fokus, proyektil |
| Blue | `#1979DB` | Tombol utama dan progress |
| Danger | `#FF5268` | Health rendah, damage, kalah |
| Success | `#58F2A5` | Status siap dan berhasil |
| Muted text | `#7892AD` | Teks sekunder |
| Main text | `#E9F4FF` | Teks utama |

### Tipografi
- Judul: Barlow Condensed, tebal, huruf kapital.
- UI: Rajdhani, mudah dibaca dengan nuansa sci-fi.
- Jangan mengorbankan keterbacaan untuk efek dekoratif.
- Efek glow digunakan secukupnya pada fokus, bukan pada semua elemen.

### Komposisi
- Header: logo, status game, kontrol suara.
- Menu desktop: panel hero di kiri; pemilihan karakter dan statistik di kanan.
- Gameplay: HUD di atas, arena besar di tengah, petunjuk kontrol dan XP di bawah.
- Hasil ronde: kartu terpusat berisi status, kills, coins, waktu bertahan, tombol coba lagi dan ganti karakter.
- Di layar kecil, layout berubah menjadi satu kolom; kontrol dan informasi penting tidak boleh terpotong.

## 5. Halaman dan State

### A. Main Menu
Elemen:
- Brand/title `LAST 60 SECONDS — SURVIVAL ARENA`.
- Tombol `MULAI BERTAHAN`.
- Grid pilihan 8 karakter.
- Detail karakter aktif: nama, role, perk, health, damage, speed.
- Tombol konfirmasi karakter.
- Panel tip survival.
- Kontrol suara dapat di-toggle; jika audio belum diimplementasikan, jangan mengklaim suara benar-benar aktif.

Interaksi:
- Klik kartu karakter langsung memperbarui karakter aktif dan detail statistik.
- Tombol mulai membuat state ronde baru dan menggunakan karakter aktif.
- Mengganti karakter setelah ronde berakhir harus mempertahankan pilihan karakter baru untuk ronde berikutnya.

### B. Gameplay
HUD harus menunjukkan:
- Nama karakter dan level.
- Health saat ini dan maksimum.
- Timer hitung mundur dari 60 detik.
- Koin, jumlah kill, wave.
- XP dan level.

Arena:
- Tampilan top-down 2D.
- Latar gelap dengan grid/debris ringan.
- Pemain tampak berbeda dari musuh dan memiliki indikator posisi.
- Musuh mendekati pemain dan memberi damage saat berada dekat.
- Arah tembakan mengikuti posisi kursor mouse; crosshair tampil di arena.
- Proyektil mengenai musuh dan mengurangi health mereka.
- Musuh yang kalah bisa menjatuhkan koin, XP, atau health.
- Wave bertambah sepanjang ronde dan tingkat tekanan meningkat.

Kontrol:
- `W`, `A`, `S`, `D` atau tombol panah: bergerak.
- `P`: pause/resume.
- Mouse: mengarahkan bidik (crosshair), klik kiri (atau tahan) untuk menembak.
- Kontrol harus berfungsi ketika canvas fokus maupun setelah klik tombol UI.

### C. Pause
- Menghentikan simulasi game dan timer.
- Tombol lanjutkan kembali ke simulasi tanpa reset.
- Tombol kembali ke menu keluar dari ronde aktif.

### D. Level Up
Saat XP melewati ambang level:
- Tampilkan modal overlay yang menjeda simulasi pada setiap kenaikan level.
- Pilihan upgrade minimal: damage, speed, heal/health.
- Pilihan upgrade diterapkan ke ronde aktif.
- Setelah pilihan diambil, game berlanjut.
- Hindari membuka beberapa modal level-up secara tumpang tindih bila XP bertambah cepat.

### E. Result
- Menang jika pemain bertahan hingga timer habis.
- Kalah jika health mencapai nol sebelum timer habis.
- Tampilkan kills, coins, dan lama bertahan.
- `COBA LAGI` memulai ronde baru dengan karakter yang sama.
- `GANTI KARAKTER` kembali ke menu.
- Hasil tidak boleh menyatakan menang jika health sudah habis pada saat timer mencapai nol.

## 6. Daftar Karakter

Karakter adalah data, bukan komponen UI yang diduplikasi manual. Tambahkan karakter baru dengan menambah data pada registry karakter dan pastikan semua komponen membaca registry tersebut.

| ID | Nama | Role | HP | Speed | Damage | Perk |
|---|---|---|---:|---:|---:|---|
| `rebel` | Rebel | All-rounder | 100 | 2.7 | 16 | Statistik seimbang |
| `soldier` | Soldier | Tank | 140 | 2.25 | 18 | HP tinggi, gerak lebih lambat |
| `hacker` | Hacker | Critical | 80 | 3.15 | 24 | Damage tinggi, HP rendah |
| `ninja` | Ninja | Speed | 90 | 3.6 | 15 | Karakter tercepat |
| `medic` | Medic | Support | 110 | 2.65 | 14 | Regenerasi HP berkala |
| `engineer` | Engineer | Builder | 105 | 2.55 | 17 | Bonus koin |
| `android` | Android | Shield | 120 | 2.5 | 16 | Indikator perisai energi |
| `phantom` | Phantom | Assassin | 85 | 3.25 | 22 | Damage tinggi dan lincah |

### Ketentuan karakter
- Karakter harus bisa dipilih dari menu.
- Pilihan memengaruhi sprite/warna, HP maksimum, speed, damage, dan perk.
- HUD harus mengikuti karakter yang dipilih.
- Pemilihan karakter tidak boleh sekadar mengubah nama atau avatar.
- Hindari menyimpan pilihan karakter di beberapa state yang bisa tidak sinkron; gunakan satu sumber kebenaran.

## 7. Aturan Gameplay

### Pergerakan
- Input diagonal dinormalisasi agar tidak lebih cepat daripada gerak horizontal/vertikal.
- Kecepatan pemain diinterpolasi menuju arah input (akselerasi/deselerasi) agar gerakan terasa mulus, tanpa lompatan posisi.
- Posisi pemain dibatasi di area arena.
- Kecepatan pergerakan disesuaikan dengan ukuran layar atau satuan world yang konsisten.

### Musuh
- Spawn dari sisi arena atau titik di luar pandangan pemain.
- Musuh mengejar posisi pemain.
- Musuh biasa mempunyai HP, speed, ukuran, dan damage sederhana.
- Boss atau musuh elite dapat muncul pada bagian akhir ronde.
- Jumlah musuh dibatasi agar browser tidak drop frame.

### Combat
- Arah tembakan mengikuti kursor mouse (manual aim).
- Menembak dengan klik kiri mouse; menahan tombol menembak beruntun dengan cooldown yang jelas.
- Proyektil bergerak ke target dan menghilang setelah hit atau melewati batas hidup.
- Feedback hit berupa flash singkat atau efek visual ringan.
- Semua update simulasi harus memakai delta time agar kecepatan relatif konsisten di berbagai frame rate.

### Pickup dan progres
- Koin meningkatkan skor/koin ronde.
- XP meningkatkan progress level.
- Heal memulihkan HP tanpa melebihi HP maksimum.
- XP yang cukup memicu level up; jika XP melewati ambang lebih dari sekali, level-up harus ditangani dengan aman.

### Menang/kalah
- Ronde berdurasi 60 detik; setelah timer habis, pemain yang masih hidup memasuki boss fight dan harus mengalahkan boss untuk menang.
- Boss memiliki HP besar dan damage kontak lebih tinggi; boss muncul saat timer mencapai nol.
- Timer dan health harus dihitung di dalam simulasi, bukan hanya animasi UI.
- Saat ronde selesai, hentikan loop atau tandai simulasi sebagai selesai agar tidak ada update state setelah unmount.
- Restart harus menghapus musuh, proyektil, pickup, timer, XP, koin, kill, dan upgrade khusus ronde sebelumnya kecuali upgrade permanen memang dirancang.

## 8. Arsitektur Kode yang Disarankan

Saat mengembangkan lebih lanjut, pertahankan pemisahan tanggung jawab:

```text
src/
  main.tsx
  App.tsx
  style.css
  game/
    types.ts
    characters.ts
    createInitialState.ts
    simulation.ts
    render.ts
    input.ts
  components/
    CharacterCard.tsx
    CharacterGrid.tsx
    CharacterStats.tsx
    GameHUD.tsx
    GameCanvas.tsx
    PauseOverlay.tsx
    UpgradeOverlay.tsx
    ResultScreen.tsx
```

Ini adalah target refactor yang disarankan, bukan alasan untuk menulis ulang seluruh prototype tanpa kebutuhan. Bila refactor dilakukan, jaga fitur yang sudah bekerja.

### Prinsip implementasi
- Pisahkan data karakter dari UI.
- Pisahkan simulasi gameplay dari rendering Canvas.
- Hindari memanggil React `setState` setiap frame; sinkronkan HUD dengan interval yang wajar.
- Gunakan `requestAnimationFrame` dan batalkan frame saat komponen dibersihkan.
- Bersihkan event listener `keydown`, `keyup`, dan `resize`.
- Jangan membuat loop game ganda saat React Strict Mode menjalankan effect ulang di development.
- Gunakan `useRef` untuk state simulasi yang sering berubah.
- Definisikan type TypeScript eksplisit untuk karakter, enemy, projectile, pickup, dan game state.
- Jangan gunakan `any` kecuali ada alasan kuat dan terdokumentasi.
- Semua tombol yang tampil harus memiliki aksi nyata atau dinonaktifkan dengan jelas.
- Pastikan build TypeScript lulus.

## 9. Responsivitas dan Aksesibilitas

- Desktop: layout dua kolom untuk menu dan arena lebar.
- Tablet: kurangi jarak dan ukuran panel, tetapi pertahankan grid karakter yang mudah dipilih.
- Mobile: satu kolom, teks tidak overflow, tombol memiliki target sentuh yang cukup besar.
- Tombol harus memiliki focus state.
- Jangan mengandalkan warna saja untuk menyampaikan status; tambahkan label atau ikon.
- Hormati `prefers-reduced-motion` untuk animasi dekoratif bila memungkinkan.
- Pastikan kontras teks sekunder tetap terbaca.

## 10. Kriteria Penerimaan

Prototype dianggap siap bila:
1. `npm install` berhasil.
2. `npm run build` berhasil tanpa error TypeScript.
3. Menu utama tampil baik di desktop dan mobile.
4. Semua 8 karakter dapat dipilih.
5. Karakter terpilih benar-benar digunakan di arena.
6. Statistik karakter memengaruhi gameplay.
7. WASD dan arrow keys menggerakkan pemain.
8. Musuh spawn, mengejar, menerima damage, dan dapat dikalahkan.
9. Arah bidik mengikuti mouse dan klik kiri menembak.
10. Health, timer, wave, XP, koin, dan kill terbarui dengan benar.
11. Pause menghentikan timer dan simulasi.
12. Level-up membuka pilihan upgrade dan melanjutkan permainan setelah dipilih.
13. Ronde berakhir dengan hasil menang/kalah yang benar: menang hanya setelah boss dikalahkan setelah timer habis; kalah jika health habis.
14. Restart mereset state ronde.
15. Tombol kembali dan ganti karakter berfungsi.
16. Tidak ada error fatal di console atau state update setelah komponen dilepas.
17. Semua aset inti tersedia lokal atau digambar melalui Canvas/CSS.

## 11. Prioritas Pengembangan

### P0 — Wajib
- Build berhasil.
- Pemilihan karakter.
- Gameplay loop stabil.
- Movement, enemy, shooting, health, timer, result.
- Pause/restart.

### P1 — Sangat diinginkan
- Level-up dan upgrade.
- Drop item dan perk karakter.
- Layout responsif.
- Feedback hit dan efek visual.

### P2 — Setelah prototype stabil
- Sprite sheet pixel art asli.
- Sound effect dan musik.
- Local high score.
- Mobile virtual joystick.
- Pilihan tingkat kesulitan.
- Save setting dan karakter terakhir.
- Leaderboard online dengan backend.

## 12. Instruksi untuk Claude Code

Sebelum mengubah kode:
1. Baca `DESAIN.md` secara keseluruhan.
2. Baca `README.md` dan periksa struktur project yang benar-benar ada.
3. Jalankan build atau periksa error yang ada sebelum melakukan perubahan besar.
4. Pertahankan stack React + TypeScript + Vite.
5. Jangan mengganti game menjadi dokumen desain atau mockup statis; targetnya tetap game browser yang bisa dimainkan.
6. Kerjakan perubahan kecil dan terukur, lalu jalankan `npm run build`.
7. Jika implementasi aktual berbeda dari dokumen ini, prioritaskan tujuan produk dan kriteria penerimaan; perbarui dokumen jika ada keputusan desain baru.
8. Jangan mengklaim fitur sudah selesai bila belum benar-benar diuji.

### Prompt awal yang dapat diberikan kepada Claude Code

> Baca `DESAIN.md` dan `README.md` terlebih dahulu. Audit project React + TypeScript ini, jalankan pemeriksaan build, lalu perbaiki masalah gameplay dan struktur tanpa menghilangkan fitur yang sudah ada. Pastikan delapan karakter dapat dipilih dan statistik mereka benar-benar memengaruhi gameplay. Verifikasi timer, pause, level-up, restart, result, responsivitas, dan cleanup requestAnimationFrame/event listener. Jalankan `npm run build` setelah perubahan dan laporkan file yang diubah serta hasil verifikasinya.
