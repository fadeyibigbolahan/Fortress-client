import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Clock3,
  CheckCircle2,
  FileText,
  GraduationCap,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const getStudentName = (student) => {
  if (!student) return "Unknown student";

  return (
    [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown student"
  );
};

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getClassName = (schoolClass) => {
  if (!schoolClass) return "Class unavailable";

  return (
    schoolClass.name ||
    [schoolClass.level, schoolClass.arm].filter(Boolean).join(" ") ||
    "Class unavailable"
  );
};

const getProgress = (item) => {
  const total = Number(item.theoryQuestions) || 0;
  const graded = Number(item.gradedTheoryQuestions) || 0;

  return total > 0 ? Math.min(100, (graded / total) * 100) : 0;
};

export default function TeacherGradingQueue() {
  const navigate = useNavigate();

  const [gradingQueue, setGradingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchGradingQueue = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/results/teacher/grading-queue");

      setGradingQueue(response.data.data || []);
    } catch (error) {
      console.error("Grading queue error:", error);

      toast.error(
        error.response?.data?.message || "Unable to load your grading queue.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGradingQueue();
  }, [fetchGradingQueue]);

  const filteredQueue = useMemo(() => {
    return gradingQueue.filter((item) => {
      const studentName = getStudentName(item.student).toLowerCase();
      const examinationName = (item.examination?.title || "").toLowerCase();
      const className = getClassName(item.schoolClass).toLowerCase();

      const matchesSearch =
        studentName.includes(search.toLowerCase()) ||
        examinationName.includes(search.toLowerCase()) ||
        className.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.gradingStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [gradingQueue, search, statusFilter]);

  const pendingCount = gradingQueue.filter(
    (item) => item.gradingStatus === "pending",
  ).length;

  const partiallyGradedCount = gradingQueue.filter(
    (item) => item.gradingStatus === "partially_graded",
  ).length;

  const totalTheoryQuestions = gradingQueue.reduce(
    (total, item) =>
      total +
      Math.max(
        0,
        (Number(item.theoryQuestions) || 0) -
          (Number(item.gradedTheoryQuestions) || 0),
      ),
    0,
  );

  const openGradingWorkspace = (attemptId) => {
    navigate(`/teacher/grading/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading your grading queue...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600">
            TEACHER WORKSPACE
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Grading Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review submitted examinations and mark students' theory responses.
          </p>
        </div>

        <button
          onClick={() => fetchGradingQueue(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Awaiting Grading"
          value={pendingCount}
          description="Attempts not yet graded"
          icon={Clock3}
          color="orange"
        />

        <SummaryCard
          title="Partially Graded"
          value={partiallyGradedCount}
          description="Attempts with outstanding responses"
          icon={ClipboardList}
          color="blue"
        />

        <SummaryCard
          title="Outstanding Questions"
          value={totalTheoryQuestions}
          description="Theory responses still to mark"
          icon={FileText}
          color="red"
        />
      </div>

      {/* Queue */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Submitted Examinations</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredQueue.length} examination attempt
              {filteredQueue.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or exam..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="pending">Awaiting grading</option>
              <option value="partially_graded">Partially graded</option>
            </select>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="px-5 py-16 text-center">
            {gradingQueue.length === 0 ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">
                  You're all caught up!
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  There are currently no submitted examinations awaiting your
                  theory grading.
                </p>
              </>
            ) : (
              <>
                <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                <h3 className="font-semibold text-slate-900">
                  No matching examinations
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or status filter.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueue.map((item) => {
              const progress = getProgress(item);
              const outstanding =
                (Number(item.theoryQuestions) || 0) -
                (Number(item.gradedTheoryQuestions) || 0);

              return (
                <div
                  key={item.attemptId}
                  className="p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <GraduationCap size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {getStudentName(item.student)}
                          </h3>

                          <StatusBadge status={item.gradingStatus} />
                        </div>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {item.examination?.title || "Submitted examination"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{getClassName(item.schoolClass)}</span>
                          <span>Submitted: {formatDate(item.submittedAt)}</span>
                          <span>
                            {item.totalQuestions || 0} total questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:w-[340px]">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="font-medium text-slate-600">
                            Grading progress
                          </span>
                          <span className="font-semibold text-slate-900">
                            {item.gradedTheoryQuestions || 0}/
                            {item.theoryQuestions || 0}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <p className="mt-1.5 text-xs text-slate-500">
                          {outstanding > 0
                            ? `${outstanding} response${outstanding === 1 ? "" : "s"} remaining`
                            : "Theory grading completed"}
                        </p>
                      </div>

                      <button
                        onClick={() => openGradingWorkspace(item.attemptId)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {item.gradedTheoryQuestions > 0
                          ? "Continue Grading"
                          : "Start Grading"}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p className="text-sm leading-6 text-blue-800">
          Only examinations assigned to you are displayed. Student results
          remain unpublished until an authorized administrator or examination
          officer approves and releases them.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  const colorClasses = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            colorClasses[color] || colorClasses.blue
          }`}
        >
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPartial = status === "partially_graded";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPartial ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
      }`}
    >
      {isPartial ? "Partially Graded" : "Awaiting Grading"}
    </span>
  );
}
