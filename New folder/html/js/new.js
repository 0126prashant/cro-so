
function imageUrlToBase64(url, callback) {
    fetch(url, {
        method: 'GET',
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob();
    })
    .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            callback(base64data);
        };
    })
    .catch(error => {
        console.error('Error fetching or encoding image:', error);
        callback(null);
    });
}

const main = document.getElementById("dynamic-part");


function generatePdfWithJSPDF() {
    const ele = document.getElementById("pdf"); 
    const options = {
        margin: [10, 10, 10, 10], 
        filename: 'pdf_file.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        // html2canvas: { scale: 2, logging: true, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'pt',  format: 'a4', orientation: 'portrait' }
    }; 
    html2pdf()
    .set(options)
    .from(ele) 
    .outputPdf('arraybuffer') // Output as ArrayBuffer
    .then(pdfBuffer => {
        console.log("pdfBuffer", pdfBuffer); // Debugging log

        try {
            // Convert ArrayBuffer to base64
            const pdfBase64 = arrayBufferToBase64(pdfBuffer);
            console.log("mg1", pdfBase64); // Debugging log
          
            // Assuming you have a method to save the PDF to MongoDB, call it here
            savePdfToMongoDB(pdfBase64);
        } catch (error) {
            console.error("Error converting ArrayBuffer to base64:", error);
        }
    })
    .catch(error => {
        console.error("Error generating PDF:", error);
    });
}
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}


const creatorId = "65aa339fc9436036b5fbaec5"
function savePdfToMongoDB(pdfBase64, creatorId) {
    console.log("mg2");
    // Connect to MongoDB
    const MongoClient = require('mongodb').MongoClient;
    const uri = 'mongodb+srv://Prashant:som@cluster0.e4bu1fg.mongodb.net/crow_so?retryWrites=true&w=majority'; // Your MongoDB connection URI
    const dbName = 'crow_so';
    
    MongoClient.connect(uri, function(err, client) {
        if(err) throw err;
        
        const db = client.db(dbName);
        const collection = db.collection('users'); // Assuming your collection is named 'users'
        
        // Update the user document with the PDF file
        collection.updateOne(
            { _id: creatorId }, // Filter for the user document using the creator's ID
            { $set: { pdf: pdfBase64 } }, // Set the PDF field in the user document
            function(err, result) {
                if(err){
                   console.log("error-in-pdf",err);
                } 
                console.log('PDF file saved to user document in MongoDB');
                client.close();
            }
        );
    });
}


// Function to generate footer content-----------
function generateFooter() {

    let footerContainer = document.createElement('div');
    let innerContainer = document.createElement('div');
    let generatedByText = document.createElement('p');
    let logoImage = document.createElement('img');
    
    footerContainer.className = 'footer-mudcy';
    footerContainer.setAttribute('style', `
        display: flex;
        justify-content: flex-end;
        border: 2px solid;
        border-top: none;
        border-bottom: none;
        border-left: none;
        border-right: none;
        background-color: #e8fc00;`);
        
    innerContainer.setAttribute('style', `
        display: flex;
        align-items: center;
        height:40px`);
        
    generatedByText.innerHTML = 'Generated by';
    generatedByText.setAttribute('style', `
        margin-right: 10px;
        margin-top: 25px;`);
        
    logoImage.src = './assets/muducy-logo.png';
    logoImage.alt = 'Error in Muducy';
    logoImage.setAttribute('style', `
        height: 40px;
        width: auto;`);
    innerContainer.append(generatedByText, logoImage);
    footerContainer.append(innerContainer);

    return footerContainer;
}

// Function to display mobile content----------------
function mobile(data,index) {
    const mobileContainer = document.createElement("div");
    mobileContainer.classList.add("mobile-container");
    
    const mobileData = data.Mobile[index]
        // console.log("inde-des",index)
        const pageContainer = document.createElement("div");
        pageContainer.classList.add("page-container");

        const divMobile = document.createElement("div");
        divMobile.classList.add("Mobile-div");

        const divMobileImage = document.createElement("div");
        divMobileImage.classList.add("Mobile-div-image");

        const divMobileDesc = document.createElement("div");
        divMobileDesc.classList.add("Mobile-div-desc");

        const mobileImageTag = document.createElement("img");
        mobileImageTag.alt = "error in mobile image";

        imageUrlToBase64(mobileData.image_url, base64data => {
            if (base64data) {
                mobileImageTag.src = base64data;
            } else {
                console.log('Failed to fetch and encode image.');
            }
        });

        divMobileImage.appendChild(mobileImageTag);
        divMobile.appendChild(divMobileImage);
        divMobile.appendChild(divMobileDesc);

        mobileData.array.forEach((sectionObj, index) => {
            Object.values(sectionObj).forEach((sectionArr) => {
                sectionArr.forEach((section) => {
                    const pTag = document.createElement("p");
                    pTag.classList.add("advice");
                    const spanIndex = document.createElement("span");
                    spanIndex.textContent = `${index + 1}. `;
                    spanIndex.classList.add("index-number");
                    const spanHeading = document.createElement("span");
                    spanHeading.textContent = section.advice_heading + ": ";
                    spanHeading.classList.add("advice-heading");
                    const spanAdvice = document.createElement("span");
                    spanAdvice.textContent = section.advice;
                    spanAdvice.classList.add("advice-text");
                    pTag.appendChild(spanIndex);
                    pTag.appendChild(spanHeading);
                    pTag.appendChild(spanAdvice);
                    divMobileDesc.appendChild(pTag);
                });
            });
        });

        pageContainer.appendChild(divMobile);
        mobileContainer.appendChild(pageContainer);


    return mobileContainer;
}


function Desktop(data){
    for (let i =0; i <data.Desktop.length; i++) {

        const urlDes = data.Desktop[i]["image_url"];
        const DesktopDiv = document.createElement("div");
        const header = document.createElement("div");
        header.classList.add("main-heading");
        const h2Tag = document.createElement("h2");
        h2Tag.textContent = `${i+1}. ${data.Desktop[i]["main_heading"]}`;
        header.appendChild(h2Tag);
        
        const headerImageDiv = document.createElement("div");
        headerImageDiv.classList.add("mainbanner-div");
        const imgTag = document.createElement("img");
        imageUrlToBase64(urlDes, base64data => {
            if (base64data) {
                imgTag.src = base64data;
            } else {
                console.log('Failed to fetch and encode image.');
            }
        });
          
        imgTag.alt = "error in image1";
        headerImageDiv.appendChild(imgTag);
        
        const desktopDesc = document.createElement("div");
        desktopDesc.classList.add("desktopDesc-div");
        
        data.Desktop[i].array.forEach((sectionObj, index) => {
            Object.values(sectionObj).forEach((sectionArr) => {
                sectionArr.forEach((section) => {
                    const pTag = document.createElement("p");
                    pTag.classList.add("advice");
                    const spanIndex = document.createElement("span");
                    spanIndex.textContent = `${index + 1}. `;
                    spanIndex.classList.add("index-number");
                    const spanHeading = document.createElement("span");
                    spanHeading.textContent = section.advice_heading + ": ";
                    spanHeading.classList.add("advice-heading");
                    const spanAdvice = document.createElement("span");
                    spanAdvice.textContent = section.advice;
                    spanAdvice.classList.add("advice-text");
                    pTag.appendChild(spanIndex);
                    pTag.appendChild(spanHeading);
                    pTag.appendChild(spanAdvice);
                    desktopDesc.appendChild(pTag);
                });
            });
        });

        DesktopDiv.append(header,headerImageDiv,desktopDesc);
        return DesktopDiv
    }
}


function afterDesktopAndMobile(data) {
    const container = document.createElement("div");

    // Iterate through the Mobile data
    for (let i = data.Desktop.length; i < data.Mobile.length; i += 2) {
        const mainChildDM = document.createElement("div");
        mainChildDM.classList.add("mainChildDM-div");
        mainChildDM.style.cssText = `
            background-color: #E8FC00;
            margin-top: 50px;
            border: 2px solid black;
            display: grid;
            grid-template-columns: 1fr 1fr;
            height:1060px;
        `;

        // Define the limit for the current iteration to handle the last item if it's an odd number
        const limit = Math.min(i + 2, data.Mobile.length);

        // Process each item within the current iteration limit
        for (let j = i; j < limit; j++) {
            const mobData = data.Mobile[j];

            // Image Div
            const imageDiv = document.createElement("div");
            imageDiv.style.border = "2px solid black";
            const mobileImageTag = document.createElement("img");
            mobileImageTag.classList.add("img-in-afterfn")
            imageUrlToBase64(mobData.image_url, base64data => {
                if (base64data) {
                    mobileImageTag.src = base64data;
                } else {
                    console.log('Failed to fetch and encode image.');
                }
            });
            mobileImageTag.alt = "Mobile image";
            imageDiv.appendChild(mobileImageTag);

            // Description Div
            const descriptionDiv = document.createElement("div");
            descriptionDiv.classList.add("dsc-afterfn")
            // descriptionDiv.style.border = "2px solid black";
            descriptionDiv.style.padding = "20px";
            mobData.array.forEach((sectionObj, index) => {
                Object.values(sectionObj).forEach((sectionArr) => {
                    sectionArr.forEach((section) => {
                        // const pTag = document.createElement("p");
                        // pTag.textContent = `${index + 1}. ${section.advice_heading}: ${section.advice}`;
                        const pTag = document.createElement("p");
                        pTag.classList.add("advice");
                        pTag.classList.add("adv");
                        const spanIndex = document.createElement("span");
                        spanIndex.textContent = `${index + 1}. `;
                        spanIndex.classList.add("index-number");
                        const spanHeading = document.createElement("span");
                        spanHeading.textContent = section.advice_heading + ": ";
                        spanHeading.classList.add("advice-heading");
                        spanHeading.classList.add("adv-heading");
                        const spanAdvice = document.createElement("span");
                        spanAdvice.textContent = section.advice;
                        spanAdvice.classList.add("advice-text");
                        spanAdvice.classList.add("adv-heading-txt");
                        pTag.appendChild(spanIndex);
                        pTag.appendChild(spanHeading);
                        pTag.appendChild(spanAdvice);
                        descriptionDiv.appendChild(pTag);
                    }); 
                });
            });
            if (j%2 === 0) {
                descriptionDiv.style.order = 1;
                imageDiv.style.order = 2;
            } else {
                imageDiv.style.order = 1;
                descriptionDiv.style.order = 2;
            }
            mainChildDM.appendChild(descriptionDiv);
            mainChildDM.appendChild(imageDiv);
        }

                // ------------Powewred by mudcy-------->>>>>>
        // Create the footer container
const footerContainer = document.createElement("div");
footerContainer.classList.add("footer-mudcy");
footerContainer.style.display = "flex";
// footerContainer.style.marginBottom = "50px";
footerContainer.style.justifyContent = "flex-end";
footerContainer.style.border = "2px solid";
footerContainer.style.borderTop = "none";
footerContainer.style.backgroundColor = "#E8FC00";

// Create the inner container for the "Generated By" text and logo
const innerContainer = document.createElement("div");
innerContainer.style.display = "flex";
innerContainer.style.alignItems = "center";

// Create and append the "Generated By" text
const generatedByText = document.createElement("p");
generatedByText.textContent = "Generated By";
generatedByText.style.marginRight = "10px";
generatedByText.style.marginTop = "25px";
innerContainer.appendChild(generatedByText);

// Create and append the logo image
const logoImage = document.createElement("img");
logoImage.src = "./assets/muducy-logo.png";
logoImage.alt = "error-in-mudcy";
logoImage.style.height = "40px";
logoImage.style.width = "auto";
innerContainer.appendChild(logoImage);

// Append the inner container to the footer container
footerContainer.appendChild(innerContainer);

        container.append(mainChildDM,footerContainer);
    }

    return container;
}


function Display(data){
    
        for (let i =0; i <data.Desktop.length; i++) {
            let index = i
            const mainChild = document.createElement("div")
            mainChild.style.backgroundColor = "#E8FC00";
            mainChild.style.marginTop = "50px";
            mainChild.style.border = "2px solid black";
            mainChild.style.height = "1060px";
    
            mainChild.append(Desktop(data),mobile(data,index),generateFooter());
            main.append(mainChild);
        }
        
        main.appendChild(afterDesktopAndMobile(data));  
}


const fileName = "db.json";
fetch(fileName) 
  .then(response => response.json()) 
  .then(data => {
      Display(data);
  })
  .catch(error => console.error('Error fetching data:', error));

document.getElementById("download-btn").addEventListener("click", generatePdfWithJSPDF);
