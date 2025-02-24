import { Routes, Route, Navigate } from 'react-router-dom'
import Loginpage from './pages/Loginpage'
import Dashboard from './pages/Dashboard'
import AuthLayout from './components/layout/AuthLayout'
import MainLayout from './components/layout/MainLayout'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AddUser from './pages/AddUser'
import UserList from './pages/UserList'
import EditUser from './pages/EditUser'
import AddPlant from './pages/AddPlant';
import PlantList from './pages/PlantList';
import Settings from './pages/Settings';
import EditPlant from './pages/EditPlant';
import { UserRole } from './types/models';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Loginpage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN]}>
                  <UserList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users/add" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}>
                  <AddUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users/edit/:id" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}>
                  <EditUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plants" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN]}>
                  <PlantList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plants/add" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}>
                  <AddPlant />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/plants/edit/:id" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN]}>
                  <EditPlant />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </PersistGate>
    </Provider>
  )
}

export default App
