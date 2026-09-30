const STATUS_CLASSES = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  hold: "bg-amber-50 text-amber-800 border-amber-200",
};

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  hold: "On Hold",
};

const PRIORITY_CLASSES = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-300 font-semibold",
};

export function StatusPill({ status, overdue, testId }) {
  const cls = overdue
    ? "bg-red-50 text-red-700 border-red-200 font-semibold"
    : STATUS_CLASSES[status] || STATUS_CLASSES.pending;
  const label = overdue ? "Overdue" : STATUS_LABELS[status] || status;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, testId }) {
  const cls = PRIORITY_CLASSES[priority] || PRIORITY_CLASSES.medium;
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize ${cls}`}
    >
      {priority}
    </span>
  );
}
