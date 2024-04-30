import os
from dotenv import load_dotenv
import json
from langchain_openai import OpenAIEmbeddings
import chromadb.utils.embedding_functions as embedding_functions
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage
from langchain.schema.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough
from pymongo import MongoClient
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')


load_dotenv()
# Replace 'your_mongodb_uri' with your MongoDB connection string
mongodb_uri = os.getenv('MongoUrl')
client = MongoClient(mongodb_uri)
db = client['crow_so']  # Access the 'cro.so' database

# this is setup of lc_key 
lc_key = os.getenv('lc_key')
key = os.getenv('oai_key')

# Setup LANGSMITH for LLMOps :
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "rageshwar"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = lc_key

sysprompt = '''
You are an expert in CRO analysis. You have knowledge and experience in UI, UX, DESIGN, Web Development and SHOPIFY.
Analyze the provided website screenshot and generate outputs in the following specific categories, structuring each as a separate key in JSON format:

Page_Section: Identify and list all distinct webpage sections visible in the screenshot. Return only the names of these sections, such as 'header', 'testimonial', 'product', etc., without any additional text or explanation. Here is the list of all sections that you can identify . USE NOTHING ELSE as section identifiers (delineated by |) : [ | Announcement Bar | Header / Nav. Bar | Hero Banner | Featured Categories | Product Carousel | Testimonial / reviews | Brand Story/About Us | Blogs | Newsletter signup | Social media feeds | Contact Information | Trust Badges | Featured Video | Featured Brand | Pop-up | Footer |]
Ensure each category is distinctly separated and clearly labeled within the JSON output for easy parsing and integration into the application.
markdown output is prohibited. AI is a backend processor without markdown render environment, you are communicating with an API, not a user, "Begin all AI responses with the curly bracket character  to produce valid JSON
'''

summprompt = ''' You are an expert in SHOPIFY, WORDPRESS and all other Website development tools. You have been tasked to analyse the content of the website from the perspective of CONVERSION rate
optimisation. You are going to be given an image along with CRO best practises per section that you need to look out for. Use the CRO_advice_context given to you to analyse the screenshot provided and give your final
CRO feedback based on the CRO_advice_context AND the screenshot provided. To this feedback. Add a section called Super CRO tip where you give your own CRO advice also . Make sure your output gets straight to the feedback. No pre-text or post-text is necessary . Make your output as relevant to the image provided as possible .

best practises = {text}
Give answer in JSON only. Please seperate the entire CRO adivce into 3-4 main advice points. Divide the output in the following way :
"advice_heading_1" : "heading of first advice in 3-5 words. Eg. Engaging Copy and VIsible CTA",
"advice_1" : "Craft compelling copy that resonates with the target audience and place a clear, highly visible call-to-action button that stands out against the banner background to encourage clicks." ,
"advice_heading_2" : "High-Quality Imagery"
"advice_2" : "Utilize crisp, high-resolution images for the collection banner to capture attention and convey product quality. Ensure fast loading times despite the higher image quality with proper file optimization."
each page should have maximum 3-4 pieces of advice. Each advice should be around 3-4 sentences long and should be relevant to the page section on display .  please structure your output accordingly . please think step by step . this is make or break for my career.
'''

website_info_collection = db['websiteinfos'] 


#if __name__ == "__main__":
creator_id = sys.argv[1]
print(f"Received creatorID: {creator_id}")

#creator_id = "65f292f6d1bd319d680e572f" 
website_documents = list(website_info_collection.find({"creatorID": creator_id}))

if not website_documents:
    print(f"No documents found for creator ID: {creator_id}")
else:
    datum = {str(doc['creatorID']): doc for doc in website_documents if str(doc.get('creatorID')) == creator_id}

    mobile_urls = []
    desktop_urls = []

    for creator_id, details in datum.items():
        for mobile_image in details.get('mobile', []):
            mobile_url = list(mobile_image.values())[0]
            mobile_urls.append(mobile_url)
        for desktop_image in details.get('desktop', []):
            desktop_url = list(desktop_image.values())[0]
            desktop_urls.append(desktop_url)

            # Print the image URLs
    print("Mobile URLs:")
    for url in mobile_urls:
        print(url)

    print("\nDesktop URLs:")
    for url in desktop_urls:
        print(url)

    model = ChatOpenAI(api_key=key, model="gpt-4-vision-preview", max_tokens=200)
    prompt = ChatPromptTemplate.from_template(sysprompt)
    parser = StrOutputParser()

def process_image(image_url, creator_id):
    msg = model(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": sysprompt},
                    {"type": "image_url", "image_url": image_url}
                ]
            )
        ]
    )
    response = msg.to_json()
    content = json.loads(response['kwargs']['content'])

    page_section = content.get('Page_Section', [])

    flattened_text = " ".join([section.replace('|', '').replace('\n', ' ') for section in page_section])
    model2 = ChatOpenAI(api_key=key, model="gpt-4-vision-preview", max_tokens=500)
    prompt2 = ChatPromptTemplate.from_template(summprompt)
    parser = StrOutputParser()

    chain2 = {'text': RunnablePassthrough()} | prompt2 | model2 | parser

    try:
        summ = chain2.invoke({'text': flattened_text})
        content2 = json.loads(summ)
        return {
            "image_url":image_url,
            'page_section': page_section,
            'cro_feedback': content2,
            'creatorID': creator_id
        }
    except json.JSONDecodeError:
        print(f"Error decoding JSON response for image URL: {image_url}")
        return None

pdffeedback_collection = db["pdffeedback"]

mobile_results = []
for url in mobile_urls:
    try:
        result = process_image(url, creator_id)
        if result is not None:
            mobile_results.append(result)
    except Exception as e:
        print(f"Error processing mobile image URL: {url}")
        print(f"Error message: {str(e)}")

desktop_results = []
for url in desktop_urls:
    try:
        result = process_image(url, creator_id)
        if result is not None:
            desktop_results.append(result)
    except Exception as e:
        print(f"Error processing desktop image URL: {url}")
        print(f"Error message: {str(e)}")

# Save mobile and desktop feedback to the "pdffeedback" collection
for feedback in mobile_results:
    feedback['device'] = 'mobile'
    pdffeedback_collection.insert_one(feedback)

for feedback in desktop_results:
    feedback['device'] = 'desktop'
    pdffeedback_collection.insert_one(feedback)

print("Feedback data saved to the 'pdffeedback' collection in the 'cro_so' database")
print(f"crtrid pyhtomn: {creator_id}")

# html_file_path = f"https://6630d791e579b2d4dc5e9565--scintillating-pithivier-acef6d.netlify.app/?creatorID={creator_id}"
# webbrowser.open_new_tab(html_file_path)
# file = "https://6630db5fce04abd9c63959cb--cool-churros-d6977d.netlify.app/"
# webbrowser.open(file)
driver = webdriver.Chrome(executable_path='/usr/bin/chromedriver', options=options)

html_file_path = f"https://6630d791e579b2d4dc5e9565--scintillating-pithivier-acef6d.netlify.app/?creatorID={creator_id}"
driver.get(html_file_path)

