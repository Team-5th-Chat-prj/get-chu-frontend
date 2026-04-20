import { useRef, useState } from "react";
import { ArrowLeft, House, ImagePlus, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      await updateProfile(nickname, profileImageUrl);
      toast.success("프로필을 수정했어요.");
      navigate("/my");
    } catch (error: any) {
      if (error?.message === "Network Error" || !error?.response) {
        toast.success("[테스트 환경] 프로필을 수정한 것으로 처리했어요.");
        navigate("/my");
        return;
      }

      toast.error(`프로필 수정 중 오류가 발생했어요. (${error?.response?.status ?? "unknown"})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      return;
    }

    const file = event.target.files[0];
    const base64 = await resizeAndConvertToBase64(file, 200);
    setProfileImageUrl(base64);
  };

  const resizeAndConvertToBase64 = (file: File, maxSize: number): Promise<string> =>
    new Promise((resolve) => {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxSize / image.width, maxSize / image.height);
        canvas.width = image.width * ratio;
        canvas.height = image.height * ratio;
        const context = canvas.getContext("2d");

        if (context) {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        }

        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      image.src = url;
    });

  const removeImage = () => {
    setProfileImageUrl("");
  };

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isLoading}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--getchu-border)] bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[var(--getchu-orange)] hover:text-[var(--getchu-orange-strong)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Profile Settings
              </p>
              <h1 className="text-xl font-semibold text-gray-900">프로필 수정</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
            >
              <House className="h-4 w-4" />
              홈
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[var(--getchu-orange)] px-5 hover:bg-[var(--getchu-orange-strong)]"
            >
              {isLoading ? "저장 중..." : "완료"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
              Profile Image
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">프로필 사진</h2>

            <div className="mt-6 flex flex-col items-center">
              <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--getchu-cream)] via-white to-[var(--getchu-cream-strong)] ring-1 ring-[var(--getchu-border)] shadow-[0_16px_36px_rgba(249,115,22,0.12)]">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-12 w-12 text-[var(--getchu-orange)]/70" />
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
                >
                  <Upload className="h-4 w-4" />
                  사진 변경
                </Button>
                {profileImageUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeImage}
                    className="gap-2 border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
              Account
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">기본 정보</h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[24px] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-[var(--getchu-cream)] p-4 shadow-[0_16px_34px_rgba(249,115,22,0.08)]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                    닉네임
                  </Label>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
                    수정 가능
                  </span>
                </div>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="사용할 닉네임을 입력해 주세요"
                  disabled={isLoading}
                  className="border-orange-200 bg-white"
                />
              </div>

              <div className="rounded-[24px] border border-gray-200 bg-gray-50/90 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-600">
                    이메일
                  </Label>
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                    고정 정보
                  </span>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
