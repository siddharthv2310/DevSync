import {Request , Response ,NextFunction} from "express";
import { createOrganizationSchema } from "./organizationvalidation.js";
import * as organizationServices from "./organizationServices.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

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