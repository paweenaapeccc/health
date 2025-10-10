import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // ✅ ปรับ path ให้ตรงกับโปรเจกต์ของคุณ

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const citizen = searchParams.get("citizen");

    if (!citizen) {
      return NextResponse.json(
        { ok: false, error: "กรุณาระบุเลขบัตรประชาชน" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    // 🔍 ค้นหาผู้สูงอายุจากตาราง elderly
    const [rows] = await db.execute(
      `
      SELECT
        elderlyID,
        name,
        phonNumber,
        citizenID,
        gender,
        address,
        subdistrict,
        district,
        province,
        latlong
      FROM elderly
      WHERE citizenID = ?
      LIMIT 1
      `,
      [citizen]
    );

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "ไม่พบข้อมูลผู้สูงอายุ" },
        { status: 404 }
      );
    }

    // ✅ แปลง latlong เป็น lat/lng แยก
    const r = rows[0];
    let lat = null, lng = null;
    if (r.latlong) {
      const parts = String(r.latlong).split(/[, ]+/).filter(Boolean);
      if (parts.length >= 2) {
        lat = parseFloat(parts[0]);
        lng = parseFloat(parts[1]);
      }
    }

    const result = {
      elderlyID: r.elderlyID,
      name: r.name,
      citizenID: r.citizenID,
      phone: r.phoneNumber,
      gender: r.gender,
      address: r.address,
      subdistrict: r.subdistrict,
      district: r.district,
      province: r.province,
      lat,
      lng,
      latlong: r.latlong,
    };

    return NextResponse.json({ ok: true, rows: [result] });
  } catch (err) {
    console.error("GET /api/executive/map error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
