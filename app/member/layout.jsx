// app/member/layout.jsx
import MemberNavbar from "../components/memberNavbar";

export default function MemberLayout({ children }) {
  return (
    <div className=" min-h-screen">
      <MemberNavbar />
      <main className="pt-10 px-6 md:px-10 min-h-screen">{children}</main>
    </div>
  );
}
