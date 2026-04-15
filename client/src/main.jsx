
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const BUILD_DATE = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'DEV';
console.log(`%c Chatza App \n%c Build: ${BUILD_DATE}`,
    'font-weight: bold; font-size: 20px; color: #6366f1',
    'color: #94a3b8');

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)

