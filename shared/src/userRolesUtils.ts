export enum Role {
  viewer = "viewer",
  clientUser = "clientUser",
  clientAdmin = "clientAdmin",
  orderAgent = "orderAgent",
  labStaff = "labStaff",
  staffLead = "staffLead",
  adminLead = "adminLead",
  inventoryClerk = "inventoryClerk",
  admin = "admin",
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.viewer]: 0,
  [Role.clientUser]: 1,
  [Role.clientAdmin]: 2,
  [Role.orderAgent]: 3,
  [Role.labStaff]: 4,
  [Role.staffLead]: 5,
  [Role.adminLead]: 6,
  [Role.inventoryClerk]: 7,
  [Role.admin]: 8,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.viewer]: "Viewer",
  [Role.clientUser]: "Client User",
  [Role.clientAdmin]: "Client Admin",
  [Role.orderAgent]: "Order Agent",
  [Role.labStaff]: "Lab Staff",
  [Role.staffLead]: "Staff Lead",
  [Role.adminLead]: "Admin Lead",
  [Role.inventoryClerk]: "Inventory Clerk",
  [Role.admin]: "Admin",
};

export const CLIENT_ROLES: Role[] = [
  Role.clientUser,
  Role.clientAdmin,
];

export const INTERNAL_ROLES: Role[] = [
  Role.viewer,
  Role.orderAgent,
  Role.labStaff,
  Role.staffLead,
  Role.adminLead,
  Role.inventoryClerk,
  Role.admin,
];

export function isClientRole(role: Role): boolean {
  return CLIENT_ROLES.includes(role);
}

export function isInternalRole(role: Role): boolean {
  return INTERNAL_ROLES.includes(role);
}

export function canModifyUserRole(
  actorRole: Role,
  targetRole: Role,
  newRole: Role
): { canModify: boolean; reason?: string } {
  const actorLevel = ROLE_HIERARCHY[actorRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  const newLevel = ROLE_HIERARCHY[newRole];

  if (
    actorLevel === undefined ||
    targetLevel === undefined ||
    newLevel === undefined
  ) {
    return {
      canModify: false,
      reason: "Unknown role",
    };
  }

  // Full admin can manage everyone.
  if (actorRole === Role.admin) {
    return { canModify: true };
  }

  // Inventory clerk can manage operational users below them,
  // but not admins, inventory clerks, or full admin.
  if (actorRole === Role.inventoryClerk) {
    if (targetLevel >= actorLevel) {
      return {
        canModify: false,
        reason:
          "Inventory Clerks cannot modify Admins or other Inventory Clerks",
      };
    }

    if (newLevel >= actorLevel) {
      return {
        canModify: false,
        reason: "You cannot assign your own role level or higher",
      };
    }

    return { canModify: true };
  }

  // Admin Lead = front desk / admin operations.
  // Can manage client users and basic lower-level users,
  // but should not manage staff leads, inventory clerks, or admins.
  if (actorRole === Role.adminLead) {
    const allowedNewRoles: Role[] = [
      Role.viewer,
      Role.clientUser,
      Role.clientAdmin,
      Role.orderAgent,
      Role.labStaff,
    ];

    const canManageTarget =
      targetRole === Role.viewer ||
      targetRole === Role.clientUser ||
      targetRole === Role.clientAdmin ||
      targetRole === Role.orderAgent ||
      targetRole === Role.labStaff;

    if (!canManageTarget) {
      return {
        canModify: false,
        reason:
          "Admin Leads can only modify clients, viewers, order agents, and lab staff",
      };
    }

    if (!allowedNewRoles.includes(newRole)) {
      return {
        canModify: false,
        reason:
          "Admin Leads cannot assign Staff Lead, Inventory Clerk, or Admin roles",
      };
    }

    return { canModify: true };
  }

  // Everyone else cannot change roles.
  return {
    canModify: false,
    reason: "Insufficient permissions to modify users",
  };
}

export function getAvailableRoles(actorRole: Role, targetRole?: Role): Role[] {
  if (actorRole === Role.admin) {
    return Object.values(Role);
  }

  if (actorRole === Role.inventoryClerk) {
    return Object.values(Role).filter(
      (role) => ROLE_HIERARCHY[role] < ROLE_HIERARCHY[Role.inventoryClerk]
    );
  }

  if (actorRole === Role.adminLead) {
    return [
      Role.viewer,
      Role.clientUser,
      Role.clientAdmin,
      Role.orderAgent,
      Role.labStaff,
    ];
  }

  return [];
}