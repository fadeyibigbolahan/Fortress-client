import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  FileQuestion,
  BookOpen,
  CheckCircle2,
  Archive,
  MoreHorizontal,
  Pencil,
  Eye,
  X,
  LoaderCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
  CircleHelp,
  ListChecks,
  GraduationCap,
  AlignLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

const initialForm = {
  subject: "",
  classLevel: "",
  topic: "",
  subtopic: "",
  questionText: "",
  questionType: "objective",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
  markingGuide: "",
  explanation: "",
  marks: 1,
  difficulty: "medium",
  status: "draft",
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

function getQuestions(response) {
  if (Array.isArray(response?.questions)) return response.questions;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function getSubjects(response) {
  if (Array.isArray(response?.subjects)) return response.subjects;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function getSubjectId(subject) {
  if (!subject) return "";
  if (typeof subject === "string") return subject;
  return subject._id || subject.id || "";
}

function getSubjectName(subject) {
  if (!subject) return "—";
  if (typeof subject === "string") return subject;
  return subject.name || "—";
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
    draft: "bg-amber-50 text-amber-700",
    active: "bg-emerald-50 text-emerald-700",
    archived: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] || styles.draft
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const styles = {
    easy: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    hard: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[difficulty] || styles.medium
      }`}
    >
      {difficulty || "Medium"}
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

function Modal({ title, subtitle, onClose, children, size = "max-w-3xl" }) {
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
            type="button"
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

function QuestionForm({
  form,
  setForm,
  subjects,
  editing,
  saving,
  onSubmit,
  onClose,
}) {
  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectedSubject = subjects.find(
    (subject) => subject._id === form.subject,
  );

  const availableLevels =
    selectedSubject?.levels?.length > 0
      ? CLASS_LEVELS.filter((level) => selectedSubject.levels.includes(level))
      : CLASS_LEVELS;

  const updateOption = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, [field]: value }
          : field === "isCorrect" && value
            ? { ...option, isCorrect: false }
            : option,
      ),
    }));
  };

  const addOption = () => {
    if (form.options.length >= 6) return;

    setForm((previous) => ({
      ...previous,
      options: [...previous.options, { text: "", isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;

    setForm((previous) => {
      const options = previous.options.filter(
        (_, optionIndex) => optionIndex !== index,
      );

      if (!options.some((option) => option.isCorrect)) {
        options[0].isCorrect = true;
      }

      return { ...previous, options };
    });
  };

  const handleSubjectChange = (subjectId) => {
    const subject = subjects.find((item) => item._id === subjectId);

    const nextLevels = subject?.levels || CLASS_LEVELS;

    setForm((previous) => ({
      ...previous,
      subject: subjectId,
      classLevel: nextLevels.includes(previous.classLevel)
        ? previous.classLevel
        : nextLevels[0] || "",
    }));
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        {/* Subject and class */}
        <section>
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <GraduationCap size={18} className="text-blue-600" />
            Academic information
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Subject *</label>

              <select
                className={inputClass}
                value={form.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                required
              >
                <option value="">Select subject</option>

                {subjects
                  .filter((subject) => subject.status !== "inactive")
                  .map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Class level *</label>

              <select
                className={inputClass}
                value={form.classLevel}
                onChange={(e) => update("classLevel", e.target.value)}
                required
                disabled={!form.subject}
              >
                <option value="">Select class level</option>

                {availableLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Topic *</label>

              <input
                className={inputClass}
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                placeholder="e.g. Algebra"
                required
              />
            </div>

            <div>
              <label className={labelClass}>Subtopic</label>

              <input
                className={inputClass}
                value={form.subtopic}
                onChange={(e) => update("subtopic", e.target.value)}
                placeholder="e.g. Linear equations"
              />
            </div>
          </div>
        </section>

        <div className="border-t border-slate-100" />

        {/* Question details */}
        <section>
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <CircleHelp size={18} className="text-blue-600" />
            Question details
          </h3>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Question type *</label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update("questionType", "objective")}
                  className={`rounded-xl border p-3 text-left transition ${
                    form.questionType === "objective"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ListChecks size={19} />
                  <p className="mt-2 text-sm font-semibold">Objective</p>
                  <p className="mt-1 text-xs opacity-75">
                    Multiple-choice question
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    update("questionType", "theory");
                    update("options", []);
                  }}
                  className={`rounded-xl border p-3 text-left transition ${
                    form.questionType === "theory"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <AlignLeft size={19} />
                  <p className="mt-2 text-sm font-semibold">Theory</p>
                  <p className="mt-1 text-xs opacity-75">
                    Written-answer question
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Question text *</label>

              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={form.questionText}
                onChange={(e) => update("questionText", e.target.value)}
                placeholder="Enter the complete examination question..."
                required
              />
            </div>
          </div>
        </section>

        {/* Objective options */}
        {form.questionType === "objective" && (
          <>
            <div className="border-t border-slate-100" />

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Answer options
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Select exactly one correct answer.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addOption}
                  disabled={form.options.length >= 6}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add option
                </button>
              </div>

              <div className="space-y-3">
                {form.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${
                      option.isCorrect
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateOption(index, "isCorrect", true)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                        option.isCorrect
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 bg-white text-slate-500"
                      }`}
                      title="Mark as correct answer"
                    >
                      {String.fromCharCode(65 + index)}
                    </button>

                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                      value={option.text}
                      onChange={(e) =>
                        updateOption(index, "text", e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      required
                    />

                    {option.isCorrect && (
                      <span className="hidden text-xs font-semibold text-emerald-700 sm:inline">
                        Correct
                      </span>
                    )}

                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Remove option"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {form.options.length} of 6 options
              </p>
            </section>
          </>
        )}

        {/* Theory marking guide */}
        {form.questionType === "theory" && (
          <>
            <div className="border-t border-slate-100" />

            <section>
              <h3 className="mb-3 font-semibold text-slate-900">
                Marking guide
              </h3>

              <textarea
                className={`${inputClass} min-h-28 resize-y`}
                value={form.markingGuide}
                onChange={(e) => update("markingGuide", e.target.value)}
                placeholder="Enter the expected answer, marking points, or grading criteria..."
              />

              <p className="mt-2 text-xs text-slate-400">
                This guide is for authorized teachers grading theory responses.
                It is not shown to students during an exam.
              </p>
            </section>
          </>
        )}

        <div className="border-t border-slate-100" />

        {/* Marks and difficulty */}
        <section>
          <h3 className="mb-4 font-semibold text-slate-900">
            Assessment settings
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Marks *</label>

              <input
                type="number"
                min="0.5"
                step="0.5"
                className={inputClass}
                value={form.marks}
                onChange={(e) => update("marks", e.target.value)}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Difficulty *</label>

              <select
                className={inputClass}
                value={form.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Status *</label>

              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass}>Explanation (optional)</label>

            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={form.explanation}
              onChange={(e) => update("explanation", e.target.value)}
              placeholder="Add an explanation for the correct answer..."
            />
          </div>
        </section>
      </div>

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

          {editing ? "Save changes" : "Save question"}
        </button>
      </div>
    </form>
  );
}

function QuestionDetails({ question, onClose, onEdit }) {
  const options = question.options || [];

  return (
    <Modal
      title="Question details"
      subtitle="Review the question and its assessment settings."
      onClose={onClose}
    >
      <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={question.status} />
          <DifficultyBadge difficulty={question.difficulty} />

          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
            {question.questionType}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Subject</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {getSubjectName(question.subject)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Class level</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {question.classLevel}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Topic</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {question.topic}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400">Marks</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {question.marks}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">
            Question
          </h3>

          <div className="whitespace-pre-wrap rounded-xl border border-slate-200 p-4 text-sm leading-7 text-slate-700">
            {question.questionText}
          </div>
        </div>

        {question.questionType === "objective" && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Answer options
            </h3>

            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={option._id || index}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    option.isCorrect
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <p className="flex-1 text-sm text-slate-700">{option.text}</p>

                  {option.isCorrect && (
                    <CheckCircle2 size={17} className="text-emerald-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.questionType === "theory" && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Marking guide
            </h3>

            <div className="whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              {question.markingGuide || "No marking guide provided."}
            </div>
          </div>
        )}

        {question.explanation && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              Explanation
            </h3>

            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {question.explanation}
            </div>
          </div>
        )}

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Created</p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(question.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Last updated</p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(question.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={() => onEdit(question)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Pencil size={15} />
            Edit question
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [statistics, setStatistics] = useState({});

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const loadData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      try {
        const params = {
          page,
          limit: 20,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(subjectFilter ? { subject: subjectFilter } : {}),
          ...(levelFilter ? { classLevel: levelFilter } : {}),
          ...(typeFilter ? { questionType: typeFilter } : {}),
          ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        };

        const [questionResponse, subjectResponse, statsResponse] =
          await Promise.all([
            api.get("/questions", { params }),
            api.get("/subjects", {
              params: { status: "active", limit: 100 },
            }),
            api.get("/questions/statistics"),
          ]);

        const questionResult = questionResponse.data || {};

        setQuestions(getQuestions(questionResult));

        setPagination(
          questionResult.pagination || {
            total: questionResult.total || 0,
            page,
            limit: 20,
            totalPages: 1,
          },
        );

        setSubjects(getSubjects(subjectResponse.data));

        setStatistics(statsResponse.data?.statistics || {});
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      subjectFilter,
      levelFilter,
      typeFilter,
      difficultyFilter,
      statusFilter,
    ],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFilters = () => {
    setSearch("");
    setSubjectFilter("");
    setLevelFilter("");
    setTypeFilter("");
    setDifficultyFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const openCreateForm = () => {
    setEditingQuestion(null);
    setForm(initialForm);
    setSelectedQuestion(null);
    setOpenMenu(null);
    setShowForm(true);
  };

  const openEditForm = (question) => {
    setEditingQuestion(question);

    setForm({
      subject: getSubjectId(question.subject),
      classLevel: question.classLevel || "",
      topic: question.topic || "",
      subtopic: question.subtopic || "",
      questionText: question.questionText || "",
      questionType: question.questionType || "objective",
      options:
        question.questionType === "objective"
          ? (question.options || []).map((option) => ({
              text: option.text || "",
              isCorrect: Boolean(option.isCorrect),
            }))
          : [],
      markingGuide: question.markingGuide || "",
      explanation: question.explanation || "",
      marks: question.marks || 1,
      difficulty: question.difficulty || "medium",
      status: question.status || "draft",
    });

    setSelectedQuestion(null);
    setOpenMenu(null);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingQuestion(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.subject) {
      toast.error("Please select a subject.");
      return;
    }

    if (!form.classLevel) {
      toast.error("Please select a class level.");
      return;
    }

    if (form.questionType === "objective") {
      if (form.options.length < 2 || form.options.length > 6) {
        toast.error("Objective questions must have 2 to 6 options.");
        return;
      }

      if (form.options.some((option) => !option.text.trim())) {
        toast.error("Please fill in all answer options.");
        return;
      }

      if (form.options.filter((option) => option.isCorrect).length !== 1) {
        toast.error("Select exactly one correct answer.");
        return;
      }
    }

    if (Number(form.marks) <= 0) {
      toast.error("Marks must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        subject: form.subject,
        classLevel: form.classLevel,
        topic: form.topic.trim(),
        subtopic: form.subtopic.trim(),
        questionText: form.questionText.trim(),
        questionType: form.questionType,
        options:
          form.questionType === "objective"
            ? form.options.map((option) => ({
                text: option.text.trim(),
                isCorrect: option.isCorrect,
              }))
            : [],
        markingGuide:
          form.questionType === "theory" ? form.markingGuide.trim() : "",
        explanation: form.explanation.trim(),
        marks: Number(form.marks),
        difficulty: form.difficulty,
        status: form.status,
      };

      if (editingQuestion) {
        await api.patch(`/questions/${editingQuestion._id}`, payload);

        toast.success("Question updated successfully.");
      } else {
        await api.post("/questions", payload);

        toast.success("Question created successfully.");
      }

      setShowForm(false);
      setEditingQuestion(null);
      setForm(initialForm);

      await loadData(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const archiveQuestion = async (question) => {
    if (!window.confirm("Are you sure you want to archive this question?")) {
      return;
    }

    try {
      await api.patch(`/questions/${question._id}/archive`);

      toast.success("Question archived successfully.");
      setOpenMenu(null);

      await loadData(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMenuToggle = (event, questionId) => {
    if (openMenu === questionId) {
      setOpenMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 145;
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
    setOpenMenu(questionId);
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

  const menuQuestion = questions.find((question) => question._id === openMenu);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Question Bank
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create, organize and manage examination questions.
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
            Add question
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total questions"
          value={statistics.total}
          icon={FileQuestion}
          color="bg-blue-50 text-blue-600"
          loading={loading}
        />

        <StatCard
          title="Active questions"
          value={statistics.active}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
          loading={loading}
        />

        <StatCard
          title="Draft questions"
          value={statistics.draft}
          icon={BookOpen}
          color="bg-amber-50 text-amber-600"
          loading={loading}
        />

        <StatCard
          title="Archived questions"
          value={statistics.archived}
          icon={Archive}
          color="bg-slate-100 text-slate-600"
          loading={loading}
        />
      </div>

      {/* Question directory */}
      <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">Question directory</h2>

            <p className="mt-1 text-xs text-slate-500">
              Browse and manage questions in your question bank.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative sm:col-span-2 xl:col-span-1">
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
                placeholder="Search questions or topics..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All subjects</option>

              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All class levels</option>

              {CLASS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All question types</option>
              <option value="objective">Objective</option>
              <option value="theory">Theory</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Filter size={15} />
              Clear filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Question</th>
                <th className="px-5 py-3.5">Subject</th>
                <th className="px-5 py-3.5">Class</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Marks</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <LoaderCircle
                      className="mx-auto animate-spin text-blue-600"
                      size={27}
                    />

                    <p className="mt-2 text-sm text-slate-500">
                      Loading questions...
                    </p>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FileQuestion size={25} />
                    </div>

                    <p className="mt-3 font-semibold text-slate-700">
                      No questions found
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      Add a question or change your filters.
                    </p>

                    <button
                      onClick={openCreateForm}
                      className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      + Create your first question
                    </button>
                  </td>
                </tr>
              ) : (
                questions.map((question) => (
                  <tr key={question._id} className="hover:bg-slate-50/70">
                    <td className="max-w-[300px] px-5 py-4">
                      <p className="line-clamp-2 font-semibold text-slate-800">
                        {question.questionText}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {question.topic}
                        {question.subtopic ? ` • ${question.subtopic}` : ""}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {getSubjectName(question.subject)}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {question.classLevel}
                    </td>

                    <td className="px-5 py-4">
                      <span className="capitalize text-slate-600">
                        {question.questionType}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {question.marks}
                    </td>

                    <td className="px-5 py-4">
                      <DifficultyBadge difficulty={question.difficulty} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={question.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(event) =>
                          handleMenuToggle(event, question._id)
                        }
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        aria-label="Question actions"
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
            Showing {visibleRange} questions
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

      {/* Floating action menu */}
      {openMenu &&
        typeof document !== "undefined" &&
        document.body &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close question menu"
              onClick={() => setOpenMenu(null)}
              className="fixed inset-0 z-[200] cursor-default"
            />

            <div
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
              }}
              className="z-[201] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
            >
              <button
                onClick={() => {
                  if (menuQuestion) {
                    setSelectedQuestion(menuQuestion);
                    setOpenMenu(null);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                <Eye size={15} />
                View question
              </button>

              <button
                onClick={() => {
                  if (menuQuestion) {
                    openEditForm(menuQuestion);
                  }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit question
              </button>

              {menuQuestion?.status !== "archived" && (
                <button
                  onClick={() => {
                    if (menuQuestion) {
                      archiveQuestion(menuQuestion);
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Archive size={15} />
                  Archive question
                </button>
              )}
            </div>
          </>,
          document.body,
        )}

      {/* Create / Edit modal */}
      {showForm && (
        <Modal
          title={editingQuestion ? "Edit question" : "Create new question"}
          subtitle={
            editingQuestion
              ? "Update the question and its assessment settings."
              : "Add a question to the school's question bank."
          }
          onClose={closeForm}
        >
          <QuestionForm
            form={form}
            setForm={setForm}
            subjects={subjects}
            editing={Boolean(editingQuestion)}
            saving={saving}
            onSubmit={handleSubmit}
            onClose={closeForm}
          />
        </Modal>
      )}

      {/* Question details */}
      {selectedQuestion && (
        <QuestionDetails
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          onEdit={openEditForm}
        />
      )}
    </div>
  );
}
