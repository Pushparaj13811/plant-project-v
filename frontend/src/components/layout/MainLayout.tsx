import { Outlet, Navigate } from 'react-router-dom'
import { useAppSelector } from '@/redux/hooks'
import Header from './Header'

const MainLayout = () => {
    const { token } = useAppSelector((state) => state.auth)

    if (!token) {
        return <Navigate to="/login" replace />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout 