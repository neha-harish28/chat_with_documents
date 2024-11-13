# Document Based Chat Application and Retrieval

This chat application is designed to provide accurate, contextually relevant answers to user queries based on the documents the user provides. The application helps in managing extensive research notes, technical documentation or any other heavy documentations by quickly finding specific information and analyzing the content in real-time.


## Key features

* Document-Based Query Response: Upload one or multiple documents, and ask questions directly related to their content.
* Multiple formats accepted: The application can read from multiple document formats including pdf files, video formats and audio formats.
* Chat interface: The application provides a chat based interface and hence the user can interact with the application as though the application were a human.
* Context Relevance Scoring: Each response includes a relevance score that indicates how closely the provided answer matches the context of your question.
* Quick document access: The query related documents can be accessed quickly and directly in the interface and the user need not search for the specific document among multiple other documents when receiving the answer to a given query from the application.

## How it Works?
* A custom interface is used where the user can provide the documents which are used for the context of the conversation.
* The provided documents are loaded using document loaders and broken into chunks. Document loaders available under Langchain are used.
* The chunks of text produced are sent to an embeddings generator model. It converts raw text data into a set of numerical values called embeddings. Embeddings are vectors of real numbers which capture the semantics, patterns and relationship in the data.
  - The embeddings model used :- bge-m3 model
* The generated embeddings are stored in a vector store (database) which will be the knowledge base of the application.
  - The vector store used :- ChromaDB
* The user input is taken in the custom interface which is converted into embeddings and is used to search for similarities in the vector store.
  - Chainlit modules have been used to ease the interface between the custom frontend and the chat application backend.
* The obtained results are then sent to an LLM model which is responsible for answering the user  specifically with the context provided(i.e the documents).
  - LLM model used :- mistral-7b-instruct

Figure below summarizes the process - 

![image](https://github.com/user-attachments/assets/1cef926b-0610-44d2-acef-b5804c8034e4)






# How to run the application?
## Backend -
* Create a folder named 'files' in the backend section.

* run the command 'uvicorn app:app --host 0.0.0.0 --port 80' in the terminal. 

## Frontend/chatbot folder - 
* run the command 'npm run dev' in the terminal.


Most of the requirements for the project should be satisfied by the provided requirements.txt file (backend folder) and npm packages mentioned in package.json file(frontend/chatbot folder) .


## Note:

**For the working of llm model and Embedding Model (locally)**

*Ollama - Mistral-7B Model Should be configured in the system.
**Reference** - https://ollama.com/library/mistral*

**For the working of llm model and Embedding Model (using huggingface)**

 *Mistral-7B is used using the huggingfaceendpoint and the access token is stored in a .env file.
 **Reference** - https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2*

**For the generation of transcript from an uploaded video file**

*OpenAI-Whisper model should be configured (Available as a package) [should be updated in the requirements.txt and hence might not require external configurement]*

*Ffmpeg must be downloaded and configured in the system (including updation of path variable in windows environment) 
**Reference** - https://www.ffmpeg.org/download.html*
