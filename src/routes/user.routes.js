import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import { uploader } from "../middlewares/multer.middleware.js"
import { varifyJwt } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    uploader.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(varifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(varifyJwt, changeCurrentPassword)
router.route("/get-current-user").get(varifyJwt, getCurrentUser)
router.route("/update-account").patch(varifyJwt, updateAccountDetails)
router.route("/update-avatar").patch(
    uploader.single("avatar"),
    varifyJwt,
    updateUserAvatar
)
router.route("/update-cover-image").patch(
    uploader.single("coverImage"),
    varifyJwt,
    updateCoverImage
)
router.route("/user-channel-profile/:username").get(varifyJwt, getUserChannelProfile)
router.route("/watch-history").get(varifyJwt, getWatchHistory)

export default router