import { Router } from "express";
import {
  getCurrentUser,
  getUserChannel,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountInfo,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validedAuth } from "../middlewares/auth.middleware.js";
const router = Router();

//user related routes

// register and login routes
router.route("/register").post(
  // register user
  upload.fields([
    // store cover image and avater in server by useing multer middleware
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(validedAuth, logoutUser);
router.route("/current-user").post(validedAuth, getCurrentUser);
router.route("/update-password").post(validedAuth, getCurrentUser);
router.route("/update-AccountInfo").post(validedAuth, updateAccountInfo);
router.route("/update-avater").post(validedAuth,upload.single("avatar"), updateAvatar);
router.route("/update-coverImage").post(validedAuth,upload.single("coverImage"), updateCoverImage);
router.route("/getUserChannelInfo/:username").post(validedAuth, getUserChannel);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
