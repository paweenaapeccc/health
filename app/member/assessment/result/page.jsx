// app/member/assessment/result/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AssessmentResultPage() {
  const sp = useSearchParams(); // ✅ บนสุด
  const assessmentId = (sp.get("assessmentId") || "").toUpperCase();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assessmentId) {
      setError("ไม่พบรหัสผลการประเมิน");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/assessment_results/${assessmentId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "โหลดข้อมูลไม่สำเร็จ");
        setRow(json?.data ?? null);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId]);

  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;

  const name = row?.elderlyName || "-";
  const resultText = row?.resultText ?? row?.as_results ?? "-";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">ผลการประเมิน</h1>

        <p className="text-lg text-gray-700 mb-4">
          <span className="font-semibold">ชื่อผู้ถูกประเมิน:</span> {name}
        </p>
        <p className="text-lg text-gray-700 mb-4">
          <span className="font-semibold">ผลการประเมิน:</span> {resultText}
        </p>

        <a
          href="/member/assessment"
          className="inline-block mt-6 px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
        >
          กลับไปหน้าประเมิน
        </a>
      </div>
    </div>
  );
}
