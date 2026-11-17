import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Users,
  GraduationCap,
  MoreVertical,
  Pencil,
  Power,
  X,
  Loader2,
  School,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

const initialForm = {
  name: "JSS1 A",
  level: "JSS1",
  arm: "A",
  capacity: 40,
  status: "active",
};

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);

      const response = await api.get("/classes");

      setClasses(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: classes.length,
      active: classes.filter((item) => item.status === "active").length,
      inactive: classes.filter((item) => item.status === "inactive").length,
      capacity: classes.reduce(
        (total, item) => total + Number(item.capacity || 0),
        0,
      ),
    };
  }, [classes]);

  // Search and filters
  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.name?.toLowerCase().includes(searchText) ||
        item.level?.toLowerCase().includes(searchText) ||
        item.arm?.toLowerCase().includes(searchText);

      const matchesLevel = levelFilter === "all" || item.level === levelFilter;

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [classes, search, levelFilter, statusFilter]);

  // Open create modal
  const openCreateModal = () => {
    setMenuOpen(null);
    setMenuPosition(null);
    setEditingClass(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (schoolClass) => {
    setMenuOpen(null);
    setMenuPosition(null);
    setEditingClass(schoolClass);

    setForm({
      name: schoolClass.name || "",
      level: schoolClass.level || "JSS1",
      arm: schoolClass.arm || "A",
      capacity: schoolClass.capacity || 40,
      status: schoolClass.status || "active",
    });

    setModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingClass(null);
    setForm(initialForm);
  };

  // Handle form changes
  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "level" || name === "arm") {
        const level = name === "level" ? value : previous.level;
        const arm = name === "arm" ? value.toUpperCase() : previous.arm;

        updated.name = `${level} ${arm}`;
        updated.arm = arm;
      }

      return updated;
    });
  };

  // Create or update class
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter a class name.");
      return;
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      toast.error("Class capacity must be at least 1.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      level: form.level,
      arm: form.arm.trim().toUpperCase(),
      capacity: Number(form.capacity),
      status: form.status,
    };

    try {
      setSaving(true);

      if (editingClass) {
        await api.patch(`/classes/${editingClass._id}`, payload);
        toast.success("Class updated successfully.");
      } else {
        await api.post("/classes", payload);
        toast.success("Class created successfully.");
      }

      setModalOpen(false);
      setEditingClass(null);
      setForm(initialForm);

      await fetchClasses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          `Unable to ${editingClass ? "update" : "create"} class.`,
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate class
  const handleDeactivate = async (schoolClass) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${schoolClass.name}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(`/classes/${schoolClass._id}/deactivate`);

      toast.success("Class deactivated successfully.");
      await fetchClasses();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to deactivate class.",
      );
    }
  };

  // Toggle action dropdown with viewport-aware positioning
  const toggleActionMenu = (event, classId) => {
    if (menuOpen === classId) {
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

    // Prevent dropdown from going outside the right edge
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

    // Open above the button if there isn't enough space below
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - spacing;
    }

    // Keep dropdown inside the viewport
    top = Math.max(8, top);

    setMenuPosition({ top, left });
    setMenuOpen(classId);
  };

  // Activate class using update endpoint
  const handleActivate = async (schoolClass) => {
    setMenuOpen(null);
    setMenuPosition(null);

    try {
      await api.patch(`/classes/${schoolClass._id}`, {
        status: "active",
      });

      toast.success("Class activated successfully.");
      await fetchClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to activate class.");
    }
  };

  const selectedMenuClass = classes.find((item) => item._id === menuOpen);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Class Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage your school's academic classes and arms.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add New Class
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Classes"
          value={statistics.total}
          icon={<School size={21} />}
          iconStyle="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Active Classes"
          value={statistics.active}
          icon={<GraduationCap size={21} />}
          iconStyle="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Inactive Classes"
          value={statistics.inactive}
          icon={<Users size={21} />}
          iconStyle="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Total Class Capacity"
          value={statistics.capacity.toLocaleString()}
          icon={<Users size={21} />}
          iconStyle="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Classes table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">School Classes</h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredClasses.length} class
              {filteredClasses.length !== 1 ? "es" : ""} displayed
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
                placeholder="Search classes..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-52"
              />
            </div>

            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchClasses}
              title="Refresh classes"
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
        ) : filteredClasses.length === 0 ? (
          /* Empty state */
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <School size={27} />
            </div>

            <h3 className="font-semibold text-slate-800">No classes found</h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {classes.length === 0
                ? "You have not created any classes yet. Start by adding your first class."
                : "Try adjusting your search or filter settings."}
            </p>

            {classes.length === 0 && (
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Create First Class
              </button>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Class</th>
                  <th className="px-6 py-4 font-semibold">Level</th>
                  <th className="px-6 py-4 font-semibold">Arm</th>
                  <th className="px-6 py-4 font-semibold">Capacity</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((schoolClass) => (
                  <tr
                    key={schoolClass._id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Class */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                          {schoolClass.level?.slice(0, 1)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {schoolClass.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {schoolClass.level} • Arm {schoolClass.arm}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {schoolClass.level}
                    </td>

                    {/* Arm */}
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {schoolClass.arm}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        {schoolClass.capacity || 0}
                      </span>{" "}
                      students
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={schoolClass.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(event) =>
                          toggleActionMenu(event, schoolClass._id)
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label={`Actions for ${schoolClass.name}`}
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

      {/* Action dropdown rendered outside the table */}
      {menuOpen &&
        menuPosition &&
        createPortal(
          <>
            {/* Outside click overlay */}
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => {
                setMenuOpen(null);
                setMenuPosition(null);
              }}
            />

            {/* Dropdown */}
            <div
              className="fixed z-[101] w-44 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <button
                onClick={() => {
                  if (selectedMenuClass) {
                    openEditModal(selectedMenuClass);
                  } else {
                    setMenuOpen(null);
                    setMenuPosition(null);
                  }
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit Class
              </button>

              {selectedMenuClass?.status === "active" ? (
                <button
                  onClick={() => {
                    const schoolClass = selectedMenuClass;

                    setMenuOpen(null);
                    setMenuPosition(null);

                    handleDeactivate(schoolClass);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Power size={15} />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (selectedMenuClass) {
                      handleActivate(selectedMenuClass);
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
                  {editingClass ? "Edit Class" : "Create New Class"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingClass
                    ? "Update the class information below."
                    : "Provide the details for the new school class."}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Class name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Class Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. JSS1 A"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Level and arm */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Class Level
                  </label>

                  <select
                    name="level"
                    value={form.level}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Class Arm
                  </label>

                  <input
                    type="text"
                    name="arm"
                    value={form.arm}
                    onChange={handleFormChange}
                    placeholder="A"
                    maxLength={5}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Student Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={form.capacity}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Maximum number of students that can be enrolled in this class.
                </p>
              </div>

              {/* Status - edit only */}
              {editingClass && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Class Status
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

              {/* Form actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}

                  {saving
                    ? "Saving..."
                    : editingClass
                      ? "Save Changes"
                      : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Statistics card
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

// Status badge
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
