import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  ClipboardList,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  History,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

function formatDate(date) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return parsedDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusDetails(status) {
  const statuses = {
    completed: {
      label: "Completed",
      className: "bg-green-50 text-green-700",
      icon: CheckCircle2,
      description: "You successfully submitted this examination.",
    },
    expired: {
      label: "Expired",
      className: "bg-red-50 text-red-700",
      icon: XCircle,
      description: "Your examination attempt expired.",
    },
    missed: {
      label: "Missed",
      className: "bg-amber-50 text-amber-700",
      icon: AlertCircle,
      description: "You did not attempt this examination before its deadline.",
    },
  };

  return (
    statuses[status] || {
      label: "Unknown",
      className: "bg-slate-100 text-slate-600",
      icon: History,
      description: "Examination status unavailable.",
    }
  );
}

export default function ExaminationHistory() {
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student-portal/examinations");

      const allExaminations = response.data.examinations || [];

      const history = allExaminations.filter((exam) =>
        ["completed", "expired", "missed"].includes(exam.status),
      );

      setExaminations(history);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load your examination history.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Map();

    examinations.forEach((exam) => {
      if (exam.subject?.id) {
        uniqueSubjects.set(exam.subject.id, exam.subject.name);
      }
    });

    return Array.from(uniqueSubjects.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [examinations]);

  const summary = useMemo(
    () => ({
      total: examinations.length,
      completed: examinations.filter((exam) => exam.status === "completed")
        .length,
      expired: examinations.filter((exam) => exam.status === "expired").length,
      missed: examinations.filter((exam) => exam.status === "missed").length,
    }),
    [examinations],
  );

  const filteredExaminations = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return examinations.filter((exam) => {
      const matchesStatus =
        statusFilter === "all" || exam.status === statusFilter;

      const matchesSubject =
        subjectFilter === "all" || exam.subject?.id === subjectFilter;

      const matchesSearch =
        !searchText ||
        exam.title?.toLowerCase().includes(searchText) ||
        exam.subject?.name?.toLowerCase().includes(searchText);

      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [examinations, search, statusFilter, subjectFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Examination History
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review your completed, expired, and missed examinations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total History",
            value: summary.total,
            icon: ClipboardList,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Completed",
            value: summary.completed,
            icon: CheckCircle2,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Expired",
            value: summary.expired,
            icon: XCircle,
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Missed",
            value: summary.missed,
            icon: AlertCircle,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{item.label}</p>

                <div className={`rounded-lg p-2 ${item.color}`}>
                  <Icon size={18} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search examinations..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All history</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="missed">Missed</option>
        </select>

        <select
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All subjects</option>

          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading examination history...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <AlertCircle className="mx-auto text-red-500" size={32} />

          <h3 className="mt-3 font-semibold text-slate-800">
            Could not load examination history
          </h3>

          <p className="mt-1 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={fetchHistory}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : filteredExaminations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <History className="mx-auto text-slate-300" size={42} />

          <h3 className="mt-4 font-semibold text-slate-800">
            No examination history found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Your completed, expired, and missed examinations will appear here.
          </p>

          {(search || statusFilter !== "all" || subjectFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setSubjectFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExaminations.map((exam) => {
            const status = getStatusDetails(exam.status);
            const StatusIcon = status.icon;

            return (
              <article
                key={exam.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{exam.title}</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {exam.subject?.name || "Subject not specified"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {exam.academicSession?.name || "Academic session"}{" "}
                        {exam.term?.name ? `• ${exam.term.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                  >
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Questions</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.totalQuestions ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Total Marks</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.totalMarks ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
                      <Clock3 size={14} />
                      {exam.durationMinutes ?? 0} minutes
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Class</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.class?.name || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} className="shrink-0" />
                    <span>Scheduled: {formatDate(exam.startAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays size={15} className="shrink-0" />
                    <span>Deadline: {formatDate(exam.endAt)}</span>
                  </div>
                </div>

                {exam.attempt && (
                  <div className="mt-4 rounded-xl border border-slate-100 p-3">
                    <p className="text-xs font-semibold text-slate-600">
                      Attempt information
                    </p>

                    {exam.attempt.startedAt && (
                      <p className="mt-2 text-xs text-slate-500">
                        Started: {formatDate(exam.attempt.startedAt)}
                      </p>
                    )}

                    {exam.attempt.submittedAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted: {formatDate(exam.attempt.submittedAt)}
                      </p>
                    )}

                    {exam.attempt.expiresAt && exam.status === "expired" && (
                      <p className="mt-1 text-xs text-slate-500">
                        Expired: {formatDate(exam.attempt.expiresAt)}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">{status.description}</p>

                  {exam.status === "completed" && (
                    <p className="mt-2 text-xs font-medium text-blue-600">
                      Your result will be available here once officially
                      released.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredExaminations.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          Showing {filteredExaminations.length} of {examinations.length}{" "}
          examinations
        </p>
      )}
    </div>
  );
}
