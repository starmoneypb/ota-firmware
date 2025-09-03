
# MQTT OTA Manager (Next.js + GitHub Pages)

## Quick Start (Dev)
1. `npm i`
2. `npm run dev`
3. เปิด http://localhost:3000

## Build + Static Export (สำหรับ GitHub Pages)
```bash
npm run build
# ได้โฟลเดอร์ out/ สำหรับนำไป deploy
```

### Deploy ไป GitHub Pages
- **User/Org Pages** (`<user>.github.io`): push ไฟล์ใน `out/` ไป branch ที่ตั้งค่าใน Settings → Pages (มักเป็น `main`).  
- **Project Pages** (`<user>.github.io/<repo>`): build ด้วย env `NEXT_PUBLIC_BASE_PATH="/<repo>"` แล้ว deploy `out/` ไป branch `gh-pages`.

## ตั้งค่าในหน้าเว็บ
กรอก **Owner/Repo/Branch/Base URL/PAT** แล้วระบบจะอัปโหลด `.bin` ไปที่ `${Repo}/${otaDir}` และสร้าง URL เช่น  
`https://<owner>.github.io/ota-firmware/firmware_1_0_1.bin`

- ใช้ Fine‑grained PAT (scope: *Contents read/write* เฉพาะ repo เป้าหมาย)
- ไฟล์ ≤ 100MB (ข้อจำกัดของ GitHub Contents API)

## MQTT
เชื่อมต่อ `wss://test.mosquitto.org:8081` (path `/mqtt`). แสดงสถานะการเชื่อมต่อบน UI

## หมายเหตุ
เบราว์เซอร์ใช้ TCP :1883 ไม่ได้ จึงต้องใช้ MQTT over WebSocket (wss:8081).
