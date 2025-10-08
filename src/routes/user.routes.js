import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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
    { name: "avater", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);  
router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(validedAuth, logoutUser);

export default router;
