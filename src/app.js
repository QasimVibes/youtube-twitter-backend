import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(cors({ // configuration for cors
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" })) //  to get form data etc.
app.use(express.urlencoded({ extended: true, limit: "16kb" })) //  to get url data etc.
app.use(express.static("public")) // to save static file in our server
app.use(cookieParser()) // to get cookies from browser


// Routes import 
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import videoRouter from "./routes/video.routes.js"

// decleration of Routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/videos", videoRouter)
// http://localhost:5000/api/v1/users/register

export { app }