import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  GraduationCap,
  UserCheck,
  Repeat,
  UserMinus,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  ArrowUpRight,
  RotateCcw,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BookOpen,
  Hash,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  promoted: "bg-blue-50 text-blue-700",
  repeated: "bg-amber-50 text-amber-700",
  withdrawn: "bg-red-50 text-red-700",
};

const initialForm = {
  studentId: "",
  classId: "",
  academicSessionId: "",
  enrollmentDate: new Date().toISOString().slice(0, 10),
  remarks: "",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function getArray(response, keys = []) {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getStudentName(student) {
  if (!student) return "Unknown student";
  if (typeof student === "string") return student;

  return [student.firstName, student.lastName].filter(Boolean).join(" ");
}

function getClassName(schoolClass) {
  if (!schoolClass) return "—";
  if (typeof schoolClass === "string") return schoolClass;

  return (
    schoolClass.name ||
    [schoolClass.level, schoolClass.arm].filter(Boolean).join(" ") ||
    "—"
  );
}

function getSessionName(session) {
  if (!session) return "—";
  if (typeof session === "string") return session;
  return session.name || "—";
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        statusStyles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="text-2xl font-bold text-slate-900">
            {Number(value || 0).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, size = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <div
        className={`my-auto w-full ${size} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");

  const [modalType, setModalType] = useState("");
  const [form, setForm] = useState(initialForm);

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionEnrollment, setActionEnrollment] = useState(null);
  const [actionPosition, setActionPosition] = useState(null);

  const [movementForm, setMovementForm] = useState({
    newClassId: "",
    newAcademicSessionId: "",
    enrollmentDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });

  const [withdrawRemarks, setWithdrawRemarks] = useState("");

  const pageSize = 10;

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: pageSize,
      };

      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.classId = classFilter;
      if (sessionFilter) params.academicSessionId = sessionFilter;

      const [listResponse, statsResponse] = await Promise.all([
        api.get("/enrollments", { params }),
        api.get("/enrollments/statistics", {
          params: {
            ...(sessionFilter && { academicSessionId: sessionFilter }),
            ...(classFilter && { classId: classFilter }),
          },
        }),
      ]);

      const data = listResponse.data || {};
      const list = Array.isArray(data.enrollments) ? data.enrollments : [];

      setEnrollments(list);
      setPagination(
        data.pagination || {
          total: list.length,
          page: 1,
          totalPages: 1,
        },
      );

      setStatistics(statsResponse.data?.statistics || {});
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, classFilter, sessionFilter]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [studentResponse, classResponse, sessionResponse] =
        await Promise.all([
          api.get("/students", { params: { limit: 100 } }),
          api.get("/classes"),
          api.get("/academic-sessions"),
        ]);

      const studentList = getArray(studentResponse, ["students", "results"]);

      const classList = getArray(classResponse, ["classes"]);
      const sessionList = getArray(sessionResponse, ["sessions"]);

      setStudents(studentList);
      setClasses(classList);
      setSessions(sessionList);
    } catch (error) {
      toast.error("Unable to load student, class or session options.");
    }
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, classFilter, sessionFilter]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setForm(initialForm);
    setModalType("create");
  };

  const openMovementModal = (enrollment, type) => {
    setSelectedEnrollment(enrollment);
    setMovementForm({
      newClassId: "",
      newAcademicSessionId: "",
      enrollmentDate: new Date().toISOString().slice(0, 10),
      remarks: "",
    });
    setActionEnrollment(null);
    setModalType(type);
  };

  const handleCreateEnrollment = async (event) => {
    event.preventDefault();

    if (!form.studentId || !form.classId || !form.academicSessionId) {
      toast.error("Please select a student, class and academic session.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/enrollments", {
        studentId: form.studentId,
        classId: form.classId,
        academicSessionId: form.academicSessionId,
        enrollmentDate: form.enrollmentDate,
        remarks: form.remarks,
      });

      toast.success("Student enrolled successfully.");
      setModalType("");
      setForm(initialForm);
      await fetchEnrollments();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleMovement = async (event) => {
    event.preventDefault();

    if (!movementForm.newClassId || !movementForm.newAcademicSessionId) {
      toast.error("Select the new class and academic session.");
      return;
    }

    setSaving(true);

    try {
      const endpoint =
        modalType === "promote"
          ? `/enrollments/${selectedEnrollment._id}/promote`
          : `/enrollments/${selectedEnrollment._id}/repeat`;

      await api.patch(endpoint, {
        newClassId: movementForm.newClassId,
        newAcademicSessionId: movementForm.newAcademicSessionId,
        enrollmentDate: movementForm.enrollmentDate,
        remarks: movementForm.remarks,
      });

      toast.success(
        modalType === "promote"
          ? "Student promoted successfully."
          : "Student repetition recorded successfully.",
      );

      setModalType("");
      setSelectedEnrollment(null);
      await fetchEnrollments();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();

    if (!selectedEnrollment) return;

    setSaving(true);

    try {
      await api.patch(`/enrollments/${selectedEnrollment._id}/withdraw`, {
        remarks: withdrawRemarks,
      });

      toast.success("Student withdrawn from this enrollment.");
      setModalType("");
      setSelectedEnrollment(null);
      setWithdrawRemarks("");
      await fetchEnrollments();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDetailsLoading(true);
    setActionEnrollment(null);
    setModalType("details");

    try {
      const response = await api.get(`/enrollments/${enrollment._id}`);
      setSelectedEnrollment(response.data?.enrollment || enrollment);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleActions = (event, enrollment) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionPosition({
      top: Math.min(rect.bottom + 6, window.innerHeight - 190),
      left: Math.max(12, rect.right - 190),
    });

    setActionEnrollment((previous) =>
      previous?._id === enrollment._id ? null : enrollment,
    );
  };

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Enrollments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student class assignments, academic progression and
            enrollment records.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchEnrollments}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <UserPlus size={17} />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Enrollments"
          value={statistics.total}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Active"
          value={statistics.active}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Promoted"
          value={statistics.promoted}
          icon={ArrowUpRight}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Repeated"
          value={statistics.repeated}
          icon={Repeat}
          color="bg-amber-50 text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Withdrawn"
          value={statistics.withdrawn}
          icon={UserMinus}
          color="bg-red-50 text-red-600"
          loading={loading}
        />
      </div>

      {/* Directory */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Enrollment Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              View enrollment records across academic sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All sessions</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.name}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All classes</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {getClassName(item)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="promoted">Promoted</option>
              <option value="repeated">Repeated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Admission Number</th>
                <th className="px-5 py-4">Class</th>
                <th className="px-5 py-4">Academic Session</th>
                <th className="px-5 py-4">Enrollment Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <Loader2
                      size={26}
                      className="mx-auto animate-spin text-blue-600"
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading enrollments...
                    </p>
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <GraduationCap size={26} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">
                      No enrollment records found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Enroll a student or change your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr
                    key={enrollment._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                          {getStudentName(enrollment.student)
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {getStudentName(enrollment.student)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {enrollment.student?.status || "Student"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                      {enrollment.student?.admissionNumber || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getClassName(enrollment.class)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getSessionName(enrollment.academicSession)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(enrollment.enrollmentDate)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={enrollment.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(event) => toggleActions(event, enrollment)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      >
                        <MoreVertical size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {enrollments.length} enrollment record(s)
            {pagination.total != null ? ` of ${pagination.total}` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-2 text-sm font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Actions dropdown */}
      {actionEnrollment &&
        actionPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setActionEnrollment(null)}
            />

            <div
              style={{
                position: "fixed",
                top: actionPosition.top,
                left: actionPosition.left,
              }}
              className="z-[91] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
            >
              <button
                onClick={() => openDetails(actionEnrollment)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Eye size={16} />
                View Details
              </button>

              {actionEnrollment.status === "active" && (
                <>
                  <button
                    onClick={() =>
                      openMovementModal(actionEnrollment, "promote")
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-blue-700 hover:bg-blue-50"
                  >
                    <ArrowUpRight size={16} />
                    Promote Student
                  </button>

                  <button
                    onClick={() =>
                      openMovementModal(actionEnrollment, "repeat")
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50"
                  >
                    <Repeat size={16} />
                    Repeat Class
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEnrollment(actionEnrollment);
                      setWithdrawRemarks("");
                      setActionEnrollment(null);
                      setModalType("withdraw");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <UserMinus size={16} />
                    Withdraw Student
                  </button>
                </>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* Create enrollment modal */}
      {modalType === "create" && (
        <Modal
          title="Enroll Student"
          subtitle="Assign a student to a class for an academic session."
          onClose={() => !saving && setModalType("")}
        >
          <form onSubmit={handleCreateEnrollment}>
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Student" required>
                  <select
                    value={form.studentId}
                    onChange={(e) => updateForm("studentId", e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Select student</option>
                    {students
                      .filter((student) => student.status === "active")
                      .map((student) => (
                        <option key={student._id} value={student._id}>
                          {getStudentName(student)} — {student.admissionNumber}
                        </option>
                      ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Class" required>
                <select
                  value={form.classId}
                  onChange={(e) => updateForm("classId", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select class</option>
                  {classes
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {getClassName(item)}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Academic Session" required>
                <select
                  value={form.academicSessionId}
                  onChange={(e) =>
                    updateForm("academicSessionId", e.target.value)
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select session</option>
                  {sessions
                    .filter((session) => session.status !== "completed")
                    .map((session) => (
                      <option key={session._id} value={session._id}>
                        {session.name}
                        {session.isCurrent ? " (Current)" : ""}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Enrollment Date">
                <input
                  type="date"
                  value={form.enrollmentDate}
                  onChange={(e) => updateForm("enrollmentDate", e.target.value)}
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Remarks">
                  <textarea
                    value={form.remarks}
                    onChange={(e) => updateForm("remarks", e.target.value)}
                    placeholder="Optional enrollment notes..."
                    rows={3}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalType("")}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Create Enrollment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Promotion / repetition modal */}
      {(modalType === "promote" || modalType === "repeat") && (
        <Modal
          title={
            modalType === "promote"
              ? "Promote Student"
              : "Record Class Repetition"
          }
          subtitle={`Create a new enrollment for ${getStudentName(
            selectedEnrollment?.student,
          )}.`}
          onClose={() => !saving && setModalType("")}
        >
          <form onSubmit={handleMovement}>
            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Previous enrollment
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {getStudentName(selectedEnrollment?.student)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {getClassName(selectedEnrollment?.class)} ·{" "}
                  {getSessionName(selectedEnrollment?.academicSession)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="New Class" required>
                  <select
                    value={movementForm.newClassId}
                    onChange={(e) =>
                      setMovementForm((previous) => ({
                        ...previous,
                        newClassId: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select class</option>
                    {classes
                      .filter((item) => item.status === "active")
                      .map((item) => (
                        <option key={item._id} value={item._id}>
                          {getClassName(item)}
                        </option>
                      ))}
                  </select>
                </FormField>

                <FormField label="New Academic Session" required>
                  <select
                    value={movementForm.newAcademicSessionId}
                    onChange={(e) =>
                      setMovementForm((previous) => ({
                        ...previous,
                        newAcademicSessionId: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select session</option>
                    {sessions
                      .filter((session) => session.status !== "completed")
                      .map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                  </select>
                </FormField>

                <FormField label="Enrollment Date">
                  <input
                    type="date"
                    value={movementForm.enrollmentDate}
                    onChange={(e) =>
                      setMovementForm((previous) => ({
                        ...previous,
                        enrollmentDate: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Remarks">
                    <textarea
                      value={movementForm.remarks}
                      onChange={(e) =>
                        setMovementForm((previous) => ({
                          ...previous,
                          remarks: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional remarks..."
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This action will update the previous enrollment and create a new
                active enrollment. It will not create a new student account.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalType("")}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {modalType === "promote"
                  ? "Confirm Promotion"
                  : "Confirm Repetition"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdrawal modal */}
      {modalType === "withdraw" && (
        <Modal
          title="Withdraw Student"
          subtitle={`Withdraw ${getStudentName(
            selectedEnrollment?.student,
          )} from this enrollment.`}
          onClose={() => !saving && setModalType("")}
        >
          <form onSubmit={handleWithdraw}>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Please confirm this action.
                </p>
                <p className="mt-1 text-sm text-red-700">
                  The enrollment status will change to withdrawn. This does not
                  delete the student's account or enrollment history.
                </p>
              </div>

              <FormField label="Withdrawal Remarks">
                <textarea
                  value={withdrawRemarks}
                  onChange={(e) => setWithdrawRemarks(e.target.value)}
                  rows={4}
                  placeholder="Enter the reason for withdrawal..."
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalType("")}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Confirm Withdrawal
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Enrollment details */}
      {modalType === "details" && selectedEnrollment && (
        <Modal
          title="Enrollment Details"
          subtitle="Complete information about this enrollment record."
          onClose={() => setModalType("")}
          size="max-w-2xl"
        >
          {detailsLoading ? (
            <div className="py-20 text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-blue-600"
              />
              <p className="mt-3 text-sm text-slate-500">
                Loading enrollment details...
              </p>
            </div>
          ) : (
            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Student
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {getStudentName(selectedEnrollment.student)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedEnrollment.student?.admissionNumber || "—"}
                  </p>
                </div>
                <StatusBadge status={selectedEnrollment.status} />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailItem
                  icon={GraduationCap}
                  label="Class"
                  value={getClassName(selectedEnrollment.class)}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Academic Session"
                  value={getSessionName(selectedEnrollment.academicSession)}
                />
                <DetailItem
                  icon={CalendarDays}
                  label="Enrollment Date"
                  value={formatDate(selectedEnrollment.enrollmentDate)}
                />
                <DetailItem
                  icon={FileText}
                  label="Created On"
                  value={formatDate(selectedEnrollment.createdAt)}
                />
                <DetailItem
                  icon={Users}
                  label="Created By"
                  value={getStudentName(selectedEnrollment.createdBy)}
                />
                <DetailItem
                  icon={BookOpen}
                  label="Previous Enrollment"
                  value={
                    selectedEnrollment.previousEnrollment
                      ? selectedEnrollment.previousEnrollment.status ||
                        "Available"
                      : "None"
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Remarks
                </p>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  {selectedEnrollment.remarks || "No remarks recorded."}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              onClick={() => setModalType("")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
