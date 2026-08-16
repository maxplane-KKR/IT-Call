# สเป็กรีดีไซน์ IT-Call แบบ Command Ribbon

วันที่: 16 สิงหาคม 2569  
สถานะ: ผ่านการอนุมัติดีไซน์ทั้ง 3 ส่วน

## 1. เป้าหมาย

รีดีไซน์หน้า IT Call Center Analytics ให้เป็น Dashboard สำหรับงานปฏิบัติการที่เห็นภาพรวมได้รวดเร็ว รองรับ Desktop, Touch Tablet และมือถืออย่างสมบูรณ์ โดยรักษาข้อมูล ฟิลเตอร์ รายงาน HR การส่งออก CSV กราฟ รายการแจ้งซ่อม PWA และพฤติกรรม API เดิมไว้

ระบบสีใช้ `CARD-THEME-CONFIG.md` เป็นต้นแบบ และติดตั้งตัวเลือกครบ 6 ธีม พร้อม Light/Dark Glass, opacity, blur และ Custom Image

## 2. ข้อสรุปที่อนุมัติแล้ว

- โครงสร้างหลัก: **Command Ribbon**
- หน้าแรกเน้น: ภาพรวมงาน IT วันนี้และเดือนปัจจุบัน
- Desktop: Dashboard เต็มรูปแบบตั้งแต่ `1280px` ขึ้นไป
- Touch Tablet: กริด 2 คอลัมน์และ Bottom Tabs ช่วง `768–1279px`
- Mobile: คอลัมน์เดียวและ Bottom Tabs ช่วง `320–767px`
- ตำแหน่งตั้งค่าธีม: ปุ่มบน Header
  - Desktop เปิด Side Drawer
  - Tablet/Mobile เปิด Bottom Sheet
- ค่าเริ่มต้น: Netflix + Dark Glass + opacity 88% + blur 12px
- Custom Image ใช้เฉพาะพื้นหลัง Hero Overview และอยู่เฉพาะ session

## 3. โครงสร้างข้อมูลบนหน้า

ลำดับข้อมูลต้องเหมือนกันทุก viewport เพื่อให้ผู้ใช้สลับอุปกรณ์แล้วไม่ต้องเรียนรู้ใหม่:

1. Header: ชื่อระบบ สถานะข้อมูล เวลาอัปเดต ปุ่มรีเฟรช และปุ่มธีม
2. Hero Overview: สถานการณ์งาน IT และบริบทเดือนที่เลือก
3. Command Ribbon KPI: เคสทั้งหมด เคสวันนี้ ผู้รับผิดชอบ และแนวโน้มเทียบช่วงก่อน
4. แนวโน้มเคสรายวัน
5. ปัญหาและแผนกที่พบบ่อย
6. ภาระงานทีมและรายงาน HR
7. รายการแจ้งซ่อมล่าสุดและประวัติทั้งหมด

ข้อมูลเดิมทุกชุดยังเข้าถึงได้ผ่านแท็บ `ภาพรวม`, `ทีม IT`, `กราฟ` และ `บันทึกงาน` บน Tablet/Mobile โดยไม่เพิ่มแท็บธีมเป็นแท็บที่ห้า

## 4. Responsive Architecture

### Desktop (`>=1280px`)

- แสดง KPI 4 ช่องในแถวเดียว
- ส่วนวิเคราะห์หลักใช้กริดกราฟใหญ่คู่กับปัญหาที่พบบ่อย
- รายงานทีมและรายการล่าสุดอยู่ใต้ส่วนวิเคราะห์
- ตาราง Desktop และ pagination เดิมยังใช้งานได้
- Side Drawer ธีมกว้างคงที่และไม่ดัน layout หลัก

### Touch Tablet (`768–1279px`)

- ใช้กริดการ์ด 2 คอลัมน์ที่เหมาะกับการสัมผัส
- คง Bottom Tabs และ swipe navigation เดิม
- ไม่ย่อตาราง Desktop ลงในพื้นที่แคบ
- Theme Bottom Sheet สูงไม่เกิน `78dvh` และเลื่อนได้ภายใน

### Mobile (`320–767px`)

- ใช้คอลัมน์เดียว ไม่มี horizontal scroll
- KPI จัดเป็นกริด 2 คอลัมน์
- Bottom Tabs มี 4 รายการเดิมและคำนึงถึง safe area
- ปุ่มและ input มี touch target อย่างน้อย 44px
- Theme Bottom Sheet ไม่บังปุ่มบันทึกหรือเนื้อหาที่กำลังแก้ไข

## 5. Visual System

### ธีม

ระบบใช้ CSS variables เป็นแหล่งสีเดียว และรองรับพรีเซ็ตต่อไปนี้:

| ธีม | สีหลัก | บุคลิก |
|---|---:|---|
| Mint | `#10B981` | สดและสงบ |
| Neon | `#6366F1` | เทคโนโลยี |
| Rose | `#F43F5E` | เด่นและอบอุ่น |
| Sunset | `#F97316` | พลังงานสูง |
| Netflix | `#E50914` | ค่าเริ่มต้น ดำ-แดงคมชัด |
| Luxury | `#F59E0B` | สุขุมและพรีเมียม |

การเปลี่ยนพรีเซ็ตต้องอัปเดต accent, focus ring, chart palette, active states และพื้นหลังแอปโดยไม่เปลี่ยนความหมายของสีสถานะสำคัญ เช่น สำเร็จ คำเตือน และข้อผิดพลาด

### Glass และ Typography

- หัวข้อ: Kanit
- เนื้อหาไทย: Sarabun
- ตัวเลขและสถานะ: monospace ของระบบ
- Hero เป็นจุดตกแต่งหลักเพียงจุดเดียว ส่วนการ์ดข้อมูลใช้พื้นผิวที่สงบและมี contrast อย่างน้อย 4.5:1
- รองรับ `prefers-reduced-motion` และ `focus-visible`

## 6. พฤติกรรม Theme System

- เลือกพรีเซ็ต, opacity และ blur แล้วเห็นผลทันที
- Netflix บังคับ Glass ภายใน Hero เป็น Dark Glass
- Light/Dark ของแอปบันทึกทันที
- ค่าการ์ดบันทึกเมื่อกด `บันทึกการตั้งค่า`
- ค่าใน `localStorage` ต้องผ่าน whitelist และ clamp ก่อนใช้
- ใช้ storage keys เฉพาะโปรเจกต์ เช่น `it_call_card_preferences` และ `it_call_app_theme`
- Custom Image:
  - รับเฉพาะไฟล์รูปภาพขนาดไม่เกิน 8MB
  - ใช้กับ Hero Overview เท่านั้น
  - ห้ามกำหนดให้ `document.body.style.backgroundImage`
  - ไม่บันทึก Base64 ลง `localStorage`
  - ลบแล้วกลับไปใช้พรีเซ็ตล่าสุด

## 7. สถาปัตยกรรมและการไหลของข้อมูล

สายข้อมูล Dashboard เดิมยังเป็นแหล่งความจริงหลัก:

`/api/incidents` → timeout/retry → `processRawData` → `AppState` → filters → Desktop/Tablet/Mobile renderers

Theme System แยก state อิสระ:

`Theme Drawer` → validate/clamp → `ThemeState` → CSS variables/DOM classes → localStorage เฉพาะค่าที่ปลอดภัย

ข้อกำหนดสำคัญ:

- รักษา DOM IDs, `aria-controls`, `data-tab` และ selector ที่ JavaScript/tests เดิมใช้อยู่
- ไม่ refactor ระบบข้อมูลเดิมที่อยู่นอกขอบเขตรีดีไซน์
- เพิ่มโมดูล `public/js/theme-system.js` และให้ `public/js/app.js` เรียก initialization เท่านั้น
- ไม่เพิ่ม dependency หาก CSS และ JavaScript ปัจจุบันทำได้

## 8. Error Handling

- API ช้าหรือ offline: แสดงสถานะชัดเจนและคงข้อมูลล่าสุดไว้
- รูปแบบ API ไม่ถูกต้อง: แสดงข้อความที่บอกสาเหตุโดยไม่ทำให้ส่วนอื่นล่ม
- Theme JSON เสียหรือค่าเกินช่วง: fallback เป็น Netflix/Dark/88/12
- localStorage ใช้งานไม่ได้: เปลี่ยนธีมใน session ได้และแจ้งว่าไม่ได้บันทึก
- ไฟล์รูปไม่รองรับหรือเกิน 8MB: ปฏิเสธไฟล์และแสดงแนวทางแก้ไข
- กรณีไม่มีข้อมูล: แสดง empty state ที่บอกให้เปลี่ยนเดือน แผนก หรือคำค้น

## 9. ขอบเขตไฟล์ที่คาดว่าจะเปลี่ยน

- `public/IT-Call-Skeuomorph.html`: จัดลำดับ DOM ใหม่ เพิ่ม Theme Drawer/Bottom Sheet และรักษา IDs เดิม
- `public/css/styles.css`: เพิ่ม design tokens, 6 themes, Glass surfaces, Command Ribbon และ responsive rules
- `public/js/theme-system.js`: config, state, validation, storage และ event handlers ของธีม
- `public/js/app.js`: เชื่อม init ธีมและจุด sync ที่จำเป็นเท่านั้น
- `tests/`: เพิ่ม regression tests เฉพาะ Theme System และ responsive contract

จะไม่แก้ไฟล์ environment, lockfile, generated build output, API endpoint หรือโครงสร้างฐานข้อมูล

## 10. Verification Gate

ก่อนรายงานว่าเสร็จต้องมีหลักฐานจากดิสก์จริง:

1. รัน tests เดิมทั้งหมดสำหรับ API, HR, PWA, Mobile Tabs และ iPad
2. เพิ่ม tests สำหรับค่าเริ่มต้นธีม, whitelist/clamp, storage fallback และ Custom Image ไม่แตะ `body`
3. รัน `npm run lint`
4. รัน `npm run build`
5. ตรวจ browser ที่ viewport อย่างน้อย `360×800`, `768×1024`, `1024×768`, `1280×800` และ `1440×900`
6. ตรวจ horizontal overflow, keyboard focus, touch targets, Bottom Tabs, Drawer/Sheet, การ reload ค่าที่บันทึก และ reduced motion
7. ตรวจ final diff และ `git diff --check`

## 11. สิ่งที่อยู่นอกขอบเขต

- เปลี่ยน API หรือ Google Apps Script
- เปลี่ยนสูตรค่าตอบแทน HR
- เพิ่มระบบผู้ใช้หรือสิทธิ์ใหม่
- เพิ่มฐานข้อมูลหรือ dependency ใหม่
- Push, deploy หรือเผยแพร่ Production ก่อนตรวจสอบสิทธิ์และได้รับคำสั่งจากผู้ใช้

