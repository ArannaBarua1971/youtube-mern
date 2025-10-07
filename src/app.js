import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true //FIXME: not understand
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public")) //FIXME: not understand
app.use(cookieParser()) //FIXME: half understand

// routes related work
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/user",userRouter)

export {app}