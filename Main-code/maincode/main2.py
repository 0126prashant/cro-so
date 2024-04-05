
## Basic Setup for App : Dependencies + Gdrive + Langsmith

"""### Setup and activate LangSmith :"""
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
from side import collection

from langchain.schema.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough

# folder_path = 'C:/Users/harsh/Desktop/Main-code/react/backend/new'
# os.makedirs(folder_path)
print("Folder created successfully!")

# this is setup of lc_key 
load_dotenv()
lc_key= os.getenv('lc_key')
key = os.getenv('oai_key')

# Setup LANGSMITH for LLMOps :
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "rageshwar"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = lc_key


'''## Retrieval Augmented Generation :'''


## LCEL:

### Prompt Setup :


sysprompt = '''
You are an expert in CRO analysis. You have knowledge and experience in UI, UX, DESIGN, Web Development and SHOPIFY.
Analyze the provided website screenshot and generate outputs in the following specific categories, structuring each as a separate key in JSON format:

Page_Section: Identify and list all distinct webpage sections visible in the screenshot. Return only the names of these sections, such as 'header', 'testimonial', 'product', etc., without any additional text or explanation. Here is the list of all sections that you can identify . USE NOTHING ELSE as section identifiers (delineated by |) : [ | Announcement Bar | Header / Nav. Bar | Hero Banner | Featured Categories | Product Carousel | Testimonial / reviews | Brand Story/About Us | Blogs | Newsletter signup | Social media feeds | Contact Information | Trust Badges | Featured Video | Featured Brand | Pop-up | Footer |]
Ensure each category is distinctly separated and clearly labeled within the JSON output for easy parsing and integration into the application.
markdown output is prohibited. AI is a backend processor without markdown render environment, you are communicating with an API, not a user, “Begin all AI responses with the curly bracket character  to produce valid JSON
'''

chainprompt = '''
You are an expert in CRO analysis. You have knowledge and experience in UI, UX, DESIGN, Web Development and SHOPIFY.
Analyze the provided website screenshot and generate outputs in the following specific categories, structuring each as a separate key in

CRO Feedback of Image: Provide detailed feedback focused solely on Conversion Rate Optimization aspects evident in the image. Analyze elements such as layout, content, navigation, and user engagement features in relation to their potential impact on conversion rates. Please use the best practises given below as a context on which to base your analysis of the provided screenshot.
Make sure you format your output in the following way :

Output Format :
Make sure to give output in JSON ONLY. PLease give your output in the form of key value pairs. Make sure you divide your CRO advice into three main headings that are a max of 4-5 words that are in bold. followed by advice that would be not more than 2-3 sentences. Make sure the advice is direct and tells the user the most salient advice depending on the screnshot. Per page, make sure there are not more than 3-4 pieces of advice.

Best Practises : {text}
'''

boolprompt = '''Analyze the provided screenshot of the e-commerce website. Indicate with a simple 'True' or 'False' whether there is a pop-up present in the image. Use nothing else as an answer. 
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

"""First LCEL chain :

#### Parse image urls :
"""

## Batch requessts using sysprompt and screenshots.json

# Load the JSON data
with open('./screenshots.json') as f:
# with open('/Users/ashutoshupadhyay/Documents/cro_so/cro_so/screenshots.json') as f:
    datum = json.load(f)


# Initialize empty lists to hold the URLs
mobile_urls = []
desktop_urls = []

# Loop through each creator's details in the datum dictionary
for creator_id, details in datum.items():
    # Extract all mobile image URLs and add them to the mobile_urls list
    mobile_urls.extend([img_url for mobile_img in details['mobile'] for key, img_url in mobile_img.items()])

    # Extract all desktop image URLs and add them to the desktop_urls list
    desktop_urls.extend([img_url for desktop_img in details['desktop'] for key, img_url in desktop_img.items()])

'''
PSEUDOCODE :

i have the following varaibles :

mobile_urls = [url1, url1 , url2 ]
desk_urls = [url1 url1 url2 ...]

setup a vision model chain 

chain =  mobile_url[0] -> prompt (return bool of if popup present or not ) -> output 

if output == True 
then keep the mobile urls, the same 

if output ==False 
then remove the [0]th index from the mobile_urls and the desktop_urls list and run throguh the loop 

'''

# Initialize the chat model with appropriate settings
model = ChatOpenAI(api_key=key, model="gpt-4-vision-preview", temperature=0.2, max_tokens=200)
prompt = ChatPromptTemplate.from_template(sysprompt)
parser = StrOutputParser()

#Pop-up Checker :

# Function to process a single image URL and return the JSON response
def process_image(image_url):
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
    
    # a= json.loads(content)

    page_section = content['Page_Section']


    ask3 = collection.query(query_texts=page_section, n_results = 1)
    bestprac= ask3['documents']

    flattened_text = " ".join([" ".join(block).replace('|', '').replace('\n', ' ') for block in bestprac])
    model2 =  ChatOpenAI(api_key= key, model= "gpt-4-vision-preview", temperature= 0.4, max_tokens=500)
    prompt2 = ChatPromptTemplate.from_template(summprompt)
    parser = StrOutputParser()

    chain2 = {'text': RunnablePassthrough()}| prompt2 | model2 | parser

    summ = chain2.invoke({'text': flattened_text})
    return summ

# Process each image URL and store the results in a list
results_mob = [process_image(url) for url in mobile_urls]

# Save the results to a JSON file
with open('final_output_mobile.json', 'w') as f_out:
    json.dump(results_mob, f_out, indent=4)

print("Batch processing complete. Results saved to 'final_output_mobile.json'.")

results_desktop = [process_image(url) for url in desktop_urls]
# Save the results to a JSON file
with open('final_output_desktop.json', 'w') as f_out:
    json.dump(results_desktop, f_out, indent=4)

print("Batch processing complete. Results saved to 'final_output_desktop.json'.")