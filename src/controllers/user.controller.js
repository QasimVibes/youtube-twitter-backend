import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { cloudinaryUpload, cloudinaryDelete } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const acccessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { acccessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token and refresh token")
    }


}

const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, password } = req.body

    if ([userName, fullName, email, password].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All fields are required")
    }
    const alreadyExist = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (alreadyExist) {
        throw new ApiError(409, "Email or User Name is already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await cloudinaryUpload(avatarLocalPath)
    const coverImage = await cloudinaryUpload(coverImageLocalPath)

    if (!avatar.url) {
        throw new ApiError(500, "Something went wrong will uploading on server")
    }


    const user = await User.create({
        userName: userName.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body

    if (!(userName || email)) {
        throw new ApiError(400, "User Name or Email is required")
    }

    const user = await User.findOne({ $or: [{ userName }, { email }] })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const passwordValidate = await user.isPasswordCorrect(password)

    if (!passwordValidate) {
        throw new ApiError(401, "Password is incorrect")
    }

    const { acccessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = user.toObject()
    delete loggedInUser.refreshToken
    delete loggedInUser.password

    const cookieOptions = { // cannot be update on frontend
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .cookie("acccessToken", acccessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200,
                { user: loggedInUser, refreshToken, acccessToken },
                "User logged in successfully")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }

        },
        {
            new: true
        }
    )
    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("acccessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingResfrehToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingResfrehToken) {
        throw new ApiError(400, "Refresh token is required")
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingResfrehToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingResfrehToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or invalid")
        }

        const { acccessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("acccessToken", acccessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(201, { acccessToken, refreshToken }, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(error?.message || "Something went wrong while refreshing access token")
    }


})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    if ([oldPassword, newPassword].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const passwordValidate = await user.isPasswordCorrect(oldPassword)

    if (!passwordValidate) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true,
        }
    ).select("-password -refreshToken")


    return res.status(200).json(new ApiResponse(200, { user }, 'Account details updated successfully'))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Please provide an image")
    }
    const previousAvatarPublicId = req.user?.avatar?.split("/").pop().split(".")[0]
    const avatarLocalPath = req.file?.path
    const avatarUploaded = await cloudinaryUpload(avatarLocalPath)

    if (!avatarUploaded.url) {
        throw new ApiError(500, "Something went wrong while updating avatar")
    }
    if (previousAvatarPublicId) {
        await cloudinaryDelete(previousAvatarPublicId)
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatarUploaded.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(201, { user }, "Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "Cover Image is required")
    }

    const previousCoverImagePublicId = req.user?.coverImage?.split("/").pop().split(".")[0]
    const coverImageLocalPath = req.file?.path
    const coverImageUploaded = await cloudinaryUpload(coverImageLocalPath)

    if (!coverImageUploaded.url) {
        throw new ApiError(500, "Something went wrong while updating cover image")
    }
    if (previousCoverImagePublicId) {
        await cloudinaryDelete(previousCoverImagePublicId)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImageUploaded.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(201, { user }, "Cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "User name is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "Subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "SubscribedTo"
            }
        },
        {
            $addFields: {
                SubscribersCount: {
                    $size: "$Subscribers"
                },
                SubscribedToCount: {
                    $size: "$SubscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$Subscribers.subscriber"] }
                        , then: true, else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                email: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                SubscribersCount: 1,
                SubscribedToCount: 1,
                isSubscribed: 1,
                createdAt: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User profile fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "onwer",
                            pipeline: [
                                {
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            onwer: {
                                // $arrayElemAt: ["$onwer", 0]
                                $first: "$onwer"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!user?.length) {
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}