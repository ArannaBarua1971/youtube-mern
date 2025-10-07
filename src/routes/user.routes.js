import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

//user related routes
router.route("/register").post(// register user
  upload.fields([ // store cover image and avater in server by useing multer middleware
    { name: "avater", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

export default router;
