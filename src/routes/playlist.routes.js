import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { createPlaylist, getUserPlaylists, getPlaylistById, updatePlaylist, deletePlaylist } from "../controllers/playlist.controller.js";


const router = Router()

router.use(varifyJwt)

router.route("/create-playlist").post(createPlaylist)
router.route("/user-playlist/:userId").get(getUserPlaylists)
router.route("/playlistbyid/:playlistId").get(getPlaylistById)
router.route("/update-playlist/:playlistId").patch(updatePlaylist)
router.route("/delete-playlist/:playlistId").delete(deletePlaylist)

export default router
