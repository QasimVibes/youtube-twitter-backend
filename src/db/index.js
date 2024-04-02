import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URI}/${DATABASE_NAME}`);
    } catch (error) {
        console.log("Error in connecting to database", error);
        process.exit(1); // stop the app / Node process
    }
}

export default connectDB;