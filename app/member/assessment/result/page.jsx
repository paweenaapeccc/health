// app/member/assessment/result/page.jsx
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AssessmentResultPage() {
  const sp = useSearchParams();
  const assessmentId = sp.get("assessmentId");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assessmentId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/assessment_results/${encodeURIComponent(assessmentId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        setRow(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId]);

  if (!assessmentId) return <div className="p-6 text-gray-600">ไม่พบพารามิเตอร์ assessmentId</div>;
  if (loading) return <div className="p-6">กำลังโหลด...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const result = row?.data;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">ผลการประเมิน</h1>

        {result ? (
          <>
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">ชื่อผู้ถูกประเมิน:</span>{" "}
              {result.elderlyName}
            </p>
            <p className="text-lg text-gray-700 mb-4">
              <span className="font-semibold">ผลการประเมิน:</span>{" "}
              {result.as_results}
            </p>
          </>
        ) : (
          <p className="text-gray-500">ไม่พบผลการประเมิน</p>
        )}

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
