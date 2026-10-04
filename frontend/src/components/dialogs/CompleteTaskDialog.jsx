import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CompleteTaskDialog({ task, client, staff, onClose, onConfirm }) {
  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white sm:max-w-md" data-testid="complete-task-dialog">
        <DialogHeader>
          <DialogTitle>Who completed this task?</DialogTitle>
          <DialogDescription>
            {task ? task.task_name : ""}
            {client ? " - " + client.name : ""}
            <br />
            Selecting a staff name marks the task as completed.
          </DialogDescription>
        </DialogHeader>
        <Select
          value=""
          onValueChange={(id) => {
            const t = task;
            onClose();
            onConfirm(t, id);
          }}
        >
          <SelectTrigger data-testid="complete-staff-select">
            <SelectValue placeholder="Select staff name" />
          </SelectTrigger>
          <SelectContent>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  );
}
