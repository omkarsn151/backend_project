import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


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

    if (!userName || email){
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
        throw new ApiError("Password Incorrect");
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

export { registerUser, logInUser, logOutUser };


 // if (fullName === "") {
    //     throw new ApiError(400, "Full name is required");
    // }
