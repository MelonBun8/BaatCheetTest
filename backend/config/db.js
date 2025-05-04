const mongoose = require("mongoose")

const connectDB= async()=>{
  
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL);//using async and await so that db can connect because db connection takes time and we dont want the execution to skip this and run the next line
        console.log("MongoDb connected")
    }
    catch (error){
        console.error(`error: ${error.message}`)
        process.exit(1);

    }
 

};


module.exports= connectDB;