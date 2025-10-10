'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// โหลด react-leaflet แบบ client-only
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });

/** 🔒 ป้องกัน hydration mismatch */
function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return children;
}

export default function ExecutiveMapPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultCenter = [15.8700, 100.9925];
  const defaultZoom = 6;

  const mapRef = useRef(null);
  const markerRef = useRef(null); // ✅ แทน popupRef

  // ---------------- helper ----------------
  const fetchJsonSafe = async (url) => {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { throw new Error(text || `HTTP ${res.status}`); }
    if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const getLatLng = (r) => {
    if (!r) return null;
    if (r.lat != null && r.lng != null) {
      const lat = Number(r.lat), lng = Number(r.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
    }
    if (r.latlong) {
      const parts = String(r.latlong).split(/[, ]+/).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
      }
    }
    return null;
  };
  // ----------------------------------------

  const search = async () => {
    setLoading(true); setError(''); setRows([]);
    try {
      const citizen = q.trim();
      if (!citizen) { setError('กรุณากรอกเลขบัตรประชาชน'); return; }

      const json = await fetchJsonSafe(`/api/executive/map?citizen=${encodeURIComponent(citizen)}`);
      const items = json.rows || [];
      setRows(items);

      const pos = items.length ? getLatLng(items[0]) : null;
      if (pos) {
        const map = mapRef.current;
        if (map && typeof map.flyTo === 'function') {
          // 🔍 ซูมไปจุดที่ค้นหา
          map.flyTo(pos, 16, { duration: 1.2 });
        }
        // ✅ เปิด popup ของ marker แรก (ถ้ามี)
        setTimeout(() => {
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }, 1400);
      } else {
        setError('ไม่พบพิกัดของผลลัพธ์นี้');
      }
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const points = useMemo(() => {
    return (rows || [])
      .map(r => ({ r, pos: getLatLng(r) }))
      .filter(x => Array.isArray(x.pos));
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* ✅ ช่องค้นหา */}
      <div className="bg-white rounded-2xl shadow border p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 mb-1">ค้นหาเลขบัตรประชาชน (13 หลัก)</label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="เช่น 1319800382548"
          />
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:opacity-95 disabled:opacity-50"
        >
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
        <button
          onClick={() => { setQ(''); setRows([]); setError(''); }}
          className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
        >
          ล้าง
        </button>
      </div>

      {error && <div className="text-sm text-rose-700">⚠️ {error}</div>}

      {/* ✅ แผนที่ */}
      <div className="rounded-2xl overflow-hidden border shadow" style={{ height: '70vh' }}>
        <ClientOnly>
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            whenCreated={(map) => { mapRef.current = map; }}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {points.map(({ r, pos }, idx) => (
              <CircleMarker
                key={r.elderlyID ?? idx}
                center={pos}
                radius={10}
                pathOptions={{ color: '#10b981', weight: 2 }}
                ref={idx === 0 ? markerRef : null} // ✅ เก็บ ref ของ marker แรก
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{r.name || '-'}</div>
                    {r.citizenID && <div>บัตร: {r.citizenID}</div>}
                    {r.address && <div>ที่อยู่: {r.address}</div>}
                    <div>ละติจูด: {pos[0].toFixed(6)}</div>
                    <div>ลองจิจูด: {pos[1].toFixed(6)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </ClientOnly>
      </div>
    </div>
  );
}
