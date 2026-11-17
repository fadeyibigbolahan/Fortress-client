import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  ClipboardList,
  Search,
  RefreshCw,
  AlertCircle,
  Play,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const statusOptions = [
  { value: "all", label: "All examinations" },
  { value: "upcoming", label: "Upcoming" },
  { value: "available", label: "Available" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "expired", label: "Expired" },
];

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

function getActionDetails(status) {
  switch (status) {
    case "available":
      return {
        label: "Start Examination",
        description: "This examination is available to start.",
        icon: Play,
        className:
          "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
        enabled: true,
      };

    case "in_progress":
      return {
        label: "Continue Examination",
        description: "You have an examination in progress.",
        icon: RotateCcw,
        className:
          "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-200",
        enabled: true,
      };

    case "completed":
      return {
        label: "Submitted",
        description: "You have already submitted this examination.",
        icon: CheckCircle2,
        className: "bg-slate-100 text-slate-500 cursor-not-allowed",
        enabled: false,
      };

    case "upcoming":
      return {
        label: "Not Yet Available",
        description:
          "This examination will become available at its scheduled start time.",
        icon: Clock3,
        className: "bg-slate-100 text-slate-500 cursor-not-allowed",
        enabled: false,
      };

    case "expired":
    case "missed":
      return {
        label: "Unavailable",
        description: "This examination is no longer available to start.",
        icon: AlertCircle,
        className: "bg-slate-100 text-slate-500 cursor-not-allowed",
        enabled: false,
      };

    default:
      return {
        label: "Unavailable",
        description: "This examination cannot currently be accessed.",
        icon: AlertCircle,
        className: "bg-slate-100 text-slate-500 cursor-not-allowed",
        enabled: false,
      };
  }
}

export default function StudentExaminations() {
  const navigate = useNavigate();

  const [examinations, setExaminations] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startingExamId, setStartingExamId] = useState(null);

  const fetchExaminations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student-portal/examinations");

      setExaminations(response.data.examinations || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load your examinations.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminations();
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

  const filteredExaminations = useMemo(() => {
    return examinations.filter((exam) => {
      const matchesStatus =
        statusFilter === "all" || exam.status === statusFilter;

      const matchesSubject =
        subjectFilter === "all" || exam.subject?.id === subjectFilter;

      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        exam.title?.toLowerCase().includes(searchText) ||
        exam.subject?.name?.toLowerCase().includes(searchText);

      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [examinations, statusFilter, subjectFilter, search]);

  const handleOpenExamination = async (exam) => {
    if (!["available", "in_progress"].includes(exam.status)) {
      return;
    }

    try {
      setStartingExamId(exam.id);

      // The examination-taking page will use this ID to start
      // a new attempt or recover an existing attempt.
      navigate(`/student/examinations/${exam.id}/take`);
    } catch (error) {
      toast.error("Unable to open this examination.");
    } finally {
      setStartingExamId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Examinations</h1>
          <p className="mt-2 text-sm text-slate-500">
            View your scheduled, available, and completed examinations.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchExaminations}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            label: "Total",
            value: summary.totalExaminations ?? examinations.length,
          },
          { label: "Upcoming", value: summary.upcoming ?? 0 },
          { label: "Available", value: summary.available ?? 0 },
          { label: "In Progress", value: summary.inProgress ?? 0 },
          { label: "Completed", value: summary.completed ?? 0 },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
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
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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

      {/* Examination list */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading examinations...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <AlertCircle className="mx-auto text-red-500" size={32} />

          <p className="mt-3 font-semibold text-slate-800">
            Could not load examinations
          </p>

          <p className="mt-1 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={fetchExaminations}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : filteredExaminations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <ClipboardList className="mx-auto text-slate-300" size={40} />

          <h3 className="mt-4 font-semibold text-slate-800">
            No examinations found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            There are no examinations matching your selected filters.
          </p>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setSubjectFilter("all");
              setSearch("");
            }}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredExaminations.map((exam) => {
            const action = getActionDetails(exam.status);
            const ActionIcon = action.icon;
            const isOpening = startingExamId === exam.id;

            return (
              <article
                key={exam.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
              >
                {/* Examination heading */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">{exam.title}</h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {exam.subject?.name || "Subject"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(exam.status)}`}
                  >
                    {(exam.status || "unknown").replaceAll("_", " ")}
                  </span>
                </div>

                {/* Description */}
                {exam.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-500">
                    {exam.description}
                  </p>
                )}

                {/* Examination information */}
                <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-400">Questions</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.totalQuestions}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Total Marks</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.totalMarks}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
                      <Clock3 size={14} />
                      {exam.durationMinutes} minutes
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Term</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {exam.term?.name || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={15} />
                  <span>Starts: {formatDate(exam.startAt)}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={15} />
                  <span>Ends: {formatDate(exam.endAt)}</span>
                </div>

                {/* Attempt information */}
                {exam.attempt && (
                  <div className="mt-4 rounded-xl border border-slate-100 p-3">
                    <p className="text-xs font-semibold text-slate-600">
                      Your attempt
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-500">
                      Status: {exam.attempt.status?.replaceAll("_", " ")}
                    </p>

                    {exam.attempt.submittedAt && (
                      <p className="mt-1 text-xs text-slate-500">
                        Submitted: {formatDate(exam.attempt.submittedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Action */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs text-slate-500">
                    {action.description}
                  </p>

                  <button
                    type="button"
                    disabled={!action.enabled || isOpening}
                    onClick={() => handleOpenExamination(exam)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:opacity-70 ${action.className}`}
                  >
                    {isOpening ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Opening examination...
                      </>
                    ) : (
                      <>
                        <ActionIcon size={17} />
                        {action.label}
                        {action.enabled && <ArrowRight size={16} />}
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
