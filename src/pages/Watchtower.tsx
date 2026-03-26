import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useEventStore } from "../state/eventStore";
import { DASHBOARD_CALENDAR_TO } from "../lib/dashboardRoutes";
import { loadTodaysTasks, sortOutstandingTasks, type Task } from "../services/airtable/tasks";
import { isErrorResult } from "../services/airtable/selectors";
import "./Watchtower.css";

/**
 * /watchtower — Today's tasks only (printable list with date).
 */
export default function Watchtower() {
  const { events, loadEvents } = useEventStore();

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [todaysTasksLoading, setTodaysTasksLoading] = useState(false);
  const [todaysTasksError, setTodaysTasksError] = useState<string | null>(null);

  const todayLongLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  useEffect(() => {
    setTodaysTasksLoading(true);
    setTodaysTasksError(null);
    const eventNamesById = Object.fromEntries(events.map((e) => [e.id, e.eventName ?? ""]));
    void loadTodaysTasks(eventNamesById).then((result) => {
      setTodaysTasksLoading(false);
      if (isErrorResult(result)) {
        setTodaysTasksError(result.message ?? "Could not load tasks");
        setTodaysTasks([]);
        return;
      }
      setTodaysTasks(sortOutstandingTasks(result));
    });
  }, [events]);

  return (
    <div className="wt-page">
      <header className="wt-page-header watchtower-no-print">
        <Link to={DASHBOARD_CALENDAR_TO} className="wt-back-link">
          ← Back to calendar
        </Link>
      </header>

      <main className="wt-page-main">
        <section className="wt-todays-tasks watchtower-print-area" aria-label="Today's tasks">
          <div className="wt-todays-tasks-header">
            <div>
              <h1 className="wt-todays-tasks-title">Today&apos;s Tasks</h1>
              <p className="wt-todays-tasks-date">{todayLongLabel}</p>
            </div>
            <button type="button" className="wt-todays-tasks-print watchtower-no-print" onClick={() => window.print()}>
              Print list
            </button>
          </div>
          {todaysTasksLoading ? (
            <p className="wt-todays-tasks-loading">Loading tasks…</p>
          ) : todaysTasksError ? (
            <p className="wt-todays-tasks-error">{todaysTasksError}</p>
          ) : todaysTasks.length === 0 ? (
            <p className="wt-todays-tasks-empty">No tasks due today.</p>
          ) : (
            <div className="wt-todays-tasks-list">
              {todaysTasks.map((t) => (
                <div key={t.taskId} className="wt-todays-tasks-row">
                  <div className="wt-todays-tasks-row-main">
                    {t.eventName ? <span className="wt-todays-tasks-event">{t.eventName}</span> : null}
                    <span className="wt-todays-tasks-name">{t.taskName}</span>
                    <span className="wt-todays-tasks-meta">
                      {t.taskType}
                      {t.dueDate ? ` · Due ${t.dueDate}` : ""}
                      {t.status ? ` · ${t.status}` : ""}
                    </span>
                  </div>
                  {t.notes?.trim() ? <p className="wt-todays-tasks-notes">{t.notes.trim()}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
