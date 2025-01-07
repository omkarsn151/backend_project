import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        //     {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        //     useCreateIndex: true,
        //     useFindAndModify: false
        // }) 
        console.log(`\nMongoDB connected!! DB host: ${connectionInstance.connection.host}`);

    }catch(error){
        console.log("ERROR: ",error)
        throw Error("Error connecting to MOngoDB\nConnection failed");
        process.exit(1);
    }
}

export default connectDB;