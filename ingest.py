# import os
# import warnings

# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import (
#     DirectoryLoader,
#     PyPDFLoader,
# )
# from langchain_community.document_loaders import YoutubeLoader
# from langchain_community.embeddings import OllamaEmbeddings
# from langchain_community.vectorstores import Chroma

# import pytube as pt
# import whisper

# warnings.simplefilter("ignore")

# ABS_PATH: str = os.path.dirname(os.path.abspath(__file__))
# DB_DIR: str = os.path.join(ABS_PATH, "audio")


# # Create vector database
# def create_vector_database():
#     """
#     Creates a vector database using document loaders and embeddings.

#     This function loads data from PDF, markdown and text files in the 'data/' directory,
#     splits the loaded documents into chunks, transforms them into embeddings using OllamaEmbeddings,
#     and finally persists the embeddings into a Chroma vector database.

#     """
#     # Initialize loaders for different file types
#     pdf_loader = DirectoryLoader("data/", glob="**/*.pdf", loader_cls=PyPDFLoader)
#     loaded_documents = pdf_loader.load()
#     #len(loaded_documents)

#     # Loading video
#     # yt = pt.YouTube("https://www.youtube.com/watch?v=K0SBrexJNoI")
#     # stream = yt.streams.filter(only_audio=True)
#     # stream.download(output_path="audio/")


#     # loader = YoutubeLoader.from_youtube_url(
#     # "https://www.youtube.com/watch?v=1bUy-1hGZpI", add_video_info=None
#     # )
#     # transcript = loader.load()
#     # print(len(transcript))
#     # Transcripting the audio file

#     # model = whisper.load_model("base")
#     # result = model.transcribe("audio/yt_audio.mp3")
#     # text = result["text"]
#     # print(text)

#     # Split loaded documents into chunks
#     text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=40)
#     chunked_documents = text_splitter.split_documents(loaded_documents)
#     # len(chunked_documents)
#     # print(chunked_documents)

#     # Initialize Ollama Embeddings
#     ollama_embeddings = OllamaEmbeddings(model="mistral")

#     # Create and persist a Chroma vector database from the chunked documents
#     vector_database = Chroma.from_documents(
#         documents=chunked_documents,
#         embedding=ollama_embeddings,
#         persist_directory=DB_DIR,
#     )

#     vector_database.persist()
    
#     # query it
#     #query = "Who are the authors of the paper"
#     #docs = vector_database.similarity_search(query)


#     # print results
#     #print(docs[0].page_content)


# if __name__ == "__main__":
#     create_vector_database()




import os
import warnings
import chainlit as cl
from chainlit.input_widget import TextInput

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    DirectoryLoader,
    PyPDFLoader,
    YoutubeLoader
)
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

import pytube as pt
import whisper

warnings.simplefilter("ignore")

# video_directory = "video/"
# data_directory = None
# video_url = None

ABS_PATH: str = os.path.dirname(os.path.abspath(__file__))
DB_DIR: str = os.path.join(ABS_PATH, "newDB")
VD_DIR: str = os.path.join(ABS_PATH, "video")
DATA_DR: str = os.path.join(ABS_PATH, "data")
VID_URL: str = None


class Document:
    def __init__(self, page_content, metadata=None):
        self.page_content = page_content
        self.metadata = metadata if metadata is not None else {}

# Create vector database
def create_vector_database():
    """
    Creates a vector database using document loaders and embeddings.

    This function loads data from PDF, markdown and text files in the specified directory,
    splits the loaded documents into chunks, transforms them into embeddings using OllamaEmbeddings,
    and finally persists the embeddings into a Chroma vector database.
    
    If a video URL is provided, it downloads and transcribes the video as well.
    """
    loaded_documents = []

    model = whisper.load_model("base")

    # Initialize loaders for different file types
    if DATA_DR is not None:
        pdf_loader = DirectoryLoader(DATA_DR, glob="**/*.pdf", loader_cls=PyPDFLoader)
        loaded_documents += pdf_loader.load()

    # Loading and transcribing video if URL is provided
    # if video_url:
    #     yt = pt.YouTube(video_url)
    #     stream = yt.streams.filter(only_audio=True).first()
    #     # audio_path = os.path.join(data_directory, "yt_audio.mp3")
    #     stream.download(output_path=data_directory)

    #     model = whisper.load_model("base")
    #     result = model.transcribe(audio_path)
    #     text = result["text"]
    #     loaded_documents.append({"text": text})

    if VD_DIR is not None:
        for filename in os.listdir(VD_DIR):
            if filename.endswith(".mp4") or filename.endswith(".mkv") or filename.endswith(".avi"):
                video_path = os.path.join(VD_DIR, filename)
                result = model.transcribe(video_path)
                text = result["text"]
                loaded_documents.append(Document(page_content=text, metadata={"source": filename,"score": 0.0}))


    # print(loaded_documents)


    if VID_URL is not None:
        loader = YoutubeLoader.from_youtube_url(
        VID_URL, add_video_info=True
        )
        loaded_documents += loader.load()

    # Split loaded documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=40)
    chunked_documents = text_splitter.split_documents(loaded_documents)


    print(chunked_documents)

    # Initialize Ollama Embeddings
    ollama_embeddings = OllamaEmbeddings(model="mistral")

    # Create and persist a Chroma vector database from the chunked documents
    vector_database = Chroma.from_documents(
        documents=chunked_documents,
        embedding=ollama_embeddings,
        persist_directory=DB_DIR,
        collection_metadata={"hnsw:space": "cosine"}
    )

    vector_database.persist()

    

    return vector_database




# Add this check to make sure it doesn't run on import
if __name__ == "__main__":
    create_vector_database()
