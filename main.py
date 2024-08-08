# import required dependencies
# https://docs.chainlit.io/integrations/langchain
import os
from langchain import hub
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.llms import Ollama
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
import chainlit as cl
from langchain.chains import RetrievalQA
from langchain.memory import ChatMessageHistory, ConversationBufferMemory

ABS_PATH: str = os.path.dirname(os.path.abspath(__file__))
DB_DIR: str = os.path.join(ABS_PATH, "newDB")


# Set up RetrievelQA model
rag_prompt_mistral = hub.pull("rlm/rag-prompt-mistral")


# from typing import List


from langchain.schema.vectorstore import VectorStoreRetriever
from langchain.callbacks.manager import CallbackManagerForRetrieverRun
from langchain.schema.document import Document
from typing import List
from langchain_core.runnables import chain


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
    llm = Ollama(
        model="mistral",
        verbose=True,
        callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]),
    )
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
    vectorstore = Chroma(
        persist_directory=DB_PATH, embedding_function=OllamaEmbeddings(model="mistral")
    )

    qa_chain = retrieval_qa_chain(llm, vectorstore)
    return qa_chain


@cl.on_chat_start
async def start():
    """
    Initializes the bot when a new chat starts.

    This asynchronous function creates a new instance of the retrieval QA bot,
    sends a welcome message, and stores the bot instance in the user's session.
    """
    chain = qa_bot()
    welcome_message = cl.Message(content="Starting the bot...")
    await welcome_message.send()
    welcome_message.content = (
        "Hi, Welcome to Chat With Documents using Ollama (mistral model) and LangChain."
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
    chain = cl.user_session.get("chain")
    cb = cl.AsyncLangchainCallbackHandler()
    cb.answer_reached = True
    
    res = await chain.acall(message.content, callbacks=[cb])
    
    answer = res['result']
   
    source_documents = res["source_documents"]

    text_elements = []  # type: List[cl.Text]

    vectorstore = Chroma(
        persist_directory=DB_DIR, embedding_function=OllamaEmbeddings(model="mistral")
    )

    metadocs = vectorstore.similarity_search_with_relevance_scores(message.content)

    if metadocs:
        source_names = []
        for source_ind,[source_doc,score] in enumerate(metadocs):
            relevance_score = score
            source = source_doc.metadata.get('source')
            file_name = os.path.basename(source)
            source_name = f"{source_ind+1}) {file_name}  [Relevance: {relevance_score}]"

            if(".pdf" in source):

                answer += f"\nRelevant File: {file_name}"

                text_elements.append(
                cl.Pdf(path=source, name=file_name,display="side"),
            )
            # print(source)
            # source_names.append(f"{source_name}  (Relevance: {relevance_score})")
            # Create the text element referenced in the message
            text_elements.append(
                cl.Text(content=source_doc.page_content, name=source_name),
            )          
        
        # source_names = [text_el.name for text_el in text_elements]
            

        # if source_names:
        #     answer += f"\nSources: {', '.join(source_names)}"
        # else:
        #     answer += "\nNo sources found"

    await cl.Message(content=answer, elements=text_elements).send()
