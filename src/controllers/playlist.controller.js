import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js"
import { PlayList } from "../models/playlists.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if ([name, description].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const existingPlaylist = await PlayList.findOne({ name, owner: req.user?._id })

    if (existingPlaylist) {
        throw new ApiError(400, "Playlist already exists")
    }

    const playlist = await PlayList.create({
        name,
        description,
        owner: req.user?._id
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating playlist")
    }

    res.status(200).json(new ApiResponse(200, "Playlist created successfully", playlist))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User Id is required")
    }

    const playlists = await PlayList.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist Id is required")
    }

    const playlist = await PlayList.findOne({ _id: playlistId })

    if (!playlist) {
        throw new ApiError(500, "No playlists")
    }

    const playlists = await PlayList.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                }
            }
        }
    ])

    if (!playlists?.length) {
        throw new ApiError(500, "No playlists found")
    }

    res.status(200).json(new ApiResponse(200, "Playlist found successfully", playlists))
})


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    const deletePlaylist = await PlayList.findByIdAndDelete(playlistId).select("-videos -description -createdAt -updatedAt -__v")

    if (!deletePlaylist) {
        throw new ApiError(500, "Something went wrong while deleting playlist")
    }

    res.status(200).json(new ApiResponse(200, "Playlist deleted successfully", deletePlaylist))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!name || !description || !playlistId) {
        throw new ApiError(400, "All fields are required")
    }

    const updatePlaylist = await PlayList.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "Something went wrong while updating playlist")
    }

    res.status(200).json(new ApiResponse(200, "Playlist updated successfully", updatePlaylist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    deletePlaylist,
    updatePlaylist
}