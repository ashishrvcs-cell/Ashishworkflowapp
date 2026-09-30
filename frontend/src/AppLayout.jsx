import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Repeat,
  Network,
  Plus,
  Zap,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import NewTaskDialog from "@/components/dialogs/NewTaskDialog";
import { generateToday } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Morning Cockpit", icon: LayoutDashboard, testId: "nav-morning-cockpit" },
  { to: "/today", label: "Today's Work", icon: ListChecks, testId: "nav-todays-work" },
  { to: "/clients", label: "Client Master", icon: Users, testId: "nav-client-master" },
  { to: "/templates", label: "Task Templates", icon: Repeat, testId: "nav-task-templates" },
  { to: "/assignments", label: "Client Assignments", icon: Network, testId: "nav-client-assignments" },
];

export default function AppLayout() {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    try {
      const res = await generateToday();
      if (res.created > 0) {
        toast.success(`Generated ${res.created} task${res.created === 1 ? "" : "s"} for today`);
      } else {
        toast.info(`No new tasks to generate (${res.skipped_existing} already exist)`);
      }
      navigate("/today");
      window.dispatchEvent(new CustomEvent("ledgerflow:refresh"));
    } catch (e) {
      toast.error("Failed to generate tasks");
    }
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B1E3F] flex flex-col shrink-0 fixed h-screen">
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <div className="text-white font-semibold tracking-tight text-[15px]">Ashish</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Team Work Flow</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                data-testid={item.testId}
                className={({ isActive }) => `sb-item ${isActive ? "sb-item-active" : ""}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Practice sync active
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">
              Ashish · Team Work Flow
            </h1>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              {todayLabel}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              data-testid="btn-generate-todays-work"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Generate Today&apos;s Work
            </Button>
            <Button
              size="sm"
              onClick={() => setNewTaskOpen(true)}
              data-testid="btn-new-task"
              className="bg-[#0B1E3F] hover:bg-[#132D5E] text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Task
            </Button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </div>
  );
}
