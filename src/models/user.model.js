import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        unique:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    fullName:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    avater:{
        type:String,//FIXME: cloudinary image
        required:true 
    },
    coverImage:{
        type:String,//FIXME: cloudinary image
    },
    password:{
        type:String,
        required:true
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    refreshToken:{
        type:String,
    }
},{timestamps:true});

//for encrypt password
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next()
    
    this.password=await bcrypt.hash(this.password,10)
    next()
})

//check hash password when login
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

// TODO: token

export const User = mongoose.model("User",userSchema);
