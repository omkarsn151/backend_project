import { Router } from "express";
import { 
        logOutUser,
        registerUser,
        logInUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateAvatar,
        updateCoverImage,
        getUserChannelProfile, 
        getWatchHistory
} from "../controllers/user.controllers.js";
import { upload } from  "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// secured routes

router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser)
router.route("/login").post(logInUser)
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post( refreshAccessToken );
router.route("/change-password").post( verifyJWT, changeCurrentPassword )
router.route("/current-user").get( verifyJWT, getCurrentUser);
router.route("/update-account-details").patch( verifyJWT, updateAccountDetails );
router.route("/update-avatar").patch( verifyJWT, upload.single("avatar"), updateAvatar );
router.route("/updatecover-image").patch( verifyJWT, upload.single("coverImage"), updateCoverImage );
router.route("/c/:userName").get( verifyJWT, getUserChannelProfile );
router.route("/watch-history").get( verifyJWT, getWatchHistory );


export default router