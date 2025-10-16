"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return children;
}

export default function AddElderlyMemberPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ show: false, text: "", success: false });

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    citizenID: "",
    birthDate: "",
    gender: "",
    address: "",
    subdistrict: "",
    district: "",
    province: "",
    latitude: "",
    longitude: "",
  });

  // ✅ แปลงข้อความวันเกิด (พ.ศ.) → ค.ศ.
  const parseThaiDateInput = (text) => {
    if (!text) return "";
    const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (!match) return "";
    const [_, day, month, yearThai] = match;
    const yearAD = parseInt(yearThai) - 543;
    return `${yearAD}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/elderly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phone: formData.phoneNumber,
          birthDate: parseThaiDateInput(formData.birthDate),
        }),
      });

      if (res.ok) {
        // ✅ แสดง modal ตรงกลางแทน alert
        setModal({
          show: true,
          text: "เพิ่มข้อมูลผู้สูงอายุสำเร็จ ✅",
          success: true,
        });
      } else {
        const data = await res.json().catch(() => ({}));
        setModal({
          show: true,
          text: data?.error || "เกิดข้อผิดพลาดในการบันทึก ❌",
          success: false,
        });
      }
    } catch {
      setModal({
        show: true,
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ❌",
        success: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
    if (modal.success) router.push("/admin/elderly");
  };

  const label = "text-sm font-medium text-slate-700";
  const input =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const sectionTitle = "text-lg font-semibold text-slate-900 mb-4";

  return (
    <div className="">
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4 border border-gray-200">
            {/* ไอคอนเครื่องหมายถูก */}
            {modal.success ? (
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="green"
                    className="w-10 h-10"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="red"
                    className="w-10 h-10"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
            )}

            <h2
              className={`text-lg font-semibold mb-4 ${
                modal.success ? "text-green-700" : "text-red-700"
              }`}
            >
              {modal.text}
            </h2>

            <button
              onClick={() => {
                setModal({ ...modal, show: false });
                if (modal.success) router.push("/admin/elderly");
              }}
              className="mt-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            เพิ่มข้อมูลผู้สูงอายุ (Admin)
          </h1>
          <p className="mt-1 text-slate-600 text-sm">
            กรอกข้อมูลให้ครบถ้วน และถูกต้อง{" "}
            <span className="text-red-500">*</span>
          </p>
        </header>

        <ClientOnly>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-8"
            autoComplete="off"
          >
            {/* ข้อมูลส่วนตัว */}
            <section>
              <h2 className={sectionTitle}>ข้อมูลส่วนตัว</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>
                    ชื่อ-สกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="เช่น นางเอ บีซี"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={label}>
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phoneNumber"
                    placeholder="เช่น 0812345678"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={label}>
                    รหัสบัตรประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="citizenID"
                    placeholder="13 หลัก"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className={label}>
                    วันเดือนปีเกิด (พ.ศ.){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    placeholder="เช่น 01/01/2500 หรือ 1-1-2500"
                    className={input}
                    value={formData.birthDate}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    กรุณากรอกเป็นรูปแบบ วัน/เดือน/ปี พ.ศ.
                  </p>
                </div>

                <div>
                  <label className={label}>
                    เพศ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    className={input}
                    onChange={handleChange}
                    required
                    defaultValue=""
                  >
                    <option value="" disabled>
                      เลือกเพศ
                    </option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ที่อยู่ */}
            <section>
              <h2 className={sectionTitle}>ที่อยู่</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={label}>
                    ที่อยู่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="address"
                    placeholder="เลขที่ หมู่ ถนน (ถ้ามี)"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={label}>
                    ตำบล <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="subdistrict"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={label}>
                    อำเภอ <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="district"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className={label}>
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="province"
                    className={input}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </section>

            {/* พิกัด */}
            <section>
              <h2 className={sectionTitle}>พิกัด</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ละติจูด-ลองจิจูด</label>
                  <input
                    name="latitude"
                    placeholder="เช่น 14.999999,103.000000"
                    className={input}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* ปุ่ม */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/admin/elderly")}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      opacity="0.25"
                    />
                    <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor" />
                  </svg>
                )}
                {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </form>
        </ClientOnly>

        <p className="mt-4 text-center text-xs text-slate-500">
          ข้อมูลจะถูกเก็บรักษาตามนโยบายความเป็นส่วนตัวของระบบ
        </p>
      </div>
    </div>
  );
}
