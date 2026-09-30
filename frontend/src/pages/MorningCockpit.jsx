import { useEffect, useState } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PauseCircle,
  ArrowRight,
} from "lucide-react";
import {
  dashboardStats,
  listTasks,
  listClients,
  listStaff,
  todayISO,
  daysBetween,
} from "@/lib/api";
import { StatusPill, PriorityBadge } from "@/components/StatusPill";
import StaffAvatar from "@/components/StaffAvatar";
import { Link } from "react-router-dom";

const KPI_STYLES = {
  total: "bg-blue-50/70 border-blue-200",
  completed: "bg-emerald-50/70 border-emerald-200",
  pending: "bg-slate-50 border-slate-200",
  overdue: "bg-red-50/80 border-red-300",
  hold: "bg-amber-50/80 border-amber-200",
};

const ICON_COLOR = {
  total: "text-blue-700",
  completed: "text-emerald-700",
  pending: "text-slate-700",
  overdue: "text-red-700",
  hold: "text-amber-700",
};

function StatCard({ title, value, subtitle, variant, icon: Icon, testId }) {
  return (
    <div
      data-testid={testId}
      className={`p-4 rounded-lg border ${KPI_STYLES[variant]} transition-all hover:shadow-sm relative`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="th-caps">{title}</span>
        <Icon className={`w-4 h-4 ${ICON_COLOR[variant]}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${variant === "overdue" ? "text-red-900" : "text-slate-900"}`}>
          {value}
        </span>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
    </div>
  );
}

export default function MorningCockpit() {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [hold, setHold] = useState([]);
  const [clients, setClients] = useState({});
  const [staff, setStaff] = useState({});

  const load = async () => {
    const [s, ov, hd, cl, st] = await Promise.all([
      dashboardStats(),
      listTasks({ overdue: true }),
      listTasks({ status: "hold" }),
      listClients(),
      listStaff(),
    ]);
    setStats(s);
    setOverdue(ov);
    setHold(hd);
    setClients(Object.fromEntries(cl.map((c) => [c.id, c])));
    setStaff(Object.fromEntries(st.map((s) => [s.id, s])));
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("ledgerflow:refresh", handler);
    return () => window.removeEventListener("ledgerflow:refresh", handler);
  }, []);

  if (!stats) {
    return <div className="text-sm text-slate-500">Loading...</div>;
  }

  const today = todayISO();
  const empty = stats.total_clients === 0 && stats.active_rules === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            Morning Cockpit
          </span>
          {stats.overdue > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold border border-red-200">
              {stats.overdue} SLA breaches
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Exception-Driven Practice Overview
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Focus on what needs partner attention today &middot; Last synced now
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          title="Today's Tasks"
          value={stats.todays_tasks}
          subtitle="slated"
          variant="total"
          icon={ClipboardList}
          testId="kpi-card-total"
        />
        <StatCard
          title="Completed"
          value={stats.completed_today}
          subtitle="today"
          variant="completed"
          icon={CheckCircle2}
          testId="kpi-card-completed"
        />
        <StatCard
          title="Pending"
          value={stats.pending_today}
          subtitle="in queue"
          variant="pending"
          icon={Clock}
          testId="kpi-card-pending"
        />
        <StatCard
          title="Overdue Alert"
          value={stats.overdue}
          subtitle="critical"
          variant="overdue"
          icon={AlertTriangle}
          testId="kpi-card-overdue"
        />
        <StatCard
          title="On Hold"
          value={stats.on_hold}
          subtitle="blocked"
          variant="hold"
          icon={PauseCircle}
          testId="kpi-card-hold"
        />
      </div>

      {empty && (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Welcome to LedgerFlow</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-lg mx-auto">
            Start by adding your team, clients, and defining recurring task rules. Then use
            &quot;Generate Today&apos;s Work&quot; from the top bar every morning to auto-populate today&apos;s queue.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <Link
              to="/clients"
              className="text-blue-700 hover:underline font-medium"
              data-testid="link-add-clients"
            >
              Add Clients →
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/rules"
              className="text-blue-700 hover:underline font-medium"
              data-testid="link-add-rules"
            >
              Set up Recurring Rules →
            </Link>
          </div>
        </div>
      )}

      {/* Overdue */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-semibold text-slate-900">Overdue Tasks (Immediate Attention)</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-semibold border border-red-200">
            {overdue.length} escalations
          </span>
        </div>
        {overdue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            All tasks on track. Zero overdue items.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="th-caps text-left px-5 py-2">Client</th>
                <th className="th-caps text-left px-3 py-2">Task</th>
                <th className="th-caps text-left px-3 py-2">Staff</th>
                <th className="th-caps text-left px-3 py-2">Days Overdue</th>
                <th className="th-caps text-left px-3 py-2">Priority</th>
              </tr>
            </thead>
            <tbody>
              {overdue.slice(0, 8).map((t) => {
                const c = clients[t.client_id];
                const s = staff[t.assigned_staff_id];
                const days = -daysBetween(today, t.due_date);
                return (
                  <tr key={t.id} className="border-t border-slate-100 tr-hover">
                    <td className="px-5 py-3 text-slate-900 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {c?.name || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{t.task_name}</td>
                    <td className="px-3 py-3">
                      <StaffAvatar staff={s} />
                    </td>
                    <td className="px-3 py-3 text-red-700 font-semibold">
                      {days} day{days !== 1 ? "s" : ""}
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-2 border-t border-slate-100 text-right">
          <Link
            to="/today"
            className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
            data-testid="link-view-all-tasks"
          >
            View all in Today&apos;s Work
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* On Hold */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Tasks On Hold (Client Dependencies)</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-200">
            {hold.length} blockers
          </span>
        </div>
        {hold.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Zero tasks on hold.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="th-caps text-left px-5 py-2">Client</th>
                <th className="th-caps text-left px-3 py-2">Task</th>
                <th className="th-caps text-left px-3 py-2">Reason</th>
                <th className="th-caps text-left px-3 py-2">Staff</th>
              </tr>
            </thead>
            <tbody>
              {hold.map((t) => {
                const c = clients[t.client_id];
                const s = staff[t.assigned_staff_id];
                return (
                  <tr key={t.id} className="border-t border-slate-100 tr-hover">
                    <td className="px-5 py-3 text-slate-900 font-medium">{c?.name || "—"}</td>
                    <td className="px-3 py-3 text-slate-700">{t.task_name}</td>
                    <td className="px-3 py-3 text-slate-600 max-w-xs truncate">
                      {t.hold_reason || t.remarks || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StaffAvatar staff={s} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
