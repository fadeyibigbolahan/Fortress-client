import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import fortress_logo from "../../assets/Fortress.png";

const roles = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "exam_officer", label: "Exam Officer" },
  { value: "admin", label: "Administrator" },
];

const credentialLabels = {
  admin: "Username or email",
  teacher: "Staff ID",
  exam_officer: "Staff ID",
  student: "Admission number",
};

const credentialPlaceholders = {
  admin: "Enter your username or email",
  teacher: "Enter your staff ID",
  exam_officer: "Enter your staff ID",
  student: "Enter your admission number",
};

const dashboardPaths = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  exam_officer: "/exam-officer/dashboard",
  student: "/student/dashboard",
};

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Set and sit exams in one place",
    text: "Schedules, papers and submissions stay together.",
  },
  {
    icon: BarChart3,
    title: "Results without the paperwork",
    text: "Scores and reports are ready as soon as marking ends.",
  },
  {
    icon: ShieldCheck,
    title: "Access that matches your role",
    text: "Everyone sees only what they need to see.",
  },
];

const battlementStyle = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.06) 50%, transparent 50%)",
  backgroundSize: "48px 100%",
};

const inputBase =
  "w-full rounded-lg border border-transparent bg-slate-100 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:bg-slate-200/70 focus:border-[#1d3f72] focus:bg-white focus:ring-4 focus:ring-[#1d3f72]/10";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d3f72] border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={dashboardPaths[user.role] || "/login"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      toast.error("Please enter your login credentials.");
      return;
    }

    try {
      setSubmitting(true);

      const authenticatedUser = await login(identifier.trim(), password, role);

      toast.success("Login successful. Welcome!");

      navigate(dashboardPaths[authenticatedUser.role] || "/", {
        replace: true,
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to sign in. Please try again.";

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden">
      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden bg-[#0f2747] text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#2a5aa0]/30 blur-3xl"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between px-9 py-7 xl:px-12 xl:py-9">
          <header className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 shadow-lg shadow-black/20">
              <img
                src={fortress_logo}
                alt="The Fortress College"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-base font-semibold leading-tight">
                The Fortress College
              </p>
              <p className="text-xs text-slate-300">
                Examination Management System
              </p>
            </div>
          </header>

          <div className="max-w-lg py-5">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Examinations, organised from start to results.
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Sign in to your school portal to manage exams, take assessments
              and view your results.
            </p>

            <ul className="mt-7 space-y-4">
              {highlights.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon size={18} className="text-[#e5c26b]" />
                  </span>

                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} The Fortress College
          </p>
        </div>

        <div
          aria-hidden="true"
          className="relative z-10 h-3 w-full"
          style={battlementStyle}
        />
      </aside>

      {/* Login form */}
      <main className="flex min-h-screen flex-col bg-white px-5 py-6 sm:px-10 lg:min-h-0 lg:h-screen lg:overflow-y-auto lg:px-10 lg:py-5 xl:px-16">
        {/* Mobile brand */}
        <header className="flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5 ring-1 ring-slate-200">
            <img
              src={fortress_logo}
              alt="The Fortress College"
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900">
              The Fortress College
            </p>
            <p className="text-[11px] text-slate-500">
              Examination Management System
            </p>
          </div>
        </header>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-5 lg:py-0">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Choose your account type, then sign in.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Role selector */}
              <fieldset>
                <legend className="mb-2 text-xs font-semibold text-slate-700">
                  I am a
                </legend>

                <div
                  role="radiogroup"
                  aria-label="Account type"
                  className="flex flex-wrap gap-1.5"
                >
                  {roles.map((item) => {
                    const active = role === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setRole(item.value);
                          setIdentifier("");
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3f72] focus-visible:ring-offset-2 ${
                          active
                            ? "border-[#0f2747] bg-[#0f2747] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  {credentialLabels[role]}
                </label>

                <div className="relative">
                  <UserRound
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={credentialPlaceholders[role]}
                    autoComplete="username"
                    required
                    className={`${inputBase} pl-10 pr-3.5`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className={`${inputBase} pl-10 pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3f72]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f2747] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f72] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d3f72]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        <footer className="mx-auto flex w-full max-w-sm items-start gap-2 border-t border-slate-200 pt-3 text-[11px] leading-4 text-slate-500">
          <ShieldCheck
            size={15}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#1d3f72]"
          />

          <p>
            Your account is managed by your school administrator. If you can't
            sign in or have forgotten your password, contact them to reset it.
          </p>
        </footer>
      </main>
    </div>
  );
}
