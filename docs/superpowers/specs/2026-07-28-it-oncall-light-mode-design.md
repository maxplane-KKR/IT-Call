# IT On-call Compensation Desk — Light Mode Design

## Goal

เพิ่มโหมดสว่างที่เข้าคู่กับ Liquid Glass dark mode เดิม พร้อมปุ่มสลับโหมดที่เข้าถึงได้และจำค่าหลัง reload สำหรับ local preview.

## User experience

- ค่าเริ่มต้นยังเป็น dark mode เพื่อรักษาภาพลักษณ์ operational console เดิม
- ปุ่มสลับโหมดอยู่ใน topbar ใกล้กับสถานะ `LOCAL PREVIEW` และปุ่มอัปเดตข้อมูล
- ปุ่มมีข้อความภาษาไทยที่บอกผลลัพธ์ถัดไป เช่น `โหมดสว่าง` เมื่ออยู่ใน dark mode และ `โหมดมืด` เมื่ออยู่ใน light mode พร้อม `aria-pressed`
- เมื่อเปลี่ยนโหมด สีของ canvas, glass cards, filters, KPI cards, analysis bars, table, notices และ tags จะเปลี่ยนผ่าน semantic tokens ชุดเดียวกัน
- เก็บค่าที่เลือกไว้ใน `localStorage` ด้วย key เฉพาะแดชบอร์ด และใช้ dark mode เป็น fallback หากค่าที่เก็บไม่ถูกต้อง

## Visual direction

Light mode ใช้ canvas สีฟ้าเทาอ่อนแบบกระดาษงานปฏิบัติการ, glass surfaces สีขาวโปร่ง, ตัวอักษร navy, เส้นขอบ blue-gray และ accent blue/green เดิมที่เข้มขึ้นเพื่อผ่าน contrast. Signature ของ Liquid Glass ยังคงอยู่ที่แผงโปร่ง, blur, gradient ขอบ และ ambient orbs ที่ลดความเข้มลง.

## Technical design

- เพิ่ม pure theme helpers ใน `lib/theme.mjs` เพื่อกำหนด theme ที่ถูกต้อง, คำนวณ theme ถัดไป และสร้าง label ของปุ่ม
- `app/page.tsx` จะเก็บ state `dark | light`, sync `document.documentElement.dataset.theme` และ persist เฉพาะตอนผู้ใช้กดสลับ
- `app/globals.css` จะใช้ semantic variables และ override tokens ใน `html[data-theme="light"]`; ไม่สร้าง duplicate component markup
- ไม่เพิ่ม dependency ใหม่ และไม่แตะ data/filter logic เดิม

## Accessibility and responsive requirements

- ปุ่มขนาดอย่างน้อย 44×44px, มี visible focus ring, `aria-label`, `aria-pressed` และข้อความที่สื่อผลลัพธ์
- ไม่ใช้สีอย่างเดียวสื่อสถานะ และรักษา reduced-motion rule เดิม
- ไม่มี horizontal overflow ที่ 1440, 1024, 768 และ 375px
- Light mode ต้องตรวจ contrast ของ body text, muted text, buttons, tags และ table rows ใน browser

## Verification

- Unit tests สำหรับ theme validation, toggle order และ label
- Render test ตรวจว่ามี theme toggle และไม่มี starter infrastructure
- Browser test ตรวจ dark → light → dark, localStorage persistence, geometry และ visual preview หลักบน desktop/mobile
