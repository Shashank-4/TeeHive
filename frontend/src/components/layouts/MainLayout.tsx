import { Outlet } from "react-router-dom";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-white">
            {/* <Navbar />, */}
            <main className="container mx-auto">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
