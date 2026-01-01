export enum Role {
  viewer= 'viewer',
  orderAgent = 'orderAgent',
  labStaff= "labStaff",
  inventoryClerk= 'inventoryClerk',
  admin= 'admin'
}

export const ROLE_HIERARCHY: Record<string, number> ={
  [Role.viewer]: 0,
  [Role.orderAgent]: 1,
  [Role.labStaff]: 2,
  [Role.inventoryClerk]: 3,
  [Role.admin]: 4,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.viewer]: 'viewer',
  [Role.orderAgent]: 'orderAgent',
  [Role.labStaff]: 'labStaff',
  [Role.inventoryClerk]: 'inventoryClerk',
  [Role.admin]: 'admin',
};

export function canModifyUserRole(
  actorRole: Role,
  targetRole: Role,
  newRole: Role
): { canModify: boolean; reason?: string } {
  const actorLevel = ROLE_HIERARCHY[actorRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  const newLevel = ROLE_HIERARCHY[newRole];

  // 1. ADMIN LOGIC
  // Admin can do anything (Update info, Change roles, etc.)
  if (actorRole === Role.admin) {
    return { canModify: true };
  }

  // 2. INVENTORY CLERK LOGIC
  if (actorRole === Role.inventoryClerk) {
    // Cannot delete or modify an Admin or another Inventory Clerk
    // (Must only modify those with a STRICTLY LOWER level)
    if (targetLevel >= actorLevel) {
      return { 
        canModify: false, 
        reason: "Inventory Clerks cannot modify Admins or other Inventory Clerks" 
      };
    }

    // Promotion Rule: Can promote roles, but NOT to Inventory Clerk or Admin
    if (newLevel >= actorLevel) {
      return { 
        canModify: false, 
        reason: "You cannot promote a user to your own level or higher" 
      };
    }

    return { canModify: true };
  }

  // 3. DEFAULT (Viewer/Staff/Order Agent)
  return { canModify: false, reason: "Insufficient permissions to modify users" };
}

export function getAvailableRoles(actorRole: Role, targetRole: Role): Role[] {
  const roles = Object.values(Role);

  if (actorRole === Role.admin) {
    // Admin can see all roles to assign
    return roles;
  }

  if (actorRole === Role.inventoryClerk) {
    // Inventory Clerk can only assign roles lower than themselves
    return roles.filter(r => ROLE_HIERARCHY[r] < ROLE_HIERARCHY[Role.inventoryClerk]);
  }

  return [];
}