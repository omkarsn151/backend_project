import { Router } from "express";
import { logOutUser, registerUser, logInUser } from "../controllers/user.controllers.js";
import { upload } from  "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
 
const router = Router();

router.route("/register").post(
    upload.fields([
        {name: "avatar", maxCount: 1},
        {name: "coverImage", maxCount: 1}
    ]),
    registerUser)


router.route("/login").post(logInUser)

// secured routes

router.route("/logout").post(verifyJWT, logOutUser)

export default router