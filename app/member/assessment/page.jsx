"use client"

import React, { useEffect, useMemo, useState, useDeferredValue, useTransition } from "react"
import { useRouter } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api"
const CHECK_ELDER_ENDPOINT = `${API_BASE}/elderly/exists`
const SAVE_ASSESSMENT_ENDPOINT = `${API_BASE}/assessment`
const SAVE_RESULTS_ENDPOINT = `${API_BASE}/assessment_results`

const QUESTIONS = [
  { id: "stiffness", th: "ข้อเข่าฝืดตอนเช้าน้อยกว่า 30 นาที" },
  { id: "crepitus", th: "มีเสียงกรอบแกรบเมื่อขยับข้อ" },
  { id: "bonyTenderness", th: "กดเจ็บที่กระดูกข้อเข่า" },
  { id: "bonyEnlargement", th: "ข้อใหญ่ผิดรูป" },
  { id: "noWarmth", th: "ไม่พบข้ออุ่น" },
]

export default function KneeOAScreeningPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [citizenID, setCitizenID] = useState("")
  const [elderVerified, setElderVerified] = useState(false)
  const [elderInfo, setElderInfo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState("")
  const [answers, setAnswers] = useState(() => Object.fromEntries(QUESTIONS.map((q) => [q.id, null])))
  const deferredAnswers = useDeferredValue(answers)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [resultRow, setResultRow] = useState(null)
  const [history, setHistory] = useState([]) // ✅ เก็บประวัติการประเมินทั้งหมด
  const [today, setToday] = useState("")
  const [userName, setUserName] = useState("ไม่ระบุ")

  /* ✅ mount ครั้งแรก — preload session / วันที่ */
  useEffect(() => {
    requestIdleCallback(async () => {
      setMounted(true)
      const now = new Date()
      setToday(
        now.toLocaleDateString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )

      try {
        const cached = localStorage.getItem("username")
        if (cached) setUserName(cached)

        const res = await fetch("/api/session", { cache: "no-store", keepalive: true })
        if (res.ok) {
          const data = await res.json()
          if (data?.username) {
            setUserName(data.username)
            localStorage.setItem("username", data.username)
          }
        }
      } catch (err) {
        console.warn("โหลด session ช้า:", err)
      }
    })
  }, [])

  /* ✅ คำนวณผล */
  const yesCount = useMemo(() => Object.values(deferredAnswers).filter((v) => v === "yes").length, [deferredAnswers])
  const allAnswered = useMemo(() => Object.values(deferredAnswers).every((v) => v !== null), [deferredAnswers])
  const resultText = useMemo(() => {
    if (!elderVerified || !allAnswered) return ""
    return yesCount >= 2 ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม" : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้"
  }, [elderVerified, allAnswered, yesCount])

  const handleChange = (id, value) => {
    startTransition(() => {
      setAnswers((prev) => ({ ...prev, [id]: value }))
    })
  }

  const reset = () => {
    startTransition(() => {
      setAnswers(Object.fromEntries(QUESTIONS.map((q) => [q.id, null])))
      setSaveError("")
      setResultRow(null)
    })
  }

  /* ✅ โหลดประวัติการประเมินทั้งหมด */
  const loadHistory = async (citizenID) => {
    try {
      const res = await fetch(`/api/followup?mode=detail&citiZenID=${citizenID}`, { cache: "no-store" })
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      setHistory([])
    }
  }

  /* ✅ ตรวจสอบเลขบัตรประชาชน */
  const checkElder = async () => {
    setChecking(true)
    setElderVerified(false)
    setElderInfo(null)
    setCheckError("")
    setResultRow(null)
    setHistory([])

    try {
      const res = await fetch(`${CHECK_ELDER_ENDPOINT}?citizenID=${encodeURIComponent(citizenID.trim())}`, {
        cache: "no-store",
        keepalive: true,
      })
      const data = await res.json()

      if (data?.exists && (data.data || data.elderlyID)) {
        setElderVerified(true)
        const info = data.data || { elderlyID: data.elderlyID, name: data.name }
        setElderInfo(info)

        // ✅ โหลดผลล่าสุด (ถ้ามี)
        if (data.assessment) {
          setResultRow({
            elderlyName: info.name,
            as_results: data.assessment.resultText,
            as_score: data.assessment.yesCount,
            assessmentDate: data.assessment.assessmentDate,
          })
        }

        // ✅ โหลดประวัติทั้งหมด
        loadHistory(info.citizenID || citizenID.trim())
      } else {
        setCheckError("ไม่พบข้อมูลเลขบัตรประชาชนนี้ในระบบ กรุณาเพิ่มข้อมูลก่อนทำแบบประเมิน")
      }
    } catch {
      setCheckError("เกิดข้อผิดพลาดระหว่างตรวจสอบข้อมูล")
    } finally {
      setChecking(false)
    }
  }

  /* ✅ บันทึกแบบประเมิน */
  const submitAssessment = async () => {
    if (resultRow) return
    setSaveError("")

    if (!elderVerified) return setSaveError("ต้องตรวจสอบข้อมูลผู้สูงอายุก่อน")
    if (!allAnswered) return setSaveError("กรุณาตอบแบบประเมินให้ครบทุกข้อ")

    setSaving(true)
    try {
      const userID = localStorage.getItem("userID") || null
      const payload = {
        userID,
        elderlyID: elderInfo.elderlyID,
        ...Object.fromEntries(Object.entries(deferredAnswers).map(([k, v]) => [k, v === "yes" ? 1 : 0])),
      }

      const res1 = await fetch(SAVE_ASSESSMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
      if (!res1.ok) throw new Error("บันทึกการประเมินไม่สำเร็จ")

      const data1 = await res1.json()
      const assessmentID = data1.assessmentID
      const yesFromServer = data1.yesCount ?? yesCount
      const textFromServer = data1.resultText ?? resultText

      const res2 = await fetch(SAVE_RESULTS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentID,
          elderlyID: elderInfo.elderlyID,
          as_score: yesFromServer,
          as_results: textFromServer,
        }),
        keepalive: true,
      })
      if (!res2.ok) throw new Error("บันทึกผลสรุปไม่สำเร็จ")

      // ✅ บันทึกสำเร็จ
      setResultRow({
        elderlyName: elderInfo?.name ?? "",
        as_results: textFromServer,
        as_score: yesFromServer,
        assessmentID,
      })
      loadHistory(elderInfo.citizenID || citizenID.trim()) // โหลดประวัติใหม่
    } catch (e) {
      setSaveError(e.message || "เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setSaving(false)
    }
  }

  /* ✅ หน้ารอโหลด */
  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        กำลังโหลด...
      </div>
    )

  /* ✅ UI หลัก */
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-center text-indigo-700">
          แบบประเมินคัดกรองโรคข้อเข่าเสื่อม
        </h1>

        <div className="flex flex-col md:flex-row justify-between text-gray-700">
          <p>🗓️ <b>วันที่:</b> {today}</p>
          <p>👤 <b>ชื่อผู้กรอก:</b> {userName}</p>
        </div>

        {/* 🔹 เกณฑ์ */}
        <div className="text-left">
          <b>🔹 เกณฑ์การพิจารณา:</b>
          <p className="pl-6">หากตอบ “ใช่” ตั้งแต่ 2 ข้อขึ้นไป มีโอกาสเป็นโรคข้อเข่าเสื่อม</p>
        </div>

        {/* 🔹 กรอกเลขบัตร */}
        <div className="mb-5">
          <label className="block font-medium text-gray-700 mb-2">
            เลขบัตรประชาชน <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={citizenID}
              onChange={(e) => setCitizenID(e.target.value)}
              placeholder="กรอกเลขบัตรประชาชน 13 หลัก"
              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={checkElder}
              disabled={!citizenID.trim() || checking}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
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
              <div className="text-sm text-red-600">⛔ {checkError}</div>
              <button
                onClick={() => router.push("/member/elderly/add")}
                className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                ➕ เพิ่มข้อมูล
              </button>
            </div>
          )}
        </div>

        {/* 🔹 ฟอร์มคำถาม */}
        {!resultRow && (
          <>
            <div className={`overflow-hidden rounded-xl border ${elderVerified ? "border-gray-200" : "border-gray-300 opacity-60 pointer-events-none"}`}>
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="w-12 py-3">ข้อ</th>
                    <th className="text-left">คำถาม</th>
                    <th className="w-20 text-center">ไม่ใช่</th>
                    <th className="w-20 text-center">ใช่</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((q, idx) => (
                    <tr key={q.id} className={idx % 2 ? "bg-gray-50" : "bg-white"}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{q.th}</td>
                      <td className="text-center">
                        <input type="radio" name={q.id} checked={answers[q.id] === "no"} onChange={() => handleChange(q.id, "no")} disabled={!elderVerified} />
                      </td>
                      <td className="text-center">
                        <input type="radio" name={q.id} checked={answers[q.id] === "yes"} onChange={() => handleChange(q.id, "yes")} disabled={!elderVerified} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {saveError && <div className="text-center text-red-600 text-sm mt-3">{saveError}</div>}

            <div className="mt-6 flex justify-center gap-4">
              <button onClick={reset} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                ล้างคำตอบ
              </button>
              <button
                onClick={submitAssessment}
                disabled={!elderVerified || !allAnswered || saving}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก & ดูผลลัพธ์"}
              </button>
            </div>
          </>
        )}

        {/* 🔹 แสดงผลลัพธ์ */}
        {resultRow && (
          <div className="mt-8 p-6 rounded-2xl border shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <h2 className="text-xl font-bold text-indigo-800 mb-4 text-center">🩺 ผลการประเมินล่าสุด</h2>
            <div className="space-y-2 text-gray-700 text-lg">
              <p><b>ชื่อผู้ถูกประเมิน:</b> {resultRow.elderlyName || elderInfo?.name}</p>
              <p><b>ผลการประเมิน:</b> {resultRow.as_results}
                {typeof resultRow.as_score === "number" && (
                  <span className="ml-2 text-sm text-gray-500">(คะแนน {resultRow.as_score})</span>
                )}
              </p>
              {resultRow.assessmentDate && (
                <p><b>วันที่ประเมิน:</b> {resultRow.assessmentDate}</p>
              )}
            </div>

            {resultRow.as_results.includes("มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม") && (
              <div className="mt-6 bg-white/80 rounded-xl p-5 border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-700 mb-2">💡 คำแนะนำในการดูแลสุขภาพ</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>ควรรักษาน้ำหนักให้อยู่ในเกณฑ์ปกติ เพื่อลดแรงกดที่ข้อเข่า</li>
                  <li>หลีกเลี่ยงการนั่งพับเพียบ ขัดสมาธิ หรือยอง ๆ นาน ๆ</li>
                  <li>ออกกำลังกายเบา ๆ เช่น เดิน ว่ายน้ำ หรือปั่นจักรยานวันละ 20–30 นาที</li>
                  <li>เลือกรับประทานอาหารที่มีแคลเซียมและวิตามินดีเพียงพอ</li>
                  <li>หากมีอาการปวดบ่อย ควรพบแพทย์เพื่อตรวจเพิ่มเติม</li>
                </ul>
              </div>
            )}

            {/* ✅ ปุ่มทำแบบประเมินใหม่ */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  reset()
                  setResultRow(null)
                  setAnswers(Object.fromEntries(QUESTIONS.map((q) => [q.id, null])))
                }}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                🔄 ทำแบบประเมินใหม่
              </button>
            </div>
          </div>
        )}

        {/* 🔹 ตารางประวัติทั้งหมด */}
        {history.length > 0 && (
          <div className="mt-8 bg-white/90 rounded-2xl p-6 border border-gray-200 shadow-md">
            <h3 className="text-lg font-bold text-indigo-700 mb-3 text-center">📜 ประวัติการประเมินทั้งหมด</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">วันที่</th>
                    <th className="p-2 text-center">คะแนน</th>
                    <th className="p-2 text-left">ผลการประเมิน</th>
                    <th className="p-2 text-left">ผู้ประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50 transition">
                      <td className="p-2">{h.assessmentDate}</td>
                      <td className="p-2 text-center">{h.yesCount}</td>
                      <td className="p-2">{h.resultText}</td>
                      <td className="p-2">{h.assessorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
