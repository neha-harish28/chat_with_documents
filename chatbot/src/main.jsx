import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { RecoilRoot } from "recoil";
import { ChainlitAPI, ChainlitContext } from "@chainlit/react-client";


const CHAINLIT_SERVER = "http://localhost:80/chainlit";
const apiClient = new ChainlitAPI(CHAINLIT_SERVER, "webapp");




createRoot(document.getElementById('root')).render(
  <StrictMode>
     <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <App />
      </RecoilRoot>
    </ChainlitContext.Provider>
  </StrictMode>,
)
