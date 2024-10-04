How to run the application?
## Backend -
i. Create a folder named 'files' in the backend section.
ii. run the command 'uvicorn app:app --host 0.0.0.0 --port 80' in the terminal. 

## Frontend/chatbot folder - 
iii. run the command 'npm run dev' in the terminal.


Most of the requirements for the project should be satisfied by the provided requirements.txt file (backend folder) and npm packages mentioned in package.json file(frontend/chatbot folder) .


## Note:

**For the working of llm model and Embedding Model (locally)**

*Ollama - Mistral-7B Model Should be configured in the system.
**Reference** - https://ollama.com/library/mistral*

**For the working of llm model and Embedding Model (using huggingface)**

 *Mistral-7B is used using the huggingfaceendpoint and the access token is stored in a .env file.
 **Reference** - https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3*

**For the generation of transcript from an uploaded video file**

*OpenAI-Whisper model should be configured (Available as a package) [should be updated in the requirements.txt and hence might not require external configurement]*

*Ffmpeg must be downloaded and configured in the system (including updation of path variable in windows environment) 
**Reference** - https://www.ffmpeg.org/download.html*
