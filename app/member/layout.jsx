// app/member/layout.jsx
import MemberNavbar from "../components/memberNavbar";

export default function MemberLayout({ children }) {
  return (
    <div className=" min-h-screen">
      <MemberNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
