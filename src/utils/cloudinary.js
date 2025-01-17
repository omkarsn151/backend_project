// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';


// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null;
//         // upload the file on cloudinary
//         const respone = await cloudinary.uploader.upload(localFilePath,{resource_type: "auto"});
//         // file has been uploaded successfully
//         // console.log("File uploaded successfully on cloudinary: ", respone.url);
//         fs.unlinkSync(localFilePath)
//         return respone;        
//     } catch (error) {
//         fs.unlinkSync(localFilePath); //remove the locally saved temp file if the upload fails
//         return null;
//     }
// }

// export { uploadOnCloudinary };



import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload to Cloudinary
export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        
        // Delete the local file after upload
        fs.unlinkSync(localFilePath);
        
        return response;  // Return Cloudinary response with URL and other data
    } catch (error) {
        fs.unlinkSync(localFilePath);  // Delete the local file if upload fails
        console.error('Error uploading to Cloudinary:', error);
        return null;
    }
};


// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null;

//         // Log the file path to ensure it's correct
//         console.log("Uploading file to Cloudinary: ", localFilePath);

//         // Upload the file to Cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

//         // Log the Cloudinary response
//         console.log("Cloudinary Response: ", response);

//         // Delete the local file after upload
//         fs.unlinkSync(localFilePath);
        
//         return response;  // Return Cloudinary response with URL and other data
//     } catch (error) {
//         fs.unlinkSync(localFilePath);  // Delete the local file if upload fails
//         console.error('Error uploading to Cloudinary:', error);
//         return null;  // Return null if an error occurs
//     }
// };
