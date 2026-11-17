import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  GraduationCap,
  UserCheck,
  UserX,
  ShieldAlert,
  MoreVertical,
  Pencil,
  Eye,
  Power,
  X,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
  BookOpen,
  Hash,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  admissionNumber: "",
  email: "",
  phone: "",
  gender: "",
  password: "",
  currentClass: "",
};

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  suspended: "bg-red-50 text-red-700",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function getStudentArray(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.students)) {
    return response.students;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
}

function getClassName(student) {
  const currentClass = student?.currentClass;

  if (!currentClass) return "Not assigned";
  if (typeof currentClass === "string") return currentClass;

  return (
    currentClass.name ||
    [currentClass.level, currentClass.arm].filter(Boolean).join(" ") ||
    "Not assigned"
  );
}

function getInitials(student) {
  return `${student?.firstName?.[0] || ""}${student?.lastName?.[0] || ""}`.toUpperCase();
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

function StatusBadge({ status }) {
  const value = status || "inactive";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        statusStyles[value] || statusStyles.inactive
      }`}
    >
      {value}
    </span>
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
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [actionStudent, setActionStudent] = useState(null);
  const [actionPosition, setActionPosition] = useState(null);

  const [form, setForm] = useState(initialForm);

  const pageSize = 10;

  const fetchStudents = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.currentClass = classFilter;

      const [studentResponse, statsResponse] = await Promise.all([
        api.get("/students", { params }),
        api.get("/students/statistics"),
      ]);

      const result = studentResponse.data;
      const list = getStudentArray(result);

      setStudents(list);

      // Support common pagination response structures.
      const paginationData = result.pagination || result.meta || result;

      setPagination({
        page: paginationData.currentPage || paginationData.page || page,
        totalPages: paginationData.totalPages || paginationData.pages || 1,
        total:
          paginationData.total ||
          paginationData.totalStudents ||
          paginationData.count ||
          list.length,
      });

      const stats =
        statsResponse.data?.statistics || statsResponse.data?.data || {};

      setStatistics(stats);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, classFilter]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get("/classes");
      const result = response.data?.data;

      setClasses(
        Array.isArray(result)
          ? result
          : Array.isArray(result?.classes)
            ? result.classes
            : [],
      );
    } catch (error) {
      toast.error("Unable to load classes.");
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, classFilter]);

  const statValues = useMemo(() => {
    const total =
      statistics.totalStudents ??
      statistics.total ??
      statistics.totalCount ??
      pagination.total ??
      students.length;

    return {
      total,
      active:
        statistics.activeStudents ??
        statistics.active ??
        statistics.activeCount ??
        0,
      inactive:
        statistics.inactiveStudents ??
        statistics.inactive ??
        statistics.inactiveCount ??
        0,
      suspended:
        statistics.suspendedStudents ??
        statistics.suspended ??
        statistics.suspendedCount ??
        0,
    };
  }, [statistics, pagination.total, students.length]);

  const openCreateModal = () => {
    setEditingStudent(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);

    setForm({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      middleName: student.middleName || "",
      admissionNumber: student.admissionNumber || "",
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender || "",
      password: "",
      currentClass:
        typeof student.currentClass === "object"
          ? student.currentClass?._id || ""
          : student.currentClass || "",
    });

    setModalOpen(true);
    setActionStudent(null);
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    if (!editingStudent && !form.admissionNumber.trim()) {
      toast.error("Admission number is required.");
      return;
    }

    if (!editingStudent && !form.password) {
      toast.error("Password is required.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
    };

    if (form.currentClass) {
      payload.currentClass = form.currentClass;
    }

    if (!editingStudent) {
      payload.admissionNumber = form.admissionNumber.trim().toUpperCase();
      payload.password = form.password;
    }

    setSaving(true);

    try {
      if (editingStudent) {
        await api.patch(`/students/${editingStudent._id}`, payload);
        toast.success("Student information updated.");
      } else {
        await api.post("/students", payload);
        toast.success("Student registered successfully.");
      }

      setModalOpen(false);
      setForm(initialForm);
      setEditingStudent(null);
      await fetchStudents();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openProfile = async (student) => {
    setProfileLoading(true);
    setSelectedStudent(student);
    setActionStudent(null);

    try {
      const response = await api.get(`/students/${student._id}`);
      setSelectedStudent(response.data?.student || student);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const changeStudentStatus = async (student, status) => {
    const actionText =
      status === "active"
        ? "activate"
        : status === "suspended"
          ? "suspend"
          : "deactivate";

    if (
      !window.confirm(`Are you sure you want to ${actionText} this student?`)
    ) {
      return;
    }

    try {
      await api.patch(`/students/${student._id}/status`, { status });
      toast.success(`Student ${actionText}d successfully.`);
      setActionStudent(null);

      if (selectedStudent?._id === student._id) {
        setSelectedStudent((previous) => ({ ...previous, status }));
      }

      await fetchStudents();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const toggleActions = (event, student) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionPosition({
      top: Math.min(rect.bottom + 6, window.innerHeight - 180),
      left: Math.max(12, rect.right - 180),
    });

    setActionStudent((previous) =>
      previous?._id === student._id ? null : student,
    );
  };

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));

  const enrollmentHistory =
    selectedStudent?.enrollmentHistory || selectedStudent?.enrollments || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register students, manage student records and monitor enrollment.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <UserPlus size={17} />
            Register Student
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={statValues.total}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Active Students"
          value={statValues.active}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <StatCard
          title="Inactive Students"
          value={statValues.inactive}
          icon={UserX}
          color="bg-slate-100 text-slate-600"
          loading={loading}
        />
        <StatCard
          title="Suspended Students"
          value={statValues.suspended}
          icon={ShieldAlert}
          color="bg-red-50 text-red-600"
          loading={loading}
        />
      </div>

      {/* Directory */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Student Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage registered students.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All classes</option>
              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name || `${item.level} ${item.arm}`}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Admission Number</th>
                <th className="px-5 py-4">Class</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date Registered</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <Loader2
                      className="mx-auto animate-spin text-blue-600"
                      size={26}
                    />
                    <p className="mt-3 text-sm text-slate-500">
                      Loading students...
                    </p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <GraduationCap size={25} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">
                      No students found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your filters or register a new student.
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                          {getInitials(student)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {student.firstName} {student.middleName}{" "}
                            {student.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.email || "No email address"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {student.admissionNumber || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getClassName(student)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {student.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={student.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(student.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(event) => toggleActions(event, student)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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
            Showing {students.length} student{students.length === 1 ? "" : "s"}
            {pagination.total ? ` of ${pagination.total}` : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="px-2 text-sm font-medium text-slate-700">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((previous) => previous + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Action dropdown rendered outside the table */}
      {actionStudent &&
        actionPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setActionStudent(null)}
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
                onClick={() => openProfile(actionStudent)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Eye size={16} />
                View Profile
              </button>

              <button
                onClick={() => openEditModal(actionStudent)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edit Student
              </button>

              <div className="my-1 border-t border-slate-100" />

              {actionStudent.status !== "active" && (
                <button
                  onClick={() => changeStudentStatus(actionStudent, "active")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  <Power size={16} />
                  Activate
                </button>
              )}

              {actionStudent.status !== "inactive" && (
                <button
                  onClick={() => changeStudentStatus(actionStudent, "inactive")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  <UserX size={16} />
                  Deactivate
                </button>
              )}

              {actionStudent.status !== "suspended" && (
                <button
                  onClick={() =>
                    changeStudentStatus(actionStudent, "suspended")
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <ShieldAlert size={16} />
                  Suspend
                </button>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <Modal
          title={editingStudent ? "Edit Student" : "Register New Student"}
          subtitle={
            editingStudent
              ? "Update the student's personal information."
              : "Enter the student's details to create an account."
          }
          onClose={() => {
            if (!saving) {
              setModalOpen(false);
              setEditingStudent(null);
            }
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] overflow-y-auto"
          >
            <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
              <FormField label="First Name" required>
                <input
                  value={form.firstName}
                  onChange={(e) => updateForm("firstName", e.target.value)}
                  placeholder="Enter first name"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Last Name" required>
                <input
                  value={form.lastName}
                  onChange={(e) => updateForm("lastName", e.target.value)}
                  placeholder="Enter last name"
                  className={inputClass}
                  required
                />
              </FormField>

              <FormField label="Middle Name">
                <input
                  value={form.middleName}
                  onChange={(e) => updateForm("middleName", e.target.value)}
                  placeholder="Enter middle name"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Admission Number" required>
                <input
                  value={form.admissionNumber}
                  onChange={(e) =>
                    updateForm("admissionNumber", e.target.value)
                  }
                  placeholder="e.g. SCH/2026/001"
                  className={inputClass}
                  disabled={Boolean(editingStudent)}
                  required={!editingStudent}
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  placeholder="student@example.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Phone Number">
                <input
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => updateForm("gender", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Current Class">
                <select
                  value={form.currentClass}
                  onChange={(e) => updateForm("currentClass", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select class</option>
                  {classes
                    .filter((item) => item.status === "active")
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name || `${item.level} ${item.arm}`}
                      </option>
                    ))}
                </select>
              </FormField>

              {!editingStudent && (
                <div className="sm:col-span-2">
                  <FormField label="Initial Password" required>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateForm("password", e.target.value)}
                      placeholder="Create a password (minimum 8 characters)"
                      className={inputClass}
                      minLength={8}
                      required
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      The student will use their admission number and this
                      password to sign in.
                    </p>
                  </FormField>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingStudent(null);
                }}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingStudent ? "Save Changes" : "Register Student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student profile modal */}
      {selectedStudent && (
        <Modal
          title="Student Profile"
          subtitle="Student information and enrollment history."
          onClose={() => setSelectedStudent(null)}
          size="max-w-3xl"
        >
          {profileLoading ? (
            <div className="py-20 text-center">
              <Loader2
                className="mx-auto animate-spin text-blue-600"
                size={28}
              />
              <p className="mt-3 text-sm text-slate-500">
                Loading student profile...
              </p>
            </div>
          ) : (
            <>
              <div className="p-6">
                <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                    {getInitials(selectedStudent)}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedStudent.firstName} {selectedStudent.middleName}{" "}
                      {selectedStudent.lastName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedStudent.admissionNumber}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selectedStudent.status} />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      openEditModal(selectedStudent);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil size={15} />
                    Edit Profile
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="mb-4 font-bold text-slate-900">
                    Personal Information
                  </h4>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <ProfileItem
                      icon={Mail}
                      label="Email Address"
                      value={selectedStudent.email}
                    />
                    <ProfileItem
                      icon={Phone}
                      label="Phone Number"
                      value={selectedStudent.phone}
                    />
                    <ProfileItem
                      icon={GraduationCap}
                      label="Current Class"
                      value={getClassName(selectedStudent)}
                    />
                    <ProfileItem
                      icon={Users}
                      label="Gender"
                      value={selectedStudent.gender}
                    />
                    <ProfileItem
                      icon={CalendarDays}
                      label="Date Registered"
                      value={formatDate(selectedStudent.createdAt)}
                    />
                    <ProfileItem
                      icon={Hash}
                      label="Admission Number"
                      value={selectedStudent.admissionNumber}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">
                      Enrollment History
                    </h4>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {enrollmentHistory.length} record(s)
                    </span>
                  </div>

                  {enrollmentHistory.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                      <BookOpen className="mx-auto text-slate-300" size={25} />
                      <p className="mt-2 text-sm text-slate-500">
                        No enrollment history available.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[500px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Academic Session</th>
                            <th className="px-4 py-3">Class</th>
                            <th className="px-4 py-3">Enrollment Date</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {enrollmentHistory.map((enrollment) => (
                            <tr key={enrollment._id}>
                              <td className="px-4 py-3 text-slate-700">
                                {typeof enrollment.academicSession === "object"
                                  ? enrollment.academicSession?.name
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {typeof enrollment.class === "object"
                                  ? enrollment.class?.name ||
                                    `${enrollment.class?.level || ""} ${enrollment.class?.arm || ""}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {formatDate(enrollment.enrollmentDate)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-semibold capitalize text-slate-600">
                                  {enrollment.status || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium capitalize text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}
