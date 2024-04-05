
## Basic Setup for App : Dependencies + Gdrive + Langsmith

"""### Setup and activate LangSmith :"""
import os
from dotenv import load_dotenv
from unstructured.partition.md import partition_md
import re
import json
import chromadb
import chromadb 
from langchain_openai import OpenAIEmbeddings
import chromadb.utils.embedding_functions as embedding_functions
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage

load_dotenv()

# this is setup of lc_key 
lc_key= os.getenv('lc_key')

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "rageshwar"
os.environ["LANGCHAIN_ENDPOINT"] = "https://api.smith.langchain.com"
os.environ["LANGCHAIN_API_KEY"] = lc_key

key = os.getenv('oai_key')

"""## Retrieval Augmented Generation :"""


## LOAD UNSTRUCTURED MARKDOWN LOADER AND THEN SPLIT THE DOCUMENTS ACCORDINGLY :


md_filepath = ('./CRO_advice(modified).md')
elements = partition_md(filename=md_filepath)


def split_markdown_into_sections_with_ids_and_list(markdown_file_path):
    documents_list = []  # List to store document content
    ids = []  # List to store the names of the sections which will act as IDs

    with open(markdown_file_path, 'r') as file:
        markdown_content = file.read()

    # Splitting the markdown content into sections based on the header pattern
    sections = re.split(r'\n### ', markdown_content)

    # Skipping the very first split if it does not contain a header
    if sections[0] and not sections[0].startswith('###'):
        sections = sections[1:]

    for section in sections:
        # Ensure the section has content before proceeding
        if not section.strip():
            continue

        # Extracting the header and content
        header, *content = section.split('\n', 1)
        header_clean = header.strip().rstrip(':').strip()
        content_clean = '\n'.join(content).strip()

        # Appending the cleaned header as the ID for the RAG system
        ids.append(header_clean)

        # Appending the cleaned content to the documents list
        documents_list.append(content_clean)

    return documents_list, ids

# Now let's call this function with the previously used markdown file path to get both the documents and the IDs
markdown_file_path = md_filepath
section_documents, section_ids = split_markdown_into_sections_with_ids_and_list(markdown_file_path)


"""### Load Embeddings to ChromaDB vectorstore :"""

# chroma = chromadb()

client = chromadb.PersistentClient(path= "./chroma")
embed_function = embedding_functions.OpenAIEmbeddingFunction(
                api_key=key,
                model_name="text-embedding-3-small"
            )

# Generate embeddings for each document

collection = client.get_or_create_collection(name = "CRO_so", embedding_function= embed_function)
vector= collection.upsert(documents= section_documents, ids=section_ids)


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

summprompt = ''' You are an expert in SHOPIFY, WORDPRESS and all other Website development tools. You have been tasked to analyse the content of the website from the perspective of CONVERSION rate
optimisation. You are going to be given an image along with CRO best practises per section that you need to look out for. Use the CRO_advice_context given to you to analyse the screenshot provided and give your final
CRO feedback based on the CRO_advice_context . To this feedback. Add a section called generic CRO tips where you give your own CRO advice also . Make sure your output gets straight to the feedback. No pre-text or post-text is necessary .

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
# with open('C:/Users/harsh/Desktop/cro_so/screenshots.json') as f:
with open('./screenshots.json') as f:
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


"""#### Setup the LCEL instances"""

# initialise the chat

model = ChatOpenAI(api_key= key, model= "gpt-4-vision-preview", temperature= 0.2, max_tokens=200)
prompt = ChatPromptTemplate.from_template(sysprompt)
parser = StrOutputParser()

#chain_first =

## Retrieving Page Sections from Image Chain :

msg = model(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": sysprompt},
                    {
                        "type": "image_url",
                        "image_url":desktop_urls[4]
                    }
                ]
            )
        ]
    )



rag= msg.to_json()
section= rag['kwargs']['content']
a= json.loads(section)

page_section = a['Page_Section']


"""#### Setup Retreived Best Practises :"""

ask3 = collection.query(query_texts=page_section, n_results = 1)
bestprac= ask3['documents']


flattened_text = " ".join([" ".join(block).replace('|', '').replace('\n', ' ') for block in bestprac])
print(flattened_text)

"""#### Second LCEL Chain :

##### Sumamrization Chain :
"""

model2 =  ChatOpenAI(api_key= key, model= "gpt-4-vision-preview", temperature= 0.4, max_tokens=500)
prompt2 = ChatPromptTemplate.from_template(summprompt)
parser = StrOutputParser()

chain2 = {'text': RunnablePassthrough()}| prompt2 | model2 | parser

summ = chain2.invoke({'text': flattened_text})

print(summ)