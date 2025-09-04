// app/member/assessment/page.jsx  (หรือไฟล์ที่เป็นหน้าทำแบบประเมินของคุณ)
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const CHECK_ELDER_ENDPOINT = `${API_BASE}/elderly/exists`;
const SAVE_ASSESSMENT_ENDPOINT = `${API_BASE}/assessment`;               // healthassessment
const SAVE_RESULTS_ENDPOINT = `${API_BASE}/assessment_results`;          // assessmentresults

const QUESTIONS = [
  { id: "stiffness",        th: "ข้อเข่าฝืดตอนเช้าน้อยกว่า 30 นาที" },
  { id: "crepitus",         th: "มีเสียงกรอบแกรบเมื่อขยับข้อ" },
  { id: "bonyTenderness",   th: "กดเจ็บที่กระดูกข้อเข่า" },
  { id: "bonyEnlargement",  th: "ข้อใหญ่ผิดรูป" },
  { id: "noWarmth",         th: "ไม่พบข้ออุ่น" },
];

export default function KneeOAScreeningPage() {
  const router = useRouter();

  // --- Elderly ---
  const [elderName, setElderName] = useState("");
  const [elderVerified, setElderVerified] = useState(false);
  const [elderInfo, setElderInfo] = useState(null); // { elderlyID, name }
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  // --- Answers ---
  const [answers, setAnswers] = useState(
    Object.fromEntries(QUESTIONS.map(q => [q.id, null])) // "yes" | "no" | null
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const yesCount = useMemo(
    () => Object.values(answers).filter(v => v === "yes").length,
    [answers]
  );
  const allAnswered = useMemo(
    () => Object.values(answers).every(v => v !== null),
    [answers]
  );

  // คงไว้เพื่อส่งให้ backend (แต่ "ไม่แสดง" บนหน้านี้)
  const resultText = useMemo(() => {
    if (!elderVerified || !allAnswered) return "";
    return yesCount >= 2
      ? 'มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม (ตอบ "ใช่" ≥ 2 ข้อ)'
      : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";
  }, [elderVerified, allAnswered, yesCount]);

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };
  const reset = () => {
    setAnswers(Object.fromEntries(QUESTIONS.map(q => [q.id, null])));
    setSaveError("");
  };

  const checkElder = async () => {
    setChecking(true);
    setElderVerified(false);
    setElderInfo(null);
    setCheckError("");

    try {
      const url = `${CHECK_ELDER_ENDPOINT}?name=${encodeURIComponent(elderName.trim())}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data?.exists) {
        setElderVerified(true);
        setElderInfo({ elderlyID: data.elderlyID, name: data.name || elderName.trim() });
      } else {
        setCheckError("ไม่พบชื่อผู้สูงอายุในฐานข้อมูล กรุณาเพิ่มชื่อก่อนทำแบบประเมิน");
      }
    } catch {
      setCheckError("เกิดข้อผิดพลาดระหว่างตรวจสอบ");
    } finally {
      setChecking(false);
    }
  };

  // บันทึก 2 ขั้นตอน แล้ว "ไปหน้าแสดงผล"
  const submitAssessment = async () => {
    setSaveError("");

    if (!elderVerified) {
      setSaveError("ต้องตรวจสอบชื่อผู้สูงอายุให้ผ่านก่อน");
      return;
    }
    if (!allAnswered) {
      setSaveError("กรุณาตอบแบบประเมินให้ครบทุกข้อ");
      return;
    }

    setSaving(true);
    try {
      // 1) บันทึก healthassessment
      const payloadAssessment = {
        elderlyID: elderInfo.elderlyID,
        stiffness:       answers.stiffness === "yes" ? 1 : 0,
        crepitus:        answers.crepitus === "yes" ? 1 : 0,
        bonyTenderness:  answers.bonyTenderness === "yes" ? 1 : 0,
        bonyEnlargement: answers.bonyEnlargement === "yes" ? 1 : 0,
        noWarmth:        answers.noWarmth === "yes" ? 1 : 0,
      };

      const res1 = await fetch(SAVE_ASSESSMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadAssessment),
      });
      if (!res1.ok) {
        const err = await res1.json().catch(() => ({}));
        throw new Error(err?.error || "บันทึกการประเมินไม่สำเร็จ");
      }
      const data1 = await res1.json(); // { ok, assessmentID, yesCount, resultText }
      const assessmentID = data1.assessmentID;
      const yesFromServer = data1.yesCount ?? yesCount;
      const textFromServer = data1.resultText ?? resultText;

      // 2) บันทึก assessmentresults
      const payloadResults = {
        assessmentID,
        elderlyID: elderInfo.elderlyID,
        as_score: yesFromServer,
        as_results: textFromServer,
      };

      const res2 = await fetch(SAVE_RESULTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadResults),
      });
      if (!res2.ok) {
        const err = await res2.json().catch(() => ({}));
        throw new Error(err?.message || "บันทึกผลสรุปไม่สำเร็จ");
      }

      // ⮕ ไปหน้าแสดงผลเท่านั้น (หน้านี้ไม่โชว์ผล)
      router.push(`/member/assessment/result?assessmentId=${assessmentID}`);
    } catch (e) {
      setSaveError(e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          แบบประเมินคัดกรองโรคข้อเข่าเสื่อม
        </h1>

        {/* ผู้สูงอายุ */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อผู้สูงอายุ <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={elderName}
              onChange={(e) => {
                setElderName(e.target.value);
                setElderVerified(false);
                setElderInfo(null);
                setCheckError("");
              }}
              placeholder="พิมพ์ชื่อ-นามสกุลให้ตรงกับฐานข้อมูล"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={checkElder}
              disabled={!elderName.trim() || checking}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
            >
              {checking ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
            </button>
          </div>

          {elderVerified && (
            <div className="mt-2 text-sm text-emerald-700">
              ✅ พบในฐานข้อมูล: {elderInfo?.name}
            </div>
          )}
          {!elderVerified && checkError && (
            <div className="mt-2 text-sm text-red-600">
              ⛔ {checkError}{" "}
              <a href="/admin/elderly/add" className="underline text-indigo-700 hover:text-indigo-900">
                ไปเพิ่มชื่อที่ฐานข้อมูล
              </a>
            </div>
          )}
        </div>

        {/* ตารางคำถาม */}
        <div
          className={`overflow-hidden rounded-xl border ${
            elderVerified ? "border-gray-200" : "border-gray-300"
          } ${elderVerified ? "" : "opacity-60 pointer-events-none"}`}
          title={elderVerified ? "" : "ต้องตรวจสอบชื่อผู้สูงอายุก่อนจึงจะทำแบบประเมินได้"}
        >
          <table className="w-full table-fixed">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="w-12 py-3 px-2 text-sm font-semibold">ข้อ</th>
                <th className="py-3 px-2 text-sm font-semibold text-left">คำถาม</th>
                <th className="w-20 py-3 px-2 text-sm font-semibold text-center">ไม่ใช่</th>
                <th className="w-20 py-3 px-2 text-sm font-semibold text-center">ใช่</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q, idx) => (
                <tr key={q.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-3 px-2 text-center">{idx + 1}</td>
                  <td className="py-3 px-2">{q.th}</td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === "no"}
                      onChange={() => handleChange(q.id, "no")}
                      className="h-4 w-4"
                      disabled={!elderVerified}
                    />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === "yes"}
                      onChange={() => handleChange(q.id, "yes")}
                      className="h-4 w-4"
                      disabled={!elderVerified}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ข้อความผิดพลาด */}
        {saveError && <div className="mt-3 text-sm text-red-600 text-center">{saveError}</div>}

        {/* ปุ่มเท่านั้น (ไม่แสดงผลสรุปในหน้านี้) */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
          >
            ล้างคำตอบ
          </button>
          <button
            onClick={submitAssessment}
            disabled={!elderVerified || !allAnswered || saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก & ดูผลการประเมิน"}
          </button>
        </div>
      </div>
    </div>
  );
}
