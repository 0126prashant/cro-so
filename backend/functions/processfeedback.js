const dotenv = require('dotenv');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage } = require('@langchain/core/messages');
const { PromptTemplate } = require('@langchain/core/prompts');
const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');
const axios = require('axios');

dotenv.config();

const mongodb_uri = process.env.MongoUrl;
const client = new MongoClient(mongodb_uri);
const db = client.db('crow_so');

const lc_key = process.env.lc_key;
const key = process.env.oai_key;

// AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Setup LANGSMITH for LLMOps
process.env.LANGCHAIN_TRACING_V2 = 'true';
process.env.LANGCHAIN_PROJECT = 'rageshwar';
process.env.LANGCHAIN_ENDPOINT = 'https://api.smith.langchain.com';
process.env.LANGCHAIN_API_KEY = lc_key;

const sysprompt = `
You are an expert in CRO analysis. You have knowledge and experience in UI, UX, DESIGN, Web Development and SHOPIFY.
Analyze the provided website screenshot and generate outputs in the following specific categories, structuring each as a separate key in JSON format:

Page_Section: Identify and list all distinct webpage sections visible in the screenshot. Return only the names of these sections, such as 'header', 'testimonial', 'product', etc., without any additional text or explanation. Here is the list of all sections that you can identify . USE NOTHING ELSE as section identifiers (delineated by |) : [ | Announcement Bar | Header / Nav. Bar | Hero Banner | Featured Categories | Product Carousel | Testimonial / reviews | Brand Story/About Us | Blogs | Newsletter signup | Social media feeds | Contact Information | Trust Badges | Featured Video | Featured Brand | Pop-up | Footer |]
Ensure each category is distinctly separated and clearly labeled within the JSON output for easy parsing and integration into the application.
markdown output is prohibited. AI is a backend processor without markdown render environment, you are communicating with an API, not a user, "Begin all AI responses with the curly bracket character  to produce valid JSON
`;

const summprompt = `
You are an expert in SHOPIFY, WORDPRESS and all other Website development tools. You have been tasked to analyse the content of the website from the perspective of CONVERSION rate
optimisation. You are going to be given an image along with CRO best practises per section that you need to look out for. Use the CRO_advice_context given to you to analyse the screenshot provided and give your final
CRO feedback based on the CRO_advice_context AND the screenshot provided. To this feedback. Add a section called Super CRO tip where you give your own CRO advice also . Make sure your output gets straight to the feedback. No pre-text or post-text is necessary . Make your output as relevant to the image provided as possible .

best practises = {text}
Give answer in JSON only. Please seperate the entire CRO adivce into 3-4 main advice points. Divide the output in the following way :
"advice_heading_1" : "heading of first advice in 3-5 words. Eg. Engaging Copy and VIsible CTA",
"advice_1" : "Craft compelling copy that resonates with the target audience and place a clear, highly visible call-to-action button that stands out against the banner background to encourage clicks." ,
"advice_heading_2" : "High-Quality Imagery"
"advice_2" : "Utilize crisp, high-resolution images for the collection banner to capture attention and convey product quality. Ensure fast loading times despite the higher image quality with proper file optimization."
each page should have maximum 3-4 pieces of advice. Each advice should be around 3-4 sentences long and should be relevant to the page section on display .  please structure your output accordingly . please think step by step . this is make or break for my career.
`;

async function uploadToS3(imageUrl, key) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/png'
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.Location);
    });
  });
}

async function processImage(imageUrl, creatorId) {
    const model = new ChatOpenAI({
        openAIApiKey: key,
        modelName: 'gpt-4-vision-preview',
        temperature: 0.2,
        maxTokens: 200,
      });
    
  const response = await model.call([
    new HumanMessage({
      content: [
        { type: 'text', text: sysprompt },
        { type: 'image_url', image_url: imageUrl },
      ],
    }),
  ]);

  const content = JSON.parse(response.content);
  const pageSection = content.Page_Section || [];

  const flattenedText = pageSection.map(section => section.replace(/\|/g, '').replace(/\n/g, ' ')).join(' ');

  const model2 = new ChatOpenAI({
    openAIApiKey: key,
    modelName: 'gpt-4-vision-preview',
    temperature: 0.4,
    maxTokens: 500,
  });

  const prompt2 = new PromptTemplate({
    template: summprompt,
    inputVariables: ['text'],
  });

  const chain2 = await prompt2.format({ text: flattenedText });
  const summ = await model2.call([new HumanMessage(chain2)]);

  try {
    const content2 = JSON.parse(summ.content);
    return {
      image_url: imageUrl,
      page_section: pageSection,
      cro_feedback: content2,
      creatorID: creatorId,
    };
  } catch (error) {
    console.error(`Error decoding JSON response for image URL: ${imageUrl}`);
    return null;
  }
}

async function processFeedback(creatorId) {
  try {
    await client.connect();
    const websiteInfoCollection = db.collection('websiteinfos');
    const pdffeedbackCollection = db.collection('pdffeedback');

    const websiteDocuments = await websiteInfoCollection.find({ creatorID: creatorId }).toArray();

    if (websiteDocuments.length === 0) {
      console.log(`No documents found for creator ID: ${creatorId}`);
      return;
    }

    const datum = websiteDocuments.reduce((acc, doc) => {
      if (doc.creatorID === creatorId) {
        acc[creatorId] = doc;
      }
      return acc;
    }, {});

    const mobileUrls = [];
    const desktopUrls = [];

    for (const [, details] of Object.entries(datum)) {
      details.mobile?.forEach(mobileImage => {
        mobileUrls.push(Object.values(mobileImage)[0]);
      });
      details.desktop?.forEach(desktopImage => {
        desktopUrls.push(Object.values(desktopImage)[0]);
      });
    }

    console.log('Mobile URLs:', mobileUrls);
    console.log('Desktop URLs:', desktopUrls);

    const processAndUpload = async (url, device) => {
      try {
        const result = await processImage(url, creatorId);
        if (result) {
          const s3Key = `${creatorId}/${device}/${Date.now()}.png`;
          const s3Url = await uploadToS3(url, s3Key);
          result.s3_url = s3Url;
          return result;
        }
        return null;
      } catch (error) {
        console.error(`Error processing ${device} image URL: ${url}`);
        console.error(`Error message: ${error.message}`);
        return null;
      }
    };

    const mobileResults = await Promise.all(mobileUrls.map(url => processAndUpload(url, 'mobile')));
    const desktopResults = await Promise.all(desktopUrls.map(url => processAndUpload(url, 'desktop')));

    const validMobileResults = mobileResults.filter(result => result !== null);
    const validDesktopResults = desktopResults.filter(result => result !== null);

    await Promise.all([
      ...validMobileResults.map(feedback => pdffeedbackCollection.insertOne({ ...feedback, device: 'mobile' })),
      ...validDesktopResults.map(feedback => pdffeedbackCollection.insertOne({ ...feedback, device: 'desktop' })),
    ]);

    console.log("Feedback data saved to the 'pdffeedback' collection in the 'cro_so' database");
    console.log(`creatorId: ${creatorId}`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
  }
}

module.exports = { processFeedback };
