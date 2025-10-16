// app/layout.jsx
import './globals.css'
import Navbar from './components/Navbar' // 👈 ปรับ path ให้ตรงกับโปรเจกต์จริง

export const metadata = {
  title: 'My App',
  description: 'My App Description',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ เพิ่มส่วนนี้เพื่อโหลด CSS ของ Leaflet Routing Machine จาก CDN */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css"
        />
      </head>
      <body className="bg-gradient-to-br from-blue-300 to-green-300 min-h-screen">
        {/* ✅ Navbar ของคุณ */}
        <Navbar />
        <main className="p-4">{children}</main>
      </body>
    </html>
  )
}
