import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/addComment").post(addComment)//✅
router.route("/videoComments").get(getVideoComments)//✅
router.route("/deleteComment").get(deleteComment)//✅
router.route("/updateComment").patch(updateComment)//✅

export default router