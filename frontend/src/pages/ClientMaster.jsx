import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/EmptyState";
import NewClientDialog from "@/components/dialogs/NewClientDialog";
import StaffDialog from "@/components/dialogs/StaffDialog";
import StaffAvatar from "@/components/StaffAvatar";
import {
  listClients,
  listStaff,
  listAssignments,
  deleteClient,
  updateClient,
} from "@/lib/api";
import { toast } from "sonner";

export default function ClientMaster() {
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState({});
  const [ruleCounts, setRuleCounts] = useState({});
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffDialog, setStaffDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [cl, st, as] = await Promise.all([listClients(), listStaff(), listAssignments()]);
    setClients(cl);
    setStaff(Object.fromEntries(st.map((s) => [s.id, s])));
    const counts = {};
    as.forEach((r) => {
      counts[r.client_id] = (counts[r.client_id] || 0) + 1;
    });
    setRuleCounts(counts);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.category || "").toLowerCase().includes(q)
    );
  });

  const remove = async (c) => {
    if (!confirm(`Delete client ${c.name}?`)) return;
    await deleteClient(c.id);
    toast.success("Client deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
            Client Portfolio Engine
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Client Master & Allocation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {clients.length} client{clients.length === 1 ? "" : "s"} · {Object.keys(staff).length} team
            member{Object.keys(staff).length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStaffDialog(true)}
            data-testid="btn-manage-staff"
            className="border-slate-300"
          >
            <UserCog className="w-3.5 h-3.5 mr-1.5" />
            Manage Staff
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            data-testid="btn-add-client"
            className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Search by name, code, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="clients-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={clients.length === 0 ? "No clients yet" : "No matches"}
          description={
            clients.length === 0
              ? "Add your first client to begin allocating recurring work."
              : "Try clearing the search."
          }
          action={
            clients.length === 0 && (
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add first client
              </Button>
            )
          }
          testId="empty-clients"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th-caps text-left px-4 py-2">Code</th>
                <th className="th-caps text-left px-3 py-2">Name</th>
                <th className="th-caps text-left px-3 py-2">Category</th>
                <th className="th-caps text-left px-3 py-2">Main Staff</th>
                <th className="th-caps text-left px-3 py-2">Backup Staff</th>
                <th className="th-caps text-left px-3 py-2">Assignments</th>
                <th className="th-caps text-left px-3 py-2">Active</th>
                <th className="th-caps text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  data-testid={`client-row-${c.id}`}
                  className="border-t border-slate-100 tr-hover"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.code}</td>
                  <td className="px-3 py-3 text-slate-900 font-medium">{c.name}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {c.category || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StaffAvatar staff={staff[c.main_staff_id]} />
                  </td>
                  <td className="px-3 py-3">
                    <StaffAvatar staff={staff[c.backup_staff_id]} />
                  </td>
                  <td className="px-3 py-3 text-slate-700 font-mono text-xs">
                    {ruleCounts[c.id] || 0}
                  </td>
                  <td className="px-3 py-3">
                    <Switch
                      checked={c.active}
                      onCheckedChange={async (v) => {
                        await updateClient(c.id, { ...c, active: v });
                        load();
                      }}
                      data-testid={`client-active-toggle-${c.id}`}
                    />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      className="text-slate-500 hover:text-slate-800 mr-2"
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                      data-testid={`client-edit-${c.id}`}
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(c)}
                      data-testid={`client-delete-${c.id}`}
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

      <NewClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editClient={editing}
        onSaved={load}
      />
      <StaffDialog open={staffDialog} onOpenChange={setStaffDialog} />
    </div>
  );
}
