import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { WatchlistProvider } from './context/WatchlistContext'
import { FavoritesProvider } from './context/FavoritesContext'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <WatchlistProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </WatchlistProvider>
    </BrowserRouter>
  </StrictMode>,
)
