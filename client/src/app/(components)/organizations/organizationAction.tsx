"use client";

import * as React from "react";
import MoreHorizontalIcon from "@mui/icons-material/MoreHoriz";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { InviteOrganizationDialog } from "./InviteOrganizationDialog";

type Props = {
  organizationId: string;
  organizationName: string;
};

export function OrganizationActions({
  organizationId,
  organizationName,
}: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const menuOpen = Boolean(anchorEl);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreHorizontalIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setInviteOpen(true);
          }}
        >
          <ListItemIcon>
            <MailOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Invite by Email</ListItemText>
        </MenuItem>
      </Menu>

      <InviteOrganizationDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </>
  );
}