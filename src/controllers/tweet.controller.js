import { Tweet } from "../models/tweets.model.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req?.body
    const { id } = req?.user


    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.create({
        owner: id,
        content
    })
    return res.status(200).json(new ApiResponse(200, "Tweet created successfully", tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                owner: {
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                }
            }
        }
    ]);

    if (!tweets?.length) {
        throw new ApiError(500, "No tweets found")
    }
    return res.status(200).json(new ApiResponse(200, "Tweets fetched successfully", tweets))
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req?.body
    const { id } = req?.query
    if (!content || !id) {
        throw new ApiError(400, "Id and content are required")
    }
    const updateTweet = await Tweet.findByIdAndUpdate(
        id, // req.params.id
        {
            $set: {
                content
            }
        },
        { new: true }
    ).select("-owner")

    if (!updateTweet) {
        throw new ApiError(500, "Something went wrong while updating tweet")
    }
    return res.status(200).json(new ApiResponse(200, "Tweet updated successfully", updateTweet))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { id } = req?.query
    if (!id) {
        throw new ApiError(400, "owner Id is required")
    }
    const deleteTweet = await Tweet.findByIdAndDelete(id, { new: true })
    if (!deleteTweet) {
        throw new ApiError(500, "Something went wrong while deleting tweet")
    }
    return res.status(200).json(new ApiResponse(200, "Tweet deleted successfully"))
})

const getAllTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                owner: {
                    fullName: "$owner.fullName",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])

    if (!tweets?.length) {
        throw new ApiError(500, "No tweets found")
    }
    return res.status(200)
        .json(new ApiResponse(200, "All tweets fetched successfully", tweets))
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
}