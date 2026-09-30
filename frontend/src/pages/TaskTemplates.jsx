import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Repeat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/EmptyState";
import NewTemplateDialog from "@/components/dialogs/NewTemplateDialog";
import { PriorityBadge } from "@/components/StatusPill";
import {
  listTemplates,
  listAssignments,
  deleteTemplate,
  updateTemplate,
} from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatCadence(t) {
  const f = t.frequency;
  const d = t.day_of_period;
  if (f === "daily") return "Daily (Mon–Fri)";
  if (f === "weekly") return `Weekly (${DOW[Math.max(0, Math.min(6, d))]})`;
  if (f === "monthly") return `Monthly (day ${d})`;
  if (f === "quarterly") return `Quarterly (day ${d})`;
  return f;
}

export default function TaskTemplates() {
  const [templates, setTemplates] = useState([]);
  const [attachCounts, setAttachCounts] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [t, a] = await Promise.all([listTemplates(), listAssignments()]);
    setTemplates(t);
    const counts = {};
    a.forEach((x) => {
      counts[x.template_id] = (counts[x.template_id] || 0) + 1;
    });
    setAttachCounts(counts);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.task_name.toLowerCase().includes(q) ||
      (t.category || "").toLowerCase().includes(q)
    );
  });

  const remove = async (t) => {
    if (!confirm(`Delete template "${t.task_name}"? All client assignments using this template will also be removed.`))
      return;
    await deleteTemplate(t.id);
    toast.success("Template deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            Automation Engine · Global Master
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Standard Task Templates
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Client-agnostic task definitions. Attach them to specific clients in{" "}
            <Link to="/assignments" className="text-blue-700 hover:underline">
              Client Assignments
            </Link>
            .
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          data-testid="btn-add-template"
          className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Task Template
        </Button>
      </div>

      {/* Cadence summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["daily", "weekly", "monthly", "quarterly"].map((f) => {
          const count = templates.filter((t) => t.frequency === f && t.active).length;
          return (
            <div
              key={f}
              className="p-3 rounded-lg border border-slate-200 bg-white"
              data-testid={`cadence-card-${f}`}
            >
              <div className="th-caps mb-1">{f} cadence</div>
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-[11px] text-slate-500">active templates</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search template by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="templates-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={templates.length === 0 ? "No task templates yet" : "No matches"}
          description={
            templates.length === 0
              ? "Create your first template (e.g. GSTR-1 Filing, monthly on day 11) — then attach it to clients from Client Assignments."
              : "Adjust your search to find a template."
          }
          action={
            templates.length === 0 && (
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add first template
              </Button>
            )
          }
          testId="empty-templates"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th-caps text-left px-4 py-2">Task Name</th>
                <th className="th-caps text-left px-3 py-2">Category</th>
                <th className="th-caps text-left px-3 py-2">Cadence</th>
                <th className="th-caps text-left px-3 py-2">Default Priority</th>
                <th className="th-caps text-left px-3 py-2">SLA</th>
                <th className="th-caps text-left px-3 py-2">Attached</th>
                <th className="th-caps text-left px-3 py-2">Active</th>
                <th className="th-caps text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  data-testid={`template-row-${t.id}`}
                  className="border-t border-slate-100 tr-hover"
                >
                  <td className="px-4 py-3 text-slate-900 font-medium">{t.task_name}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-700 text-xs">{formatCadence(t)}</td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={t.default_priority} />
                  </td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{t.sla_notes || "—"}</td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs">
                    {attachCounts[t.id] || 0} client{(attachCounts[t.id] || 0) === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      checked={t.active}
                      onCheckedChange={async (v) => {
                        await updateTemplate(t.id, { ...t, active: v });
                        load();
                      }}
                      data-testid={`template-active-toggle-${t.id}`}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      className="text-slate-500 hover:text-slate-800 mr-2"
                      onClick={() => {
                        setEditing(t);
                        setDialogOpen(true);
                      }}
                      data-testid={`template-edit-${t.id}`}
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(t)}
                      data-testid={`template-delete-${t.id}`}
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

      <NewTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTemplate={editing}
        onSaved={load}
      />
    </div>
  );
}
