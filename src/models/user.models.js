// import mongoose, { Schema } from "mongoose";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import e from "express";
// const userSchema = new Schema(
//     {
//         userName: {
//             type: String,
//             required: true,
//             unique: true,
//             trim: true,
//             index: true,
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//             trim: true,
//         },
//         password: {
//             type: String,
//             required: [true, "Password is required"],
//         },
//         fullName: {
//             type: String,
//             required: true,
//             trim: true,
//             index: true,
//         },
//         avatar: {
//             type: String, //Cloud url
//             required: true,
//         },
//         coverImage: {
//             type: String,
//         },
//         refreshToken: {
//             type: String
//         },
//         watchHistory: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Video"
//         }
//     }, {timestamps: true}
// );

// userSchema.pre("save", async function (next) {
//     // if (this.isModified("password")) {
//     //     this.password = await bcrypt.hash(this.password, 10);
//     // }
//     // next();
//     if (!this.isModified("password")) return next();

//     this.password = await bcrypt.hash(this.password, 10);
//     next();
    
// });

// userSchema.methods.isPasswordCorrect = async function (password) {
//     return await bcrypt.compare(password, this.password);
// };

// userSchema.methods.generateAccessToken = function () {
//     return jwt.sign(
//         {
//             _id: this._id ,
//             email: this.email,
//             userName: this.userName,
//             fullName: this.fullName,
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         {
//             expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
//         }
//     );
// }
// userSchema.methods.generateRefreshToken = function () {
//     return jwt.sign(
//         {
//             _id: this._id ,
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         {
//             expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
//         }
//     );
// }




// export const User = mongoose.model("User", userSchema);


import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Use only this import statement, and remove the duplicate require statement

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, // Cloud URL
            required: true,
        },
        coverImage: {
            type: String,
        },
        refreshToken: {
            type: String,
        },
        watchHistory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
    },
    { timestamps: true }
);

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) {
        throw new Error("User password is not set.");
    }
    if (!password) {
        throw new Error("Password to compare is missing.");
    }
    return await bcrypt.compare(password, this.password);
};

// Method to generate an access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        }
    );
};

// Method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        }
    );
};

export const User = mongoose.model("User", userSchema);