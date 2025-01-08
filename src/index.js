// require("dotenv").config({path: "./env"});
import "dotenv/config.js";

import connectDB from "./db/index.js";
import app from "./app.js";




connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
    console.log("MongoDB connected!!")
})
.catch((error) => {
    console.log("MongoDB connection error!!: ",error)
    // process.exit(1);
});

