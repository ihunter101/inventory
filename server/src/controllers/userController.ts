import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { Role, canModifyUserRole, ROLE_HIERARCHY } from "@lab/shared/userRoleUtils";

//const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                lastLogin: true,
                onboardedAt: true,
                clerkId: true,
            },
            orderBy: {
                onboardedAt: "desc"
            },
        });
        res.json(users) 
    } catch (error) {
        res.status(500).json({ message: "Error retreiving users."})
    }
}


export const getUserById = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;

        const user = await prisma.users.findUnique({
            where: {id},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
                createdAt: true,
                lastLogin: true,
                onboardedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
    } catch (e) {
        console.error(e)
        return res.status(500).json({error: "Failed to fetch user"})
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const {id} = req.params;
        const { name, location } = req.body;

        const auth = (req as any).auth as {userId: string}
        const actorClerkId = auth.userId;
    

    const actor = await prisma.users.findUnique({
        where: { clerkId: actorClerkId},
        select: { role: true }
    });

    if (!actor) {
        return res.status(401).json({ error: "unauthorized"})
    }

    const targetUser = await prisma.users.findUnique({
        where: { id },
        select: {role: true}
    });
    
    if (!targetUser) {
        return res.status(404).json({ error: "user not found"})
    }

    //Check if actor can modify targeted user
    const {canModify, reason} = canModifyUserRole(
        actor.role as Role,
        targetUser.role as Role,
        targetUser.role as Role
    );

    if (!canModify) {
        return res.status(403).json({error: reason || "Insufficient Permissions"})
    }

    const updated = await prisma.users.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(location !== undefined ? { location } : {}),
            },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            location:true,
        }
    });

    return res.json(updated);
} catch (e) {
    console.error("Error updating user:" , e)
    return res.status(500).json({erro: "Failed to update user"})
}
}


export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const {id } = req.params;
        const { role: newRole }  = req.body

        if (!Object.values(Role).includes(newRole)){
            return res.status(400).json({ error: "invalid Role"})
        };

        const auth = (req as any).auth as {userId: string};
        const actorClerkId = auth.userId

        const actor = await prisma.users.findUnique({
            where: {clerkId: actorClerkId},
            select: { role: true }
        });

        if (!actor) {
            return res.status(401).json({error: "Unauthorized"})
        };

        const targetUser = await prisma.users.findUnique({
            where: { id },
            select: { role: true }
        });
        
        if (!targetUser) {
            return res.status(404).json({ error: "User not found"})
        };

        //check if actor can cahnge target user role to new Role

        const {canModify, reason } = canModifyUserRole(
            actor.role as Role,
            targetUser.role as Role,
            newRole as Role
        );

        if (!canModify) {
            return res.status(403).json({ error: reason || "Insufficient Permissions"})
        };

        const updated = await prisma.users.update({
            where: {id},
            data: { role: newRole },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                location: true,
            }
        });

        return res.json(updated);
    } catch (e) {
        console.error("Error updating user role: ", e)
        return res.status(500).json({error: "Failed to update user role"})
    }    
}


export const deleteUser = async (req: Request, res: Response) => {
    try {
        const {id} = req.params

        const auth = (req as any).auth as {userId: string};
        const actorClerkId = auth.userId

        const actor = await prisma.users.findUnique({
            where: {clerkId: actorClerkId},
            select: {
                role: true,
                id: true,
            },
        });

        if (!actor) {
            return res.status(401).json({error: "unauthorized"})
        }

        //user can not delete their own account
        if (actor.id === id ){
            return res.status(400).json({error: "Can not delete your own account"})
        }

        const targetUser = await prisma.users.findUnique({
            where: {id},
            select: { role: true }
        })

        if (!targetUser) {
            return res.status(404).json({ error: "User not found"})
        }

        //check if an actor can modify a target 

        const { canModify, reason } = canModifyUserRole(
            actor.role as Role,
            targetUser.role as Role,
            targetUser.role as Role,
        );

        if(!canModify) {
            return res.status(403).json({ error: reason || "Insufficient permission"})
        }

        await prisma.users.delete({
            where: {id }
        });

        return res.json({ sucess: true, message: "User delete successfully"})
    } catch (error) {
        console.error("Error deleting user: ", error)
        return res.status(500).json({ error: "Failed to delete user"})
    }
}

