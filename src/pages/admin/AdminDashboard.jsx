import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarDays,
  FileQuestion,
  ArrowUpRight,
  Plus,
  UserPlus,
  BookPlus,
  ClipboardPlus,
  Settings,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const quickActions = [
  {
    label: "Register Student",
    description: "Add a new student account",
    icon: UserPlus,
    path: "/admin/students",
    color: "blue",
  },
  {
    label: "Add Teacher",
    description: "Create a teacher account",
    icon: Users,
    path: "/admin/teachers",
    color: "purple",
  },
  {
    label: "Create Examination",
    description: "Set up a new examination",
    icon: ClipboardPlus,
    path: "/admin/examinations",
    color: "orange",
  },
  {
    label: "Add Questions",
    description: "Manage the question bank",
    icon: BookPlus,
    path: "/admin/questions",
    color: "green",
  },
];

const managementItems = [
  {
    title: "Academic Sessions",
    description: "Manage academic years and active sessions.",
    icon: CalendarDays,
    path: "/admin/sessions",
  },
  {
    title: "Classes & Subjects",
    description: "Organize school classes and subjects.",
    icon: GraduationCap,
    path: "/admin/classes",
  },
  {
    title: "Students & Enrollments",
    description: "Manage student records and class enrollment.",
    icon: Users,
    path: "/admin/students",
  },
  {
    title: "Question Bank",
    description: "Create and organize examination questions.",
    icon: FileQuestion,
    path: "/admin/questions",
  },
  {
    title: "Examinations",
    description: "Schedule, publish and manage examinations.",
    icon: ClipboardList,
    path: "/admin/examinations",
  },
  {
    title: "Results & Reports",
    description: "Review examination results and performance.",
    icon: BookOpen,
    path: "/admin/results",
  },
];

/**
 * Extracts the total record count from common API response formats.
 *
 * Supports:
 * { students: [], pagination: { total: 20 } }
 * { data: [], pagination: { total: 20 } }
 * { success: true, count: 20, data: [] }
 * { total: 20 }
 */
function extractTotal(response, possibleKeys = []) {
  const payload = response?.data || {};

  const pagination = payload.pagination || payload.meta || {};

  const total =
    pagination.total ??
    pagination.totalRecords ??
    pagination.totalItems ??
    payload.total ??
    payload.totalRecords ??
    payload.count;

  if (Number.isFinite(Number(total))) {
    return Number(total);
  }

  for (const key of possibleKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key].length;
    }

    if (Array.isArray(payload.data?.[key])) {
      return payload.data[key].length;
    }
  }

  if (Array.isArray(payload.data)) {
    return payload.data.length;
  }

  return 0;
}

const initialStatistics = {
  students: 0,
  teachers: 0,
  classes: 0,
  examinations: 0,
};

export default function AdminDashboard() {
  const { user } = useAuth();

  const [statistics, setStatistics] = useState(initialStatistics);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const firstName = user?.firstName || "Administrator";

  const fetchDashboardStatistics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/students"),
        api.get("/teachers"),
        api.get("/classes"),
        api.get("/examinations"),
      ]);

      const endpoints = [
        { key: "students", result: results[0], names: ["students"] },
        { key: "teachers", result: results[1], names: ["teachers"] },
        { key: "classes", result: results[2], names: ["classes"] },
        {
          key: "examinations",
          result: results[3],
          names: ["examinations", "exams"],
        },
      ];

      const updatedStatistics = { ...initialStatistics };
      const failedEndpoints = [];

      endpoints.forEach(({ key, result, names }) => {
        if (result.status === "fulfilled") {
          updatedStatistics[key] = extractTotal(result.value, names);
        } else {
          failedEndpoints.push(key);
          console.error(
            `Failed to fetch ${key}:`,
            result.reason?.response?.data || result.reason?.message,
          );
        }
      });

      setStatistics(updatedStatistics);

      if (failedEndpoints.length === endpoints.length) {
        setError(
          "Unable to load dashboard statistics. Please check your API connection and try again.",
        );
      } else if (failedEndpoints.length > 0) {
        setError(
          `Some statistics could not be loaded: ${failedEndpoints.join(", ")}.`,
        );
      }
    } catch (err) {
      console.error("Dashboard statistics error:", err);

      setError(
        err.response?.data?.message || "Unable to load dashboard statistics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStatistics();
  }, [fetchDashboardStatistics]);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium text-blue-100">
            ADMINISTRATOR OVERVIEW
          </p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back, {firstName}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Manage your school's academic activities, students, teachers,
            examinations and results from one place.
          </p>
        </div>

        <Link
          to="/admin/examinations"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <Plus size={18} />
          New Examination
        </Link>
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              School Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              A summary of your school's academic records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardStatistics(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Students"
            value={loading ? "..." : statistics.students.toLocaleString()}
            description="Registered student accounts"
            icon={Users}
            iconColor="blue"
          />

          <StatCard
            title="Total Teachers"
            value={loading ? "..." : statistics.teachers.toLocaleString()}
            description="Registered teaching staff"
            icon={GraduationCap}
            iconColor="purple"
          />

          <StatCard
            title="Total Classes"
            value={loading ? "..." : statistics.classes.toLocaleString()}
            description="School classes"
            icon={BookOpen}
            iconColor="green"
          />

          <StatCard
            title="Examinations"
            value={loading ? "..." : statistics.examinations.toLocaleString()}
            description="Created examinations"
            icon={ClipboardList}
            iconColor="orange"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>

          <p className="mt-1 text-sm text-slate-500">
            Quickly access frequently used operations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            const colors = {
              blue: "bg-blue-50 text-blue-600",
              purple: "bg-purple-50 text-purple-600",
              orange: "bg-orange-50 text-orange-600",
              green: "bg-green-50 text-green-600",
            };

            return (
              <Link
                key={action.label}
                to={action.path}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[action.color]}`}
                  >
                    <Icon size={21} />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-slate-300 transition group-hover:text-blue-600"
                  />
                </div>

                <h3 className="mt-5 font-semibold text-slate-900">
                  {action.label}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Management modules */}
      <section>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Management Modules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Access the different areas of your school management system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                to={item.path}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ArrowUpRight size={17} className="shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* System information */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">Academic Calendar</h3>

              <p className="text-xs text-slate-400">
                Session and term information
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Academic session information will appear here once an active
              session is configured.
            </p>

            <Link
              to="/admin/sessions"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage sessions
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Settings size={20} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">System Management</h3>

              <p className="text-xs text-slate-400">
                Configure your school portal
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Manage your school information and administrative preferences.
            </p>

            <Link
              to="/admin/settings"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Open settings
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
