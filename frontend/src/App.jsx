import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login/Login"
import Register from "./pages/Register/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import Progress from "./pages/Progress/Progress"
import Planner from "./pages/Planner/Planner"
import AdminUsuarios from "./pages/AdminUsuarios/AdminUsuarios"
import ProtectedRoute from "./components/ProtectedRoute"
import Navbar from "./components/Navbar"
import { ensureAdminUser } from "./services/userStorage"

ensureAdminUser()

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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <Planner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsuarios />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  )
}

export default App