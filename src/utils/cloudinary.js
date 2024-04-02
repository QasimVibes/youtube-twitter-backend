import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; // file system

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryUpload = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // Remove file from temp public folder
        return null
    }
}

const cloudinaryDelete = async (publicId) => {
    try {
        if (!publicId) return null
        await cloudinary.uploader.destroy(publicId)
        return true
    } catch (error) {
        return null
    }
}

export { cloudinaryUpload, cloudinaryDelete }