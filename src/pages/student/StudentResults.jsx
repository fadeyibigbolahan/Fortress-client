import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
  X,
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

function formatNumber(value) {
  return Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, "");
}

function ResultStatus({ passed }) {
  return passed ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      Passed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
      <XCircle size={14} />
      Failed
    </span>
  );
}

function ResultDetailsModal({ result, onClose }) {
  if (!result) return null;

  const passed = Boolean(result.isPassed);

  const percentage = Math.min(100, Math.max(0, Number(result.percentage || 0)));

  const objectiveMarks = Number(result.objectiveMarks || 0);
  const theoryMarks = Number(result.theoryMarks || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Result Details
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {result.examination?.title || "Examination Result"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {result.subject?.name || "Subject"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close result details"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5 sm:p-6">
          {/* Main score */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex flex-col items-center text-center">
              <div
                className={`rounded-full p-3 ${
                  passed
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <Award size={28} />
              </div>

              <p className="mt-3 text-sm text-slate-500">Overall Percentage</p>

              <p className="mt-1 text-4xl font-bold text-slate-900">
                {percentage.toFixed(2)}%
              </p>

              <div className="mt-3">
                <ResultStatus passed={passed} />
              </div>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    passed ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div>
            <h3 className="font-semibold text-slate-900">Score Breakdown</h3>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Total Score",
                  value: `${formatNumber(result.totalAwardedMarks)} / ${formatNumber(result.totalPossibleMarks)}`,
                },
                {
                  label: "Pass Mark",
                  value: formatNumber(result.passMarks),
                },
                {
                  label: "Objective",
                  value: formatNumber(objectiveMarks),
                },
                {
                  label: "Theory",
                  value: formatNumber(theoryMarks),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-xs text-slate-500">{item.label}</p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Examination information */}
          <div>
            <h3 className="font-semibold text-slate-900">
              Examination Information
            </h3>

            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              {[
                {
                  label: "Subject",
                  value: result.subject?.name,
                },
                {
                  label: "Class",
                  value: result.schoolClass?.name,
                },
                {
                  label: "Academic Session",
                  value: result.academicSession?.name,
                },
                {
                  label: "Term",
                  value: result.term?.name,
                },
                {
                  label: "Grading Mode",
                  value: result.gradingMode,
                },
                {
                  label: "Released On",
                  value: formatDate(result.releasedAt),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-xs text-slate-500">{item.label}</span>

                  <span className="text-right text-sm font-medium capitalize text-slate-800">
                    {item.value || "Not available"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          {result.remarks && (
            <div>
              <h3 className="font-semibold text-slate-900">
                Teacher's Remarks
              </h3>

              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  {result.remarks}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedResult, setSelectedResult] = useState(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/results/my");

      setResults(response.data.data || []);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load your results.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const subjects = useMemo(() => {
    const uniqueSubjects = new Map();

    results.forEach((result) => {
      if (result.subject?._id) {
        uniqueSubjects.set(result.subject._id, result.subject.name);
      }
    });

    return Array.from(uniqueSubjects.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [results]);

  const summary = useMemo(() => {
    const passed = results.filter((result) => result.isPassed).length;
    const failed = results.length - passed;

    const average =
      results.length > 0
        ? results.reduce(
            (total, result) => total + Number(result.percentage || 0),
            0,
          ) / results.length
        : 0;

    return {
      total: results.length,
      passed,
      failed,
      average,
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return results.filter((result) => {
      const subjectId = result.subject?._id;

      const matchesSubject =
        subjectFilter === "all" || subjectId === subjectFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "passed" && result.isPassed) ||
        (statusFilter === "failed" && !result.isPassed);

      const matchesSearch =
        !searchText ||
        result.examination?.title?.toLowerCase().includes(searchText) ||
        result.subject?.name?.toLowerCase().includes(searchText) ||
        result.academicSession?.name?.toLowerCase().includes(searchText);

      return matchesSubject && matchesStatus && matchesSearch;
    });
  }, [results, search, subjectFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Results</h1>

          <p className="mt-2 text-sm text-slate-500">
            View your officially released examination results and performance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchResults}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Released Results",
            value: summary.total,
            icon: ClipboardList,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Passed",
            value: summary.passed,
            icon: CheckCircle2,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Failed",
            value: summary.failed,
            icon: XCircle,
            color: "bg-red-50 text-red-600",
          },
          {
            label: "Average Score",
            value: `${summary.average.toFixed(1)}%`,
            icon: GraduationCap,
            color: "bg-purple-50 text-purple-600",
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
            placeholder="Search results..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

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

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All results</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-3 text-sm text-slate-500">
              Loading your results...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <XCircle className="mx-auto text-red-500" size={32} />

          <h3 className="mt-3 font-semibold text-slate-800">
            Could not load results
          </h3>

          <p className="mt-1 text-sm text-slate-500">{error}</p>

          <button
            type="button"
            onClick={fetchResults}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <Award className="mx-auto text-slate-300" size={42} />

          <h3 className="mt-4 font-semibold text-slate-800">
            {results.length === 0
              ? "No results released yet"
              : "No matching results found"}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {results.length === 0
              ? "Your examination results will appear here once they have been officially released by the school."
              : "Try changing your search or filters."}
          </p>

          {results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSubjectFilter("all");
                setStatusFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <article
              key={result._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <BookOpen size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">
                      {result.examination?.title || "Examination"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {result.subject?.name || "Subject"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {result.academicSession?.name || "Academic session"}
                      {result.term?.name ? ` • ${result.term.name}` : ""}
                    </p>
                  </div>
                </div>

                <ResultStatus passed={result.isPassed} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">Score</p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(result.totalAwardedMarks)}
                    <span className="text-sm font-medium text-slate-400">
                      {" "}
                      / {formatNumber(result.totalPossibleMarks)}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Percentage</p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {Number(result.percentage || 0).toFixed(2)}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Pass Mark</p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(result.passMarks)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Released</p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {formatDate(result.releasedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={15} />

                  <span>
                    {result.schoolClass?.name || "Class not specified"}
                    {result.schoolClass?.arm
                      ? ` - ${result.schoolClass.arm}`
                      : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedResult(result)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Eye size={16} />
                  View Result
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && filteredResults.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          Showing {filteredResults.length} of {results.length} released results
        </p>
      )}

      <ResultDetailsModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}
