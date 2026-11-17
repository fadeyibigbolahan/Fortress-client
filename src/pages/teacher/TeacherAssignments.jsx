import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  CalendarDays,
  Search,
  RefreshCw,
  Loader2,
  Layers3,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const getErrorMessage = (error) =>
  error?.response?.data?.message || "Unable to load your teaching assignments.";

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function TeacherAssignments() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/teacher-assignments/my");

      setAssignments(response.data?.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return assignments;

    return assignments.filter((assignment) => {
      const subject = assignment.subject || {};
      const schoolClass = assignment.class || {};
      const session = assignment.academicSession || {};

      const searchableText = [
        subject.name,
        subject.code,
        schoolClass.name,
        schoolClass.level,
        schoolClass.arm,
        session.name,
        session.status,
        assignment.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [assignments, search]);

  const statistics = useMemo(() => {
    const subjects = new Set(
      assignments
        .map((item) => item.subject?._id || item.subject?.id)
        .filter(Boolean)
        .map(String),
    );

    const classes = new Set(
      assignments
        .map((item) => item.class?._id || item.class?.id)
        .filter(Boolean)
        .map(String),
    );

    const sessions = new Set(
      assignments
        .map((item) => item.academicSession?._id || item.academicSession?.id)
        .filter(Boolean)
        .map(String),
    );

    return {
      total: assignments.length,
      subjects: subjects.size,
      classes: classes.size,
      sessions: sessions.size,
    };
  }, [assignments]);

  const teacherName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") || "Teacher";

  const statCards = [
    {
      label: "Total Assignments",
      value: statistics.total,
      description: "Active teaching assignments",
      icon: ClipboardList,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      label: "Subjects",
      value: statistics.subjects,
      description: "Different subjects assigned",
      icon: BookOpen,
      iconStyle: "bg-purple-50 text-purple-600",
    },
    {
      label: "Classes",
      value: statistics.classes,
      description: "Different classes assigned",
      icon: GraduationCap,
      iconStyle: "bg-green-50 text-green-600",
    },
    {
      label: "Academic Sessions",
      value: statistics.sessions,
      description: "Sessions represented",
      icon: CalendarDays,
      iconStyle: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Teaching Assignments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View the subjects and classes assigned to you by the school.
          </p>
        </div>

        <button
          onClick={() => fetchAssignments(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Teacher information */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Teacher profile
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {teacherName}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Staff ID: {user?.staffId || "Not available"}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-xs font-semibold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Teaching assignments
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-900">
                    {loading ? "—" : stat.value}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    {stat.description}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${stat.iconStyle}`}>
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignments */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Assigned Subjects and Classes
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Your active teaching responsibilities.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subjects or classes..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-indigo-600" />
            <p className="mt-3 text-sm text-gray-500">
              Loading your assignments...
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              {assignments.length === 0 ? (
                <AlertCircle size={25} />
              ) : (
                <Search size={25} />
              )}
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              {assignments.length === 0
                ? "No teaching assignments yet"
                : "No matching assignments"}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              {assignments.length === 0
                ? "Your teaching assignments will appear here once the school administrator assigns subjects and classes to you."
                : "Try searching with a different subject, class or academic session."}
            </p>

            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Academic Session</th>
                    <th className="px-5 py-4">Assigned Date</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAssignments.map((assignment) => (
                    <tr
                      key={assignment._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <BookOpen size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {assignment.subject?.name || "Unknown subject"}
                            </p>

                            {assignment.subject?.code && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {assignment.subject.code}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {assignment.class?.name || "Unknown class"}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {[assignment.class?.level, assignment.class?.arm]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {assignment.academicSession?.name || "Not available"}
                        </p>

                        <p className="mt-0.5 text-xs capitalize text-gray-500">
                          {assignment.academicSession?.status || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          assignment.assignedAt || assignment.createdAt,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold capitalize text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {assignment.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile assignment cards */}
            <div className="space-y-3 p-4 md:hidden">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <BookOpen size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {assignment.subject?.name || "Unknown subject"}
                        </h3>

                        <p className="text-xs text-gray-500">
                          {assignment.subject?.code || "Subject"}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                      {assignment.status || "active"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="text-xs text-gray-400">Class</p>
                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {assignment.class?.name || "Unknown class"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {[assignment.class?.level, assignment.class?.arm]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Academic Session</p>
                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {assignment.academicSession?.name || "Not available"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Assigned Date</p>
                      <p className="mt-1 text-sm text-gray-700">
                        {formatDate(
                          assignment.assignedAt || assignment.createdAt,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && filteredAssignments.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4">
            <p className="text-xs text-gray-500">
              Showing {filteredAssignments.length} of {assignments.length}{" "}
              active assignments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
