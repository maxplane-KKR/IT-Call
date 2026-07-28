# Mobile Metric Strip Design

## Goal

แสดงการ์ดตัวชี้วัด 4 ใบในแถวเดียวบนมือถือ โดยย่อให้พอดีความกว้างหน้าจอตั้งแต่ 320 พิกเซลขึ้นไป ไม่มี horizontal scroll และไม่เปลี่ยนหน้าตา desktop

## Approved approach

สร้าง metric strip สำหรับมือถือแยกจากชุดการ์ด desktop:

- ชุด desktop ใช้โครงสร้างและสไตล์เดิม
- ชุด mobile แสดงเฉพาะหน้าจอกว้างไม่เกิน 600 พิกเซล
- ใช้ grid 4 คอลัมน์ขนาดเท่ากัน `repeat(4, minmax(0, 1fr))`
- ใช้ระยะห่าง ไอคอน และตัวอักษรแบบ compact เพื่อให้พอดีจอโดยไม่เลื่อน

## Mobile card content

การ์ดมือถือทั้ง 4 ใบเรียงตามลำดับเดิม:

1. `Ticket` — จำนวนรายการ
2. `แผนก` — แผนกที่แจ้งมากที่สุด
3. `ผู้รับ` — ผู้ปฏิบัติงานที่รับเรื่องมากที่สุด
4. `สถานะ` — สถานะการดึงข้อมูลแบบย่อ

ค่าข้อมูลต้องอยู่บรรทัดเดียว ใช้ ellipsis เมื่อข้อความยาว และเก็บข้อความเต็มใน `title` กับ accessible label

## Responsive behavior

- มากกว่า 600 พิกเซล: แสดงการ์ด desktop และซ่อน metric strip มือถือ
- ไม่เกิน 600 พิกเซล: ซ่อนการ์ด desktop และแสดง metric strip มือถือ
- grid ต้องไม่ขยายความกว้างเอกสารและต้องไม่มี horizontal overflow
- การ์ดทั้ง 4 ใบมีความสูงเท่ากันและคงสี accent เดิม: น้ำเงิน ม่วง ส้ม เขียว

## Data flow

เพิ่ม element ID สำหรับค่าบนมือถือ และปรับ JavaScript ให้ helper เดียวอัปเดตค่าทั้ง desktop และ mobile:

- จำนวน Ticket
- แผนกสูงสุด
- ผู้รับเรื่องสูงสุด
- สถานะ API

สถานะมือถือใช้ข้อความย่อ เช่น `กำลังโหลด`, `สำเร็จ`, `ไม่มีข้อมูล`, `ผิดพลาด` ขณะที่ desktop คงข้อความเดิม

## Accessibility

- metric strip มีชื่อกลุ่มที่ screen reader เข้าใจ
- การ์ดแต่ละใบมี accessible label ที่รวมชื่อ metric และค่าปัจจุบัน
- ข้อความที่ถูกตัดด้วย ellipsis ต้องอ่านค่าเต็มได้จาก `title`
- ไม่ลดขนาดพื้นที่จนเกิด horizontal overflow ที่ 320 พิกเซล

## Verification

- Regression test ยืนยันว่ามี desktop และ mobile metric markup แยกกัน
- Regression test ยืนยันว่า JavaScript อัปเดตค่าทั้งสองชุด
- Build, test suite และ lint ต้องผ่าน
- ตรวจ UI จริงที่ 320×800, 360×800 และ 390×844
- ตรวจว่า 4 การ์ดอยู่แถวเดียว ไม่มี page-level horizontal overflow และค่ากรองข้อมูลยังอัปเดตทันที
- เผยแพร่ Sites เวอร์ชันใหม่และตรวจ production URL หลัง deployment สำเร็จ

## Out of scope

- ไม่เปลี่ยนการ์ด desktop
- ไม่เปลี่ยน API, Apps Script หรือสูตรคำนวณ
- ไม่เปลี่ยนกราฟ ตาราง หรือส่วนรายงาน HR
