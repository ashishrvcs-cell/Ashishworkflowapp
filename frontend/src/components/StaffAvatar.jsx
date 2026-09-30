const COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-cyan-100 text-cyan-800",
  "bg-indigo-100 text-indigo-800",
];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function StaffAvatar({ staff, size = "sm" }) {
  if (!staff) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-slate-400">
        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200" />
        Unassigned
      </span>
    );
  }
  const initials = staff.initials || staff.name?.slice(0, 2).toUpperCase() || "?";
  const color = COLORS[hashCode(staff.id || staff.name || "x") % COLORS.length];
  const sz = size === "md" ? "w-8 h-8 text-[11px]" : "w-6 h-6 text-[10px]";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${sz} rounded-full ${color} flex items-center justify-center font-semibold`}
      >
        {initials}
      </span>
      <span className="text-sm text-slate-800">{staff.name}</span>
    </span>
  );
}
