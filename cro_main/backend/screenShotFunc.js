const puppeteer = require('puppeteer');
const { S3 } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const { WebsiteInfo } = require('./model/screenshot.model');


const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = 'us-east-1';

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'my-aws-cro-bucket';

const desktopViewport = { width: 1920, height: 1080 };
const mobileViewport = { width: 375, height: 667 };

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

async function screenShotFunc(inputUrl, websiteName, userEmail, creatorID) {
    console.log("crtrID", creatorID);
    console.log("Starting screenshot function for:", websiteName);
    console.time('Execution Time');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const uniqueFolderName = await getUniqueFolderName(websiteName.replace(/^https?:\/\/|^www\./, '').replace(/[^a-zA-Z0-9]/g, '_'));

    // Fetch or initialize the MongoDB document for the website
    let websiteInfo = await WebsiteInfo.findOne({ creatorID: creatorID });
    if (!websiteInfo) {
        websiteInfo = new WebsiteInfo({
            email: userEmail,
            websiteName: websiteName,
            creatorID: creatorID,
            mobile: [],
            desktop: []
        });
    }
    await page.waitForTimeout(5000);
    
    // <<<---------------------Initial screenshots logic---------------------------->>>> 
    const viewports = [desktopViewport, mobileViewport];
    await page.goto(inputUrl, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(5000);
    for (const viewport of viewports) {
        await page.setViewport(viewport);
    await page.waitForTimeout(2000); 
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
    const imageType = viewport === mobileViewport ? 'mobile' : 'desktop';
    websiteInfo[imageType].push({
        url: uploadResult.Location,
        key: `initial_${imageType}_img_url`
    });
}

// await page.setRequestInterception(true);
// page.on('request', (request) => {
//     if (request.resourceType() === 'image' && request.url().includes('pop-up')) {
//         console.log(`Blocking pop-up image request: ${request.url()}`);
//         request.abort();
//     } else {
//         request.continue();
//     }
// });

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
        // <<<-----Logic to capture full-page screenshots and upload them to S3bucket------>>>>>
        for (const viewport of viewports) {
            await page.setViewport(viewport);
            await page.goto(inputUrl, { waitUntil: 'networkidle0' });
            await page.waitForTimeout(2000);
        
            const type = viewport === mobileViewport ? 'mobile' : 'desktop';
            const dimensions = await page.evaluate(() => {
                return {
                    width: document.documentElement.scrollWidth,
                    height: document.documentElement.scrollHeight
                };
            });
        
            for (let y = 0; y < dimensions.height; y += viewport.height) {
                let newHeight = viewport.height;
                if (y + viewport.height > dimensions.height) {
                    newHeight = dimensions.height - y;
                }
                await page.setViewport({
                    width: viewport.width,
                    height: newHeight
                });
        
                for (let x = 0; x < dimensions.width; x += viewport.width) {
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
                    websiteInfo[type].push({
                        url: uploadResult.Location,
                        key: `${type}_img_${x}_${y}_url`
                    });
                }
        
                if (newHeight !== viewport.height) {
                    // Reset viewport to original after last screenshot if it was modified
                    await page.setViewport(viewport);
                }
            }
        }
       
        await websiteInfo.save();
        console.log("Data saved to MongoDB.");

    } catch (error) {
        console.error(`Error in screenShotFunc: ${error.message}`);
    } finally {
        console.timeEnd('Execution Time');
        await browser.close();
        // Generate and return the URLs of captured screenshots 
        const screenshotUrls = {
            desktop: websiteInfo.desktop.map(img => img.url),
            mobile: websiteInfo.mobile.map(img => img.url)
        };
        console.log("Screenshot URLs:", screenshotUrls);
        return screenshotUrls;
    }
}

module.exports = { screenShotFunc };












