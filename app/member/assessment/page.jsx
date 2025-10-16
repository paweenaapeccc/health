"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const CHECK_ELDER_ENDPOINT = `${API_BASE}/elderly/exists`;
const SAVE_ASSESSMENT_ENDPOINT = `${API_BASE}/assessment`;
const SAVE_RESULTS_ENDPOINT = `${API_BASE}/assessment_results`;

const QUESTIONS = [
  { id: "stiffness", th: "ข้อเข่าฝืดตอนเช้าน้อยกว่า 30 นาที" },
  { id: "crepitus", th: "มีเสียงกรอบแกรบเมื่อขยับข้อ" },
  { id: "bonyTenderness", th: "กดเจ็บที่กระดูกข้อเข่า" },
  { id: "bonyEnlargement", th: "ข้อใหญ่ผิดรูป" },
  { id: "noWarmth", th: "ไม่พบข้ออุ่น" },
];

export default function KneeOAScreeningPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [citizenID, setCitizenID] = useState("");
  const [elderVerified, setElderVerified] = useState(false);
  const [elderInfo, setElderInfo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(QUESTIONS.map((q) => [q.id, null]))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [resultRow, setResultRow] = useState(null);

  // ✅ เพิ่ม: วันที่และชื่อผู้กรอกจาก session
  const [today, setToday] = useState("");
  const [userName, setUserName] = useState("ไม่ระบุ");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setToday(
      now.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // ✅ ดึงชื่อผู้ใช้งานจาก session (api/session)
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.username) {
            setUserName(data.username);
            localStorage.setItem("username", data.username);
          } else {
            const storedUser =
              localStorage.getItem("username") ||
              localStorage.getItem("userName");
            if (storedUser) setUserName(storedUser);
          }
        }
      } catch (err) {
        console.warn("ไม่สามารถโหลดข้อมูล session ได้:", err);
      }
    };

    fetchUser();
  }, []);

  // ✅ เกณฑ์การประเมิน: ใช่ ≥ 2 ข้อ = มีโอกาสข้อเข่าเสื่อม
  const yesCount = useMemo(
    () => Object.values(answers).filter((v) => v === "yes").length,
    [answers]
  );
  const allAnswered = useMemo(
    () => Object.values(answers).every((v) => v !== null),
    [answers]
  );

  const resultText = useMemo(() => {
    if (!elderVerified || !allAnswered) return "";
    return yesCount >= 2
      ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
      : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";
  }, [elderVerified, allAnswered, yesCount]);

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const reset = () => {
    setAnswers(Object.fromEntries(QUESTIONS.map((q) => [q.id, null])));
    setSaveError("");
    setResultRow(null);
  };

  // ✅ ตรวจสอบเลขบัตรประชาชน
  const checkElder = async () => {
    setChecking(true);
    setElderVerified(false);
    setElderInfo(null);
    setCheckError("");
    setResultRow(null);

    try {
      const url = `${CHECK_ELDER_ENDPOINT}?citizenID=${encodeURIComponent(
        citizenID.trim()
      )}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (data?.exists && (data.data || data.elderlyID)) {
        setElderVerified(true);
        const info = data.data || {
          elderlyID: data.elderlyID,
          citizenID: data.citizenID,
          name: data.name,
        };
        setElderInfo(info);

        if (data.assessment) {
          setResultRow({
            elderlyName: info.name,
            as_results: data.assessment.resultText,
            as_score: data.assessment.yesCount,
            assessmentDate: data.assessment.assessmentDate,
          });
        }
      } else {
        setCheckError(
          "ไม่พบข้อมูลเลขบัตรประชาชนนี้ในระบบ กรุณาเพิ่มข้อมูลก่อนทำแบบประเมิน"
        );
      }
    } catch {
      setCheckError("เกิดข้อผิดพลาดระหว่างตรวจสอบข้อมูล");
    } finally {
      setChecking(false);
    }
  };

  // ✅ บันทึกแบบประเมิน
  const submitAssessment = async () => {
    if (resultRow) return;

    setSaveError("");
    if (!elderVerified) {
      setSaveError("ต้องตรวจสอบข้อมูลผู้สูงอายุก่อน");
      return;
    }
    if (!allAnswered) {
      setSaveError("กรุณาตอบแบบประเมินให้ครบทุกข้อ");
      return;
    }

    setSaving(true);
    try {
      const userID = localStorage.getItem("userID") || null;

      const payloadAssessment = {
        userID,
        elderlyID: elderInfo.elderlyID,
        stiffness: answers.stiffness === "yes" ? 1 : 0,
        crepitus: answers.crepitus === "yes" ? 1 : 0,
        bonyTenderness: answers.bonyTenderness === "yes" ? 1 : 0,
        bonyEnlargement: answers.bonyEnlargement === "yes" ? 1 : 0,
        noWarmth: answers.noWarmth === "yes" ? 1 : 0,
      };

      const res1 = await fetch(SAVE_ASSESSMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadAssessment),
      });
      if (!res1.ok) throw new Error("บันทึกการประเมินไม่สำเร็จ");

      const data1 = await res1.json();
      const assessmentID = data1.assessmentID;
      const yesFromServer = data1.yesCount ?? yesCount;
      const textFromServer = data1.resultText ?? resultText;

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
      if (!res2.ok) throw new Error("บันทึกผลสรุปไม่สำเร็จ");

      setResultRow({
        elderlyName: elderInfo?.name ?? "",
        as_results: textFromServer,
        as_score: yesFromServer,
        assessmentID,
      });
    } catch (e) {
      setSaveError(e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        กำลังโหลด...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center 4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700 tracking-tight">
          แบบประเมินคัดกรองโรคข้อเข่าเสื่อม
        </h1>

        {/* 🔹 ส่วนข้อมูลผู้กรอกและวันที่ */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between ">
          <p className="text-gray-700 text-base">
            🗓️ <span className="font-semibold">วันที่:</span> {today}
          </p>
          <p className="text-gray-700 text-base">
            👤 <span className="font-semibold">ชื่อผู้กรอก:</span> {userName}
          </p>
        </div>

        {/* ✅ เพิ่มส่วนเกณฑ์การพิจารณา */}
        <div className="text-left">
          <span className="block font-semibold">🔹 เกณฑ์การพิจารณา:</span>
          <span className="block pl-6">
            {" "}
            {/* เพิ่ม class pl-4 เพื่อเว้นระยะจากซ้าย */}
            หากตอบว่า{" "}
            <span className="font-semibold">
              “ใช่” ตั้งแต่ 2 ข้อขึ้นไป
            </span>{" "}
            มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม
          </span>
        </div>

        {/* 🔹 กรอกเลขบัตร */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลขบัตรประชาชน <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={citizenID}
              onChange={(e) => {
                setCitizenID(e.target.value);
                setElderVerified(false);
                setElderInfo(null);
                setCheckError("");
                setResultRow(null);
              }}
              placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={checkElder}
              disabled={!citizenID.trim() || checking}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold transition"
            >
              {checking ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
            </button>
          </div>

          {elderVerified && !resultRow && (
            <div className="mt-2 text-sm text-emerald-700 font-medium">
              ✅ พบข้อมูลผู้สูงอายุ: {elderInfo?.name}
            </div>
          )}
          {!elderVerified && checkError && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="text-sm text-red-600 flex items-center gap-1">
                ⛔ {checkError}
              </div>
              <button
                onClick={() => router.push("/member/elderly/add")}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg shadow hover:bg-indigo-700 transition"
              >
                ➕ เพิ่มข้อมูล
              </button>
            </div>
          )}
        </div>

        {/* 🔹 แบบประเมิน */}
        {!resultRow && (
          <>
            <div
              className={`overflow-hidden rounded-xl border ${
                elderVerified
                  ? "border-gray-200"
                  : "border-gray-300 opacity-60 pointer-events-none"
              }`}
            >
              <table className="w-full table-fixed">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="w-12 py-3 px-2 text-sm font-semibold">
                      ข้อ
                    </th>
                    <th className="py-3 px-2 text-sm font-semibold text-left">
                      คำถาม
                    </th>
                    <th className="w-20 py-3 px-2 text-sm font-semibold text-center">
                      ไม่ใช่
                    </th>
                    <th className="w-20 py-3 px-2 text-sm font-semibold text-center">
                      ใช่
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((q, idx) => (
                    <tr
                      key={q.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
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

            {saveError && (
              <div className="mt-3 text-sm text-red-600 text-center">
                {saveError}
              </div>
            )}

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium shadow-sm"
              >
                ล้างคำตอบ
              </button>
              <button
                onClick={submitAssessment}
                disabled={!elderVerified || !allAnswered || saving}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold shadow transition"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก & ดูผลลัพธ์"}
              </button>
            </div>
          </>
        )}

        {/* 🔹 แสดงผลพร้อมคำแนะนำ */}
        {resultRow && (
          <div className="mt-8 p-6 rounded-2xl border shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <h2 className="text-xl font-bold text-indigo-800 mb-4 text-center">
              🩺 ผลการประเมินล่าสุด
            </h2>
            <div className="space-y-2 text-gray-700 leading-relaxed text-lg">
              <p>
                <span className="font-semibold">ชื่อผู้ถูกประเมิน:</span>{" "}
                {resultRow.elderlyName || elderInfo?.name}
              </p>
              <p>
                <span className="font-semibold">ผลการประเมิน:</span>{" "}
                {resultRow.as_results}
                {typeof resultRow.as_score === "number" && (
                  <span className="ml-2 text-sm text-gray-500">
                    (คะแนน {resultRow.as_score})
                  </span>
                )}
              </p>
              {resultRow.assessmentDate && (
                <p className="text-gray-600 text-base mt-1">
                  วันที่ประเมิน:{" "}
                  {new Date(resultRow.assessmentDate).toLocaleDateString(
                    "th-TH"
                  )}
                </p>
              )}
            </div>

            {/* ✅ คำแนะนำในการดูแลสุขภาพ */}
            {resultRow.as_results.includes(
              "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
            ) && (
              <div className="mt-6 bg-white/80 rounded-xl p-5 border border-indigo-200 shadow-inner">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">
                  💡 คำแนะนำในการดูแลสุขภาพ
                </h3>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 text-base">
                  <li>
                    ควรรักษาน้ำหนักให้อยู่ในเกณฑ์ปกติ เพื่อลดแรงกดที่ข้อเข่า
                  </li>
                  <li>
                    หลีกเลี่ยงการนั่งพับเพียบ ขัดสมาธิ หรือยอง ๆ เป็นเวลานาน
                  </li>
                  <li>
                    ออกกำลังกายเบา ๆ เช่น เดิน ว่ายน้ำ หรือปั่นจักรยานวันละ
                    20–30 นาที
                  </li>
                  <li>เลือกรับประทานอาหารที่มีแคลเซียมและวิตามินดีเพียงพอ</li>
                  <li>
                    หากมีอาการปวดบ่อยหรือรุนแรง ควรพบแพทย์เพื่อตรวจเพิ่มเติม
                  </li>
                </ul>
              </div>
            )}

            {/* 🔄 ปุ่มทำแบบประเมินใหม่ */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setResultRow(null);
                  setCitizenID("");
                  setElderVerified(false);
                  setElderInfo(null);
                  setAnswers(
                    Object.fromEntries(QUESTIONS.map((q) => [q.id, null]))
                  );
                }}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md transition-all"
              >
                ทำแบบประเมินใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
