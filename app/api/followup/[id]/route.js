import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'

// ✅ GET ตาม followupID
export async function GET(req, { params }) {
  const db = await connectDB()
  const [rows] = await db.execute('SELECT * FROM followup WHERE followupID = ?', [params.id])
  return NextResponse.json(rows[0] ?? {})
}

// ✅ PUT (แก้ไข)
export async function PUT(req, { params }) {
  const db = await connectDB()
  const body = await req.json()
  const { followupDate, symptom, treatment, nextAppointment, note } = body
  await db.execute(
    `UPDATE followup SET followupDate=?, symptom=?, treatment=?, nextAppointment=?, note=? WHERE followupID=?`,
    [followupDate, symptom, treatment, nextAppointment, note, params.id]
  )
  return NextResponse.json({ ok: true, message: 'อัปเดตข้อมูลสำเร็จ' })
}

// ✅ DELETE (ลบ)
export async function DELETE(req, { params }) {
  const db = await connectDB()
  await db.execute('DELETE FROM followup WHERE followupID = ?', [params.id])
  return NextResponse.json({ ok: true, message: 'ลบข้อมูลสำเร็จ' })
}
