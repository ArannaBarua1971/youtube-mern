import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/toggleVideoLike").post(toggleVideoLike)//✅
router.route("/toggleCommentLike").post(toggleCommentLike)//✅
router.route("/likedVideos").get(getLikedVideos)//✅

export default router