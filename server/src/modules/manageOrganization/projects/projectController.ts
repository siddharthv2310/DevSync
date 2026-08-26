import {Request,Response ,NextFunction} from "express";
import * as projectServices from "./projectServices.js";
import { createProjectSchema } from "./projectValidator.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

export const createProjectController = async(req:Request , res:Response)=>{
    const result =  createProjectSchema.safeParse(req.body);
    
    if(!result.success){
        throw new ApiErrors(404 , "invalid data process");
    }

    const organizationId = req.params.organizationId as string;

    const userId = req.user!.userId;

    const project = await projectServices.createProject( organizationId, userId, result.data);

return res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project
});

};