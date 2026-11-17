import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Users,
  UserRoundCheck,
  ClipboardList,
  FileQuestion,
  ClipboardCheck,
  BarChart3,
  Settings,
  X,
  School,
  History,
  UserCircle,
  ClipboardPenLine,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import fortress_logo from "../../assets/Fortress.png";

const adminGroups = [
  {
    title: "MAIN MENU",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "ACADEMICS",
    items: [
      {
        label: "Academic Sessions",
        path: "/admin/sessions",
        icon: CalendarDays,
      },
      { label: "Terms", path: "/admin/terms", icon: CalendarDays },
      { label: "Classes", path: "/admin/classes", icon: GraduationCap },
      { label: "Subjects", path: "/admin/subjects", icon: BookOpen },
    ],
  },
  {
    title: "PEOPLE MANAGEMENT",
    items: [
      { label: "Students", path: "/admin/students", icon: Users },
      {
        label: "Enrollments",
        path: "/admin/enrollments",
        icon: UserRoundCheck,
      },
      { label: "Teachers", path: "/admin/teachers", icon: GraduationCap },
      {
        label: "Teacher Assignments",
        path: "/admin/teacher-assignments",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "EXAMINATIONS",
    items: [
      { label: "Question Bank", path: "/admin/questions", icon: FileQuestion },
      {
        label: "Examinations",
        path: "/admin/examinations",
        icon: ClipboardList,
      },
      { label: "Results", path: "/admin/results", icon: ClipboardCheck },
      { label: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "SYSTEM",
    items: [{ label: "Settings", path: "/admin/settings", icon: Settings }],
  },
];

const teacherGroups = [
  {
    title: "MY WORKSPACE",
    items: [
      { label: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
      { label: "My Assignments", path: "/teacher/assignments", icon: BookOpen },
    ],
  },
  {
    title: "EXAMINATIONS",
    items: [
      {
        label: "Question Bank",
        path: "/teacher/questions",
        icon: FileQuestion,
      },
      {
        label: "Grading Queue",
        path: "/teacher/grading",
        icon: ClipboardPenLine,
      },
      {
        label: "Student Results",
        path: "/teacher/results",
        icon: FileText,
      },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      { label: "My Profile", path: "/teacher/profile", icon: UserCircle },
    ],
  },
];

const studentGroups = [
  {
    title: "LEARNING",
    items: [
      { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
      {
        label: "My Examinations",
        path: "/student/examinations",
        icon: ClipboardList,
      },
      {
        label: "Examination History",
        path: "/student/history",
        icon: History,
      },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      { label: "My Results", path: "/student/results", icon: ClipboardCheck },
      { label: "My Profile", path: "/student/profile", icon: UserCircle },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen, collapsed }) {
  const { user } = useAuth();

  const menuGroups =
    user?.role === "student"
      ? studentGroups
      : user?.role === "teacher"
        ? teacherGroups
        : adminGroups;

  const portalTitle =
    user?.role === "student"
      ? "Student Portal"
      : user?.role === "teacher"
        ? "Teacher Portal"
        : "Management Portal";

  const footerMessage =
    user?.role === "student"
      ? "Your learning and examination portal."
      : user?.role === "teacher"
        ? "Your teaching and examination workspace."
        : "Examination management made simple.";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0b1324] text-slate-300 transition-[width,transform] duration-300 ease-out motion-reduce:transition-none
        ${collapsed ? "lg:w-[88px]" : "lg:w-[260px]"}
        w-[260px]
        ${
          mobileOpen
            ? "translate-x-0 shadow-2xl shadow-black/40"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-blue-950/50 ring-1 ring-white/20">
              <img
                src={fortress_logo}
                alt="The Fortress College"
                className="h-full w-full object-contain"
              />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="whitespace-nowrap text-[17px] font-semibold leading-tight tracking-tight text-white">
                  The Fortress College
                </h1>
                <p className="mt-0.5 whitespace-nowrap text-[11.5px] leading-none text-slate-400">
                  {portalTitle}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:rgba(148,163,184,0.25)_transparent] [scrollbar-width:thin]">
          {menuGroups.map((group, index) => (
            <div key={group.title} className="mb-6 last:mb-0">
              {!collapsed ? (
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-[1.2px] text-slate-500">
                  {group.title}
                </p>
              ) : (
                index > 0 && (
                  <div className="mx-3 mb-4 border-t border-white/[0.08]" />
                )
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                          isActive
                            ? "bg-white/[0.09] text-white before:absolute before:-left-3 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-blue-400 [&>svg]:text-blue-300"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 [&>svg]:text-slate-500 hover:[&>svg]:text-slate-300"
                        } ${collapsed ? "lg:justify-center" : ""}`
                      }
                    >
                      <Icon size={18} strokeWidth={1.9} className="shrink-0" />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{item.label}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 border-t border-white/[0.06] p-4">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5">
              <p className="text-xs font-semibold text-slate-100">
                School CBT Portal
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
                {footerMessage}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
