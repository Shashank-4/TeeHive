import type { RouteObject } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import MainLayout from "./components/layouts/MainLayout";
import ArtistSidebarLayout from "./components/layouts/ArtistSidebarLayout";
import AdminSidebarLayout from "./components/layouts/AdminSidebarLayout";
import ArtistProfile from "./pages/artist/ArtistProfile";
import ArtistSetupProfile from "./pages/artist/ArtistSetupProfile";
import ArtistEditProfile from "./pages/artist/ArtistEditProfile";
import ArtistVerificationStatus from "./pages/artist/ArtistVerificationStatus";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminDesigns from "./pages/admin/AdminDesigns";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminColors from "./pages/admin/AdminColors";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminArtistReview from "./pages/admin/AdminArtistReview";
import AdminInventoryMatrix from "./pages/admin/AdminInventoryMatrix";
import BrowseProducts from "./pages/customer/BrowseProducts";
import BrowseArtists from "./pages/customer/BrowseArtists";
import ArtistStorefront from "./pages/customer/ArtistStorefront";
import Hive50Page from "./pages/customer/Hive50Page";
import Cart from "./pages/customer/CartPage";
import Checkout from "./pages/customer/Checkout";
import OrderConfirmation from "./pages/customer/OrderConfirmation";
import OrderPage from "./pages/customer/OrderPage";
import ProductDetails from "./pages/customer/ProductDetails";
import CustomerProfile from "./pages/customer/ProfilePage";
import RatePurchase from "./pages/customer/RatePurchase";
import ArtistDesignManager from "./pages/artist/ArtistDesignManager";
import ArtistMockupCreator from "./pages/artist/ArtistMockupCreator";
import ArtistProductManager from "./pages/artist/ArtistProductManager";
import ArtistOrders from "./pages/artist/ArtistOrders"
import ArtistPayout from "./pages/artist/ArtistPayout";
import ArtistEarnings from "./pages/artist/ArtistEarnings";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettlements from "./pages/admin/AdminSettlements";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import PrivacyPolicyPage from "./pages/legal/PrivacyPolicyPage";
import TermsAndConditionsPage from "./pages/legal/TermsAndConditionsPage";
import ReturnRefundPolicyPage from "./pages/legal/ReturnRefundPolicyPage";
import ShippingPolicyPage from "./pages/legal/ShippingPolicyPage";
import ArtistAgreementPage from "./pages/legal/ArtistAgreementPage";
import ArtistContentGuidelinesPage from "./pages/legal/ArtistContentGuidelinesPage";
import ArtistTaxPayoutPolicyPage from "./pages/legal/ArtistTaxPayoutPolicyPage";
import CopyrightTakedownPolicyPage from "./pages/legal/CopyrightTakedownPolicyPage";
import GrievanceRedressalMechanismPage from "./pages/legal/GrievanceRedressalMechanismPage";


const router: RouteObject[] = [
    // ── Public / Customer routes (MainLayout with Navbar + Footer) ──
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "products", element: <BrowseProducts /> },
            { path: "hive50", element: <Hive50Page /> },
            { path: "artists", element: <BrowseArtists /> },
            { path: "artists/:artistHandle", element: <ArtistStorefront /> },
            { path: "cart", element: <Cart /> },
            { path: "order/checkout", element: <Checkout /> },
            { path: "order/confirmation", element: <OrderConfirmation /> },
            { path: "orders", element: <OrderPage /> },
            { path: "orders/:orderId/rate", element: <RatePurchase /> },
            { path: "products/:productId", element: <ProductDetails /> },
            { path: "user/profile", element: <CustomerProfile /> },
            { path: "privacy-policy", element: <PrivacyPolicyPage /> },
            { path: "terms", element: <TermsAndConditionsPage /> },
            { path: "return-refund-policy", element: <ReturnRefundPolicyPage /> },
            { path: "shipping-policy", element: <ShippingPolicyPage /> },
            { path: "copyright-takedown-policy", element: <CopyrightTakedownPolicyPage /> },
            { path: "grievance-redressal", element: <GrievanceRedressalMechanismPage /> },
            { path: "artist-agreement", element: <ArtistAgreementPage /> },
            { path: "artist-content-guidelines", element: <ArtistContentGuidelinesPage /> },
            { path: "artist-tax-payout-policy", element: <ArtistTaxPayoutPolicyPage /> },
        ],
    },

    // ── Artist routes (ArtistSidebarLayout — no navbar/footer) ──
    {
        path: "/artist",
        element: <ArtistSidebarLayout />,
        children: [
            { path: "dashboard", element: <ArtistDashboard /> },
            { path: "setup-profile", element: <ArtistSetupProfile /> },
            { path: "verification-status", element: <ArtistVerificationStatus /> },
            { path: "profile", element: <ArtistProfile /> },
            { path: "edit-profile", element: <ArtistEditProfile /> },
            { path: "manage-designs", element: <ArtistDesignManager /> },
            { path: "create-mockup", element: <ArtistMockupCreator /> },
            { path: "manage-products", element: <ArtistProductManager /> },
            { path: "orders", element: <ArtistOrders /> },
            { path: "payout", element: <ArtistPayout /> },
            { path: "earnings", element: <ArtistEarnings /> },
        ],
    },

    // ── Admin routes (AdminSidebarLayout — no navbar/footer) ──
    {
        path: "/admin",
        element: <AdminSidebarLayout />,
        children: [
            { path: "dashboard", element: <AdminDashboard /> },
            { path: "artists", element: <AdminArtists /> },
            { path: "artists/:id", element: <AdminArtistReview /> },
            { path: "designs", element: <AdminDesigns /> },
            { path: "products", element: <AdminProducts /> },
            { path: "inventory-matrix", element: <AdminInventoryMatrix /> },
            { path: "orders", element: <AdminOrders /> },
            { path: "users", element: <AdminUsers /> },
            { path: "categories", element: <AdminCategories /> },
            { path: "colors", element: <AdminColors /> },
            { path: "config", element: <AdminConfig /> },
            { path: "reviews", element: <AdminReviews /> },
            { path: "settlements", element: <AdminSettlements /> },
        ],
    },

    // ── Standalone pages (no layout) ──
    {
        path: "artist/mockup-creator/:designId",
        element: <ArtistMockupCreator />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />,
    },
    {
        path: "/reset-password",
        element: <ResetPassword />,
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
];

export default router;
