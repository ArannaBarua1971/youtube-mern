import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const validedAuth = asyncHandler(async (req, _, next) => {
  const accessToken =
    req.cookies?.AccessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!accessToken) {
    throw new ApiError(401, "Unauthorized User");
  }

  const decodeToken = jwt.verify(
    accessToken,
    process.env.JWT_ACCESS_SECRET_KEY
  );

  if(!decodeToken){
    throw new ApiError(401,"Unauthorized User")
  }
  // check user existed or not
  const user = await User.findById(decodeToken?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(400, "Invalid Access Token");
  }

  req.user = user;
  next();
});
