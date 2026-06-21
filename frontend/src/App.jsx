import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import VideoView from './pages/VideoView.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:requestId" element={<VideoView />} />
      </Routes>
    </div>
  )
}
