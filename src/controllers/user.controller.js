import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"

const registerUser = asyncHandler(async (req, res) => {
  // check required feild is empty or not
  // check user alreay existed or not
  // add middlware for avartar and coverImage
  // check avatar is feild is empty or not and  upload in server or not
  // upload avatar and coverImage in cloudinary
  // store in database and check user is created or not
  // give response without password and refresh token

  const { username, email, fullName, password } = req.body;
  const avaterLocalPath = req.files?.avater[0]?.path;
  let coverImageLocalPath;
  if (req.files.coverImage) {
     coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  

  if (
    // check empty field empty or not
    [username, email, fullName, password].some((value) => value?.trim() == "")
  ) {
    throw new ApiError(400, "All feilds Recuried");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    fs.unlinkSync(avaterLocalPath)
    fs.unlinkSync(coverImageLocalPath)
    // check registered user is existed or not
    throw new ApiError(409, "User already existed");
  }

  if (!avaterLocalPath) {
    //check avater
    throw new ApiError(400, "Avater file is required");
  }

  const avater = await uploadOnCloudinary(avaterLocalPath);
  if (!avater) {
    //avater upload in cloudinary or not
    throw new ApiError(400, "Avater file is required");
  }

  let coverImage = "";
  if (req.files.coverImage) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  //store in DB
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avater: avater.url,
    coverImage: coverImage?.url || "",
  });

  // get user data wihtout password and refreshtoken
  const userData = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!userData) {
    //check user is created or not
    throw new ApiError(500, "something went wrong while registering user");
  }

  //give response to user
  return res
    .status(200)
    .json(new ApiResponse(200, userData, "User Registered Successfully"));
});

export { registerUser };
