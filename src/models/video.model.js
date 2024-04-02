import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,
            required: true
        },
        thumbnail: {
            type: String,
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        duration: {
            type: String,
            required: true
        },
        isPublished: {
            type: Boolean,
            default: true
        }
    }
    , { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate) // For advance query
export const Video = mongoose.model("Video", videoSchema)