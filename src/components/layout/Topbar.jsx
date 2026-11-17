import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  LogOut,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/sessions": "Academic Sessions",
  "/admin/terms": "Academic Terms",
  "/admin/classes": "Class Management",
  "/admin/subjects": "Subject Management",
  "/admin/students": "Student Management",
  "/admin/enrollments": "Student Enrollments",
  "/admin/teachers": "Teacher Management",
  "/admin/teacher-assignments": "Teacher Assignments",
  "/admin/questions": "Question Bank",
  "/admin/examinations": "Examination Management",
  "/admin/results": "Results Management",
  "/admin/reports": "Reports & Analytics",
  "/admin/settings": "Settings",

  "/student/dashboard": "My Dashboard",
  "/student/examinations": "My Examinations",
  "/student/history": "Examination History",
  "/student/results": "My Results",
  "/student/profile": "My Profile",
};

export default function Topbar({ setMobileOpen, collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const title = pageTitles[location.pathname] || "Dashboard";

  const isStudent = user?.role === "student";
  const settingsPath = isStudent ? "/student/profile" : "/admin/settings";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  const identifier =
    user?.admissionNumber ||
    user?.staffId ||
    user?.email ||
    user?.username ||
    "";

  const initial = user?.firstName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 sm:px-6 lg:px-8">
      {/* Left: navigation toggles + page title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:block"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <PanelLeftOpen size={20} />
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>

        <span
          aria-hidden="true"
          className="mx-1 hidden h-6 w-px bg-slate-200 lg:block"
        />

        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
            {isStudent ? "Student examination portal" : "School administration"}
          </p>
        </div>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          className="relative rounded-full p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} strokeWidth={1.9} />
        </button>

        <span
          aria-hidden="true"
          className="hidden h-6 w-px bg-slate-200 sm:block"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className={`flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:pr-3 ${
              profileOpen ? "bg-slate-100" : ""
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b1324] text-sm font-semibold text-white ring-2 ring-white">
              {initial}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-[13.5px] font-semibold leading-tight text-slate-900">
                {fullName}
              </p>
              <p className="mt-0.5 text-[11.5px] capitalize leading-none text-slate-500">
                {user?.role?.replace("_", " ") || "User"}
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition-transform duration-200 motion-reduce:transition-none sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setProfileOpen(false)}
                aria-label="Close profile menu"
              />

              <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                <div className="mb-1.5 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b1324] text-sm font-semibold text-white">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fullName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {identifier}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(settingsPath);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <UserCircle size={17} className="text-slate-400" />
                  {isStudent ? "My profile" : "Account settings"}
                </button>

                <div className="my-1.5 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
