const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); 
require('dotenv').config();
const path = require("path");
const { connection } = require('./db');
const { routerScreenshot } = require('./routes/screenshot.routes');
const app = express();
// app.use(cors());
app.use(cors({
  origin:`${process.env.frontendURL}/`,
  methods:"GET,POST,PUT,DELETE",
  credentials:true
}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend/build")));

const { MongoClient } = require("mongodb");


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

const url = process.env.MongoUrl;
const dbName = 'crow_so';

app.get("/pdffeedback/:creatorID", async (req, res) => {
  const creatorID = req.params.creatorID;

  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('pdffeedback');

    const data = await collection.find({ creatorID: creatorID }).toArray();;

    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Data not found for the specified creator ID' });
    }
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
});


app.use("/screenshots", routerScreenshot);
app.use("/", routerScreenshot);


app.get("*",(req,res)=>{
  res.sendFile(
      path.join(__dirname,"../frontend/build/index.html"),
      function(err){

          if(err){
              res.status(500).send(err)
          }
      }
  )

})

const PORT = 8081;
app.listen(PORT,async()=>{
 
    try {
        await connection;
        console.log(`Server is running at Port ${PORT} and also connected to DataBase`)
    } catch (error) {
        console.log(error.message)
    }
})
