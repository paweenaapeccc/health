// app/layout.js
import './globals.css'; // อย่าลืมสร้างไฟล์นี้ด้วย
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'My App',
  description: 'My App Description',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-100 to-green-100 min-h-screen">
        <Navbar />
        <main className="p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
