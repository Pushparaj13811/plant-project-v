import { Routes, Route, Navigate } from 'react-router-dom'
import Loginpage from './pages/Loginpage'
import Signuppage from './pages/Signuppage'
import AuthLayout from './components/layout/AuthLayout'
import MainLayout from './components/layout/MainLayout'

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Loginpage />} />
        <Route path="/signup" element={<Signuppage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<div>Dashboard Coming Soon</div>} />
        {/* Add more protected routes here */}
      </Route>
    </Routes>
  )
}

export default App
