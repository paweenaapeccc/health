// app/member/assessment/page.jsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const CHECK_ELDER_ENDPOINT = `${API_BASE}/elderly/exists`; // เปลี่ยนมาเช็ก citizenID
const SAVE_ASSESSMENT_ENDPOINT = `${API_BASE}/assessment`;
const SAVE_RESULTS_ENDPOINT = `${API_BASE}/assessment_results`;

const QUESTIONS = [
  { id: "stiffness",        th: "ข้อเข่าฝืดตอนเช้าน้อยกว่า 30 นาที" },
  { id: "crepitus",         th: "มีเสียงกรอบแกรบเมื่อขยับข้อ" },
  { id: "bonyTenderness",   th: "กดเจ็บที่กระดูกข้อเข่า" },
  { id: "bonyEnlargement",  th: "ข้อใหญ่ผิดรูป" },
  { id: "noWarmth",         th: "ไม่พบข้ออุ่น" },
];

/* ===== Parent: มี mounted gate + skeleton ===== */
export default function KneeOAScreeningPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return <KneeOAScreeningForm />;
}

/* ===== Child: logic + hooks ทั้งหมด ===== */
function KneeOAScreeningForm() {
  const router = useRouter();

  // --- Elderly (ใช้ citizenID) ---
  const [citizenID, setCitizenID] = useState("");
  const [elderVerified, setElderVerified] = useState(false);
  const [elderInfo, setElderInfo] = useState(null); // { elderlyID, citizenID, name? }
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

  const resultText = useMemo(() => {
    if (!elderVerified || !allAnswered) return "";
    return yesCount >= 2
      ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
      : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";
  }, [elderVerified, allAnswered, yesCount]);

  const handleChange = (id, value) =>
    setAnswers(prev => ({ ...prev, [id]: value }));

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
      const url = `${CHECK_ELDER_ENDPOINT}?citizenID=${encodeURIComponent(citizenID.trim())}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data?.exists) {
        setElderVerified(true);
        setElderInfo({
          elderlyID: data.elderlyID,
          citizenID: data.citizenID,
          name: data.name ?? "",
        });
      } else {
        setCheckError("ไม่พบเลขบัตรนี้ในฐานข้อมูล กรุณาเพิ่มข้อมูลก่อนทำแบบประเมิน");
      }
    } catch {
      setCheckError("เกิดข้อผิดพลาดระหว่างตรวจสอบ");
    } finally {
      setChecking(false);
    }
  };

  const submitAssessment = async () => {
    setSaveError("");

    if (!elderVerified) {
      setSaveError("ต้องตรวจสอบเลขบัตรประชาชนให้ผ่านก่อน");
      return;
    }
    if (!allAnswered) {
      setSaveError("กรุณาตอบแบบประเมินให้ครบทุกข้อ");
      return;
    }

    setSaving(true);
    try {
      // 1) healthassessment
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

      // 2) assessmentresults
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

        {/* เลขบัตรประชาชน */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลขบัตรประชาชน <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{13}"
              maxLength={13}
              value={citizenID}
              onChange={(e) => {
                setCitizenID(e.target.value.replace(/[^\d]/g, ""));
                setElderVerified(false);
                setElderInfo(null);
                setCheckError("");
              }}
              placeholder="กรอกเลขบัตร 13 หลัก"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={checkElder}
              disabled={citizenID.trim().length !== 13 || checking}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold"
            >
              {checking ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
            </button>
          </div>

          {elderVerified && (
            <div className="mt-2 text-sm text-emerald-700">
              ✅ พบเลขบัตรในฐานข้อมูล {elderInfo?.name ? `(${elderInfo.name})` : ""}
            </div>
          )}
          {!elderVerified && checkError && (
            <div className="mt-2 text-sm text-red-600">
              ⛔ {checkError}{" "}
              <a href="/member/elderly/add" className="underline text-indigo-700 hover:text-indigo-900">
                ไปเพิ่มข้อมูลผู้สูงอายุ
              </a>
            </div>
          )}
        </div>

        {/* ตารางคำถาม */}
        <div
          className={`overflow-hidden rounded-xl border ${
            elderVerified ? "border-gray-200" : "border-gray-300"
          } ${elderVerified ? "" : "opacity-60 pointer-events-none"}`}
          title={elderVerified ? "" : "ต้องตรวจสอบเลขบัตรก่อนจึงจะทำแบบประเมินได้"}
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

        {/* Error */}
        {saveError && <div className="mt-3 text-sm text-red-600 text-center">{saveError}</div>}

        {/* Actions */}
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
