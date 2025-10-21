"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------
   ✅ Helpers
------------------------------------------------------------ */
const fmtDate = (d) => {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "medium",
    }).format(dt);
  } catch {
    return "-";
  }
};

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children : null;
}

/* ------------------------------------------------------------
   ✅ หน้าแสดงข้อมูลผู้สูงอายุ (Admin)
------------------------------------------------------------ */
export default function AdminElderlyPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // ✅ แสดง 10 รายการต่อหน้า
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null); // ✅ สำหรับยกเลิก fetch

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [detail, setDetail] = useState({ show: false, data: null });

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / pageSize), 1),
    [total, pageSize]
  );

  /* ------------------------------------------------------------
     ✅ โหลดข้อมูลจาก API
  ------------------------------------------------------------ */
  const load = async (searchText = q, pageNum = page) => {
    setLoading(true);

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    try {
      const res = await fetch(
        `/api/elderly?search=${encodeURIComponent(
          searchText
        )}&page=${pageNum}&pageSize=${pageSize}`,
        {
          cache: "no-store",
          keepalive: true,
          signal: controllerRef.current.signal,
          next: { revalidate: 5 },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      setRows(data);
      setTotal(json.total ?? data.length ?? 0);
    } catch (err) {
      if (err.name !== "AbortError") console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     ✅ โหลดข้อมูลเมื่อเปิดหน้า หรือเปลี่ยนหน้า
  ------------------------------------------------------------ */
  useEffect(() => {
    load();
  }, [page]);

  /* ------------------------------------------------------------
     ✅ ค้นหาแบบ Debounce 300ms
  ------------------------------------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(q, 1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const showConfirm = (title, message, onConfirm) =>
    setModal({ show: true, title, message, onConfirm });

  const handleDelete = async (id, name) => {
    showConfirm(
      "ยืนยันการลบข้อมูล",
      `ต้องการลบข้อมูลของ "${name}" หรือไม่?`,
      async () => {
        try {
          const res = await fetch(`/api/elderly/${id}`, { method: "DELETE" });
          const json = await res.json();
          if (res.ok && json.ok) {
            setModal({
              show: true,
              title: "สำเร็จ",
              message: "ลบข้อมูลสำเร็จ ✅",
              onConfirm: () => setModal({ show: false }),
            });
            load();
          } else {
            throw new Error(json.error || "ลบไม่สำเร็จ");
          }
        } catch (err) {
          console.error(err);
          setModal({
            show: true,
            title: "ข้อผิดพลาด",
            message: "เกิดข้อผิดพลาดในการลบข้อมูล ❌",
            onConfirm: () => setModal({ show: false }),
          });
        }
      }
    );
  };

  /* ------------------------------------------------------------
     ✅ ฟังก์ชันแปลงค่าพฤติกรรมสุขภาพเป็นภาษาไทย
  ------------------------------------------------------------ */
  const translateHealthValue = (key, value) => {
    if (!value) return "-";

    const maps = {
      exerciseFrequency: {
        daily: "ทุกวัน",
        "3-5": "3-5 ครั้ง/สัปดาห์",
        "1-2": "1-2 ครั้ง/สัปดาห์",
        rarely: "ไม่ค่อยออกกำลังกาย",
      },
      foodHabit: {
        healthy: "ทานอาหารครบ 5 หมู่",
        highfat: "ชอบอาหารมัน / เค็ม",
        sweet: "ทานหวานจัด",
        irregular: "ไม่เป็นเวลา",
      },
      smoking: {
        no: "ไม่สูบ",
        quit: "เลิกแล้ว",
        yes: "สูบเป็นประจำ",
      },
      alcohol: {
        no: "ไม่ดื่ม",
        occasionally: "ดื่มบางโอกาส",
        regular: "ดื่มเป็นประจำ",
      },
    };

    return maps[key]?.[value] ?? value;
  };

  /* ------------------------------------------------------------
     ✅ UI
  ------------------------------------------------------------ */
  return (
    <div className="max-w-7xl mx-auto relative">
      {/* ✅ Popup แสดงข้อมูลสุขภาพ */}
      {detail.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fadeIn">
            <button
              onClick={() => setDetail({ show: false, data: null })}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
              ข้อมูลสุขภาพผู้สูงอายุ
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>ส่วนสูง:</strong> {detail.data?.height ?? "-"} ซม.
              </p>
              <p>
                <strong>น้ำหนัก:</strong> {detail.data?.weight ?? "-"} กก.
              </p>
              <p>
                <strong>โรคประจำตัว:</strong>{" "}
                {detail.data?.congenitalDisease ?? "-"}
              </p>
              <p>
                <strong>หมายเหตุ:</strong> {detail.data?.note ?? "-"}
              </p>
              <p>
                <strong>ความถี่ในการออกกำลังกาย:</strong>{" "}
                {translateHealthValue(
                  "exerciseFrequency",
                  detail.data?.exerciseFrequency
                )}
              </p>
              <p>
                <strong>พฤติกรรมการบริโภคอาหาร:</strong>{" "}
                {translateHealthValue("foodHabit", detail.data?.foodHabit)}
              </p>
              <p>
                <strong>การสูบบุหรี่:</strong>{" "}
                {translateHealthValue("smoking", detail.data?.smoking)}
              </p>
              <p>
                <strong>การดื่มแอลกอฮอล์:</strong>{" "}
                {translateHealthValue("alcohol", detail.data?.alcohol)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal ยืนยัน */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">{modal.title}</h2>
            <p className="text-gray-600">{modal.message}</p>
            <div className="flex justify-center gap-4 pt-2">
              {modal.onConfirm && modal.title === "ยืนยันการลบข้อมูล" ? (
                <>
                  <button
                    onClick={() => {
                      setModal({ show: false });
                      modal.onConfirm();
                    }}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    ตกลง
                  </button>
                  <button
                    onClick={() => setModal({ show: false })}
                    className="px-5 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal({ show: false })}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ ตาราง */}
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">
            ข้อมูลผู้สูงอายุ (Admin)
          </h1>
          <Link
            href="/admin/elderly/add"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            + เพิ่มข้อมูล
          </Link>
        </div>

        {/* 🔍 Search */}
        <ClientOnly>
          <form
            onSubmit={onSearch}
            className="flex flex-col sm:flex-row gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / เบอร์ / บัตร / ที่อยู่"
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow cursor-pointer"
            >
              ค้นหา
            </button>
          </form>
        </ClientOnly>

        {/* ✅ ตารางข้อมูล */}
        <div className="overflow-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">เลขบัตรประชาชน</th>
                <th className="p-3 text-left">ชื่อ-สกุล</th>
                <th className="p-3 text-left">อายุ</th>
                <th className="p-3 text-left">วันเกิด</th>
                <th className="p-3 text-left">ที่อยู่</th>
                <th className="p-3 text-left">เบอร์โทร</th>
                <th className="p-3 text-center w-60">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="p-3 text-center text-gray-300">
                      █████████████████████
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r.id ?? r.elderlyID;
                  const name = r.name ?? r.fullName;
                  return (
                    <tr
                      key={id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{r.citizenID ?? "-"}</td>
                      <td className="p-3">{name}</td>
                      <td className="p-3">{r.age ?? "-"}</td>
                      <td className="p-3">
                        {fmtDate(r.birthDate || r.birthdate)}
                      </td>
                      <td className="p-3">{r.address ?? "-"}</td>
                      <td className="p-3">{r.phonNumber || r.phone || "-"}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setDetail({ show: true, data: r })}
                            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-xs shadow cursor-pointer"
                          >
                            ข้อมูลสุขภาพ
                          </button>
                          <Link
                            href={`/admin/elderly/${id}/edit`}
                            className="px-3 py-1.5 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 text-xs shadow"
                          >
                            แก้ไข
                          </Link>
                          <button
                            onClick={() => handleDelete(id, name)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-xs shadow cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-gray-600">รวม {total} รายการ</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100 transition cursor-pointer"
            >
              ก่อนหน้า
            </button>
            <span className="text-gray-700">
              หน้า {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100 transition cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
