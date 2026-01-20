"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Option A: if you can import Prisma enum on the client:
// import { Location } from "@prisma/client";

// Option B: mirror the enum here or in shared
export enum Location {
  Tapion = "Tapion",
  blueCoral = "blueCoral",
  manoelStreet = "manoelStreet",
  sunnyAcres = "sunnyAcres",
  emCare = "emCare",
  RodneyBay = "RodneyBay",
  memberCare = "memberCare",
  vieuxFort = "vieuxFort",
  soufriere = "soufriere",
  other = "other",
}

// nice labels for UI
const LOCATION_LABELS: Record<Location, string> = {
  [Location.Tapion]: "Tapion",
  [Location.blueCoral]: "Blue Coral",
  [Location.manoelStreet]: "Manoel Street",
  [Location.sunnyAcres]: "Sunny Acres",
  [Location.emCare]: "EM Care",
  [Location.RodneyBay]: "Rodney Bay",
  [Location.memberCare]: "Member Care",
  [Location.vieuxFort]: "Vieux Fort",
  [Location.soufriere]: "Soufriere",
  [Location.other]: "Other",
};

type EditUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string | null; email: string; location: Location } | null;
  saving?: boolean;
  onSave: (userId: string, updates: { name?: string; location?: Location }) => void | Promise<void>;
};

export function getLocationLabel(location: Location | string): string {
  return LOCATION_LABELS[location as Location] || location;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  saving = false,
  onSave,
}: EditUserDialogProps) {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState<Location>(Location.other);

  React.useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setLocation(user.location ?? Location.other);
  }, [user]);

  const buildUpdates = () => {
    if (!user) return {};
    const updates: { name?: string; location?: Location } = {};

    const trimmedName = name.trim();

    if (trimmedName !== (user.name ?? "")) updates.name = trimmedName;
    if (location !== user.location) updates.location = location;

    return updates;
  };

  const handleSave = async () => {
    if (!user) return;

    const updates = buildUpdates();

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    await onSave(user.id, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit user</DialogTitle>
          {user && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hunter Gaillard"
            />
          </div>

          <div className="grid gap-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={(v) => setLocation(v as Location)} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Location).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {LOCATION_LABELS[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !user}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
