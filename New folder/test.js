const express = require('express');
require('dotenv').config();

const app = express();


app.get((req))
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    try {
        await connection;
        console.log(`Server is running at Port 8080 and also connected to DataBase`)
    } catch (error) {
        console.log(error.message)
    }
});
