export default function EmptyState({ icon: Icon, title, description, action, testId }) {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed border-slate-200 rounded-lg bg-white"
    >
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
