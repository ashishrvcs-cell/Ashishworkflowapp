import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Repeat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/EmptyState";
import NewRuleDialog from "@/components/dialogs/NewRuleDialog";
import { PriorityBadge } from "@/components/StatusPill";
import StaffAvatar from "@/components/StaffAvatar";
import {
  listRules,
  listClients,
  listStaff,
  deleteRule,
  updateRule,
} from "@/lib/api";
import { toast } from "sonner";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatCadence(rule) {
  const f = rule.frequency;
  const d = rule.day_of_period;
  if (f === "daily") return "Daily (Mon–Fri)";
  if (f === "weekly") return `Weekly (${DOW[Math.max(0, Math.min(6, d))]})`;
  if (f === "monthly") return `Monthly (day ${d})`;
  if (f === "quarterly") return `Quarterly (day ${d})`;
  return f;
}

export default function RecurringRules() {
  const [rules, setRules] = useState([]);
  const [clients, setClients] = useState({});
  const [staff, setStaff] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [r, c, s] = await Promise.all([listRules(), listClients(), listStaff()]);
    setRules(r);
    setClients(Object.fromEntries(c.map((x) => [x.id, x])));
    setStaff(Object.fromEntries(s.map((x) => [x.id, x])));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const c = clients[r.client_id];
    return (
      r.task_name.toLowerCase().includes(q) ||
      (c?.name || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q)
    );
  });

  const remove = async (r) => {
    if (!confirm(`Delete rule "${r.task_name}"?`)) return;
    await deleteRule(r.id);
    toast.success("Rule deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            Automation Engine
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Recurring Task Rules
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define the cadence once — task instances auto-generate each day.
            <span className="font-medium text-slate-700"> {rules.length}</span> rule
            {rules.length === 1 ? "" : "s"} configured.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          data-testid="btn-add-rule"
          className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Recurring Rule
        </Button>
      </div>

      {/* Cadence summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["daily", "weekly", "monthly", "quarterly"].map((f) => {
          const count = rules.filter((r) => r.frequency === f && r.active).length;
          return (
            <div
              key={f}
              className="p-3 rounded-lg border border-slate-200 bg-white"
              data-testid={`cadence-card-${f}`}
            >
              <div className="th-caps mb-1">{f} cadence</div>
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-[11px] text-slate-500">active rules</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search rule by task, client, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="rules-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={rules.length === 0 ? "No recurring rules yet" : "No matches"}
          description={
            rules.length === 0
              ? "Create a rule (e.g. GSTR-1 monthly on day 11 for ABC Ltd) and it will spawn tasks automatically."
              : "Adjust your search to find a rule."
          }
          action={
            rules.length === 0 && (
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add first rule
              </Button>
            )
          }
          testId="empty-rules"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th-caps text-left px-4 py-2">Client</th>
                <th className="th-caps text-left px-3 py-2">Task</th>
                <th className="th-caps text-left px-3 py-2">Category</th>
                <th className="th-caps text-left px-3 py-2">Cadence</th>
                <th className="th-caps text-left px-3 py-2">Staff</th>
                <th className="th-caps text-left px-3 py-2">Priority</th>
                <th className="th-caps text-left px-3 py-2">Active</th>
                <th className="th-caps text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  data-testid={`rule-row-${r.id}`}
                  className="border-t border-slate-100 tr-hover"
                >
                  <td className="px-4 py-3">
                    <div className="text-slate-900 font-medium">
                      {clients[r.client_id]?.name || "—"}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {clients[r.client_id]?.code}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-800">{r.task_name}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700 text-xs">{formatCadence(r)}</td>
                  <td className="px-3 py-3">
                    <StaffAvatar staff={staff[r.assigned_staff_id]} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={r.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      checked={r.active}
                      onCheckedChange={async (v) => {
                        await updateRule(r.id, { ...r, active: v });
                        load();
                      }}
                      data-testid={`rule-active-toggle-${r.id}`}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      className="text-slate-500 hover:text-slate-800 mr-2"
                      onClick={() => {
                        setEditing(r);
                        setDialogOpen(true);
                      }}
                      data-testid={`rule-edit-${r.id}`}
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(r)}
                      data-testid={`rule-delete-${r.id}`}
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRule={editing}
        onSaved={load}
      />
    </div>
  );
}
