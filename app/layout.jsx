// app/layout.jsx
import './globals.css'
import Navbar from './components/Navbar'

export const metadata = {
  title: 'My App',
  description: 'My App Description',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-300 to-green-300 min-h-screen">
        <Navbar />
        <main className="p-4">{children}</main>
      </body>
    </html>
  )
}
