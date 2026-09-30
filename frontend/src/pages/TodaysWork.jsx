import { useEffect, useState } from "react";
import { Search, CheckCircle2, PlayCircle, PauseCircle, RotateCcw, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill, PriorityBadge } from "@/components/StatusPill";
import StaffAvatar from "@/components/StaffAvatar";
import EmptyState from "@/components/EmptyState";
import {
  listTasks,
  listClients,
  listStaff,
  updateTask,
  deleteTask,
  todayISO,
} from "@/lib/api";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

const ALL = "__all__";

export default function TodaysWork() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState({});
  const [staff, setStaff] = useState({});
  const [staffFilter, setStaffFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [scope, setScope] = useState("today"); // today | all | overdue
  const [search, setSearch] = useState("");

  const load = async () => {
    const params = {};
    if (scope === "today") params.due_date = todayISO();
    if (scope === "overdue") params.overdue = true;
    const [t, cl, st] = await Promise.all([listTasks(params), listClients(), listStaff()]);
    setTasks(t);
    setClients(Object.fromEntries(cl.map((c) => [c.id, c])));
    setStaff(Object.fromEntries(st.map((s) => [s.id, s])));
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("ledgerflow:refresh", handler);
    return () => window.removeEventListener("ledgerflow:refresh", handler);
  }, [scope]);

  const filtered = tasks.filter((t) => {
    if (staffFilter !== ALL && t.assigned_staff_id !== staffFilter) return false;
    if (statusFilter !== ALL && t.status !== statusFilter) return false;
    if (priorityFilter !== ALL && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const client = clients[t.client_id];
      if (
        !t.task_name.toLowerCase().includes(q) &&
        !(client?.name.toLowerCase().includes(q)) &&
        !(client?.code.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  const change = async (task, patch) => {
    if (patch.status === "hold") {
      const reason = prompt("Reason for hold?");
      if (reason === null) return;
      patch.hold_reason = reason;
    }
    await updateTask(task.id, patch);
    toast.success("Task updated");
    load();
    window.dispatchEvent(new CustomEvent("ledgerflow:refresh"));
  };

  const remove = async (task) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(task.id);
    toast.success("Task deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
          Practice Workbench
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Today's Work</h2>
        <p className="text-xs text-slate-500 mt-1">
          Update statuses, mark completions and flag holds throughout the day.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search task or client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-input"
          />
        </div>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="h-9 w-[140px] text-xs" data-testid="filter-scope-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="all">All Tasks</SelectItem>
          </SelectContent>
        </Select>
        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="h-9 w-[160px] text-xs" data-testid="filter-staff-select">
            <SelectValue placeholder="Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Staff</SelectItem>
            {Object.values(staff).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[150px] text-xs" data-testid="filter-status-select">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-[140px] text-xs" data-testid="filter-priority-select">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks match your filters"
          description="Try clearing filters or click Generate Today&apos;s Work at the top to spawn instances from recurring rules."
          testId="empty-tasks"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th-caps text-left px-4 py-2">Client</th>
                <th className="th-caps text-left px-3 py-2">Task</th>
                <th className="th-caps text-left px-3 py-2">Due Date</th>
                <th className="th-caps text-left px-3 py-2">Staff</th>
                <th className="th-caps text-left px-3 py-2">Priority</th>
                <th className="th-caps text-left px-3 py-2">Status</th>
                <th className="th-caps text-right px-3 py-2">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const c = clients[t.client_id];
                const s = staff[t.assigned_staff_id];
                const overdue =
                  t.due_date < todayISO() && ["pending", "in_progress"].includes(t.status);
                return (
                  <tr
                    key={t.id}
                    data-testid={`task-row-${t.id}`}
                    className="border-t border-slate-100 tr-hover"
                  >
                    <td className="px-4 py-3">
                      <div className="text-slate-900 font-medium">{c?.name || "—"}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c?.code}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      <div>{t.task_name}</div>
                      {t.category && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.category}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-700 font-mono text-xs">{t.due_date}</td>
                    <td className="px-3 py-3">
                      <StaffAvatar staff={s} />
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={t.status} overdue={overdue} />
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {t.status !== "completed" && (
                        <button
                          className="text-emerald-600 hover:text-emerald-800 mr-2"
                          title="Mark completed"
                          onClick={() => change(t, { status: "completed" })}
                          data-testid={`task-complete-${t.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 inline" />
                        </button>
                      )}
                      {t.status === "pending" && (
                        <button
                          className="text-blue-600 hover:text-blue-800 mr-2"
                          title="Start"
                          onClick={() => change(t, { status: "in_progress" })}
                          data-testid={`task-start-${t.id}`}
                        >
                          <PlayCircle className="w-4 h-4 inline" />
                        </button>
                      )}
                      {t.status !== "hold" && t.status !== "completed" && (
                        <button
                          className="text-amber-600 hover:text-amber-800 mr-2"
                          title="Put on hold"
                          onClick={() => change(t, { status: "hold" })}
                          data-testid={`task-hold-${t.id}`}
                        >
                          <PauseCircle className="w-4 h-4 inline" />
                        </button>
                      )}
                      {(t.status === "hold" || t.status === "completed") && (
                        <button
                          className="text-slate-600 hover:text-slate-800 mr-2"
                          title="Reopen"
                          onClick={() => change(t, { status: "pending", hold_reason: null })}
                          data-testid={`task-reopen-${t.id}`}
                        >
                          <RotateCcw className="w-4 h-4 inline" />
                        </button>
                      )}
                      <button
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                        onClick={() => remove(t)}
                        data-testid={`task-delete-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
