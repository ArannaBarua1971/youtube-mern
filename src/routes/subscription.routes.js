import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/toggleSubscription").post(toggleSubscription)//✅
router.route("/subscribers").get(getUserChannelSubscribers)//✅
router.route("/subscribeTo").get(getSubscribedChannels)//✅

export default router