import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  LoaderCircle,
  Save,
  UserRound,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStudentName = (student) => {
  if (!student) return "Unknown student";

  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
};

export default function TeacherGradeAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState(null);
  const [grades, setGrades] = useState({});

  const fetchAttempt = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(`/results/teacher/attempts/${attemptId}`);

      const data = response.data.data;

      setAttempt(data);

      const initialGrades = {};

      (data.questions || []).forEach((question) => {
        initialGrades[question.id] = {
          awardedMarks:
            question.awardedMarks === null ||
            question.awardedMarks === undefined
              ? ""
              : String(question.awardedMarks),
          feedback: question.teacherFeedback || "",
        };
      });

      setGrades(initialGrades);
    } catch (error) {
      console.error("Attempt grading error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load this examination attempt.",
      );

      navigate("/teacher/grading");
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  const updateGrade = (questionId, field, value) => {
    setGrades((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        [field]: value,
      },
    }));
  };

  const saveGrade = async (question) => {
    const grade = grades[question.id];

    if (!grade || grade.awardedMarks === "") {
      toast.error("Enter the marks awarded before saving.");
      return;
    }

    const awardedMarks = Number(grade.awardedMarks);

    if (
      !Number.isFinite(awardedMarks) ||
      awardedMarks < 0 ||
      awardedMarks > question.marks
    ) {
      toast.error(`Marks must be between 0 and ${question.marks}.`);
      return;
    }

    try {
      setSavingQuestion(question.id);

      const response = await api.patch(
        `/results/teacher/attempts/${attemptId}/questions/${question.id}/grade`,
        {
          awardedMarks,
          feedback: grade.feedback,
        },
      );

      const result = response.data.data;

      setAttempt((previous) => ({
        ...previous,
        gradingStatus: result.attemptGradingStatus,
        questions: previous.questions.map((item) =>
          item.id === question.id
            ? {
                ...item,
                awardedMarks: result.question.awardedMarks,
                gradingStatus: result.question.gradingStatus,
                teacherFeedback: grade.feedback,
              }
            : item,
        ),
      }));

      toast.success(response.data.message || "Grade saved successfully.");
    } catch (error) {
      console.error("Save grade error:", error);

      toast.error(
        error.response?.data?.message || "Unable to save this grade.",
      );
    } finally {
      setSavingQuestion(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading examination responses...
          </p>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const theoryQuestions = attempt.questions.filter(
    (question) => question.questionType === "theory",
  );

  const gradedQuestions = theoryQuestions.filter(
    (question) => question.gradingStatus === "graded",
  ).length;

  const pendingQuestions = theoryQuestions.length - gradedQuestions;

  const progress = theoryQuestions.length
    ? (gradedQuestions / theoryQuestions.length) * 100
    : 100;

  const isCompleted = attempt.gradingStatus === "graded";

  return (
    <div className="space-y-7 pb-10">
      {/* Page heading */}
      <div>
        <button
          onClick={() => navigate("/teacher/grading")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Grading Queue
        </button>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600">
              TEACHER WORKSPACE
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              Examination Grading
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and grade the student's theory responses.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
              isCompleted
                ? "bg-green-50 text-green-700"
                : "bg-orange-50 text-orange-700"
            }`}
          >
            {isCompleted ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}

            {isCompleted ? "Grading Completed" : "Grading In Progress"}
          </span>
        </div>
      </div>

      {/* Student and examination information */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-500">
            <UserRound size={18} />
            <span className="text-sm font-semibold">Student Information</span>
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            {getStudentName(attempt.student)}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Admission Number:{" "}
            <span className="font-semibold text-slate-700">
              {attempt.student?.admissionNumber || "Not available"}
            </span>
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Class:{" "}
            <span className="font-semibold text-slate-700">
              {attempt.schoolClass?.name ||
                [attempt.schoolClass?.level, attempt.schoolClass?.arm]
                  .filter(Boolean)
                  .join(" ") ||
                "Not available"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-slate-500">
            <FileText size={18} />
            <span className="text-sm font-semibold">
              Examination Information
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            {attempt.examination?.title || "Examination"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Submitted:{" "}
            <span className="font-medium text-slate-700">
              {formatDate(attempt.submittedAt)}
            </span>
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Total possible marks:{" "}
            <span className="font-semibold text-slate-700">
              {attempt.totalPossibleMarks}
            </span>
          </p>
        </div>
      </section>

      {/* Grading progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Grading Progress</h2>
            <p className="mt-1 text-sm text-slate-500">
              {gradedQuestions} of {theoryQuestions.length} theory questions
              graded
            </p>
          </div>

          <div className="text-2xl font-bold text-slate-900">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="text-green-700">{gradedQuestions} graded</span>
          <span className="text-orange-600">
            {pendingQuestions} outstanding
          </span>
        </div>
      </section>

      {/* Completion notice */}
      {isCompleted && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">
              All theory responses have been graded.
            </p>
            <p className="mt-1 text-sm text-green-700">
              The result has been generated and is awaiting administrative
              review and approval.
            </p>
          </div>
        </div>
      )}

      {/* Theory responses */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Student Responses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review each answer and award marks according to the marking guide.
          </p>
        </div>

        {theoryQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-9 w-9 text-green-600" />
            <h3 className="font-semibold text-slate-900">
              No theory questions
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This examination does not contain any theory responses requiring
              manual grading.
            </p>
          </div>
        ) : (
          theoryQuestions.map((question, index) => {
            const grade = grades[question.id] || {
              awardedMarks: "",
              feedback: "",
            };

            const isGraded = question.gradingStatus === "graded";
            const isSaving = savingQuestion === question.id;

            return (
              <section
                key={question.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Maximum marks: {question.marks}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isGraded
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {isGraded ? "Graded" : "Awaiting grading"}
                  </span>
                </div>

                <div className="space-y-5 p-5">
                  {/* Question */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-500">
                      Question
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900">
                      {question.questionText}
                    </p>
                  </div>

                  {/* Student answer */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-blue-800">
                      Student's Answer
                    </h3>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {question.responseText?.trim() ||
                        "The student did not provide an answer."}
                    </p>
                  </div>

                  {/* Marking guide */}
                  {question.markingGuide && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-amber-800">
                        Marking Guide
                      </h3>

                      <p className="whitespace-pre-wrap text-sm leading-7 text-amber-900">
                        {question.markingGuide}
                      </p>
                    </div>
                  )}

                  {/* Award marks */}
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`marks-${question.id}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Marks Awarded
                      </label>

                      <div className="relative">
                        <input
                          id={`marks-${question.id}`}
                          type="number"
                          min="0"
                          max={question.marks}
                          step="any"
                          value={grade.awardedMarks}
                          disabled={isSaving || isCompleted}
                          onChange={(event) =>
                            updateGrade(
                              question.id,
                              "awardedMarks",
                              event.target.value,
                            )
                          }
                          placeholder="Enter marks"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-24 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          / {question.marks}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`feedback-${question.id}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Teacher Feedback
                      </label>

                      <textarea
                        id={`feedback-${question.id}`}
                        rows={3}
                        maxLength={2000}
                        value={grade.feedback}
                        disabled={isSaving || isCompleted}
                        onChange={(event) =>
                          updateGrade(
                            question.id,
                            "feedback",
                            event.target.value,
                          )
                        }
                        placeholder="Provide comments or guidance (optional)"
                        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Save */}
                  <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                    <p className="text-xs text-slate-400">
                      {isGraded
                        ? "You can update this grade until the result is approved."
                        : "Save your marks to record this grading."}
                    </p>

                    <button
                      onClick={() => saveGrade(question)}
                      disabled={isSaving || isCompleted}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <LoaderCircle size={17} className="animate-spin" />
                      ) : (
                        <Save size={17} />
                      )}

                      {isSaving
                        ? "Saving..."
                        : isGraded
                          ? "Update Grade"
                          : "Save Grade"}
                    </button>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <p className="text-sm leading-6 text-slate-600">
          Saving a grade records the teacher's assessment. It does not publish
          the student's result. Results remain subject to administrative
          approval and release.
        </p>
      </div>

      <div>
        <button
          onClick={() => navigate("/teacher/grading")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Return to Grading Queue
        </button>
      </div>
    </div>
  );
}
