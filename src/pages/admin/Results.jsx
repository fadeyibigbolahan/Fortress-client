import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  RefreshCw,
  Eye,
  Check,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ClipboardList,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const statusOptions = [
  { value: "all", label: "All results" },
  { value: "pending_review", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "released", label: "Released" },
];

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    pending_review: "bg-amber-50 text-amber-700",
    approved: "bg-blue-50 text-blue-700",
    released: "bg-green-50 text-green-700",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
};

const getStudentName = (student) => {
  if (!student) return "Unknown student";

  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
};

function SummaryCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-xl p-3 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ResultDetailsModal({ result, onClose }) {
  if (!result) return null;

  const student = result.student;
  const examination = result.examination;
  const subject = result.subject;
  const schoolClass = result.schoolClass;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Result details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the student's examination performance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close result details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Student
            </p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {getStudentName(student)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Admission number: {student?.admissionNumber || "Not available"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Examination</p>
              <p className="mt-1 font-semibold text-slate-800">
                {examination?.title || "Unknown examination"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Subject</p>
              <p className="mt-1 font-semibold text-slate-800">
                {subject?.name || "Not available"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Class</p>
              <p className="mt-1 font-semibold text-slate-800">
                {schoolClass?.name || "Not available"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Grading mode</p>
              <p className="mt-1 font-semibold capitalize text-slate-800">
                {result.gradingMode || "Not available"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Awarded marks", result.totalAwardedMarks ?? 0],
              ["Total marks", result.totalPossibleMarks ?? 0],
              ["Pass marks", result.passMarks ?? 0],
              ["Percentage", `${result.percentage ?? 0}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 p-3"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Examination outcome
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {result.isPassed
                  ? "The student achieved the required pass mark."
                  : "The student did not achieve the required pass mark."}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                result.isPassed
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {result.isPassed ? "Passed" : "Failed"}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">
              Publication status
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                result.gradingStatus,
              )}`}
            >
              {(result.gradingStatus || "unknown").replaceAll("_", " ")}
            </span>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              {result.approvedAt && (
                <p>Approved: {formatDate(result.approvedAt)}</p>
              )}
              {result.releasedAt && (
                <p>Released: {formatDate(result.releasedAt)}</p>
              )}
              <p>Generated: {formatDate(result.createdAt)}</p>
            </div>
          </div>

          {result.remarks && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Remarks</p>
              <p className="mt-1 text-sm text-slate-600">{result.remarks}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response = await api.get("/results", { params });

      setResults(response.data.results || []);
      setPagination((current) => ({
        ...current,
        ...(response.data.pagination || {}),
      }));
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load examination results.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, refreshKey]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }));
  }, [statusFilter]);

  const filteredResults = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return results;

    return results.filter((result) => {
      const studentName = getStudentName(result.student).toLowerCase();
      const admissionNumber =
        result.student?.admissionNumber?.toLowerCase() || "";
      const examination = result.examination?.title?.toLowerCase() || "";
      const subject = result.subject?.name?.toLowerCase() || "";

      return (
        studentName.includes(searchText) ||
        admissionNumber.includes(searchText) ||
        examination.includes(searchText) ||
        subject.includes(searchText)
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

  const handleResultAction = async (result, action) => {
    const actionLabel = action === "approve" ? "approve" : "release";
    const endpoint = `/results/${result._id}/${action}`;

    const confirmed = window.confirm(
      action === "approve"
        ? `Approve the result for ${getStudentName(result.student)}?`
        : `Release the result for ${getStudentName(result.student)}? The student will be able to view it.`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(result._id);

      const response = await api.patch(endpoint);

      toast.success(
        response.data.message || `Result ${actionLabel}d successfully.`,
      );

      if (selectedResult?._id === result._id) {
        setSelectedResult(null);
      }

      setRefreshKey((value) => value + 1);
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Unable to ${actionLabel} this result.`,
      );
    } finally {
      setProcessingId(null);
    }
  };

  const changePage = (nextPage) => {
    setPagination((current) => ({
      ...current,
      page: Math.max(1, Math.min(current.totalPages || 1, nextPage)),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Results Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review, approve, and publish students' examination results.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <SummaryCard
          title="Total results"
          value={summary.total}
          icon={ClipboardList}
          color="blue"
        />
        <SummaryCard
          title="Pending review"
          value={summary.pending}
          icon={Clock3}
          color="amber"
        />
        <SummaryCard
          title="Approved"
          value={summary.approved}
          icon={CheckCircle2}
          color="purple"
        />
        <SummaryCard
          title="Released"
          value={summary.released}
          icon={Award}
          color="green"
        />
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, admission number, exam or subject..."
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
      </div>

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">
              Loading examination results...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
          <AlertCircle className="mx-auto text-red-500" size={32} />
          <p className="mt-3 font-semibold text-slate-800">
            Could not load results
          </p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
          <Award className="mx-auto text-slate-300" size={40} />
          <h3 className="mt-4 font-semibold text-slate-800">
            {results.length === 0 ? "No results found" : "No matching results"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {results.length === 0
              ? "Generated examination results will appear here."
              : "Try another search term or change the status filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Examination</th>
                  <th className="px-5 py-4">Score</th>
                  <th className="px-5 py-4">Percentage</th>
                  <th className="px-5 py-4">Outcome</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((result) => {
                  const isProcessing = processingId === result._id;

                  return (
                    <tr key={result._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {getStudentName(result.student)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.student?.admissionNumber ||
                            "No admission number"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {result.examination?.title || "Unknown examination"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {result.subject?.name || "Unknown subject"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                        {result.totalAwardedMarks ?? 0} /{" "}
                        {result.totalPossibleMarks ?? 0}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {result.percentage ?? 0}%
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            result.isPassed
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {result.isPassed ? "Passed" : "Failed"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            result.gradingStatus,
                          )}`}
                        >
                          {(result.gradingStatus || "unknown").replaceAll(
                            "_",
                            " ",
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedResult(result)}
                            title="View result"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                          >
                            <Eye size={16} />
                          </button>

                          {result.gradingStatus === "pending_review" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                handleResultAction(result, "approve")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              Approve
                            </button>
                          )}

                          {result.gradingStatus === "approved" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                handleResultAction(result, "release")
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Send size={14} />
                              )}
                              Release
                            </button>
                          )}

                          {result.gradingStatus === "released" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 size={15} />
                              Published
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Showing{" "}
              {pagination.total === 0
                ? 0
                : (pagination.page - 1) * pagination.limit + 1}{" "}
              to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} results
              {search.trim() && " (search applies to this page)"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changePage(pagination.page - 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="px-2 text-sm text-slate-600">
                Page {pagination.page} of {Math.max(1, pagination.totalPages)}
              </span>

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => changePage(pagination.page + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedResult && (
        <ResultDetailsModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}
