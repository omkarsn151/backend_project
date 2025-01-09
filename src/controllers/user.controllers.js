import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

    console.log("email: ", email);

    // --------------------------------------------------------------------------------------
    // Check if any field is empty or consists only of whitespace - validation
    if ([userName, fullName, email, password].some((field) => field?.trim() === "")) {
    // if ([userName, fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required");
    }

    // --------------------------------------------------------------------------------------
    // Check if user already exists
    const existedUser = User.findOne({
        $or: [{ userName }, { email }],
    })
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }    

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
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


    const createdUser = await User.findById(user._id).select("-password -refreshTokens");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }




    // --------------------------------------------------------------------------------------
    // Return response
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
    




});

export { registerUser };


 // if (fullName === "") {
    //     throw new ApiError(400, "Full name is required");
    // }