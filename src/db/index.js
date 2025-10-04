import mongoose from "mongoose";
import { DBName } from "../constants.js";

const connectDB=async ()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DBName}`)

        console.log("connection completed",connectionInstance.connections)
        
    } catch (error) {
        console.log("mongodb connection failed",error)
        process.exit(1)
    }
}

export default connectDB