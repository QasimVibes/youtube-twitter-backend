import connectDB from "./db/index.js";
import dotenv from "dotenv";
import {app} from "./app.js";

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port http://localhost:${port}`)
        })
        app.on("error", (error) => {
            console.log("Error in running server", error)
            throw error
        })
    })
    .catch((error) => {
        console.log("Error in connecting to database", error)
    })
