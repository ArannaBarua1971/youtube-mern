import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelInfo,
  getUserWatchHistory,
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
router.route("/current-user").get(validedAuth, getCurrentUser);
router.route("/update-password").patch(validedAuth, getCurrentUser);
router.route("/update-AccountInfo").patch(validedAuth, updateAccountInfo);
router.route("/update-avater").patch(validedAuth,upload.single("avatar"), updateAvatar);
router.route("/update-coverImage").patch(validedAuth,upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(validedAuth, getUserChannelInfo);
router.route("/history").get(validedAuth, getUserWatchHistory);
router.route("/refresh-token").get(refreshAccessToken);

export default router;
