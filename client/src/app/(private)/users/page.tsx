"use client";

import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { 
  useDeleteUserMutation, 
  useGetUsersQuery, 
  useUpdateUserMutation, 
  useUpdateUserRoleMutation 
} from "@/app/state/api";
import { useUser } from "@clerk/nextjs";
import { Role } from "@shared/dist/userRolesUtils";
import { UserActions } from "@/app/(components)/users/UserAction";
import { toast } from "sonner";
import { EditUserDialog, getLocationLabel } from "@/app/(components)/users/EditUserDialog";
import { RouteGuard } from "@/app/(components)/auth/RouteGaurd";
import { Can } from "@/app/(components)/auth/Can";
import { PERMS } from "@shared/dist";
import { useAuth } from "@/app/hooks/useAuth";

export default function UsersPage() {
  const { user: clerkUser } = useUser();
  const theme = useTheme();
  //const { can } = useAuth();

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<any | null>(null);

  // ✅ Fetch users - RTKQ will handle caching and deduplication
  const { data: users = [], isLoading, isError } = useGetUsersQuery()

  const [updateUserRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [updateUser, { isLoading: isChanging }] = useUpdateUserMutation();

  // Get the current logged-in user's role from the users list
  const currentUserData = users.find((u) => u.clerkId === clerkUser?.id);
  const currentUserRole = (currentUserData?.role as Role) || Role.viewer;

  const handleUpdateUserRole = async (userId: string, newRole: Role) => {
    const toastId = toast.loading("Updating role...");

    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap();
      toast.success("Updated user role", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.error || "Failed to update user", { id: toastId });
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditingUser(null);
  };

  const handleSaveUserEdits = async (
    userId: string,
    updates: { name?: string; location?: string }
  ) => {
    const toastId = toast.loading("Updating user...");

    try {
      const updatedUser = await updateUser({ id: userId, ...updates }).unwrap();

      const parts: string[] = [];

      if (updates.name !== undefined) {
        parts.push(`Name → ${updatedUser.name ?? "(empty)"}`);
      }
      if (updates.location !== undefined) {
        parts.push(`Location → ${updatedUser.location ?? "(empty)"}`);
      }

      const label = updatedUser.name ?? updatedUser.email;
      const msg = parts.length ? parts.join(" • ") : "Updated";
      toast.success(`${label}: ${msg}`, { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.error || "Failed to update user", { id: toastId });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const toastId = toast.loading("Deleting user...");
    
    try {
      await deleteUser(userId).unwrap();
      toast.success("Successfully deleted user", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.error || "Failed to delete user", { id: toastId });
    }
  };

  const rows = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    location: u.location,
    lastLogin: u.lastLogin,
    clerkId: u.clerkId,
  }));

  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 10,
  });

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1.2,
      minWidth: 200,
      align: "left",
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={600}>{params.row.name || "No name"}</Typography>
        </Box>
      ),
    },
    {
      field: "id",
      headerName: "User ID",
      flex: 0.7,
      minWidth: 150,
      align: "left",
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={600} variant="body2" sx={{ fontFamily: 'monospace' }}>
            {params.row.id.substring(0, 12)}...
          </Typography>
        </Box>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 240,
      align: "left",
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Typography
          fontWeight={600}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: theme.palette.mode === "dark" ? "#1e3a8a" : "#EEF2FF",
            color: theme.palette.mode === "dark" ? "#93c5fd" : "#3730A3",
            fontSize: "0.85rem",
            textTransform: "capitalize",
          }}
        >
          {params.row.role}
        </Typography>
      ),
    },
    {
      field: "location", 
      headerName: "Location",
      flex: 0.5,
      sortable: true,
      filterable: true,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: 500,
            color: theme.palette.text.secondary,
          }}
        >
          {getLocationLabel(params.row.location)}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.5,
      minWidth: 130,
      sortable: false,
      filterable: false,
      headerAlign: "right",
      align: "right",
      renderCell: (params) => (
        // ✅ Only show action buttons if user has WRITE permission
        <Can perm={PERMS.WRITE_USERS}>
          <div className="flex justify-end w-full">
            <UserActions
              user={params.row}
              currentUserRole={currentUserRole}
              onUpdateRole={handleUpdateUserRole}
              onDelete={handleDeleteUser}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
              onEdit={handleOpenEdit} 
            />
          </div>
        </Can>
      ),
    },
  ];

  return (
    // ✅ Page-level guard - triggers 404 if user lacks permission
    <>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Users
        </Typography>

        <Card sx={{ borderRadius: "16px", boxShadow: 3 }}>
          <CardHeader
            title={<Typography fontWeight={700}>Users Table</Typography>}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          />
          <CardContent>
            {isLoading && <Typography>Loading users...</Typography>}
            {isError && (
              <Typography color="error">
                Failed to load users from database.
              </Typography>
            )}

            {!isLoading && !isError && (
              <div style={{ width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  autoHeight
                  rowHeight={64}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  pageSizeOptions={[5, 10, 25]}
                  disableRowSelectionOnClick
                  getRowId={(r) => r.id}
                  sx={{
                    border: 0,
                    borderRadius: 2,
                    fontSize: "0.9rem",
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor:
                        theme.palette.mode === "dark" ? "#334155" : "#f0fdfa",
                    },
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </Container>

      <EditUserDialog
        open={editOpen}
        onOpenChange={handleDialogChange}
        user={editingUser}
        saving={isChanging}
        onSave={handleSaveUserEdits}
      />
    </>
  );
}