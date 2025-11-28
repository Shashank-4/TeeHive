import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ArtistDashboard from "./pages/ArtistDashboard";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import MainLayout from "./components/layouts/MainLayout";
import ArtistProfile from "./pages/ArtistProfile";

const router: RouteObject[] = [
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "products", element: <ProductsPage /> },
            { path: "artist/dashboard", element: <ArtistDashboard /> },
            { path: "artist/profile", element: <ArtistProfile /> },
        ],
    },
    {
        // Routes without the MainLayout
        path: "/login",
        element: <LoginPage />,
    },
    {
        // Catch-all route for 404 Not Found pages
        path: "*",
        element: <NotFoundPage />,
    },
];

export default router;
