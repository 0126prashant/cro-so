const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); 
require('dotenv').config();
const path = require("path");
const { connection } = require('./db');
const { routerScreenshot } = require('./routes/screenshot.routes');
const app = express();
app.use(cors());



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.use("/screenshots", routerScreenshot);
app.use("/", routerScreenshot);

const PORT = 8080;
app.listen(PORT,async()=>{
 
    try {
        await connection;
        console.log(`Server is running at Port ${PORT} and also connected to DataBase`)
    } catch (error) {
        console.log(error.message)
    }
})