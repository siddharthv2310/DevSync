import {Request , Response ,NextFunction} from "express";
import { createOrganizationSchema, organizationMembersQuerySchema, transferOwnershipSchema, updateMemberRoleSchema } from "./organizationvalidation.js";
import * as organizationServices from "./organizationServices.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { OrganizationRole } from "@prisma/client";

export const createOrganizationController = async (req:Request , res:Response , next:NextFunction)=>{
    const validatedData = createOrganizationSchema.safeParse(req.body);
    if(!validatedData.success){
        return res.status(400).json({
            success:false,
            message:"Invalid data",
            error:validatedData.error.flatten(),
        });
    }
    try{
        const userId = req.user?.userId;
        if(!userId){
            throw new ApiErrors(404,"user not find");
        }
        const organization = await organizationServices.createOrganisation(userId , validatedData.data);

        return res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: organization,
        });

    }
    catch(error){
        next(error);
    }

}

export const getOrganizationsController = async(req:Request,res:Response , next:NextFunction)=>{
    try{
        const userId = req.user?.userId;

        if(!userId){
            throw new ApiErrors(404,"user not find");
        }

        const organisations = await organizationServices.getUserOrganizations(userId);

        return res.status(200).json({
            success : true,
            data : organisations,
        })
    }
    catch(error){
        next(error);
    }
}

export const getOrganizationInfo = async (req: Request, res: Response ) => {

    const organization = req.organization;
    const membership = req.organizationMember;

    if (!organization || !membership) {
        throw new ApiErrors(
            500,
            "Organization context is missing"
        );
    }

    return res.status(200).json({
        success: true,
        message: "Organization fetched successfully",
        data: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            description: organization.description,
            avatar: organization.avatar,
            isActive: organization.isActive,
            role: membership.role,
            joinedAt: membership.joinedAt,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
        }
    });
};

export const getOrganizationMembers = async(req:Request , res:Response ,next:NextFunction)=>{
    const organization = req.organization;

    if(!organization){
        throw new ApiErrors(500,"Organization context is missing");
    }

    const query = organizationMembersQuerySchema.parse(req.query );

    const result = await organizationServices.getOrganizationMembers(organization.id, query.page , query.limit);

    return res.status(200).json({
        success: true,
        message: "Organization members fetched successfully",
        data: result.members,
        pagination: result.pagination,
    });
};

export const updateMemberRole = async (req: Request, res: Response) => {
    const organizationId = req.params.organisationId as string;
    const userId  = req.params.userId as string;

    if(!organizationId || !userId){
        throw new ApiErrors(401,"organizationId and UserId required")
    }

    const data = updateMemberRoleSchema.parse(req.body);


    const actorUserId = req.user!.userId;

    const membership =
        await organizationServices.updateMemberRole(
            organizationId,
            actorUserId,
            userId,
            data.role as OrganizationRole
        );

    return res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        data: membership
    });
};

export const removeMember = async ( req: Request, res: Response) => {

    const organizationId = req.params.organisationId as string;
    const userId  = req.params.userId as string;

    const actorUserId = req.user!.userId;

    await organizationServices.removeMember(
        organizationId,
        actorUserId,
        userId
    );

    return res.status(200).json({
        success: true,
        message: "Member removed successfully"
    });
};

export const leaveOrganization = async(req:Request , res:Response ,next:NextFunction)=>{
    const organizationId = req.organization!.id;
    const userId = req.user!.userId;

    await organizationServices.leaveOrganization(organizationId , userId);

    return res.status(200).json({
        success: true,
        message: "You have left the organization successfully"
    });
}
export const transferOwnership = async(req:Request , res:Response ,next:NextFunction)=>{
    const organizationId = req.organization!.id;
    const currentOwnerId = req.user!.userId;

    const data = transferOwnershipSchema.parse(req.body);

    await organizationServices.transferOwnership(organizationId, currentOwnerId,data.userId);

    return res.status(200).json({
        success:true,
        message:"Ownership transferred successfully",
    });

}

