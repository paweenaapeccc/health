"use client";

import { useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";

// ✅ ตั้งค่า default icon (แก้ปัญหา marker 404)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ✅ โรงพยาบาลกระสัง
const HOSPITAL_LATLNG = [14.921958636767206, 103.30063774292132];

export default function LeafletMap({ elderlyList }) {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const mapRef = useRef(null);

  const hospitalIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // ✅ ฟังก์ชันเรียกเส้นทางจาก API
  const fetchRoute = async (start, end) => {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
          method: "POST",
          headers: {
            Authorization:
              "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlZjk1MjkyOWFiMjRlMGI4YjBiYjQ2M2IwMmU4NGE0IiwiaCI6Im11cm11cjY0In0=",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [start[1], start[0]], // [lng, lat]
              [end[1], end[0]],
            ],
          }),
        }
      );

      const data = await res.json();
      const route = data?.routes?.[0];
      if (route?.geometry) {
        const decoded = polyline.decode(route.geometry);
        setRouteCoords(decoded);

        // ✅ ระยะทาง (กม.) และ เวลา (นาที)
        const distKm = (route.summary.distance / 1000).toFixed(2);
        const timeMin = (route.summary.duration / 60).toFixed(1);
        setDistance(distKm);
        setDuration(timeMin);

        // ✅ ซูมให้เห็นเส้นทางทั้งหมด
        if (mapRef.current) {
          mapRef.current.flyToBounds(decoded, { duration: 2 });
        }
      } else {
        alert("❌ ไม่พบเส้นทางจาก OpenRouteService");
      }
    } catch (err) {
      console.error("Error fetching route:", err);
      alert("เกิดข้อผิดพลาดในการดึงเส้นทาง");
    }
  };

  return (
    <div className="relative w-full">
      {/* ✅ ใช้ relative ครอบ MapContainer */}
      <div className="relative w-full h-[85vh]">
        <MapContainer
          center={[15.0, 103.1]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => (mapRef.current = map)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 🏥 โรงพยาบาล */}
          <Marker position={HOSPITAL_LATLNG} icon={hospitalIcon}>
            <Popup>
              🏥 <b>โรงพยาบาลกระสัง</b>
            </Popup>
          </Marker>

          {/* 👵 ผู้สูงอายุ */}
          {elderlyList.map((e) => {
            if (!e.latlong) return null;
            const [lat, lng] = e.latlong.split(",").map(Number);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker key={e.id} position={[lat, lng]}>
                <Popup>
                  <div>
                    <p>
                      <b>ชื่อ:</b> {e.name}
                    </p>
                    <p>
                      <b>อายุ:</b> {e.age} ปี
                    </p>
                    <p>
                      <b>เพศ:</b> {e.gender}
                    </p>
                    <p>
                      <b>ที่อยู่:</b> {e.address}
                    </p>
                    <button
                      className="text-blue-600 font-semibold underline hover:text-blue-800"
                      onClick={() => fetchRoute([lat, lng], HOSPITAL_LATLNG)}
                    >
                      🚗 เส้นทางไปโรงพยาบาลกระสัง
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 🚗 เส้นทาง */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color="blue"
              weight={6}
              opacity={0.8}
            />
          )}
        </MapContainer>

        {/* 📊 กล่องข้อมูลแสดงที่มุมซ้ายล่าง */}
        {distance > 0 && (
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md border-2 border-blue-400 rounded-2xl shadow-2xl p-5 text-gray-900 text-lg font-semibold z-[1000] min-w-[240px]">
            <p className="mb-2 text-xl font-bold text-blue-700">
              🚗 ระยะทาง: <span className="text-black">{distance} กม.</span>
            </p>
            <p className="text-xl font-bold text-green-700">
              ⏱️ เวลาเดินทาง:{" "}
              <span className="text-black">{duration} นาที</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
