const express = require("express");
const routerScreenshot = express.Router();
const path = require("path");
const { spawn } = require("child_process");
const multer = require("multer");
const parseUrl = require("url-parse");
const { UserModel } = require("../model/users.model");
const { screenShotFunc } = require("../screenShotFunc");
const { LocalStorage } = require("node-localstorage");
const { sendEmail } = require("../functions/mailSender");
const { Pdf } = require("../model/pdf.model");

const pythonExecutable = path.join(__dirname, "../venv/Scripts/python.exe");
const pythonScriptPath = path.join(__dirname, "../main2.py");
console.log("Python script path:", pythonScriptPath);

const upload = multer({ storage: multer.memoryStorage() });
let globalCreatorID;
let globalWebsiteName;
let globalUserEmail;


routerScreenshot.post("/", async (req, res) => {
  const { url: inputUrl, userEmail } = req.body;

  if (!inputUrl) {
    return res.status(400).json({ error: "URL is required in the request body." });
  }

  const parsedUrl = parseUrl(inputUrl);
  const websiteName = parsedUrl.hostname;
  globalWebsiteName = websiteName;
  globalUserEmail = userEmail;

  if (!websiteName) {
    return res.status(400).json({ error: "Invalid URL. Unable to extract the website name." });
  }

  try {
    const user = new UserModel({ websiteName, userEmail, inputUrl });
    await user.save();
    const userInDb = await UserModel.findOne({ userEmail, websiteName });
    const creatorID = userInDb._id.toString();
    globalCreatorID = creatorID

    console.log("Before screenShotFunc");
    const screenshotUrls = await screenShotFunc(inputUrl, websiteName, userEmail, creatorID);
    console.log("After screenShotFunc");
    res.status(200).json({ success: true, screenshots: screenshotUrls, creatorID: creatorID });

    console.log("Calling Python script...");

      console.log("hurray--------------->>>>>");
      runPythonScript(pythonScriptPath, creatorID) 
      .then(({ stdout, stderr }) => {
        console.log("Python script stdout:", stdout);
        if (stderr) {
          console.error("Python script stderr:", stderr);
          const htmlFilePath = path.join(__dirname, '../../html/page1.html');
          console.log("<<<<<--------------->>>>>");
          setTimeout(() => {
            sendEmail(creatorID)
          }, 5000);
          console.log("two--------------->>>>>");
        }
       })
       .catch((error) => {
         console.error(`An error occurred when running the Python script: ${error.message}`);
       });
      
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});


function runPythonScript(scriptPath, creatorID) {
  console.log("Calling Python script with creatorID:",creatorID);
  console.log("three--------------->>>>>");
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExecutable, [scriptPath, creatorID]);
    // console.log("pythonProcess",pythonProcess);
    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      console.log("Received data from Python script:");
      console.log(data.toString());
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("Received error from Python script:");
      console.error(data.toString());
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python script exited with code ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Python script exited with code ${code}, stderr: ${stderr}`));
      }
    });

    pythonProcess.on("error", (err) => {
      console.error("An error occurred while running the Python script:");
      console.error(err);
      reject(err);
    });
  });
}

      
routerScreenshot.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }
console.log("globalWebsiteName",globalWebsiteName);
console.log("globalUserEmail",globalUserEmail);
  const newPdf = new Pdf({
      name: req.file.originalname,
      pdfData: req.file.buffer,
      contentType: req.file.mimetype || 'application/pdf',
      creatorID:globalCreatorID,
      websiteName :globalWebsiteName,
      email: globalUserEmail,

  });

  try {
    
      await newPdf.save(); 
      res.json({ message: 'PDF uploaded and saved to MongoDB.' });
  } catch (error) {
      console.error('Server error while uploading PDF', error.message);
      res.status(500).send('Server error while uploading PDF');
  }
});
routerScreenshot.get("/feedback/:key", async (req, res) => {
  try {
    const key = req.params.key;
    let websiteName = globalWebsiteName;

    console.log("path", __dirname);
    const feedbackFilePath = path.join(__dirname, "..", "screenshots.json");

    console.log("feedbackFilePath", feedbackFilePath);

    const jsonData = await fs.readFile(feedbackFilePath, "utf-8");
    const feedbackData = JSON.parse(jsonData);

    console.log("feedbackData", feedbackData[websiteName][0][key]);
    if (feedbackData[websiteName]) {
      res.status(200).json({ feedback: feedbackData[websiteName][0][key] });
    } else {
      res.status(404).json({ error: "Website not found in feedback data" });
    }
  } catch (error) {
    console.error(`Error retrieving feedback data: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




module.exports = {routerScreenshot};


