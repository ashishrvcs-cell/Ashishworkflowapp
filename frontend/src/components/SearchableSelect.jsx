import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Type-to-search dropdown. Options are sorted A-Z and grouped under letter headings.
// options: [{ value, label, sortKey?, disabled? }]
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Type to search...",
  disabled = false,
  testId,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const keyOf = (o) => (o.sortKey || o.label || "").trim();
  const sorted = [...options].sort((a, b) =>
    keyOf(a).localeCompare(keyOf(b), undefined, { sensitivity: "base", numeric: true })
  );
  const groups = [];
  sorted.forEach((o) => {
    const ch = keyOf(o).charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(ch) ? ch : "#";
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(o);
    else groups.push({ letter, items: [o] });
  });
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-testid={testId}
          className={
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm disabled:cursor-not-allowed disabled:opacity-50 " +
            className
          }
        >
          <span className={"truncate " + (selected ? "" : "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 bg-white"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[260px]">
            <CommandEmpty>No match found.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.letter} heading={g.letter}>
                {g.items.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    disabled={o.disabled}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={"mr-2 h-4 w-4 " + (o.value === value ? "opacity-100" : "opacity-0")}
                    />
                    <span className="text-xs">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
