import { Routes, Route, Navigate } from 'react-router-dom'
import Loginpage from './pages/auth/Loginpage'
import Dashboard from './pages/dashboard/Dashboard'
import AuthLayout from './components/layout/AuthLayout'
import MainLayout from './components/layout/MainLayout'
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AddUser from './pages/users/AddUser'
import UserList from './pages/users/UserList'
import EditUser from './pages/users/EditUser'
import AddPlant from './pages/plants/AddPlant';
import PlantList from './pages/plants/PlantList';
import Settings from './pages/settings/Settings';
import EditPlant from './pages/plants/EditPlant';
import ForcePasswordChange from './pages/auth/ForcePasswordChange';
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
            <Route path="/force-password-change" element={
              <ProtectedRoute>
                <ForcePasswordChange />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
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
