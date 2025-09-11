"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ComboOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  allowCreate?: boolean;
  /** Called when user picks "Add …" */
  onCreate?: (label: string) => Promise<ComboOption> | ComboOption;
  className?: string;
};

export default function ComboSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  allowCreate,
  onCreate,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const canCreate = allowCreate && query.trim().length > 0 && !options.some(o => o.label.toLowerCase() === query.trim().toLowerCase());

  async function handleCreate() {
    if (!onCreate || !canCreate) return;
    const created = await onCreate(query.trim());
    // IMPORTANT: onCreate should also update the upstream options
    // but we defensively set the chosen value here.
    onChange(created.value);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("mt-2 w-full justify-between", className)}
        >
          {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* OPAQUE popover: bg-white, solid border, shadow */}
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 bg-white border shadow-lg"
        align="start"
      >
        <Command loop>
          <CommandInput
            placeholder="Search…"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <ScrollArea className="max-h-60">
              <CommandGroup>
                {canCreate && (
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={handleCreate}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add “{query}”
                  </CommandItem>
                )}

                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    // Clear, premium hover
                    className="cursor-pointer hover:bg-slate-100 data-[selected=true]:bg-slate-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
