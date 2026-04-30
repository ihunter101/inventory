"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { toast } from "sonner";
import { useCreateOrganizationInviteMutation } from "@/app/state/api";

type InviteRole = "clientUser" | "clientAdmin";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
};

export function InviteOrganizationDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("clientUser");
  const [inviteLink, setInviteLink] = React.useState("");

  const [createInvite, { isLoading }] = useCreateOrganizationInviteMutation();

  const handleClose = () => {
    setEmail("");
    setRole("clientUser");
    setInviteLink("");
    onOpenChange(false);
  };

  const handleCreateInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    const toastId = toast.loading("Creating invite...");

    try {
      const result = await createInvite({
  organizationId,
  email: email.trim(),
  role,
}).unwrap();

setInviteLink(result.inviteLink);

toast.success(
  result.emailSent
    ? "Invite email sent successfully"
    : "Invite created, but email failed. Copy the link manually.",
  { id: toastId }
);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.message || "Failed to create invite", {
        id: toastId,
      });
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied");
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite Client</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Send an invite for <strong>{organizationName}</strong>. When the
          client accepts the invite, their account will be attached to this
          organization automatically.
        </Typography>

        <TextField
          fullWidth
          label="Client email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          fullWidth
          label="Client role"
          value={role}
          onChange={(e) => setRole(e.target.value as InviteRole)}
        >
          <MenuItem value="clientUser">Client User</MenuItem>
          <MenuItem value="clientAdmin">Client Admin</MenuItem>
        </TextField>

        {inviteLink && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Typography fontWeight={700} sx={{ mb: 1 }}>
              Invite Link
            </Typography>

            <Typography
              variant="body2"
              sx={{
                wordBreak: "break-all",
                fontFamily: "monospace",
                mb: 1.5,
              }}
            >
              {inviteLink}
            </Typography>

            <Button size="small" variant="outlined" onClick={handleCopy}>
              Copy Link
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>

        <Button
          variant="contained"
          onClick={handleCreateInvite}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Invite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}