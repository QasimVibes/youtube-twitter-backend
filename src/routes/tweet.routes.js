import { Router } from "express";
import { varifyJwt } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet, deleteTweet, getAllTweets } from "../controllers/tweet.controller.js";

const router = Router()

router.use(varifyJwt)

router.route("/create-tweet").post(createTweet)
router.route("/user-tweets").get(getUserTweets)
router.route("/update-tweet").patch(updateTweet)
router.route("/delete-tweet").delete(deleteTweet)
router.route("/all-tweets").get(getAllTweets)

export default router