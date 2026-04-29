"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  useCreateOrganizationMutation,
  useGetAvailableOrganizationCustomersQuery,
} from "@/app/state/api";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateOrganizationDialog({ open, onOpenChange }: Props) {
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [customName, setCustomName] = React.useState("");

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetAvailableOrganizationCustomersQuery(undefined, {
    skip: !open,
  });

  const [createOrganization, { isLoading: isCreating }] =
    useCreateOrganizationMutation();

  const customers = data?.customers ?? [];

  const selectedCustomer = customers.find(
    (customer) => customer.customerId === selectedCustomerId
  );

  const handleClose = () => {
    setSelectedCustomerId("");
    setCustomName("");
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }

    const toastId = toast.loading("Creating organization...");

    try {
      await createOrganization({
        customerId: selectedCustomerId,
        name: customName.trim() || undefined,
      }).unwrap();

      toast.success("Organization created successfully", { id: toastId });
      handleClose();
      refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.data?.message || "Failed to create organization",
        { id: toastId }
      );
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Organization</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a QuickBooks customer to turn into a portal organization.
          Customers already linked to an organization will not appear here.
        </Typography>

        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography>Loading available customers...</Typography>
          </Box>
        )}

        {isError && (
          <Typography color="error">
            Failed to load available customers.
          </Typography>
        )}

        {!isLoading && !isError && (
          <>
            <TextField
              select
              fullWidth
              label="QuickBooks Customer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              sx={{ mt: 1 }}
            >
              {customers.map((customer) => (
                <MenuItem key={customer.customerId} value={customer.customerId}>
                  {customer.companyName || customer.name}
                  {customer.email ? ` — ${customer.email}` : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Organization Name"
              placeholder={
                selectedCustomer
                  ? selectedCustomer.companyName || selectedCustomer.name
                  : "Optional custom organization name"
              }
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              sx={{ mt: 2 }}
            />

            {customers.length === 0 && (
              <Typography sx={{ mt: 2 }} color="text.secondary">
                No available customers. Every QuickBooks customer may already be
                linked to an organization.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={isCreating || !selectedCustomerId}
        >
          {isCreating ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}