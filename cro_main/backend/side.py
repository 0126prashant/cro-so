from unstructured.partition.md import partition_md
import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from main import key
import re

## LOAD UNSTRUCTURED MARKDOWN LOADER AND THEN SPLIT THE DOCUMENTS ACCORDINGLY :
# md_filepath = ('/Users/ashutoshupadhyay/Documents/cro_so/cro_so/CRO_advice(modified).md')
md_filepath = ('./CRO_advice(modified).md')
elements = partition_md(filename=md_filepath)

# Function to Split Markdown and convert into a list  with both documents and ids. 
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
'''CODE BLOCK FROM A DIFFERENT PYTHON FILE '''
markdown_file_path = md_filepath
section_documents, section_ids = split_markdown_into_sections_with_ids_and_list(markdown_file_path)


"""### Load Embeddings to ChromaDB vectorstore :"""

client = chromadb.PersistentClient(path= "./chroma")
embed_function = embedding_functions.OpenAIEmbeddingFunction(
                api_key=key,
                model_name="text-embedding-3-small"
            )

# Generate embeddings for each document

collection = client.get_or_create_collection(name = "CRO_so", embedding_function= embed_function)
vector= collection.upsert(documents= section_documents, ids=section_ids)
