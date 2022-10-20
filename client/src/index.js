import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app.js'
import './style.css'

const rootNode = document.createElement('div')
document.body.append(rootNode)
ReactDOM.createRoot(rootNode).render(<App />);




// import './api.js'