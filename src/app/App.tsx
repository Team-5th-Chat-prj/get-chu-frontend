import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "./components/ui/sonner";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductNewPage from "./pages/ProductNewPage";
import ProductEditPage from "./pages/ProductEditPage";
import ChatListPage from "./pages/ChatListPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import MyPage from "./pages/MyPage";
import MyProductsPage from "./pages/MyProductsPage";
import MyPurchasesPage from "./pages/MyPurchasesPage";
import MyLikesPage from "./pages/MyLikesPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ReviewPage from "./pages/ReviewPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import PasswordChangePage from "./pages/PasswordChangePage";
import MemberReviewsPage from "./pages/MemberReviewsPage";
import MyWrittenReviewsPage from "./pages/MyWrittenReviewsPage";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/new" element={<ProductNewPage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/chat/:chatRoomId" element={<ChatRoomPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/my/profile/edit" element={<ProfileEditPage />} />
          <Route path="/my/password" element={<PasswordChangePage />} />
          <Route path="/my/products" element={<MyProductsPage />} />
          <Route path="/my/purchases" element={<MyPurchasesPage />} />
          <Route path="/my/likes" element={<MyLikesPage />} />
          <Route path="/my/reviews/written" element={<MyWrittenReviewsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/trades/:id/review" element={<ReviewPage />} />
          <Route path="/members/:memberId/reviews" element={<MemberReviewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
