import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  Users,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Award,
  X,
} from "lucide-react";
import api from "../../services/api";

const statusStyles = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  released: "bg-green-50 text-green-700 border-green-200",
};

const statusLabels = {
  pending_review: "Pending Review",
  approved: "Approved",
  released: "Released",
};

const formatName = (student) => {
  if (!student) return "Unknown Student";

  return (
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    "Unknown Student"
  );
};

const formatClass = (schoolClass) => {
  if (!schoolClass) return "—";

  return (
    [schoolClass.level, schoolClass.arm].filter(Boolean).join(" ") ||
    schoolClass.name ||
    "—"
  );
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatPercentage = (percentage) => {
  const value = Number(percentage);

  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "—";
};

function StatusBadge({ status }) {
  const style =
    statusStyles[status] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        style
      }`}
    >
      {statusLabels[status] || status || "Unknown"}
    </span>
  );
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            colors[color]
          }`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function TeacherResults() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = {
        page,
        limit: 20,
      };

      if (status) {
        params.status = status;
      }

      const response = await api.get("/results/teacher/results", {
        params,
      });

      setResults(response.data.results || []);
      setPagination(
        response.data.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load examination results. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, status]);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return results;

    return results.filter((result) => {
      const studentName = formatName(result.student).toLowerCase();
      const admissionNumber = (
        result.student?.admissionNumber || ""
      ).toLowerCase();
      const examination = (result.examination?.title || "").toLowerCase();
      const subject = (result.subject?.name || "").toLowerCase();
      const className = formatClass(result.schoolClass).toLowerCase();

      return (
        studentName.includes(term) ||
        admissionNumber.includes(term) ||
        examination.includes(term) ||
        subject.includes(term) ||
        className.includes(term)
      );
    });
  }, [results, search]);

  const summary = useMemo(() => {
    return {
      total: pagination.total,
      pending: results.filter((item) => item.gradingStatus === "pending_review")
        .length,
      approved: results.filter((item) => item.gradingStatus === "approved")
        .length,
      released: results.filter((item) => item.gradingStatus === "released")
        .length,
    };
  }, [results, pagination.total]);

  const changeStatus = (value) => {
    setPage(1);
    setStatus(value);
  };

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">TEACHER WORKSPACE</p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Student Results
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View examination performance for students in your assigned classes
            and subjects.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchResults(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Results"
          value={summary.total}
          description="Results in your assigned classes"
          icon={FileText}
          color="blue"
        />

        <SummaryCard
          title="Pending Review"
          value={summary.pending}
          description="Awaiting administrative approval"
          icon={Clock3}
          color="amber"
        />

        <SummaryCard
          title="Approved"
          value={summary.approved}
          description="Approved examination results"
          icon={CheckCircle2}
          color="purple"
        />

        <SummaryCard
          title="Released"
          value={summary.released}
          description="Published examination results"
          icon={Award}
          color="green"
        />
      </section>

      {/* Results table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-bold text-slate-900">Examination Results</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review marks and performance across your assigned classes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student or examination..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="relative sm:w-48">
                <Filter
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={status}
                  onChange={(event) => changeStatus(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All statuses</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="released">Released</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => fetchResults()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading examination results...
              </p>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              {search || status ? <Search size={27} /> : <FileText size={27} />}
            </div>

            <h3 className="mt-5 font-semibold text-slate-900">
              {search || status
                ? "No matching results"
                : "No examination results yet"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || status
                ? "Try changing your search term or status filter."
                : "Results will appear here after students complete examinations and all required questions have been graded."}
            </p>

            {(search || status) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  changeStatus("");
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                <X size={16} />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Examination</th>
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Marks</th>
                    <th className="px-5 py-4 font-semibold">Percentage</th>
                    <th className="px-5 py-4 font-semibold">Performance</th>
                    <th className="px-5 py-4 font-semibold">Result Status</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => (
                    <tr
                      key={result._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {formatName(result.student)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.student?.admissionNumber ||
                            "No admission number"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {result.examination?.title || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.subject?.name || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatClass(result.schoolClass)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold tabular-nums text-slate-900">
                          {Number(result.totalAwardedMarks || 0).toFixed(2)}
                          <span className="font-normal text-slate-400">
                            {" "}
                            /{" "}
                            {Number(result.totalPossibleMarks || 0).toFixed(2)}
                          </span>
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold tabular-nums text-slate-900">
                          {formatPercentage(result.percentage)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {result.isPassed === true ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                            <CheckCircle2 size={15} />
                            Passed
                          </span>
                        ) : result.isPassed === false ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                            <AlertCircle size={15} />
                            Failed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={result.gradingStatus} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(result.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredResults.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {pagination.total}
                </span>{" "}
                results
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-slate-500">
                  Page {pagination.page || page} of{" "}
                  {Math.max(1, pagination.totalPages || 1)}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages || 1, current + 1),
                    )
                  }
                  disabled={page >= (pagination.totalPages || 1) || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
