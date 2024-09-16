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

        // console.log(files);




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

      // console.log(files);
      let formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      // for (var key of formData.entries()) {
      //   console.log(key[0] + ', ' + key[1])
      // }

      const response = await fetch("http://localhost:80/upload", {
        method: "POST",
        body: formData,

      }
      )


      let data = await response.json();

      if(data["status"] === "uploaded"){
          setUpdate(true);
      }

  }



  const handleSendMessage = () => {
    const content = inputValue.trim();
    if (content.length === 0) return;

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
    if (!message.output || message.output.trim() === "") return null;
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
          <p className="text-[#ececec]">{message.output}</p>
          {/* <p className="text-[#ececec]">{elements}</p> */}

          <small className="text-xs text-gray-500">{date}</small>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex bg-[#171717] h-screen">
        <div className="shadow-md z-10">


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
                        <div className="h-full flex flex-col justify-center space-y-2 px-4">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />

                        </div>
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
                        <div className="h-full flex flex-col justify-center space-y-2 px-4">
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />
                          <Skeleton className="h-5 w-full" />

                        </div>
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

            <div className="mt-8 flex flex-col box-border p-4 items-center">

            <Input type="file" multiple className="w-full text-foreground bg-[#ececec]" ref={inputRef}/> 
            
            <Button className="mt-4 w-24 bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]" onClick={() => {
                handleInputFiles(inputRef.current.files);
            }}> 
            Upload
            </Button>
            </div>
   
           

      
        </div>


        <div className="min-h-screen bg-[#212121] text-[#ececec] flex flex-col grow">
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-col justify-center space-y-4">
              {messages.map((message) => renderMessage(message))}
            </div>
          </div>

          <div className="p-4 flex justify-center bg-[#212121] text-[#ececec]">
            <div className="flex items-center space-x-2 rounded-lg">
              <Input
                autoFocus
                className="bg-[#2f2f2f] w-[32rem] text-[#ececec] focus-visible:ring-offset-0 focus-visible:ring-transparent"
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
              <Button onClick={handleSendMessage} type="submit" className="bg-[#ececec] text-[#2f2f2f] rounded-full hover:bg-[#c1c1c1]">
                Send
              </Button>
            </div>
          </div>
        </div>


          


      </div>


      {/* Have to add a loading spinner for the file upload */}


    </>
  )
}

export default App
