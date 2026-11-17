import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  const styles = {
    upcoming: "bg-blue-50 text-blue-700",
    available: "bg-green-50 text-green-700",
    in_progress: "bg-amber-50 text-amber-700",
    completed: "bg-slate-100 text-slate-700",
    expired: "bg-red-50 text-red-700",
    missed: "bg-red-50 text-red-700",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
}

function readableStatus(status) {
  return (status || "unknown").replaceAll("_", " ");
}

function StatCard({ title, value, description, icon: Icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">
            {value ?? 0}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconStyle}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student-portal/dashboard");
      setDashboard(response.data.dashboard || response.data);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load your dashboard.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h2 className="mt-3 font-semibold text-slate-900">
          Dashboard unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  const student = dashboard?.student || user || {};
  const enrollment = dashboard?.enrollment || {};
  const statistics = dashboard?.statistics || {};
  const recentExaminations = dashboard?.recentExaminations || [];

  const fullName =
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") || "Student";

  const className =
    enrollment.class?.name ||
    student.currentClass?.name ||
    "Class not assigned";

  const sessionName = enrollment.academicSession?.name || "No active session";

  return (
    <div className="space-y-7">
      {/* Welcome section */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-100">STUDENT PORTAL</p>

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Welcome back, {student.firstName || "Student"}!
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Keep track of your examinations, monitor your progress, and stay
              prepared for your upcoming assessments.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="rounded-lg bg-white/15 px-3 py-2">
                Admission No: {student.admissionNumber || "Not available"}
              </span>
              <span className="rounded-lg bg-white/15 px-3 py-2">
                {className}
              </span>
            </div>
          </div>

          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 md:flex">
            <GraduationCap size={52} className="text-white" />
          </div>
        </div>
      </section>

      {/* Student information */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Current Class</p>
            <p className="mt-1 font-semibold text-slate-900">{className}</p>
            <p className="text-xs text-slate-500">
              {enrollment.class?.level || student.currentClass?.level || ""}
              {enrollment.class?.arm ? ` - ${enrollment.class.arm}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
            <CalendarDays size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Academic Session</p>
            <p className="mt-1 font-semibold text-slate-900">{sessionName}</p>
            <p className="text-xs text-slate-500">
              {enrollment.academicSession?.status || "Current enrollment"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2 lg:col-span-1">
          <div className="rounded-xl bg-green-50 p-3 text-green-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Enrollment Status</p>
            <p className="mt-1 font-semibold capitalize text-slate-900">
              {enrollment.status || "Active"}
            </p>
            <p className="text-xs text-slate-500">
              Enrolled {formatDate(enrollment.enrollmentDate)}
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Examination Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A summary of your examination activities.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Examinations"
            value={statistics.totalExaminations}
            description="Examinations assigned to you"
            icon={ClipboardList}
            iconStyle="bg-blue-50 text-blue-600"
          />

          <StatCard
            title="Available"
            value={statistics.available}
            description="Ready for you to start"
            icon={BookOpen}
            iconStyle="bg-green-50 text-green-600"
          />

          <StatCard
            title="Upcoming"
            value={statistics.upcoming}
            description="Scheduled for a future date"
            icon={Clock3}
            iconStyle="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Completed"
            value={statistics.completed}
            description="Examinations you have submitted"
            icon={CheckCircle2}
            iconStyle="bg-purple-50 text-purple-600"
          />
        </div>
      </section>

      {/* Recent examinations */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">Recent Examinations</h2>
            <p className="mt-1 text-xs text-slate-500">
              Your latest examination activities.
            </p>
          </div>

          <Link
            to="/student/examinations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentExaminations.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="mx-auto text-slate-300" size={34} />
            <p className="mt-3 font-medium text-slate-700">
              No examinations yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Your assigned examinations will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExaminations.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <h3 className="font-semibold text-slate-800">{exam.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {exam.subject?.name || "Subject"} ·{" "}
                    {exam.term?.name || "Term"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(exam.startAt)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(exam.status)}`}
                >
                  {readableStatus(exam.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
