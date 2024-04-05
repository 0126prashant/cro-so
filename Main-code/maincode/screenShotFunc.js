const puppeteer = require('puppeteer');
const { S3 } = require('aws-sdk');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = 'us-east-1'; 

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'my-aws-cro-bucket';

const desktopViewport = { width: 1920, height: 1080 };
const mobileViewport = { width: 375, height: 667 };

async function checkFolderExists(folderName) {
    const params = {
        Bucket: S3_BUCKET_NAME,
        Prefix: folderName + '/',
        Delimiter: '/'
    };
    const response = await s3.listObjectsV2(params).promise();
    // return response.Contents.length > 0;
    return response.CommonPrefixes.length > 0 || response.Contents.length > 0;
}

async function getUniqueFolderName(baseFolderName) {
    let suffix = 0;
    let currentFolderName = baseFolderName;
    let exists = await checkFolderExists(currentFolderName);

    while (exists) {
        suffix++;
        currentFolderName = `${baseFolderName}_${suffix}`;
        exists = await checkFolderExists(currentFolderName);
    }
    
    return currentFolderName;
}

async function generateRandomUserId() {
    return uuidv4();
}

async function screenShotFunc(inputUrl, websiteName, userEmail, creatorID) {
    
    console.log("inputurl:", inputUrl, "webname:", websiteName, "userEmail", userEmail, "creatorID:", creatorID);
    console.time('Execution Time');
    const userId = await generateRandomUserId();

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const uniqueFolderName = await getUniqueFolderName(websiteName.replace(/^https?:\/\/|^www\./, '').replace(/[^a-zA-Z0-9]/g, '_'));
    const filePath = './screenshots.json';
    let existingData = {};

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        existingData = JSON.parse(fileContent);
    } catch (readError) {
        console.error(`Error reading existing JSON file: ${readError.message}`);
    }

    const result = existingData || {};
    result[creatorID] = { email: userEmail, websiteName, creatorID, mobile: [], desktop: [] };

    await page.goto(inputUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(5000);

    const viewports  = [desktopViewport, mobileViewport];
    for (const viewport of viewports) {
        await page.setViewport(viewport);
        await page.waitForTimeout(5000);
        const screenshotImageData = await page.screenshot({ encoding: 'base64', type: 'jpeg' });
        const fileName = `${Date.now()}_${viewport === mobileViewport ? 'mobile' : 'desktop'}_initial.jpg`;
        const s3Path = `${uniqueFolderName}/initial-screenshots/${fileName}`;

        const s3Params = {
            Bucket: S3_BUCKET_NAME,
            Key: s3Path,
            Body: Buffer.from(screenshotImageData, 'base64'),
            ContentType: 'image/jpeg',
        };

        const uploadResult = await s3.upload(s3Params).promise();
        result[creatorID][viewport === mobileViewport ? 'mobile' : 'desktop'].push({ [`initial_${viewport === mobileViewport ? 'mobile' : 'desktop'}_img_url`]: uploadResult.Location });
    }
    // const viewports = [desktopViewport, mobileViewport];
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        if (request.resourceType() === 'script') {
            console.log(`Blocking script request: ${request.url()}`);
            request.abort();
        } else {
            request.continue();
        }
    });

    try {
        await page.goto(inputUrl, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(5000);
        for (const viewport of viewports) {
            await page.setViewport(viewport);
            const { width: totalWidth, height: totalHeight } = await page.evaluate(() => ({
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
            }));

            const type = viewport === mobileViewport ? 'mobile' : 'desktop';

            for (let y = 0; y < totalHeight; y += viewport.height) {
                if (y + viewport.height > totalHeight) {
                    const remainingHeight = totalHeight - y;
                    await page.setViewport({ width: viewport.width, height: remainingHeight });
                }

                for (let x = 0; x < totalWidth; x += viewport.width) {
                    await page.evaluate((x, y) => window.scrollTo(x, y), x, y);
                    await page.waitForTimeout(2000);

                    const screenshotImageData = await page.screenshot({ encoding: 'base64', type: 'jpeg' });
                    const fileName = `${Date.now()}_${type}_${x}_${y}.jpg`;
                    const s3Path = `${uniqueFolderName}/${type}-images/${fileName}`;

                    const s3Params = {
                        Bucket: S3_BUCKET_NAME,
                        Key: s3Path,
                        Body: Buffer.from(screenshotImageData, 'base64'),
                        ContentType: 'image/jpeg',
                    };

                    const uploadResult = await s3.upload(s3Params).promise();
                    result[creatorID][type].push({ [`${type}_img_${x}_${y}_url`]: uploadResult.Location });

                    if (y + viewport.height > totalHeight) {
                        await page.setViewport(viewport);
                    }
                }
            }
        }

        await saveToJSONFile(result,filePath, filePath);
        console.log("Data appended to JSON file.");
        // console.log("now-finish");
    } catch (error) {
        console.error(`Error in screenShotFunc: ${error.message}`);
    } finally {
        const screenshotUrls = {
            desktop: [],
            mobile: []
        };
    
        // Assuming result is structured with desktop and mobile arrays containing the URLs
        if (result[creatorID] && result[creatorID].desktop) {
            screenshotUrls.desktop = result[creatorID].desktop.map(entry => Object.values(entry)[0]);
        }
        if (result[creatorID] && result[creatorID].mobile) {
            screenshotUrls.mobile = result[creatorID].mobile.map(entry => Object.values(entry)[0]);
        }
    
        // console.timeEnd('Execution Time');
        // await browser.close();
        console.log("now-finish------------1111");
    console.log("screenshotUrls-before",screenshotUrls);
        return screenshotUrls;
        // console.timeEnd('Execution Time');
        // await browser.close();
        // console.log("now-finish-----------2222");
    }

    // return result;
}



async function saveToJSONFile(data, filePath, websiteName) {
    const fileName = `screenshots.json`;
    // Create a unique folder name based on the website name
    const uniqueFolderName = await getUniqueFolderName(websiteName.replace(/^https?:\/\/|^www\./, '').replace(/[^a-zA-Z0-9]/g, '_'));
    // Create the S3 Key by combining the unique folder name with the file name
    const s3Key = `${uniqueFolderName}/${fileName}`;

    const s3Params = {
        Bucket: "croo-json-files",
        Key: s3Key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
    };

    try {
        await s3.upload(s3Params).promise();
        console.log(`Data uploaded to ${s3Key}`);
    } catch (error) {
        console.error(`Error uploading to S3: ${error.message}`);
    }
}


module.exports = { screenShotFunc };










