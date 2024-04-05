
// // chain.batch([{ “url” : “<actual url1 >” }, {“url”: “<url2>” } …..and so on ])

const fs = require('fs');

const filePath = 'feedback.txt';

fs.readFile(filePath, 'utf8', (err, fileContent) => {
    if (err) {
        console.error(err);
        return;
    }

    // Define the regex pattern to match image URLs, device type, and img_key
    const regex = /'device_type':\s*'([^']+)',\s*'img_key':\s*'([^']+)',\s*'url':\s*'([^']+\.jpg)'/g;

    // Use the regex pattern to extract device type, img_key, and image URLs from the fileContent
    const imageDetails = [];
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
        // console.log("match-----",match)
        const deviceType = match[1];
        const imgKey = match[2];
        const url = match[3];
        imageDetails.push({ "device_type": deviceType, "img_key": imgKey, "url": url });
    }

    console.log("Formatted Image URLs:", imageDetails);
});


// const fs = require('fs');

// const filePath = 'feedback.txt';

// fs.readFile(filePath, 'utf8', (err, fileContent) => {
//     if (err) {
//         console.error(err);
//         return;
//     }

//     // Define the regex pattern to match image URLs
//     const regex = /'url':\s*'([^']+\.jpg)'/g;

//     // Use the regex pattern to extract image URLs from the fileContent
//     const imageUrls = [];
//     let match;
//     while ((match = regex.exec(fileContent)) !== null) {
//         imageUrls.push({ "url": match[1] });
//     }

//     console.log("Formatted Image URLs:", imageUrls);
// });




