// app/api/elderly/exists/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const citizenID = (searchParams.get("citizenID") || "").trim();

  if (!citizenID) {
    return NextResponse.json(
      { exists: false, message: "citizenID required" },
      { status: 400 }
    );
  }

  try {
    const db = await connectDB();
    const [rows] = await db.query(
      "SELECT elderlyID, citizenID, name FROM elderly WHERE citizenID = ? LIMIT 1",
      [citizenID]
    );

    if (rows.length > 0) {
      const row = rows[0];
      return NextResponse.json(
        { exists: true, elderlyID: row.elderlyID, citizenID: row.citizenID, name: row.name },
        { status: 200 }
      );
    }
    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (err) {
    console.error("GET /elderly/exists error:", err);
    return NextResponse.json({ exists: false, error: "internal error" }, { status: 500 });
  }
}
