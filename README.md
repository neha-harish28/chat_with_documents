## Backend -
uvicorn app:app --host 0.0.0.0 --port 80 

## Frontend/chatbot folder - 
npm run dev





Most of the requirements for the project should be satisfied by the provided requirements.txt file (backend folder) and npm packages mentioned in package.json file(frontend/chatbot folder) .


## Note:

**For the working of llm model and Embedding Model**

*Ollama - Mistral-7B Model Should be configured in the system.
**Reference** - https://ollama.com/library/mistral*

**For the generation of transcript from an uploaded video file**


*OpenAI-Whisper model should be configured (Available as a package) [should be updated in the requirements.txt and hence might not require external configurement]*

*Ffmpeg must be downloaded and configured in the system (including updation of path variable in windows environment) 
**Reference** - https://www.ffmpeg.org/download.html*
