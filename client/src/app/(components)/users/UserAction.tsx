"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Shield,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Role, ROLE_LABELS, getAvailableRoles, canModifyUserRole } from "@shared/dist/userRolesUtils";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  location: string;
};

type UserActionsProps = {
  user: User;
  currentUserRole: Role;
  onView?: (user: User) => void;
  onEdit?: (user: User ) => void;
  onUpdateRole: (userId: string, newRole: Role) => void | Promise<void>;
  onDelete: (userId: string) => void | Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
};

export function UserActions({
  user,
  currentUserRole,
  onView,
  onEdit,
  onUpdateRole,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: UserActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  // Copy the exact pattern from inventory
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const availableRoles = getAvailableRoles(currentUserRole, user.role);
  const { canModify } = canModifyUserRole(currentUserRole, user.role, user.role);

  const handleRoleChange = (newRole: Role) => {
    const check = canModifyUserRole(currentUserRole, user.role, newRole);
    if (check.canModify) {
      onUpdateRole(user.id, newRole);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-accent transition-colors"
            aria-label="Open actions"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          className="z-50 w-64 rounded-lg shadow-lg border-border/50"
          align="start"
          side="left"
          sideOffset={8}
          onClick={stop}
        >
          <DropdownMenuLabel className="px-3 py-2.5 text-sm font-semibold truncate text-foreground">
            {user.name || user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />

          {/* Role Management */}
          {canModify && availableRoles.length > 0 && (
            <div className="px-1 py-1.5">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  disabled={isUpdating}
                  className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/30 focus:bg-purple-50 dark:focus:bg-purple-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex items-center justify-center w-7 h-7 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-950/70 transition-colors">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Change Role</span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 rounded-lg">
                  {availableRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onSelect={() => handleRoleChange(role)}
                      className="cursor-pointer px-3 py-2 rounded-md"
                      disabled={role === user.role}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                        {role === user.role && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">current</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </div>
          )}

          {/* View & Edit */}
          <div className="px-1 py-1.5">
            <DropdownMenuItem
              disabled={!onView}
              onSelect={() => onView?.(user)}
              className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:bg-blue-50 dark:focus:bg-blue-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-950/70 transition-colors">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">View Details</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!onEdit || !canModify}
              onSelect={() => onEdit?.(user)}
              className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-accent focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-muted-foreground group-hover:bg-muted/80 transition-colors">
                  <Pencil className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Edit User</span>
              </div>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="bg-border/50" />

          {/* Delete */}
          <div className="px-1 py-1.5">
            <DropdownMenuItem
              disabled={isDeleting || !canModify}
              onSelect={() => setShowDeleteDialog(true)}
              className="px-3 py-2.5 rounded-md cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-md bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-950/70 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">Delete User</span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <strong className="text-foreground">{user.name || user.email}</strong>? 
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium mt-2 block">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(user.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700 rounded-md"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}