import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/getChannelStats").get(getChannelStats)//✅
router.route("/ChannelVideos").get(getChannelVideos)//✅

export default router