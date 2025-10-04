import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path:"./env"
})


connectDB()
    .then(()=>{
        app.on("error",(error)=>{
            console.log("server error",error)
        })
        app.listen(process.env.PORT || 8000,()=>{
            console.log(`server is listening in this port ${process.env.PORT}`)
        })
    })
    .catch((error)=> console.log("database connection failed",error))