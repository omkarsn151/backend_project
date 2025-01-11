import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";

// *****************************Genarate AT and RT***********************************
const generateAccessAndRefreshTokens = async(userId ) => {
    try {
        const  user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Tokens");
        
    }
}



// **************************Register************************************
const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({message: "ok"});



    // get user details form frontend
    // validation 
    // check if user already exists
    // check for images, avatar -
    // upload to cloudinary
    // create user object - create user in db
    // remove password and refresh token from field
    // check for user creation
    // return repsone


    // --------------------------------------------------------------------------------------
    // get usr details from frontend
    const { userName, fullName, email, password } = req.body;

    // console.log("email: ", email);

    // --------------------------------------------------------------------------------------
    // Check if any field is empty or consists only of whitespace - validation
    if ([userName, fullName, email, password].some((field) => field?.trim() === "")) {
    // if ([userName, fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    // --------------------------------------------------------------------------------------
    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }],
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }    

    // console.log(req.files);


    // Checking separately for email and username
    // const userNameExists = await User.findOne({ userName });
    // if (userNameExists) {
    //     throw new ApiError(409, "Username already exists");
    // }

    // const emailExists = await User.findOne({ email });
    // if (emailExists) {
    //     throw new ApiError(409, "Email already exists");
    // }


    // --------------------------------------------------------------------------------------
    // Check for images, avatar 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // --------------------------------------------------------------------------------------
    // Upload files to cloudinary

    const avatarCloudinary = await uploadOnCloudinary(avatarLocalPath);
    const coverImageCloudinary = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatarCloudinary) {
        throw new ApiError(500, "Image upload failed");
    }



    // --------------------------------------------------------------------------------------
    // Create user object - create user in db
    const user = await User.create(
        {
            userName: userName.toLowerCase(),
            fullName,
            email,
            password,
            avatar: avatarCloudinary.url,
            coverImage: coverImageCloudinary?.url || "",
        }
    )


    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }




    // --------------------------------------------------------------------------------------
    // Return response
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
    




});


// *****************************Login****************************************
const logInUser = asyncHandler(async (req, res) =>{
    // get data from the request body
    // username or email login 
    // find the user
    // password check
    // AT and RT
    // send cookies


    // ------------------------------------------------------------------------------
    // data from the request body and login requirements

    const {email, userName, password} = req.body

    if (!(userName || email)){
        throw new ApiError(400, "Username or email is required")
    }

    // ------------------------------------------------------------------------------
    // check user exists
    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(!user){
        throw new ApiError(404,"User doesnot Exists");
    }

    // -------------------------------------------------------------------------------
    // Check password

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Password Incorrect");
    }

    // -------------------------------------------------------------------------------
    // Generate AT and RT

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    // -------------------------------------------------------------------------------
    // cookies

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})


// ******************************Logout**********************************
const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User Logged Out"
        )
    )
})




// ********************************RefreshToken endPoint**************************
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request");
        
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid RefreshToken");
            }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "RefreshToken is expired or used"); 
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
        
    }
})


// **********************************Password edit*********************************
const changeCorrectPassword = asyncHandler(async(req, res) =>{
    const { oldPassword , newPassword } = req.body

   

    const user  = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Incorrect Password");
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new(ApiResponse(200, {}, "Password changed Successfully"))
    )
})


// **********************************get current user******************************
const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "Current user fetched successfully"
    ))
})


// *********************************Account details update**************************
const updateAccountDetails = asyncHandler( async(req, res) =>{
    const {fullName, userName} = req.body

    if(!fullName || !userName){
        throw new ApiError(400,"All fields are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        )
    )
})


// ***********************************Avatar update********************************
const updateAvatar = asyncHandler( async(req, res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar updated successfully"
        )
        
    )
})


// *************************************update cover image***********************
const updateCoverImage = asyncHandler( async(req, res) =>{
    const coverImageLocalPath = req?.file.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is missing")
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req?.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image updated successfully"
        )
    )
})


// *************************************user channel profile***********************
// *********************************Subscription**********************************
const getUserChannelProfile = asyncHandler( async(req, res) =>{
    const { userName } = req.params

    if(!userName?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberedTO",
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscriberedTO" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] } ,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    )
})



// ************************************Watch History*******************************
const getWatchHistory = asyncHandler( async(req, res) =>{
    const user =  await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            },
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
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watched history fetched successfully"
        )
    )
})



export { 
            registerUser,
            logInUser,
            logOutUser,
            refreshAccessToken,
            changeCorrectPassword,
            getCurrentUser,
            updateAccountDetails,
            updateAvatar,
            updateCoverImage,
            getUserChannelProfile,
            getWatchHistory
        };


