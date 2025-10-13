import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/createTweet").post(createTweet)//✅
router.route("/userTweets").get(getUserTweets)//✅
router.route("/deleteTweet").get(deleteTweet)//✅
router.route("/updateTweet").patch(updateTweet)//✅

export default router