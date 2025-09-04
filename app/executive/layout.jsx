// app/layout.jsx
import ExecutiveNavbar from "../components/executiveNavbar";

export const metadata = {
  title: 'My App',
  description: 'My App Description',
};

export default function ExecutiveLayout({ children }) {
  return (
    <div className="bg-gradient-to-br from-blue-300 to-green-300 min-h-screen">
      <ExecutiveNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
