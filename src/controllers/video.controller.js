import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js";
import { isValidObjectId } from "mongoose";

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }

    if (!req.file) {
        throw new ApiError(400, "Video is required")
    }

    const videoLocalPath = req.file?.path
    const uploadedVideo = await cloudinaryUpload(videoLocalPath)

    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading video")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: uploadedVideo?.url,
        thumbnail: uploadedVideo?.secure_url,
        duration: uploadedVideo?.duration,
        owner: req.user?._id
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while creating video")
    }

    res.status(200).json(new ApiResponse(200, "Video created successfully", video))
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(500, "Something went wrong while getting video")
    }

    res.status(200).json(new ApiResponse(200, "Video fetched successfully", video))
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }

    const video = await Video.findById(videoId)

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")

    }

    if (!videoId || !title || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const thumbnailLocalPath = req.file?.path
    const thumbnailUploaded = await cloudinaryUpload(thumbnailLocalPath)

    if (!thumbnailUploaded) {
        throw new ApiError(500, "Something went wrong while uploading thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            title,
            description,
            thumbnail: thumbnailUploaded?.secure_url
        },
        {
            new: true
        }

    )

    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong while updating video")
    }

    res.status(200).json(new ApiResponse(200, "Video updated successfully", updatedVideo))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(500, "Something went wrong while getting video")
    }

    if (!req.user?._id.equals(video?.owner)) {
        throw new ApiError(401, "Unauthorized")
    }

    const videoPublicId = video.videoFile?.split("/").pop().split(".")[0]
    const thumbnailPublicId = video.thumbnail?.split("/").pop().split(".")[0]
    const cloudinaryDeleteVideo = await cloudinaryDelete(videoPublicId)
    const cloudinaryDeleteThumbnail = await cloudinaryDelete(thumbnailPublicId)

    const deleteVideoResponse = await Video.findByIdAndDelete(videoId)

    // Like and comment are not deleted as of now
    // TODO: delete like and comment

    if (!deleteVideoResponse || !cloudinaryDeleteVideo || !cloudinaryDeleteThumbnail) {
        throw new ApiError(500, "Something went wrong while deleting video")
    }
    res.status(200).json(new ApiResponse(200, "Video deleted successfully", {}))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video Id is required")
    }

    const video = await Video.findById(videoId)

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },

        {
            new: true
        }
    )

    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong while updating video")
    }

    res.status(200).json(new ApiResponse(200, "Video updated successfully",  { isPublished: updatedVideo.isPublished },))

})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})
export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}