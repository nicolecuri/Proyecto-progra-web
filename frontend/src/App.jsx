import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"

import CrearRutina from "./pages/CrearRutina"
import Admin from "./pages/Admin"

import "./App.css"

function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<CrearRutina />} />

        <Route path="/admin" element={<Admin />} />

      </Routes>

    </BrowserRouter>

  )
}

export default App