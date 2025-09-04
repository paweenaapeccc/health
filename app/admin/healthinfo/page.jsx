'use client';

import { useEffect, useState } from 'react';

export default function HealthInfoPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับสร้างข้อมูลใหม่
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // ดึงข้อมูลจาก API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/healthinfo');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch health info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ฟังก์ชันบันทึกข้อมูลใหม่
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newTitle.trim() || !newContent.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }

    try {
      const res = await fetch('/api/healthinfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        fetchData(); // โหลดข้อมูลใหม่
        alert('เพิ่มข้อมูลสำเร็จ');
      } else {
        alert('เพิ่มข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      console.error('Error creating data:', err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  // ตัวอย่างข้อมูลให้กดเพิ่มได้เลย
  const exampleData = {
    title: "การดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม",
    content: `การดูแลด้านพฤติกรรม
การดูแลผู้สูงอายุที่มีภาวะข้อเข่าเสื่อมควรเริ่มจากการปรับพฤติกรรมประจำวัน เช่น หลีกเลี่ยงท่าทางที่ไม่เหมาะสมอย่างการนั่งพับเพียบ คุกเข่า หรือนั่งยอง ๆ ซึ่งเพิ่มแรงกระทำต่อข้อเข่า ควรใช้เครื่องช่วยเดิน เช่นไม้เท้า และปรับสภาพแวดล้อมภายในบ้าน เช่น ใช้ชักโครกแทนส้วมนั่งยอง

การควบคุมน้ำหนักและออกกำลังกาย
น้ำหนักที่มากเกินไปจะเพิ่มภาระให้ข้อเข่า การลดน้ำหนักสามารถลดอาการปวดได้อย่างชัดเจน ควบคู่กับการออกกำลังกายที่เหมาะสม เช่น:
- การเดินเบา ๆ
- ว่ายน้ำ
- ปั่นจักรยานแรงต้านต่ำ
- โยคะ หรือ ไทเก๊ก
ควรอยู่ภายใต้คำแนะนำของนักกายภาพบำบัด เพื่อความปลอดภัยและเหมาะสมต่อแต่ละบุคคล

การรักษาด้วยยาและการแพทย์
การใช้ยาทาภายนอกหรือยากินเพื่อลดอาการอักเสบควรอยู่ภายใต้คำแนะนำของแพทย์ อาจใช้ผลิตภัณฑ์เสริมอาหาร เช่น กลูโคซามีน หรือคอนดรอยติน และในบางกรณีอาจมีการฉีดยา เช่น:
- สเตียรอยด์
- กรดไฮยาลูรอนิก
หากอาการรุนแรงจนไม่สามารถรักษาด้วยวิธีอื่นได้ การผ่าตัดเปลี่ยนข้อเข่าอาจเป็นทางเลือกสุดท้าย`
  };

  const handleAddExample = () => {
    setNewTitle(exampleData.title);
    setNewContent(exampleData.content);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Health Info</h1>

      {loading ? (
        <p>Loading...</p>
      ) : data.length === 0 ? (
        <p>No health info found.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {data.map((item) => (
            <li key={item.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="whitespace-pre-line text-gray-700 mt-2">{item.content}</p>
              <p className="text-sm text-gray-400 mt-2">
                Updated: {new Date(item.updated_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="border p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">เพิ่มข้อมูลใหม่</h3>
        <label className="block mb-2">
          หัวข้อ:
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border rounded px-2 py-1 mt-1"
            required
          />
        </label>
        <label className="block mb-2">
          เนื้อหา:
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full border rounded px-2 py-1 mt-1"
            rows={6}
            required
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          บันทึกข้อมูล
        </button>
        <button
          type="button"
          onClick={handleAddExample}
          className="ml-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ใส่ข้อมูลตัวอย่าง
        </button>
      </form>
    </div>
  );
}
