import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  BriefcaseBusiness,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  X,
  LoaderCircle,
  Mail,
  Phone,
  Hash,
  BookOpen,
  GraduationCap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  staffId: "",
  email: "",
  phone: "",
  gender: "",
  password: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getTeacherArray(response) {
  if (Array.isArray(response?.teachers)) return response.teachers;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function getInitials(teacher) {
  return `${teacher?.firstName?.[0] || ""}${teacher?.lastName?.[0] || ""}`.toUpperCase();
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] || styles.inactive
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
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <LoaderCircle
              className="mt-3 animate-spin text-slate-400"
              size={22}
            />
          ) : (
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {value ?? 0}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={21} />
        </div>
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
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
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
            <X size={19} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function TeacherForm({ form, setForm, editing, saving, onSubmit, onClose }) {
  const update = (field, value) =>
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

  return (
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
        <div>
          <label className={labelClass}>First name *</label>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="First name"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Last name *</label>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Last name"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Middle name</label>
          <input
            className={inputClass}
            value={form.middleName}
            onChange={(e) => update("middleName", e.target.value)}
            placeholder="Middle name"
          />
        </div>

        <div>
          <label className={labelClass}>Staff ID *</label>
          <input
            className={inputClass}
            value={form.staffId}
            onChange={(e) => update("staffId", e.target.value.toUpperCase())}
            placeholder="e.g. TCH001"
            required
            disabled={editing}
          />
        </div>

        <div>
          <label className={labelClass}>Email address</label>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="teacher@school.com"
          />
        </div>

        <div>
          <label className={labelClass}>Phone number</label>
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <div>
          <label className={labelClass}>Gender</label>
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {!editing && (
          <div>
            <label className={labelClass}>Temporary password *</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>
        )}
      </div>

      {!editing && (
        <div className="mx-5 mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700 sm:mx-6">
          The teacher will use their Staff ID and this password to log in. They
          can change their password after signing in.
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <LoaderCircle size={16} className="animate-spin" />}

          {editing ? "Save changes" : "Register teacher"}
        </button>
      </div>
    </form>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>

        <p className="mt-1 break-words text-sm font-medium text-slate-700">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

function TeacherDetails({ teacher, loading, onClose, onEdit }) {
  if (loading) {
    return (
      <Modal title="Teacher profile" onClose={onClose}>
        <div className="flex justify-center py-16">
          <LoaderCircle className="animate-spin text-blue-600" size={30} />
        </div>
      </Modal>
    );
  }

  if (!teacher) return null;

  const assignments = Array.isArray(teacher.assignments)
    ? teacher.assignments
    : [];

  return (
    <Modal
      title="Teacher profile"
      subtitle="Personal information and teaching assignments"
      onClose={onClose}
      size="max-w-3xl"
    >
      <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
            {getInitials(teacher)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-slate-900">
              {teacher.firstName} {teacher.middleName} {teacher.lastName}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Staff ID: {teacher.staffId}
            </p>

            <div className="mt-2">
              <StatusBadge status={teacher.status} />
            </div>
          </div>

          <button
            onClick={() => onEdit(teacher)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={15} />
            Edit profile
          </button>
        </div>

        <div className="mt-6">
          <h4 className="mb-3 font-semibold text-slate-900">
            Personal information
          </h4>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem icon={Mail} label="Email" value={teacher.email} />

            <InfoItem icon={Phone} label="Phone" value={teacher.phone} />

            <InfoItem icon={Hash} label="Staff ID" value={teacher.staffId} />

            <InfoItem icon={Users} label="Gender" value={teacher.gender} />

            <InfoItem
              icon={BriefcaseBusiness}
              label="Account created"
              value={formatDate(teacher.createdAt)}
            />

            <InfoItem
              icon={UserCheck}
              label="Last login"
              value={formatDate(teacher.lastLoginAt)}
            />
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">
              Teaching assignments
            </h4>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {assignments.length} assignments
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
              <BookOpen className="mx-auto text-slate-300" size={28} />

              <p className="mt-2 text-sm font-medium text-slate-600">
                No teaching assignments yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Assign this teacher to a subject and class from Teacher
                Assignments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[550px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {assignment.subject?.name || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {assignment.schoolClass?.name ||
                          assignment.class?.name ||
                          "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {assignment.academicSession?.name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={assignment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [statistics, setStatistics] = useState({});

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Dropdown state
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const loadData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const params = {
          page,
          limit: 20,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        };

        const [teacherResponse, statsResponse] = await Promise.all([
          api.get("/teachers", { params }),
          api.get("/teachers/statistics"),
        ]);

        const result = teacherResponse.data || {};

        setTeachers(getTeacherArray(result));

        setPagination(
          result.pagination || {
            total: result.total || 0,
            page,
            limit: 20,
            totalPages: 1,
          },
        );

        setStatistics(statsResponse.data?.statistics || {});
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, statusFilter],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setOpenMenu(null);
    setEditingTeacher(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingTeacher(teacher);

    setForm({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      middleName: teacher.middleName || "",
      staffId: teacher.staffId || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      gender: teacher.gender || "",
      password: "",
    });

    setSelectedTeacher(null);
    setShowForm(true);
    setOpenMenu(null);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingTeacher(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      if (editingTeacher) {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
        };

        await api.patch(`/teachers/${editingTeacher._id}`, payload);

        toast.success("Teacher profile updated successfully.");
      } else {
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim(),
          staffId: form.staffId.trim().toUpperCase(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          gender: form.gender,
          password: form.password,
        };

        await api.post("/teachers", payload);

        toast.success("Teacher account created successfully.");
      }

      setShowForm(false);
      setEditingTeacher(null);
      setForm(initialForm);

      await loadData(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const viewTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    setDetailsLoading(true);
    setOpenMenu(null);

    try {
      const response = await api.get(`/teachers/${teacher._id}`);

      setSelectedTeacher(
        response.data?.teacher || response.data?.data || response.data,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSelectedTeacher(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const changeStatus = async (teacher) => {
    const nextStatus = teacher.status === "active" ? "inactive" : "active";

    const action = nextStatus === "active" ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} this teacher?`)) {
      return;
    }

    try {
      await api.patch(`/teachers/${teacher._id}/status`, {
        status: nextStatus,
      });

      toast.success(`Teacher ${action}d successfully.`);

      setOpenMenu(null);

      await loadData(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMenuToggle = (event, teacherId) => {
    if (openMenu === teacherId) {
      setOpenMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuHeight = 150;
    const menuWidth = 192;

    const top =
      rect.bottom + menuHeight + 10 > window.innerHeight
        ? rect.top - menuHeight - 6
        : rect.bottom + 6;

    const left = Math.max(
      8,
      Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
    );

    setMenuPosition({ top, left });
    setOpenMenu(teacherId);
  };

  const visibleRange = useMemo(() => {
    const total = pagination.total || 0;
    const limit = pagination.limit || 20;
    const currentPage = pagination.page || page;

    if (!total) return "0";

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    return `${start}–${end} of ${total}`;
  }, [pagination, page]);

  const menuTeacher = teachers.find((teacher) => teacher._id === openMenu);

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Teacher Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Register teachers, manage their accounts and view teaching
            assignments.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={17} />
            Add teacher
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total teachers"
          value={statistics.total}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />

        <StatCard
          title="Active teachers"
          value={statistics.active}
          icon={UserCheck}
          color="bg-emerald-50 text-emerald-600"
          loading={loading}
        />

        <StatCard
          title="Inactive teachers"
          value={statistics.inactive}
          icon={UserX}
          color="bg-amber-50 text-amber-600"
          loading={loading}
        />

        <StatCard
          title="Active assignments"
          value={statistics.activeAssignments}
          icon={BookOpen}
          color="bg-violet-50 text-violet-600"
          loading={loading}
        />
      </div>

      {/* Teacher directory */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Teacher directory</h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage all registered teaching staff.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, staff ID, email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-72"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Teacher</th>
                <th className="px-5 py-3.5">Staff ID</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date registered</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-blue-600"
                      size={27}
                    />

                    <p className="mt-2 text-sm text-slate-500">
                      Loading teachers...
                    </p>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <GraduationCap size={25} />
                    </div>

                    <p className="mt-3 font-semibold text-slate-700">
                      No teachers found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Register a teacher or change your search filters.
                    </p>

                    <button
                      onClick={openCreateForm}
                      className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      + Register your first teacher
                    </button>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                          {getInitials(teacher)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {teacher.firstName} {teacher.lastName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {teacher.gender || "Gender not specified"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {teacher.staffId}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-slate-700">{teacher.email || "—"}</p>

                      <p className="mt-1 text-xs text-slate-400">
                        {teacher.phone || "No phone"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={teacher.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(teacher.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(event) =>
                          handleMenuToggle(event, teacher._id)
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        aria-label={`Actions for ${teacher.firstName} ${teacher.lastName}`}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {visibleRange} teachers
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="min-w-20 text-center text-xs font-medium text-slate-600">
              Page {pagination.page || page} of {pagination.totalPages || 1}
            </span>

            <button
              disabled={page >= (pagination.totalPages || 1) || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating action dropdown - rendered outside the table */}
      {openMenu &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close actions menu"
              onClick={() => setOpenMenu(null)}
              className="fixed inset-0 z-[200] cursor-default"
            />

            <div
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              className="z-[201] w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
            >
              <button
                onClick={() => {
                  if (menuTeacher) viewTeacher(menuTeacher);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Eye size={15} />
                View profile
              </button>

              <button
                onClick={() => {
                  if (menuTeacher) openEditForm(menuTeacher);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit profile
              </button>

              <button
                onClick={() => {
                  if (menuTeacher) changeStatus(menuTeacher);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Power size={15} />
                {menuTeacher?.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* Create / Edit Teacher Modal */}
      {showForm && (
        <Modal
          title={
            editingTeacher ? "Edit teacher profile" : "Register new teacher"
          }
          subtitle={
            editingTeacher
              ? "Update the teacher's personal information."
              : "Create a teacher account for the school portal."
          }
          onClose={closeForm}
        >
          <TeacherForm
            form={form}
            setForm={setForm}
            editing={Boolean(editingTeacher)}
            saving={saving}
            onSubmit={handleSubmit}
            onClose={closeForm}
          />
        </Modal>
      )}

      {/* Teacher Details Modal */}
      {selectedTeacher && (
        <TeacherDetails
          teacher={selectedTeacher}
          loading={detailsLoading}
          onClose={() => setSelectedTeacher(null)}
          onEdit={openEditForm}
        />
      )}
    </div>
  );
}
