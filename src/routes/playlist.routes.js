import { Router } from "express";
import { validedAuth } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
const router =Router()

router.use(validedAuth)

//routes
router.route("/createPlaylist").post(createPlaylist)//✅
router.route("/userPlaylists").get(getUserPlaylists)//✅
router.route("/getPlaylistById").get(getPlaylistById)//✅
router.route("/addVideoInPlaylist").patch(addVideoToPlaylist)//✅
router.route("/removeVideoFromPlaylist").patch(removeVideoFromPlaylist)//✅
router.route("/deletePlaylist").get(deletePlaylist)//✅
router.route("/updatePlaylist").patch(updatePlaylist)//✅
export default router