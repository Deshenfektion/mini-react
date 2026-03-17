import { createRoot } from 'mini-react'
import { App } from './App'

const container = document.getElementById('root')

if (container) {
  createRoot(container).render(<App />)
}
