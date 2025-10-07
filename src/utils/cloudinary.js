import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_KEY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null

        // file upload
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        if(response) {
            fs.unlinkSync(localFilePath)
            return response
        }
    }catch(error){
        fs.unlinkSync(localFilePath)//if file upload failed in cloudinary ,local file is delete from local path
    }
}

export {uploadOnCloudinary}