import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  BookOpen,
  MoreVertical,
  Pencil,
  Power,
  X,
  Loader2,
  RefreshCw,
  GraduationCap,
  BookMarked,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

const initialForm = {
  name: "",
  code: "",
  description: "",
  levels: [],
  status: "active",
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  // ========================================
  // FETCH SUBJECTS
  // ========================================

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      const response = await api.get("/subjects");

      setSubjects(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // ========================================
  // STATISTICS
  // ========================================

  const statistics = useMemo(() => {
    return {
      total: subjects.length,
      active: subjects.filter((subject) => subject.status === "active").length,
      inactive: subjects.filter((subject) => subject.status === "inactive")
        .length,
      levels: new Set(subjects.flatMap((subject) => subject.levels || [])).size,
    };
  }, [subjects]);

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        subject.name?.toLowerCase().includes(searchText) ||
        subject.code?.toLowerCase().includes(searchText) ||
        subject.description?.toLowerCase().includes(searchText);

      const matchesLevel =
        levelFilter === "all" || (subject.levels || []).includes(levelFilter);

      const matchesStatus =
        statusFilter === "all" || subject.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [subjects, search, levelFilter, statusFilter]);

  // ========================================
  // MODAL MANAGEMENT
  // ========================================

  const openCreateModal = () => {
    setMenuOpen(null);
    setMenuPosition(null);
    setEditingSubject(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setMenuOpen(null);
    setMenuPosition(null);
    setEditingSubject(subject);

    setForm({
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
      levels: subject.levels || [],
      status: subject.status || "active",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingSubject(null);
    setForm(initialForm);
  };

  // ========================================
  // FORM HANDLING
  // ========================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const toggleLevel = (level) => {
    setForm((previous) => {
      const alreadySelected = previous.levels.includes(level);

      return {
        ...previous,
        levels: alreadySelected
          ? previous.levels.filter((item) => item !== level)
          : [...previous.levels, level],
      };
    });
  };

  // ========================================
  // CREATE / UPDATE SUBJECT
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter a subject name.");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Please enter a subject code.");
      return;
    }

    if (form.levels.length === 0) {
      toast.error("Select at least one class level.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      levels: form.levels,
      status: form.status,
    };

    try {
      setSaving(true);

      if (editingSubject) {
        await api.patch(`/subjects/${editingSubject._id}`, payload);

        toast.success("Subject updated successfully.");
      } else {
        await api.post("/subjects", payload);

        toast.success("Subject created successfully.");
      }

      setModalOpen(false);
      setEditingSubject(null);
      setForm(initialForm);

      await fetchSubjects();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Unable to ${editingSubject ? "update" : "create"} subject.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // DEACTIVATE SUBJECT
  // ========================================

  const handleDeactivate = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${subject.name}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(`/subjects/${subject._id}/deactivate`);

      toast.success("Subject deactivated successfully.");

      await fetchSubjects();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to deactivate subject.",
      );
    }
  };

  // ========================================
  // ACTIVATE SUBJECT
  // ========================================

  const handleActivate = async (subject) => {
    setMenuOpen(null);
    setMenuPosition(null);

    try {
      await api.patch(`/subjects/${subject._id}`, {
        status: "active",
      });

      toast.success("Subject activated successfully.");

      await fetchSubjects();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to activate subject.",
      );
    }
  };

  // ========================================
  // FLOATING ACTION MENU
  // ========================================

  const toggleActionMenu = (event, subjectId) => {
    if (menuOpen === subjectId) {
      setMenuOpen(null);
      setMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    const menuWidth = 176;
    const menuHeight = 92;
    const spacing = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + spacing;

    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - spacing;
    }

    top = Math.max(8, top);

    setMenuPosition({ top, left });
    setMenuOpen(subjectId);
  };

  const selectedMenuSubject = subjects.find(
    (subject) => subject._id === menuOpen,
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Subject Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage subjects taught across different class levels.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Subject
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Subjects"
          value={statistics.total}
          icon={<BookOpen size={21} />}
          iconStyle="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Subjects"
          value={statistics.active}
          icon={<BookMarked size={21} />}
          iconStyle="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive Subjects"
          value={statistics.inactive}
          icon={<GraduationCap size={21} />}
          iconStyle="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Class Levels Covered"
          value={statistics.levels}
          icon={<Users size={21} />}
          iconStyle="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Subject table container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">School Subjects</h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredSubjects.length} subject
              {filteredSubjects.length !== 1 ? "s" : ""} displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subjects..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
              />
            </div>

            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>

              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchSubjects}
              title="Refresh subjects"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : filteredSubjects.length === 0 ? (
          /* Empty state */
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <BookOpen size={27} />
            </div>

            <h3 className="font-semibold text-slate-800">No subjects found</h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {subjects.length === 0
                ? "You have not created any subjects yet. Start by adding your first subject."
                : "Try adjusting your search or filter settings."}
            </p>

            {subjects.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Create First Subject
              </button>
            )}
          </div>
        ) : (
          /* Subjects table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Subject</th>

                  <th className="px-6 py-4 font-semibold">Subject Code</th>

                  <th className="px-6 py-4 font-semibold">Class Levels</th>

                  <th className="px-6 py-4 font-semibold">Status</th>

                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Subject name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <BookOpen size={19} />
                        </div>

                        <div className="max-w-xs">
                          <p className="font-semibold text-slate-800">
                            {subject.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {subject.description || "No description provided"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Subject code */}
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
                        {subject.code}
                      </span>
                    </td>

                    {/* Class levels */}
                    <td className="px-6 py-4">
                      <div className="flex max-w-xs flex-wrap gap-1.5">
                        {(subject.levels || []).map((level) => (
                          <span
                            key={level}
                            className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={subject.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(event) =>
                          toggleActionMenu(event, subject._id)
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label={`Actions for ${subject.name}`}
                      >
                        <MoreVertical size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating action menu */}
      {menuOpen &&
        menuPosition &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => {
                setMenuOpen(null);
                setMenuPosition(null);
              }}
            />

            <div
              className="fixed z-[101] w-44 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <button
                onClick={() => {
                  if (selectedMenuSubject) {
                    openEditModal(selectedMenuSubject);
                  } else {
                    setMenuOpen(null);
                    setMenuPosition(null);
                  }
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit Subject
              </button>

              {selectedMenuSubject?.status === "active" ? (
                <button
                  onClick={() => {
                    const subject = selectedMenuSubject;

                    setMenuOpen(null);
                    setMenuPosition(null);

                    handleDeactivate(subject);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Power size={15} />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (selectedMenuSubject) {
                      handleActivate(selectedMenuSubject);
                    }
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50"
                >
                  <Power size={15} />
                  Activate
                </button>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSubject ? "Edit Subject" : "Create New Subject"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingSubject
                    ? "Update the subject information below."
                    : "Enter the details of the new school subject."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Subject name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subject Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Mathematics"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Subject code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subject Code
                </label>

                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  placeholder="e.g. MTH101"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Use a unique code to identify this subject.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Briefly describe this subject..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Class levels */}
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Applicable Class Levels
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Select all class levels where this subject is taught.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LEVELS.map((level) => {
                    const selected = form.levels.includes(level);

                    return (
                      <label
                        key={level}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleLevel(level)}
                          className="h-4 w-4 accent-blue-600"
                        />

                        {level}
                      </label>
                    );
                  })}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {form.levels.length} level
                  {form.levels.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              {/* Status - edit only */}
              {editingSubject && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Subject Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Form buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}

                  {saving
                    ? "Saving..."
                    : editingSubject
                      ? "Save Changes"
                      : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// STATISTICS CARD
// ========================================

function StatCard({ title, value, icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ========================================
// STATUS BADGE
// ========================================

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}
