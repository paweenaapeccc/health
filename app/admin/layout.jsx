// app/layout.jsx
import AdminNavbar from "../components/adminNavbar";

export const metadata = {
  title: 'My App',
  description: 'My App Description',
};

export default function AdminLayout({ children }) {
  return (
    <div className="bg-gradient-to-br from-blue-300 to-green-300 min-h-screen">
      <AdminNavbar />
    <main className="pt-10 px-6 md:px-10 min-h-screen">
        {children}
      </main>
    </div>
  );
}
