import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

//use validation in all routes
router.use(validedAuth);

//secure video router
router.route("/v/:id").get(getVideoById);//✅
router.route("/allVideos").get(getAllVideos);//✅
router.route("/updateVideo").patch(upload.single("videoFile"),updateVideo);//✅
router.route("/deleteVideo").patch(deleteVideo);//✅
router.route("/toggleStatus").patch(togglePublishStatus);//✅
router.route("/publishVideo").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);//✅

export default router;
