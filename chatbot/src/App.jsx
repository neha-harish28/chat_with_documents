import { Input } from "./shadcn/components/ui/input"
import { Button } from "./shadcn/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./shadcn/components/ui/accordion"
import { ScrollArea } from "./shadcn/components/ui/scroll-area"
import { sessionState, useChatSession, useChatData } from "@chainlit/react-client";
import { useRecoilValue } from "recoil";
import { videoFormats } from "./constants/videoFormats";

import { useRef } from "react";


import {
  useChatInteract,
  useChatMessages,
} from "@chainlit/react-client";


import { useState, useEffect } from "react";
import { Skeleton } from "./shadcn/components/ui/skeleton";

function App() {

  const inputRef = useRef();

  const { connect } = useChatSession();
  const session = useRecoilValue(sessionState);

  const { elements } = useChatData();


  const [pdfs, setpdfs] = useState();
  const [videos, setvideos] = useState();
  const [audios, setaudios] = useState();

  const [update, setUpdate] = useState(false);


  useEffect(() => {
    if (session?.socket.connected) {
      return;
    }
    connect({

    });

  }, [connect]);



  useEffect(() => {

    const fetchData = async () => {

      try {

        const response = await fetch("http://localhost:80/fileNames")


        if (response.status !== 200) {
          return;
        }

        let files = await response.json();
        files = files.files;

        console.log(files);




        const pdfs = files
          .filter((file) => file.includes(".pdf"))
          .map((file) => file.split(".")[0]);

        const videos = files
          .filter((file) => videoFormats.includes(file.split(".").pop()))
          .map((file) => file.split(".")[0]);

        const audios = files
          .filter((file) => file.includes(".mp3"))
          .map((file) => file.split(".")[0]);


        setpdfs(pdfs);
        setvideos(videos);
        setaudios(audios);
        setUpdate(false);

      }
      catch (error) {
        console.error(error);

      }
    }

    fetchData();



  }, [update]
  );


  const dateOptions = {}

  const [inputValue, setInputValue] = useState("");
  const { sendMessage } = useChatInteract();
  const { messages } = useChatMessages();


  const handleInputFiles = async (files) => {

      const response = await fetch("http://localhost:80/upload", {
        method: "POST",
        body: files,

      }
      )


      let data = await response.json();

      if(data["status"] === "uploaded"){
          setUpdate(true);
      }

  }



  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (content) {
      const message = {
        name: "user",
        type: "user_message",
        output: content,
      };
      sendMessage(message, []);
      setInputValue("");
    }
  };

  const renderMessage = (message) => {
    const DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(message.createdAt).toLocaleTimeString(
      undefined,
      dateOptions
    );

    // console.log(message);

    return (
      <div key={message.id} className="flex items-start space-x-2">
        <div className="w-20 text-sm text-green-500">{message.name}</div>
        <div className="flex-1 border rounded-lg p-2">
          <p className="text-black dark:text-white">{message.output}</p>
          <small className="text-xs text-gray-500">{date}</small>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="Parent">
        <div className="">
          <div className="">

            <h1 className="sideBarHeader">Stored Files</h1>
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <p className="ml-4">PDF Files</p> 
                   
                   </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-56">



                    {
                      (pdfs === undefined) ? (
                        <div className="h-full flex flex-col justify-center space-y-2 px-4">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />

                        </div>
                      ) : (
                        pdfs.length === 0 ? <div className="h-full flex flex-col justify-center space-y-2 px-4">No PDF file found</div> :
                          <div className="p-3">
                            {
                              pdfs.map((pdf, index) => {
                                return <div key={index} className="fileItem">{pdf}</div>
                              })

                            }

                          </div>
                      )

                    }
                  </ScrollArea>

                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                <p className="ml-4">Video Files</p> 
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-56">
                    {
                      (videos === undefined) ? (
                        <Skeleton />
                      ) : (
                        videos.length === 0 ? <div className="h-full flex flex-col justify-center space-y-2 px-4">No video file found</div> :
                          videos.map((video, index) => {
                            return <div key={index} className="fileItem">{video}</div>
                          })
                      )

                    }
                  </ScrollArea>

                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                <p className="ml-4">Audio Files</p> 
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="max-h-56">
                    {
                      (audios === undefined) ? (
                        <Skeleton />
                      ) : (
                        audios.length === 0 ? <div className="h-full flex flex-col justify-center space-y-2 px-4">No audio file found</div> :
                          audios.map((aud, index) => {
                            return <div key={index} className="fileItem">{aud}</div>
                          })
                      )

                    }
                  </ScrollArea>

                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="box-border p-4">

            <Input type="file" multiple className="w-full text-foreground" ref={inputRef}/> 
                    
            </div>
   
            <Button className="mt-4" onClick={() => {
                handleInputFiles(inputRef.current.files);
            }}> 
            
            </Button>

          </div>
        </div>


        <div className="min-h-screen bg-gray-500 dark:bg-gray-900 flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {messages.map((message) => renderMessage(message))}
            </div>
          </div>

          <div className="border-t p-4 bg-black dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <Input
                autoFocus
                className="flex-1"
                id="message-input"
                placeholder="Type a message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} type="submit">
                Send
              </Button>
            </div>
          </div>
        </div>





      </div>





    </>
  )
}

export default App
