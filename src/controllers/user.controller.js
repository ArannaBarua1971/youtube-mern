import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import jwt from "jsonwebtoken";
const getAccessAndRefreshToken = async (id) => {
  try {
    const user = await User.findById(id);
    const AccessToken = await user.generateAccessToken();
    const RefreshToken = await user.generateRefreshToken();

    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false }); // not required validation before save

    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Problem create when Access and Refresh token create"
    );
  }
};

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
    fs.unlinkSync(avaterLocalPath);
    fs.unlinkSync(coverImageLocalPath);
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

const loginUser = asyncHandler(async (req, res) => {
  // check required field empty or not
  // check email or username and password given or not
  // find the user
  // check user is registered or not
  // compare the password
  // create access and refresh token

  const { username, email, password } = req.body;
  if (!(username || email) || !password) {
    throw new ApiError(400, "All feilds required");
  }

  //find user and check user is registered or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "User not registered");
  }

  //check password
  const isPasswordValided = await user.isPasswordCorrect(password);
  if (!isPasswordValided) {
    throw new ApiError(400, "Invalied Credentials");
  }

  //generate access and refresh token
  const { AccessToken, RefreshToken } = await getAccessAndRefreshToken(
    user._id
  );

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    scure: true,
  };
  return res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: { loggedUser, AccessToken, RefreshToken },
        },
        "user successfully logged in"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //check user already log in or not
  //if log in then delete the refresh token from database
  //clear the cookie and send res

  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    scure: true,
  };
  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "log out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get refresh token
  // decode the token check is expire and used or not
  // find the user
  // check incoming refresh token and user.refresh token same or not
  // create new Refresh and access token
  // give res

  const incomingRefreshToken =
    req.cookies?.RefreshToken || req.body?.RefreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized User");
  }

  const decodeToken = jwt.verify(
    incomingRefreshToken,
    process.env.JWT_REFRESH_SECRET_KEY
  );

  if (!decodeToken) {
    throw new ApiError(400, "Refresh Token is Expired and Used");
  }

  const user = await User.findById(decodeToken._id);

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(400, "Invalid Refresh Token");
  }

  const { AccessToken, RefreshToken } = await getAccessAndRefreshToken(
    user._id
  );
  const options = {
    httpOnly: true,
    scure: true,
  };
  return res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { AccessToken, RefreshToken },
        "Refresh Token create Successfully"
      )
    );
});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
