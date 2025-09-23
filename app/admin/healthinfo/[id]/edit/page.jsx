// app/admin/healthinfo/[id]/edit/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditHealthInfoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
  });

  // ✅ โหลด role จาก localStorage (หรือจะไปเช็ค /api/session ก็ได้)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (!token || !r) {
      router.replace('/login');
      return;
    }
    setRole(r);
  }, [router]);

  // ✅ ถ้าไม่ใช่ admin/editor ไม่ให้เข้า
  useEffect(() => {
    if (!role) return;
    if (role !== 'admin' && role !== 'editor') {
      router.replace('/'); // กลับหน้าหลักหรือหน้า 403 ที่คุณมี
    }
  }, [role, router]);

  // ✅ โหลดข้อมูลเดิม
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/healthinfo/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
        const item = await res.json(); // ควรได้ { id, title, content, updated_at }
        setForm({
          title: item?.title || '',
          content: item?.content || '',
        });
      } catch (e) {
        setError(e.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.content.trim()) {
      setError('กรุณากรอกให้ครบ');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`/api/healthinfo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'บันทึกไม่สำเร็จ');
      }
      // กลับไปหน้ารายการหรือหน้าหลัก
      router.push('/'); // หรือ router.push('/admin/healthinfo');
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return <div className="p-6 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-teal-700 mb-6">แก้ไขข้อมูลสุขภาพ</h1>

        {error && (
          <div className="mb-4 rounded bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              หัวข้อ
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ใส่หัวข้อ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เนื้อหา
            </label>
            <textarea
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={10}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ใส่รายละเอียด"
            />
            <p className="text-xs text-gray-500 mt-1">
              รองรับบรรทัดใหม่ (จะแสดงด้วย <code>whitespace-pre-line</code> ในหน้า Home)
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
