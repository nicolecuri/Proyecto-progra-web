import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import Progress from "./pages/Progress/Progress"
import Navbar from "./components/Navbar"

import "./App.css"

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  )
}

export default App