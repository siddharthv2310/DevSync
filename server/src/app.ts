import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { notFound } from './common/handlers/notFound.js';
import { errorHandler } from './common/handlers/errorHandelers.js';
import { ApiErrors } from './common/errors/ApiErrors.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin : "http://localhost:5173",
    credentials : true,
}))

app.use(compression());
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({extended:true}));



app.get("/" , (req,res)=>{
    res.status(200).json({
        success: true ,
        message : " DevSync app is running "
    })
})

app.get("/test" , (req,res)=>{
    throw new ApiErrors(401 , "unathorised");
})

app.use(notFound);

app.use(errorHandler);

export default app;

