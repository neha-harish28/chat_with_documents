import os
from langchain import hub
from dotenv import load_dotenv
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
# from langchain_community.llms import huggingface_endpoint

from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
import chainlit as cl
from langchain.chains import RetrievalQA
from langchain.memory import ChatMessageHistory, ConversationBufferMemory
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
import huggingface_hub
from langchain_community.llms import HuggingFaceEndpoint

ABS_PATH: str = os.path.dirname(os.path.abspath(__file__))
DB_DIR: str = os.path.join(ABS_PATH, "newEmb")
huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")

# Set up RetrievelQA model
rag_prompt_mistral = hub.pull("rlm/rag-prompt-mistral")


# from typing import List


from langchain.schema.vectorstore import VectorStoreRetriever
from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from langchain.schema.document import Document
from typing import List
from langchain_core.runnables import chain
from langchain.llms import HuggingFacePipeline
# @chain
# def retriever(query: str) -> List[Document]:
#     docs, scores = zip(*vectorstore.similarity_search_with_score(query))
#     for doc, score in zip(docs, scores):
#         doc.metadata["score"] = score

#     return docs


class MyVectorStoreRetriever(VectorStoreRetriever):
    # See https://github.com/langchain-ai/langchain/blob/61dd92f8215daef3d9cf1734b0d1f8c70c1571c3/libs/langchain/langchain/vectorstores/base.py#L500
    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> List[Document]:
        docs_and_similarities = (
            self.vectorstore.similarity_search_with_relevance_scores(
                query, **self.search_kwargs
            )
        )

        # Make the score part of the document metadata
        for doc, similarity in docs_and_similarities:
            doc.metadata['score'] = similarity

        docs = [doc for doc, _ in docs_and_similarities]
        # print(f"docs: {docs}")
        return docs


def load_model():

    # Local Mistral Model
    # llm = Ollama(
    #     model="mistral",
    #     verbose=True,
    #     callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]),
    #     temperature=0.7,
    # )

    # Accessing Mistral Model from Hugging Face Hub
    
    model_id = "mistralai/Mistral-7B-Instruct-v0.3"  # Replace with the correct model ID
    



    # pipe = pipeline(
    #     task="text-generation",   # Define the task
    #     model=model_id,                # Remote model instance
    #     tokenizer=model_id,            # Remote tokenizer instance
    #     # use_auth_token=HUGGINGFACEHUB_API_TOKEN,  
    #     max_length=512,           # Adjust generation parameters
    #     temperature=0.7,
    #     top_p=0.95,
    #     repetition_penalty=1.1,
    # )

    llm = HuggingFaceEndpoint(
        repo_id = model_id,
        huggingfacehub_api_token=huggingface_api_key,
        temperature=0.5,
    )

    # llm = HuggingFacePipeline(pipeline=pipe)

    return llm


def retrieval_qa_chain(llm, vectorstore):

    message_history = ChatMessageHistory()

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        output_key="result",
        chat_memory=message_history,
        return_messages=True,
    )

    



    qa_chain = RetrievalQA.from_chain_type(
        llm,
        retriever = vectorstore.as_retriever(),
        chain_type_kwargs={"prompt": rag_prompt_mistral},
        return_source_documents=True,
        memory=memory,
    )
    return qa_chain


def qa_bot():
    llm = load_model()
    DB_PATH = DB_DIR

    model_name = "BAAI/bge-m3"
    # hf_embeddings = HuggingFaceEndpoint(repo_id=model_name)
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": True}
    hf_embeddings = HuggingFaceBgeEmbeddings(
        model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
    )

    # Using Bge Embeddings
    vectorstore = Chroma(
        persist_directory=DB_PATH, embedding_function=hf_embeddings
    )

    # Using Ollama Embeddings
    # vectorstore = Chroma(
    #     persist_directory=DB_PATH, embedding_function=OllamaEmbeddings(model="mistral")
    # )

    qa = retrieval_qa_chain(llm, vectorstore)
    return qa


@cl.on_chat_start
async def start():
    """
    Initializes the bot when a new chat starts.

    This asynchronous function creates a new instance of the retrieval QA bot,
    sends a welcome message, and stores the bot instance in the user's session.
    """
    print("hello")

    load_dotenv()

    chain = qa_bot()
    welcome_message = cl.Message(content="Starting the bot...")
    await welcome_message.send()
    welcome_message.content = (
        "Hi, Welcome to Chat With Documents using mistral-7b model and LangChain."
    )
    await welcome_message.update()
    cl.user_session.set("chain", chain)


@cl.on_message
async def main(message):
    """
    Processes incoming chat messages.

    This asynchronous function retrieves the QA bot instance from the user's session,
    sets up a callback handler for the bot's response, and executes the bot's
    call method with the given message and callback. The bot's answer and source
    documents are then extracted from the response.
    """
    print("Hello")

    chain = cl.user_session.get("chain")
    cb = cl.AsyncLangchainCallbackHandler()
    cb.answer_reached = True
    
    res = await chain.acall(message.content, callbacks=[cb])
    
    answer = res['result']
    answer += "\n"
   
    # source_documents = res["source_documents"]

    text_elements = []  # type: List[cl.Text]

    # Using Hugging Face Bge Embeddings
    model_name = "BAAI/bge-m3"
    # hf_embeddings = HuggingFaceEndpoint(endpoint_url=model_name)
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": True}
    hf_embeddings = HuggingFaceBgeEmbeddings(
        model_name=model_name, model_kwargs=model_kwargs, encode_kwargs=encode_kwargs
    )


    vectorstore = Chroma(
        persist_directory=DB_DIR, embedding_function=hf_embeddings
    ) 
    
    metadocs = vectorstore.similarity_search_with_relevance_scores(message.content)
    
    # Define a relevance score threshold
    RELEVANCE_THRESHOLD = 0.2
    relevant_docs_found = False

    if metadocs:

        for source_ind, [source_doc, score] in enumerate(metadocs):
            relevance_score = score
            if relevance_score >= RELEVANCE_THRESHOLD:
                relevant_docs_found = True
                source = source_doc.metadata.get('source')
                file_name = os.path.basename(source)
                source_name = f"{source_ind+1}) {file_name}  [Relevance: {relevance_score}]"

                if ".pdf" in source:
                    answer += f"\nRelevant File: {file_name}"
                    text_elements.append(
                        cl.Pdf(path=source, name=file_name, display="side"),
                    )
                
                if file_name.endswith(".mp4") or file_name.endswith(".mkv") or file_name.endswith(".avi"):
                    answer += f"\nRelevant Video: {file_name}"
                    text_elements.append(
                        cl.Video(path=source, name=file_name, display="side"),
                    )
                
                text_elements.append(
                    cl.Text(content=source_doc.page_content, name=source_name),
                )

    if not relevant_docs_found:
        answer += "\nNo highly relevant document found."

    await cl.Message(content=answer, elements=text_elements).send()
