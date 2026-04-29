"use client";

import * as React from "react";
import { Button } from "@mui/material";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";

export function CreateOrganizationButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddBusinessIcon />}
        onClick={() => setOpen(true)}
      >
        Create Organization
      </Button>

      <CreateOrganizationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
