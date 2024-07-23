
const puppeteer = require('puppeteer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { WebsiteInfo } = require('./model/screenshot.model');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = 'us-east-1';

AWS.config.update({ accessKeyId, secretAccessKey, region });
const s3 = new AWS.S3();
const S3_BUCKET_NAME = 'ai-agents18';

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
    return response.CommonPrefixes.length > 0 || response.Contents.length > 0;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenShotFunc(inputUrl, websiteName, userEmail, creatorID) {
    console.log("crtrID", creatorID);
    console.log("Starting screenshot function for:", websiteName);
    console.time('Execution Time');

        const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/chromium' 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const uniqueFolderName = await getUniqueFolderName(websiteName.replace(/^https?:\/\/|^www\./, '').replace(/[^a-zA-Z0-9]/g, '_'));

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

    // Block all scripts
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
        await page.goto(inputUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    } catch (error) {
        console.error(`Error loading page: ${error.message}`);
        // Continue with the script even if page load fails
    }
    
    await wait(5000);

    const viewports = [desktopViewport, mobileViewport];

    for (const viewport of viewports) {
        await page.setViewport(viewport);
        await wait(2000);

        const dimensions = await page.evaluate(() => {
            return {
                width: document.documentElement.scrollWidth,
                height: document.documentElement.scrollHeight,
                deviceScaleFactor: window.devicePixelRatio,
            };
        });

        console.log(`Total height: ${dimensions.height}px`);

        const type = viewport === mobileViewport ? 'mobile' : 'desktop';

        let yPosition = 0;
        while (yPosition < dimensions.height) {
            await page.evaluate((y) => window.scrollTo(0, y), yPosition);
            await wait(1000);

            const screenshotImageData = await page.screenshot({
                encoding: 'base64',
                type: 'jpeg',
                fullPage: false,
                clip: {
                    x: 0,
                    y: yPosition,
                    width: viewport.width,
                    height: Math.min(viewport.height, dimensions.height - yPosition)
                }
            });

            const fileName = `${Date.now()}_${type}_${yPosition}.jpg`;
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
                key: `${type}_img_${yPosition}_url`
            });

            yPosition += viewport.height;
            if (yPosition > dimensions.height) {
                yPosition = dimensions.height;
            }
        }
    }

    await websiteInfo.save();
    console.log("Data saved to MongoDB.");

    console.timeEnd('Execution Time');
    await browser.close();

    const screenshotUrls = {
        desktop: websiteInfo.desktop.map(img => img.url),
        mobile: websiteInfo.mobile.map(img => img.url)
    };
    console.log("Screenshot URLs:", screenshotUrls);
    return screenshotUrls;
}

module.exports = { screenShotFunc };

