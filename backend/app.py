from fastapi import FastAPI,UploadFile, File
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from chainlit.auth import create_jwt
from chainlit.user import User
from chainlit.utils import mount_chainlit

import os
from ingest import create_vector_database

app = FastAPI()

ABS_PATH: str = os.path.dirname(os.path.abspath(__file__))
FILE_PATH: str = os.path.join(ABS_PATH, "files")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)






@app.get("/fileNames")
async def Files():
    return {"files": os.listdir(FILE_PATH)}


@app.post("/upload")
async def upload(files: list[UploadFile]):
    with open(FILE_PATH, "w") as f:
        for file in files:
            f.write(file)
            create_vector_database(file)

            
            
            
    
    return {"status": "uploaded"}




mount_chainlit(app=app, target="cl_app.py", path="/chainlit")

