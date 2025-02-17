import { Outlet } from 'react-router-dom'
import Header from './Header'

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default MainLayout 