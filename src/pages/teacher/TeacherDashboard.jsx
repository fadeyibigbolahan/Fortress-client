import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  ClipboardList,
  CheckCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  FileQuestion,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusStyle = (status) => {
  const styles = {
    published: "bg-green-50 text-green-700",
    closed: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-50 text-red-600",
    draft: "bg-amber-50 text-amber-700",
  };

  return styles[status] || "bg-slate-100 text-slate-600";
};

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400">
        <Icon size={23} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/teacher-portal/dashboard");

      setDashboard(response.data.dashboard);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your dashboard. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const firstName = user?.firstName || "Teacher";

  const statistics = dashboard?.statistics || {};
  const assignments = dashboard?.assignments || [];
  const pendingGrading = dashboard?.pendingGrading || [];
  const recentGradingActivity = dashboard?.recentGradingActivity || [];
  const recentExaminations = dashboard?.recentExaminations || [];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-sm font-medium text-blue-100">TEACHER WORKSPACE</p>

          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            Welcome back, {firstName}!
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Manage your teaching assignments, monitor examinations and grade
            students' theory responses from your workspace.
          </p>
        </div>

        <Link
          to="/teacher/grading"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          <ClipboardList size={18} />
          Open Grading Queue
        </Link>
      </section>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <RefreshCw size={19} className="animate-spin" />
            Loading your dashboard...
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-red-600" size={20} />

            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                Dashboard unavailable
              </h3>

              <p className="mt-1 text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchDashboard();
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && !error && dashboard && (
        <>
          {/* Statistics */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Teaching Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A summary of your teaching responsibilities and grading
                activities.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Active Assignments"
                value={statistics.totalAssignments ?? 0}
                description="Your active teaching assignments"
                icon={BookOpen}
                iconColor="blue"
              />

              <StatCard
                title="Assigned Subjects"
                value={statistics.totalSubjects ?? 0}
                description="Different subjects assigned to you"
                icon={GraduationCap}
                iconColor="purple"
              />

              <StatCard
                title="Assigned Classes"
                value={statistics.totalClasses ?? 0}
                description="Different classes you teach"
                icon={CalendarDays}
                iconColor="green"
              />

              <StatCard
                title="Pending Grading"
                value={statistics.pendingGradingCount ?? 0}
                description="Submitted attempts awaiting grading"
                icon={Clock}
                iconColor="orange"
              />

              <StatCard
                title="Theory Questions"
                value={statistics.pendingTheoryQuestions ?? 0}
                description="Theory responses still awaiting marking"
                icon={FileQuestion}
                iconColor="red"
              />

              <StatCard
                title="Graded Attempts"
                value={statistics.gradedAttemptsCount ?? 0}
                description="Attempts with your grading activity"
                icon={CheckCircle}
                iconColor="green"
              />
            </div>
          </section>

          {/* Teaching assignments */}
          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Teaching Assignments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Subjects and classes assigned to you.
                </p>
              </div>

              <Link
                to="/teacher/assignments"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View assignments
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No active assignments"
                description="Your teaching assignments will appear here when the school administrator assigns subjects and classes to you."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <BookOpen size={21} />
                      </div>

                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      {assignment.subject?.name || "Subject unavailable"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {assignment.subject?.code || "No subject code"}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">Class</span>

                        <span className="text-right font-medium text-slate-800">
                          {assignment.schoolClass?.name || "Unavailable"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">Academic Session</span>

                        <span className="text-right font-medium text-slate-800">
                          {assignment.academicSession?.name || "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Grading queue */}
          <section>
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Pending Theory Grading
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Submitted examinations that require your attention.
                </p>
              </div>

              <Link
                to="/teacher/grading"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Open grading queue
                <ArrowUpRight size={16} />
              </Link>
            </div>

            {pendingGrading.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="You're all caught up!"
                description="There are currently no submitted examinations awaiting your theory grading."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Student</th>
                        <th className="px-5 py-4 font-semibold">Class</th>
                        <th className="px-5 py-4 font-semibold">
                          Theory Progress
                        </th>
                        <th className="px-5 py-4 font-semibold">Submitted</th>
                        <th className="px-5 py-4 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {pendingGrading.slice(0, 5).map((item) => (
                        <tr key={item.attemptId} className="hover:bg-slate-50">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {item.student?.firstName} {item.student?.lastName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.student?.admissionNumber ||
                                "No admission number"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {item.schoolClass?.name || "Unavailable"}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-medium text-slate-800">
                              {item.gradedTheoryQuestions || 0} /{" "}
                              {item.theoryQuestions || 0}
                            </span>

                            <p className="mt-1 text-xs text-slate-500">
                              Questions graded
                            </p>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(item.submittedAt)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              to="/teacher/grading"
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Grade
                              <ArrowUpRight size={15} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Recent examinations and grading activity */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Recent examinations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Recent Examinations
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Examinations for your assigned classes.
                  </p>
                </div>

                <ClipboardList className="text-slate-400" size={21} />
              </div>

              {recentExaminations.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No examinations found"
                  description="Relevant examinations will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {recentExaminations.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {exam.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {exam.subject?.name || "Subject"} ·{" "}
                          {exam.schoolClass?.name || "Class"}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Starts: {formatDate(exam.startAt)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                          exam.status,
                        )}`}
                      >
                        {exam.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grading activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Recent Grading Activity
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Your recently graded examination attempts.
                  </p>
                </div>

                <CheckCircle className="text-slate-400" size={21} />
              </div>

              {recentGradingActivity.length === 0 ? (
                <EmptyState
                  icon={FileQuestion}
                  title="No grading activity yet"
                  description="Your completed theory grading activities will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {recentGradingActivity.map((activity) => (
                    <div
                      key={activity.attemptId}
                      className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                        <CheckCircle size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {activity.student?.firstName}{" "}
                          {activity.student?.lastName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {activity.examination?.title || "Examination"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {activity.gradedTheoryQuestions} theory questions
                          graded · {formatDate(activity.submittedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
