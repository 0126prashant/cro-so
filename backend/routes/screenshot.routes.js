const express = require("express");
const routerScreenshot = express.Router();
const path = require("path");
const { spawn } = require("child_process");
const multer = require("multer");
const parseUrl = require("url-parse");
const { UserModel } = require("../model/users.model");
const { screenShotFunc } = require("../screenShotFunc");
const { Pdf } = require("../model/pdf.model");
const { sendEmail } = require("../functions/mailSender");
const { processFeedback } = require("../functions/processfeedback");

// Determine the Python executable path based on the environment
// const pythonExecutable = process.platform === 'win32' ? path.join(__dirname, "../myenv/Scripts/python.exe") : path.join(__dirname, "../myenv/bin/python");
// const pythonScriptPath = path.join(__dirname, "../main2.py");

// console.log("Python script path:", pythonScriptPath);



const upload = multer({ storage: multer.memoryStorage() });

routerScreenshot.post("/", async (req, res) => {
  console.log("Running");
  const { url: inputUrl, userEmail } = req.body;
  if (!inputUrl) {
    return res.status(400).json({ error: "URL is required in the request body." });
  }

  const parsedUrl = parseUrl(inputUrl);
  const websiteName = parsedUrl.hostname;
  if (!websiteName) {
    return res.status(400).json({ error: "Invalid URL. Unable to extract the website name." });
  }

  try {
    const user = new UserModel({ websiteName, userEmail, inputUrl });
    await user.save();
    const userInDb = await UserModel.findOne({ userEmail, websiteName });
    const creatorID = userInDb._id.toString();

    const screenshotUrls = await screenShotFunc(inputUrl, websiteName, userEmail, creatorID);
    
    // Process feedback using the new Node.js function
    await processFeedback(creatorID);

    const frontendUrl = `https://668e681dfdfd0f21c00bdb79--incomparable-monstera-5c55d8.netlify.app/?creatorID=${creatorID}`;

    res.status(200).json({
      success: true,
      screenshots: screenshotUrls,
      creatorID: creatorID,
      redirectUrl: frontendUrl,
      websiteName: websiteName,
      userEmail: userEmail,
    });

    console.log("Sending email after delay...");
    await sendEmail(creatorID, userEmail, inputUrl);

  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

routerScreenshot.post("/send-email", async (req, res) => {
  console.log("send-email endpoint called with body:", req.body);
  const { creatorID, userEmail, websiteUrl } = req.body;
  
  if (!creatorID) {
    return res.status(400).json({ error: "creatorID is required" });
  }

  try {
    console.log("Calling sendEmail function with creatorID:", creatorID);
    await sendEmail(creatorID, userEmail, websiteUrl);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(`An error occurred while sending email: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

routerScreenshot.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const newPdf = new Pdf({
    name: req.file.originalname,
    pdfData: req.file.buffer,
    contentType: req.file.mimetype || 'application/pdf',
    creatorID: req.body.creatorID,
    websiteName: req.body.websiteName,
    email: req.body.userEmail,
  });

  try {
    await newPdf.save();
    res.json({ message: 'PDF uploaded and saved to MongoDB.' });
  } catch (error) {
    console.error('Server error while uploading PDF', error.message);
    res.status(500).send('Server error while uploading PDF');
  }
});


// const upload = multer({ storage: multer.memoryStorage() });


// routerScreenshot.post("/", async (req, res) => {
//   console.log("Running");
//   const { url: inputUrl, userEmail } = req.body;
//   if (!inputUrl) {
//     return res.status(400).json({ error: "URL is required in the request body." });
//   }

//   const parsedUrl = parseUrl(inputUrl);
//   const websiteName = parsedUrl.hostname;
//   if (!websiteName) {
//     return res.status(400).json({ error: "Invalid URL. Unable to extract the website name." });
//   }

//   try {
//     const user = new UserModel({ websiteName, userEmail, inputUrl });
//     await user.save();
//     const userInDb = await UserModel.findOne({ userEmail, websiteName });
//     const creatorID = userInDb._id.toString();

//     const screenshotUrls = await screenShotFunc(inputUrl, websiteName, userEmail, creatorID);
//     // console.log("how many :-",screenshotUrls)
//     const { stdout, stderr } = await runPythonScript(pythonScriptPath, creatorID);
//     console.log("Python script stdout:", stdout);

//     const frontendUrl = `https://668e681dfdfd0f21c00bdb79--incomparable-monstera-5c55d8.netlify.app/?creatorID=${creatorID}`;

//     res.status(200).json({
//       success: true,
//       screenshots: screenshotUrls,
//       creatorID: creatorID,
//       redirectUrl: frontendUrl,
//       websiteName : websiteName,
//       userEmail:userEmail,
//     });

//     console.log("Sending email after delay...");


//   } catch (error) {
//     console.error(`An error occurred: ${error.message}`);
//     res.status(500).json({ error: error.message });
//   }
// });


routerScreenshot.post("/send-email", async (req, res) => {
  console.log("send-email endpoint called with body:", req.body);
  const { creatorID,userEmail,websiteUrl } = req.body;
  
  if (!creatorID) {
    return res.status(400).json({ error: "creatorID is required" });
  }

  try {
    console.log("Calling sendEmail function with creatorID:", creatorID);
    await sendEmail(creatorID,userEmail,websiteUrl);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(`An error occurred while sending email: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

function runPythonScript(scriptPath, creatorID) {
  console.log("Calling Python script with creatorID:", creatorID);
  console.log("three--------------->>>>>");
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(pythonExecutable, [scriptPath, creatorID]);
    console.log("dirname", __dirname);
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

  const newPdf = new Pdf({
    name: req.file.originalname,
    pdfData: req.file.buffer,
    contentType: req.file.mimetype || 'application/pdf',
    creatorID: req.body.creatorID,
    websiteName: req.body.websiteName,
    email: req.body.userEmail,
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
    const feedbackFilePath = path.join(__dirname, "..", "screenshots.json");

    console.log("feedbackFilePath", feedbackFilePath);

    const jsonData = await fs.promises.readFile(feedbackFilePath, "utf-8");
    const feedbackData = JSON.parse(jsonData);

    if (feedbackData[key]) {
      res.status(200).json({ feedback: feedbackData[key] });
    } else {
      res.status(404).json({ error: "Website not found in feedback data" });
    }
  } catch (error) {
    console.error(`Error retrieving feedback data: ${error.message}`);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { routerScreenshot };
