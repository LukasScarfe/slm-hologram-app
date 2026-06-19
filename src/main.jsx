import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { HologramWindow } from './windows/HologramWindow.jsx'

const params = new URLSearchParams(window.location.search)
const displaySlmId = params.get('display')


createRoot(document.getElementById('root')).render(
  <StrictMode>
    {displaySlmId
      ? <HologramWindow slmId={displaySlmId} />
      : <App />
    }
  </StrictMode>,
)
