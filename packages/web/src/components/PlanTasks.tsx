import type { PlanTask } from "../types";

interface PlanTasksProps {
  tasks: PlanTask[];
  onAccept?: () => void;
  acceptDisabled?: boolean;
  showAccept?: boolean;
}

export function PlanTasks({
  tasks,
  onAccept,
  acceptDisabled,
  showAccept = true,
}: PlanTasksProps) {
  return (
    <div className="plan-preview">
      <h3>Proposed Tasks</h3>
      <div className="plan-task-cards">
        {tasks.map((task, index) => (
          <div key={task.id} className="plan-task-card">
            <span className="plan-task-num">{index + 1}</span>
            <div>
              <strong className="plan-task-title">{task.title}</strong>
              <p className="plan-task-desc">{task.description}</p>
            </div>
          </div>
        ))}
      </div>
      {showAccept && onAccept && (
        <button className="btn-primary" onClick={onAccept} disabled={acceptDisabled}>
          Accept Plan
        </button>
      )}
    </div>
  );
}
