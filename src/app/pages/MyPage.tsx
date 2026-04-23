import { ChevronRight, Home, Loader2, MapPin, MessageCircle, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import foxHeadImage from "../../assets/logo-fox-head.png";
import { getVerifiedLocation } from "../utils/verifiedLocation";
import { membersApi } from "../api/members";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const cachedLocation = getVerifiedLocation(user?.id);
  const verifiedLocation = user?.locationName
    ? {
        locationName: user.locationName,
        locationRadius: user.locationRadius ?? cachedLocation?.locationRadius,
      }
    : cachedLocation;

  useEffect(() => {
    refreshUser().catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      await membersApi.deleteAccount();
      toast.success("회원탈퇴가 완료됐어요.");
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Delete account failed", error);
      toast.error("회원탈퇴를 완료하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <header className="border-b border-orange-100 bg-white/78 px-3 py-4 backdrop-blur-xl sm:px-4">
        <div className="flex flex-row-reverse items-center justify-end gap-4">
          <h1 className="text-lg font-medium">마이페이지</h1>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-interactive flex shrink-0 items-center justify-center"
            aria-label="홈으로 이동"
          >
            <div className="flex size-[4.1rem] items-center justify-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_top,#fff7ee,#ffe8cc_62%,#ffc98b)] shadow-[0_14px_24px_rgba(255,138,61,0.17)] ring-1 ring-orange-100/70">
              <img
                src={foxHeadImage}
                alt="Get-chu"
                className="h-full w-full -translate-x-[8%] scale-[0.7] object-contain object-center mix-blend-multiply saturate-[1.05] contrast-[1.01] drop-shadow-[0_8px_14px_rgba(255,138,61,0.1)]"
              />
            </div>
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-2xl shadow-sm">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
            ) : (
              <span>G</span>
            )}
          </div>

          <div className="flex-1">
            <h2 className="mb-1 text-lg font-bold">{user?.nickname || "사용자"}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>평점 {user?.averageRating?.toFixed(1) || "0.0"}</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => user && navigate(`/members/${user.id}/reviews`)}
                className="text-[var(--getchu-orange-strong)] underline underline-offset-2"
              >
                리뷰 {user?.reviewCount || 0}개
              </button>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full border-gray-300" onClick={() => navigate("/my/profile/edit")}>
          프로필 수정
        </Button>

        <Button
          variant="outline"
          className="mt-3 w-full border-orange-200 bg-orange-50/70 text-[var(--getchu-orange-strong)] hover:bg-orange-100"
          onClick={() => navigate("/location/verify")}
        >
          <MapPin className="h-4 w-4" />
          {verifiedLocation ? "동네 다시 인증하기" : "동네 인증하기"}
        </Button>
        {verifiedLocation ? (
          <div className="mt-3 rounded-[1.2rem] border border-orange-100 bg-white px-4 py-3 text-sm text-gray-700">
            <div className="flex items-center gap-2 font-semibold text-[var(--getchu-orange-strong)]">
              <MapPin className="h-4 w-4" />
              인증된 동네
            </div>
            <p className="mt-1 font-bold text-gray-950">{verifiedLocation.locationName}</p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-gray-200 py-2">
        <button
          type="button"
          onClick={() => navigate("/my/products")}
          className="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <span className="text-base">내 판매 목록</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/my/purchases")}
          className="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <span className="text-base">내 구매 목록</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/my/likes")}
          className="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">❤️</span>
            <span className="text-base">찜 목록</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/my/reviews/written")}
          className="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <span className="text-base">내가 작성한 리뷰</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="flex w-full items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <span className="text-base">채팅</span>
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-3 px-4 py-6">
        <Button
          onClick={() => navigate("/my/password")}
          variant="outline"
          className="w-full border-gray-300 text-gray-700"
        >
          비밀번호 변경
        </Button>
        <Button onClick={handleLogout} variant="outline" className="w-full border-gray-300 text-gray-700">
          로그아웃
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full border-red-100 bg-red-50/40 text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              회원탈퇴
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[1.75rem] border-orange-100 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-gray-950">정말 떠나시겠어요?</AlertDialogTitle>
              <AlertDialogDescription className="leading-6 text-gray-600">
                탈퇴하면 현재 계정으로 다시 로그인할 수 없어요. 판매글, 찜, 채팅 등 계정과 연결된 정보에도 영향을 줄 수 있어요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-[1.25rem] border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm text-[var(--getchu-orange-strong)]">
              잠깐만요. 실수로 누른 거라면 취소를 눌러주세요.
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount} className="rounded-full">
                취소
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isDeletingAccount}
                onClick={(event) => {
                  event.preventDefault();
                  handleDeleteAccount();
                }}
                className="rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    탈퇴 처리 중
                  </>
                ) : (
                  "회원탈퇴"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-orange-100 bg-white/90 backdrop-blur-xl md:hidden">
        <div className="floating-nav flex items-center justify-around py-3">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-gray-500">
            <Home className="w-6 h-6" />
            <span className="text-xs">홈</span>
          </button>
          <button onClick={() => navigate("/chat")} className="flex flex-col items-center gap-1 text-gray-500">
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">채팅</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[var(--getchu-orange)]">
            <User className="w-6 h-6" />
            <span className="text-xs">마이</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
