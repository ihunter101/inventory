"use client";

import * as React from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ComboOption } from "@/app/(components)/purchase-order/utils/po";

type Props = {
  /** The currently selected option's `value` (usually an ID). */
  value: string;

  /**
   * Called when the user selects a new option.
   * IMPORTANT: This component will call `onChange` with the option's `value` (the ID),
   * not the label.
   */
  onChange: (value: string) => void;

  /**
   * The list of selectable options.
   * Each option has:
   * - `value`: the internal key (usually a database ID)
   * - `label`: the human-readable text shown in the UI (usually the name)
   *
   * Example:
   *   { value: "cmiz3...", label: "Grey Top Tubes" }
   */
  options: ComboOption[];

  /** Text shown when no option is selected. */
  placeholder?: string;

  /** If true, the user can create a new option by typing a new label. */
  allowCreate?: boolean;

  /**
   * Called when the user chooses to create a new option.
   * Receives the typed text (label) and must return a new option:
   *   { value: "newId", label: "User typed name" }
   *
   * After creation, this component will automatically select it by calling:
   *   onChange(created.value)
   */
  onCreate?: (label: string) => Promise<ComboOption>;

  /** Optional extra classes for styling the trigger button. */
  className?: string;

  /** Disables the entire combobox. */
  disabled?: boolean;
};

/**
 * ComboSelect (Searchable Dropdown / Combobox)
 * -------------------------------------------
 * This component displays a searchable list of options, and lets the user pick one.
 *
 * The key rule:
 * - `value` is the *internal* identifier of the selected option (usually an ID).
 * - The component uses that `value` to FIND the matching option in `options`.
 * - Once it finds it, it DISPLAYS the option's `label` to the user.
 *
 * How it displays the selected label:
 *   const selected = options.find(opt => opt.value === value)
 *   show: selected.label
 *
 * That means:
 * - If you pass `value="cmiz3..."`, and an option exists:
 *     { value: "cmiz3...", label: "Grey Top Tubes" }
 *   the button will show "Grey Top Tubes".
 *
 * - If you pass `value="Grey Top Tubes"` (a label) instead of the ID,
 *   the find() will fail (because it compares against opt.value),
 *   so it will show the placeholder.
 */
export function ComboSelect({
  value,
  onChange,
  options,
  placeholder,
  allowCreate = false,
  onCreate,
  className = "",
  disabled = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Find the currently selected option by matching the "value" (ID) you passed in.
  // If it exists, we can show its label (name) in the button.
  const selected = options.find((opt) => opt.value === value);

  /**
   * Filter options based on what the user types into the search box.
   * We match against `label` because labels are what humans search for.
   */
  const filtered = React.useMemo(() => {
    const s = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(s));
  }, [options, search]);

  /**
   * Show a "Create ..." option when:
   * - creation is allowed
   * - user typed something non-empty
   * - there is no exact label match already
   */
  const showCreate =
    allowCreate &&
    !!search.trim() &&
    !filtered.some((opt) => opt.label.toLowerCase() === search.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={`w-full justify-between h-11 text-base ${className}`}
        >
          {/* Show the selected label if we found the selected option; otherwise show placeholder */}
          {selected ? selected.label : placeholder || "Select..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border shadow-lg"
      >
        <Command className="bg-white">
          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
            className="h-11 bg-white"
          />

          <CommandList className="max-h-72 bg-white">
            <CommandEmpty className="bg-white">
              {showCreate ? "Press enter to create" : "No results found"}
            </CommandEmpty>

            <CommandGroup className="bg-white">
              {/* Clears selection by sending an empty value */}
              {value && (
                <CommandItem
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                    setSearch("");
                  }}
                  className="cursor-pointer bg-white hover:bg-slate-100 text-red-600"
                >
                  Clear selection
                </CommandItem>
              )}

              {/* Render filtered options */}
              {filtered.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    // IMPORTANT: we send opt.value (ID) back to the parent
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="cursor-pointer bg-white hover:bg-slate-100"
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === opt.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {opt.label}
                </CommandItem>
              ))}

              {/* Create new option if allowed */}
              {showCreate && onCreate && (
                <CommandItem
                  onSelect={async () => {
                    const label = search.trim();
                    const created = await onCreate(label);

                    // IMPORTANT: select the created option by sending its VALUE (ID)
                    onChange(created.value);

                    setOpen(false);
                    setSearch("");
                  }}
                  className="text-blue-600 cursor-pointer bg-white hover:bg-slate-100"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{search}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
