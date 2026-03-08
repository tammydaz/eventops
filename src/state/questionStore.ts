/**
 * Question store — routes questions to departments.
 * Persists to localStorage. Can be swapped for Airtable/API later.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QuestionTargetDepartment =
  | "kitchen"
  | "flair"
  | "delivery"
  | "ops_chief"
  | "intake_foh";

export type EventQuestion = {
  id: string;
  eventId: string;
  question: string;
  targetDepartment: QuestionTargetDepartment;
  createdAt: string;
  /** When set, question is considered acknowledged by that department */
  acknowledgedAt?: string;
};

type QuestionStore = {
  questions: EventQuestion[];
  addQuestion: (eventId: string, question: string, targetDepartment: QuestionTargetDepartment) => void;
  getQuestionsForEvent: (eventId: string) => EventQuestion[];
  hasUnacknowledgedForDepartment: (eventId: string, department: QuestionTargetDepartment) => boolean;
  acknowledgeForDepartment: (eventId: string, department: QuestionTargetDepartment) => void;
};

export const QUESTION_DEPARTMENT_LABELS: Record<QuestionTargetDepartment, string> = {
  kitchen: "Kitchen",
  flair: "Flair / Equipment",
  delivery: "Delivery & Operations",
  ops_chief: "Ops Chief",
  intake_foh: "Intake / FOH",
};

export const useQuestionStore = create<QuestionStore>()(
  persist(
    (set, get) => ({
      questions: [],

      addQuestion: (eventId, question, targetDepartment) => {
        const q: EventQuestion = {
          id: crypto.randomUUID(),
          eventId,
          question,
          targetDepartment,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ questions: [...s.questions, q] }));
      },

      getQuestionsForEvent: (eventId) => {
        return get().questions.filter((q) => q.eventId === eventId);
      },

      hasUnacknowledgedForDepartment: (eventId, department) => {
        return get().questions.some(
          (q) =>
            q.eventId === eventId &&
            q.targetDepartment === department &&
            !q.acknowledgedAt
        );
      },

      acknowledgeForDepartment: (eventId, department) => {
        set((s) => ({
          questions: s.questions.map((q) =>
            q.eventId === eventId && q.targetDepartment === department && !q.acknowledgedAt
              ? { ...q, acknowledgedAt: new Date().toISOString() }
              : q
          ),
        }));
      },
    }),
    { name: "eventops-event-questions" }
  )
);
