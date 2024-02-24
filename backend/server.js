const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database")

// Handle Uncaught Exception
process.on("uncaughtException",(err)=>{
    console.log(`Error:${err.message}`);
    console.log(`Server is close due to Uncaught Exception`);
    process.exit(1);
})
dotenv.config({path:"backend/config/config.env"});
connectDatabase()
const server = app.listen(process.env.PORT,()=>{
    console.log(`I am server and i am running on the http://localhost:${process.env.PORT}`)
})


// Unhandled Promise Rejection 
process.on("unhandledRejection",(err)=>{
    console.log(`Error:${err.message}`);
    console.log(`Server is close due to promise rejection`);
    server.close(()=>{
        process.exit(1);
    })
})