// app/executive/map/page.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Search as SearchIcon, X as ClearIcon } from 'lucide-react';

// ---- CONFIG ----
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
const LIST_ENDPOINT = `${API_BASE}/elderly?all=1`;
const defaultCenter = [14.993, 103.099];
const defaultZoom = 10;
// ----------------

/* ---------- helpers ---------- */
function parseLatLng(latlong) {
  if (!latlong) return null;
  const [lat, lng] = String(latlong).split(',').map(s => Number(String(s).trim()));
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return null;
}
function calcAge(dateStr) {
  if (!dateStr) return null;
  const b = new Date(dateStr);
  if (isNaN(+b)) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  const m = n.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
  return a;
}
function maskCID(cid) {
  const s = (cid || '').toString();
  return s.length === 13
    ? `${s.slice(0,1)}-${s.slice(1,5)}-${s.slice(5,10)}-${s.slice(10,12)}-${s.slice(12)}`
    : s;
}
function keyOf(r) {
  const id = r.id || r.citizenID || 'row';
  const ll = Array.isArray(r.latlng) ? r.latlng.join(',') : 'no-ll';
  return `${id}-${ll}`;
}
/* -------------------------------- */

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return children;
}

/** โหลด react-leaflet/leaflet แบบ dynamic หลัง mount (กัน SSR) */
function LeafletMap({ items, focus }) {
  const [RL, setRL] = useState(null);
  const [Lmod, setLmod] = useState(null);
  const mapRef = useRef(null);
  const markerRefs = useRef({}); // key -> marker instance

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ MapContainer, TileLayer, Marker, Popup }, Leaflet] = await Promise.all([
        import('react-leaflet'),
        import('leaflet'),
      ]);
      if (!alive) return;

      // fix default marker icons
      const iconUrl = (await import('leaflet/dist/images/marker-icon.png')).default;
      const iconRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default;
      const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default;
      Leaflet.default.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

      setRL({ MapContainer, TileLayer, Marker, Popup });
      setLmod(Leaflet.default);
    })();
    return () => { alive = false; };
  }, []);

  // focus จากลิสต์ → flyTo + openPopup
  useEffect(() => {
    if (!focus || !mapRef.current || !Lmod) return;
    const { latlng, key } = focus;
    if (!Array.isArray(latlng)) return;
    try {
      mapRef.current.flyTo(latlng, 16, { duration: 0.8 });
      setTimeout(() => {
        const mk = markerRefs.current[key];
        if (mk && mk.openPopup) mk.openPopup();
      }, 300);
    } catch {}
  }, [focus, Lmod]);

  if (!RL || !Lmod) return <div className="p-3 text-sm text-gray-500">กำลังโหลดแผนที่…</div>;
  const { MapContainer, TileLayer, Marker, Popup } = RL;

  return (
    <div className="w-full" style={{ height: '60vh' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        whenCreated={(m) => (mapRef.current = m)}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items.map((r) => {
          const k = keyOf(r);
          return (
            <Marker
              key={k}
              position={r.latlng}
              ref={(instance) => {
                if (instance) markerRefs.current[k] = instance;
                else delete markerRefs.current[k];
              }}
            >
              <Popup>
                <Info item={r} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function ExecutiveMapPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ป้องกัน Hydration mismatch ด้วยการรอ mount ทั้งหน้า
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ค้นหาเฉพาะเลขบัตรประชาชน
  const [cidInput, setCidInput] = useState('');
  const [cidQuery, setCidQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // โฟกัสที่เลือกจากลิสต์
  const [focusTarget, setFocusTarget] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(LIST_ENDPOINT, { cache: 'no-store' });
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.rows || data.data || [];

        const mapped = arr.map(r => {
          const ll = parseLatLng(r.latlong);
          return {
            id: r.elderlyID,
            name: r.name,
            citizenID: (r.citizenID || '').trim(),
            phone: r.phonNumber,
            birthDate: r.birthDate,
            age: calcAge(r.birthDate),
            address: r.address,
            subdistrict: r.subdistrict,
            district: r.district,
            province: r.province,
            latlng: ll,
          };
        }).filter(x => Array.isArray(x.latlng));

        if (alive) setRows(mapped);
      } catch (e) {
        console.error('load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Search handlers
  const doSearch = () => {
    setErrorMsg('');
    const raw = cidInput.replace(/\D/g, '');
    if (!cidInput.trim()) { setCidQuery(''); return; }
    if (raw.length && raw.length !== 13) {
      setErrorMsg('คำแนะนำ: เลขบัตรประชาชนปกติ 13 หลัก (จะค้นหาแบบบางส่วนให้ก่อน)');
    }
    setCidQuery(cidInput.trim());
  };
  const clearSearch = () => {
    setErrorMsg('');
    setCidInput('');
    setCidQuery('');
  };

  // Filter by citizenID only
  const filtered = useMemo(() => {
    const kw = cidQuery.trim();
    if (!kw) return rows;
    const kwDigits = kw.replace(/\D/g, '');
    return rows.filter(r => {
      const cid = (r.citizenID || '').toString();
      if (kwDigits.length === 13) return cid.replace(/\D/g, '') === kwDigits;
      return cid.includes(kw) || cid.replace(/\D/g, '').includes(kwDigits);
    });
  }, [rows, cidQuery]);

  // เมื่อคลิกลิสต์ → โฟกัสแผนที่
  const handleFocusMap = (r) => setFocusTarget({ latlng: r.latlng, key: keyOf(r) });

  // ----- SSR PLACEHOLDER to avoid hydration mismatch -----
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white py-8 px-4 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="bg-white rounded-2xl shadow border p-4 md:p-6 space-y-5">
            <div className="h-6 w-64 bg-gray-100 rounded" />
            <div className="h-10 w-full max-w-md bg-gray-100 rounded" />
            <div className="h-[60vh] w-full bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }
  // -------------------------------------------------------

  return (
    <div className="min-h-screen bg-white py-8 px-4 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* การ์ดเดียว */}
        <div className="bg-white rounded-2xl shadow border p-4 md:p-6 space-y-5">
          {/* Header + Search */}
          <header className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
              แผนที่ผู้สูงอายุ (ค้นหาเลขบัตรประชาชน)
            </h1>
            <p className="text-gray-600">
              พิมพ์เลขบัตร 13 หลักแล้วกดค้นหา หรือพิมพ์บางส่วนเพื่อค้นหาแบบใกล้เคียง — คลิกที่รายการเพื่อเปิดตำแหน่งบนแผนที่
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md overflow-hidden shadow">
                <input
                  value={cidInput}
                  onChange={(e) => setCidInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  placeholder="กรอกเลขบัตรประชาชน (13 หลัก) หรือพิมพ์บางส่วน..."
                  className="flex-1 rounded-l-md border border-gray-300 py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5a5f] w-72"
                />
                <button
                  type="button"
                  onClick={doSearch}
                  className="bg-gradient-to-r from-orange-600 to-orange-300 text-white px-3 py-2 hover:from-orange-500 hover:to-orange-200"
                  title="ค้นหา"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="bg-gray-100 px-3 py-2 hover:bg-gray-200"
                  title="ล้างคำค้น"
                >
                  <ClearIcon className="w-4 h-4" />
                </button>
              </div>
              {errorMsg && <span className="text-xs text-orange-700">{errorMsg}</span>}
            </div>
          </header>

          {/* สรุปจำนวนผลลัพธ์ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="จำนวนผลลัพธ์" value={filtered.length} />
            <Stat label="ทั้งหมด (มีพิกัด)" value={rows.length} />
          </div>

          {/* Map + List */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ClientOnly>
                <LeafletMap items={filtered} focus={focusTarget} />
              </ClientOnly>
              {loading && <div className="p-3 text-sm text-gray-500">กำลังโหลดข้อมูล...</div>}
              {!loading && filtered.length === 0 && (
                <div className="p-3 text-sm text-gray-600">ไม่พบเลขบัตรที่ค้นหา</div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">รายการที่ตรงคำค้น</h3>
              <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {filtered.map((r) => (
                  <li
                    key={keyOf(r)}
                    className="text-sm border rounded-md p-2 cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => handleFocusMap(r)}
                    title="คลิกเพื่อแสดงบนแผนที่"
                  >
                    <div className="font-medium text-gray-800">{r.name}</div>
                    <div className="text-gray-500">เลขบัตร: {maskCID(r.citizenID)}</div>
                    <div className="text-gray-500">
                      {r.subdistrict || '-'} · {r.district || '-'} · {r.province || '-'}
                    </div>
                  </li>
                ))}
                {filtered.length === 0 && <li className="text-sm text-gray-500">— ไม่มีข้อมูล —</li>}
              </ul>
            </div>
          </div>
        </div>
        {/* end card */}
      </div>
    </div>
  );
}

/* ---------- small components ---------- */
function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}
function Info({ item }) {
  const rows = [
    ['ชื่อ', item.name || '-'],
    ['เลขบัตรประชาชน', maskCID(item.citizenID)],
    ['อายุ', item.age ?? '-'],
    ['เบอร์โทร', item.phone || '-'],
    ['ที่อยู่', [item.address, item.subdistrict, item.district, item.province].filter(Boolean).join(' · ') || '-'],
  ];
  return (
    <div className="min-w-[260px] text-sm">
      <div className="font-semibold text-orange-600 mb-1">{item.name}</div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="pr-2 text-gray-500 whitespace-nowrap align-top">{k}</td>
              <td className="text-gray-800">{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
