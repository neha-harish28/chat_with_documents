
import { Input } from "./shadcn/components/ui/input"
import { Button } from "./shadcn/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./shadcn/components/ui/accordion"
import { ScrollArea } from "./shadcn/components/ui/scroll-area"
import { sessionState, useChatSession, useChatData } from "@chainlit/react-client"
import { useRecoilValue } from "recoil"
import { videoFormats } from "./constants/videoFormats"
import { Loader2 } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./shadcn/components/ui/sheet"

import { Card, CardContent } from "./shadcn/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./shadcn/components/ui/carousel"

import {
  useChatInteract,
  useChatMessages,
} from "@chainlit/react-client"

import { Skeleton } from "./shadcn/components/ui/skeleton"

function App() {
  const inputRef = useRef()
  const { connect } = useChatSession()
  const session = useRecoilValue(sessionState)
  const { elements } = useChatData()
  const [pdfs, setpdfs] = useState()
  const [videos, setvideos] = useState()
  const [audios, setaudios] = useState()
  const [update, setUpdate] = useState(false)
  const [api, setApi] = useState(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const { sendMessage } = useChatInteract()
  const { messages } = useChatMessages()
  const [chatProcessing, setChatProcessing] = useState(false)



  useEffect(() => {
    if (session?.socket.connected) {
      return;
    }
    connect({})
  }, [connect])

  useEffect(() => {
    if (!api) {
      return
    }
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:80/fileNames")
        if (response.status !== 200) {
          return;
        }

        let files = await response.json()
        files = files.files
        const pdfs = files
          .filter((file) => file.includes(".pdf"))
          .map((file) => file.split(".")[0])
        const videos = files
          .filter((file) => videoFormats.includes(file.split(".").pop()))
          .map((file) => file.split(".")[0])
        const audios = files
          .filter((file) => file.includes(".mp3"))
          .map((file) => file.split(".")[0])
        setpdfs(pdfs)
        setvideos(videos)
        setaudios(audios)
        setUpdate(false)
      } catch (error) {
        console.error(error)
      }
    }
    fetchData();
  }, [update])


  useEffect(() => {


    setChatProcessing(false);

  }, [elements])


  const handleInputFiles = async (files) => {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    const response = await fetch("http://localhost:80/upload", {
      method: "POST",
      body: formData,
    })
    let data = await response.json()
    if (data["status"] === "uploaded") {
      setLoading(false)
      setUpdate(true)
    }
  }

  const handleSendMessage = () => {
    const content = inputValue.trim()
    if (content.length === 0) return;
    if (content) {
      const message = {
        name: "User",
        type: "user_message",
        output: content,
      }


      sendMessage(message, [])

      setInputValue("")
    }
  }

  const renderElements = (elements) => {

    const contexts = elements.filter(el => el.type === 'text')
    const nonContexts = elements.filter(el => el.type !== 'text')



    return (
      <>

        { contexts.length > 0 && (
        
        <div className="flex items-center space-x-3">

          <p className="font-bold"> Context : </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]">
              Show Context
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[700px] bg-[#ececec] text-[#2f2f2f]">
            <SheetHeader>
              <SheetTitle>Related Contexts</SheetTitle>
            </SheetHeader>

            {contexts.length > 0 && (
              <div className="mx-auto max-w-xs my-4">
                <Carousel setApi={setApi} className="w-full max-w-xs">
                  <CarouselContent>
                    {contexts.map((context) => (
                      <CarouselItem key={context.id}>
                        <Card className="bg-[#171717] text-[#ececec]">
                          <CardContent className="flex flex-col aspect-square justify-center p-6 space-y-2">
                            <p>{context.name}</p>
                            <iframe src={context.url} width="100%" height="100%" />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]" />
                  <CarouselNext className="bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]" />
                </Carousel>
                <div className="py-2 text-center text-sm text-muted-foreground">
                  Context {current}
                </div>
              </div>
            )}


            <SheetFooter>
              <SheetClose asChild />
            </SheetFooter>
          </SheetContent>
        </Sheet>

        </div>

        )}





        {nonContexts.length > 0 && (
          <div className="flex space-x-2">
            <div className="flex flex-col my-4">
              <p className="text-[#ececec] font-bold">Related Files</p>
              {nonContexts.map((element) => (
                <div key={element.id} className="my-4">
                  <Sheet>
                    <SheetTrigger asChild>
                      {/* <Button variant="outline" className="bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]">
                        {element.name}
                      </Button> */}

                      <a href="#" className="text-[pink] hover:text-[purple]" > {element.name} </a>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[700px] bg-[#ececec] text-[#2f2f2f]">
                      <SheetHeader>
                        <SheetTitle className="my-4">Related File</SheetTitle>
                      </SheetHeader>
                      {element.type === 'pdf' ? (
                        <iframe src={element.url} width="100%" height="90%" />
                      ) : element.type === 'video' ? (
                        <video controls width="100%">
                          <source src={element.url} type="video/mp4" />
                        </video>
                      ) : null}
                      <SheetFooter>
                        <SheetClose asChild />
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  const renderMessage = (message, index, messages) => {
    if (!message.output || message.output.trim() === "") return null
    const date = new Date(message.createdAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })

    // const isLatestBotMessage = message.name === 'Assistant' && index === messages.length - 1


    const specMessageEle = elements.filter(el => el.forId === message.id)

    return (
      <div key={message.id} className="flex items-start space-x-2">
        <div className="w-20 text-sm text-green-500">{message.name}</div>
        <div className="flex-1 flex flex-col rounded-lg p-2">
          <p className="text-[#ececec]">{message.output}</p>
          <small className="text-xs text-gray-500 my-2 m">{date}</small>


          {specMessageEle && (renderElements(specMessageEle))}

        </div>
      </div>
    )
  }

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

            <Input type="file" multiple className="w-full text-foreground bg-[#ececec]" ref={inputRef} />


            {!loading ? <Button className="mt-4 w-34 bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1]" onClick={() => {
              handleInputFiles(inputRef.current.files);
              setLoading(true);
            }}> Upload  </Button> : <Button disabled className='bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1] mt-4 w-34'>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </Button>
            }

          </div>




        </div>








        <div className="min-h-screen bg-[#212121] text-[#ececec] flex flex-col grow">
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-col justify-center space-y-4">
              {messages.map((message, index) => renderMessage(message, index, messages))}
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
                    setChatProcessing(true)
                  }
                }}
              />

              {
                !chatProcessing ?
                  <Button onClick={() => {handleSendMessage(); setChatProcessing(true) }} type="submit" className="bg-[#ececec] text-[#2f2f2f] rounded-full hover:bg-[#c1c1c1]">
                    Send
                  </Button>
                  : <Button disabled className='bg-[#ececec] text-[#2f2f2f] hover:bg-[#c1c1c1] mt-4 w-34'>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </Button>


              }
            </div>
          </div>
        </div>




      </div>


    </>
  )
}




export default App



// Add a spinner/ loading instance when the bot is processing and loading
// Make Sure all contexts are getting loaded correctly (Done)
// Screen Size check
// Prompt Check
// Endpoint Check