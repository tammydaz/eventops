/**
 * AskFOHPopover — Click to ask a question and route to a department.
 * Questions are stored in questionStore (localStorage). Event cards show a badge
 * when the viewing department has pending questions. Popover renders in portal to avoid clipping.
 */
import { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  useQuestionStore,
  QUESTION_DEPARTMENT_LABELS,
  type QuestionTargetDepartment,
} from "../state/questionStore";
import type { EventQuestion } from "../state/questionStore";
import "./AskFOHPopover.css";

type PopoverContentProps = {
  eventName: string;
  eventId: string;
  viewingDepartment?: QuestionTargetDepartment | null;
  canAcknowledge: boolean;
  pendingForViewer: EventQuestion[];
  acknowledgeForDepartment: (eventId: string, dept: QuestionTargetDepartment) => void;
  targetDepartment: QuestionTargetDepartment;
  setTargetDepartment: (d: QuestionTargetDepartment) => void;
  question: string;
  setQuestion: (q: string) => void;
  submitted: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
};

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(function PopoverContent(
  {
    eventName,
    eventId,
    viewingDepartment,
    canAcknowledge,
    pendingForViewer,
    acknowledgeForDepartment,
    targetDepartment,
    setTargetDepartment,
    question,
    setQuestion,
    submitted,
    handleSubmit,
    onClose,
  },
  ref
) {
  return (
    <div className="ask-foh-portal-overlay">
      <div
        ref={ref}
        className="ask-foh-popover-portal"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="ask-foh-header">
        <span className="ask-foh-title">Ask a Department</span>
        <span className="ask-foh-event">{eventName}</span>
      </div>
      {canAcknowledge && (
        <div className="ask-foh-pending">
          <p className="ask-foh-pending-label">Questions for you:</p>
          {pendingForViewer.map((q) => (
            <div key={q.id} className="ask-foh-pending-item">
              <p className="ask-foh-pending-question">&ldquo;{q.question}&rdquo;</p>
            </div>
          ))}
          <button
            type="button"
            className="ask-foh-ack"
            onClick={() => viewingDepartment && acknowledgeForDepartment(eventId, viewingDepartment)}
          >
            Got it
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="ask-foh-form">
        <label htmlFor="ask-foh-dept" className="ask-foh-label">
          Send to
        </label>
        <select
          id="ask-foh-dept"
          className="ask-foh-select"
          value={targetDepartment}
          onChange={(e) => setTargetDepartment(e.target.value as QuestionTargetDepartment)}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {QUESTION_DEPARTMENT_LABELS[d]}
            </option>
          ))}
        </select>
        <textarea
          className="ask-foh-textarea"
          placeholder="Type your question…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          disabled={submitted}
        />
        <button
          type="submit"
          className="ask-foh-submit"
          disabled={!question.trim() || submitted}
        >
          {submitted ? "Sent" : "Send"}
        </button>
      </form>
      </div>
    </div>
  );
});

type AskFOHPopoverProps = {
  eventId: string;
  eventName: string;
  /** Department viewing this card — badge shows when they have pending questions */
  viewingDepartment?: QuestionTargetDepartment | null;
  children: React.ReactNode;
  /** Disable for demo events */
  disabled?: boolean;
};

const DEPARTMENTS: QuestionTargetDepartment[] = [
  "kitchen",
  "flair",
  "delivery",
  "ops_chief",
  "intake_foh",
];

export function AskFOHPopover({
  eventId,
  eventName,
  viewingDepartment,
  children,
  disabled,
}: AskFOHPopoverProps) {
  const [show, setShow] = useState(false);
  const [question, setQuestion] = useState("");
  const [targetDepartment, setTargetDepartment] = useState<QuestionTargetDepartment>("kitchen");
  const [submitted, setSubmitted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const addQuestion = useQuestionStore((s) => s.addQuestion);
  const acknowledgeForDepartment = useQuestionStore((s) => s.acknowledgeForDepartment);
  const questions = useQuestionStore((s) => s.questions);
  const pendingForViewer = useMemo(() => {
    if (!viewingDepartment) return [];
    return questions.filter(
      (q) => q.eventId === eventId && q.targetDepartment === viewingDepartment && !q.acknowledgedAt
    );
  }, [questions, eventId, viewingDepartment]);
  const hasUnacknowledged = pendingForViewer.length > 0;
  const showBadge = !!viewingDepartment && hasUnacknowledged;
  const canAcknowledge = pendingForViewer.length > 0;

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShow((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (!show) return;
      const target = ev.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inTrigger && !inPopover) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!question.trim()) return;
    addQuestion(eventId, question.trim(), targetDepartment);
    setQuestion("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="ask-foh-wrapper">
      {showBadge && (
        <div className="ask-foh-badge" title="Question waiting for this department">
          <svg className="ask-foh-badge-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="#ef4444" strokeWidth="2" fill="none" />
            <path
              d="M10 12h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4l-2 3-2-3h-4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"
              fill="rgba(255,255,255,0.95)"
              stroke="#ef4444"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="ask-foh-trigger-btn"
        onClick={handleTriggerClick}
        title="Ask a department"
        aria-label="Ask a department"
      >
        ?
      </button>
      <div className="ask-foh-card-slot">{children}</div>
      {show && createPortal(
        <PopoverContent
          ref={popoverRef}
          eventName={eventName}
          eventId={eventId}
          viewingDepartment={viewingDepartment}
          canAcknowledge={canAcknowledge}
          pendingForViewer={pendingForViewer}
          acknowledgeForDepartment={acknowledgeForDepartment}
          targetDepartment={targetDepartment}
          setTargetDepartment={setTargetDepartment}
          question={question}
          setQuestion={setQuestion}
          submitted={submitted}
          handleSubmit={handleSubmit}
          onClose={() => setShow(false)}
        />,
        document.body
      )}
    </div>
  );
}
