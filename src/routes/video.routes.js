import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { uploader } from "../middlewares/multer.middleware.js";
import { publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";

const router = Router()

router.use(varifyJwt)

router.route("/publish").post(
    uploader.single("video"),
    publishAVideo
)

router.route("/video/:videoId").get(getVideoById)
router.route("/update/:videoId").patch(
    uploader.single("thumbnail"),
    updateVideo
)

router.route("/delete/:videoId").delete(deleteVideo)
router.route("/toggle-publish/:videoId").patch(togglePublishStatus)


export default router