import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <main className="lg:pl-64 min-h-screen">
                <div className="py-4">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default MainLayout 