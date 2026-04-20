import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, House, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { membersApi } from "../api/members";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function PasswordChangePage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!oldPassword) {
      nextErrors.oldPassword = "현재 비밀번호를 입력해 주세요.";
    }

    if (!newPassword) {
      nextErrors.newPassword = "새 비밀번호를 입력해 주세요.";
    } else if (!validatePassword(newPassword)) {
      nextErrors.newPassword = "영문, 숫자, 특수문자를 포함한 8자 이상이어야 해요.";
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "새 비밀번호가 서로 일치하지 않아요.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await membersApi.updatePassword({ oldPassword, newPassword });
      toast.success("비밀번호를 변경했어요.");
      navigate("/my");
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          toast.error("로그인 세션이 유효하지 않아요.");
        } else if (status === 403) {
          toast.error("현재 비밀번호가 일치하지 않아요.");
        } else if (status === 400) {
          toast.error("새 비밀번호 형식을 다시 확인해 주세요.");
        } else {
          toast.error(data?.message || "비밀번호 변경에 실패했어요.");
        }
      } else {
        toast.error("오류가 발생했어요.");
      }
    } finally {
      setIsLoading(false);
    }
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
                Security
              </p>
              <h1 className="text-xl font-semibold text-gray-900">비밀번호 변경</h1>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
          >
            <House className="h-4 w-4" />
            홈
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="surface-panel p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[var(--getchu-orange-strong)]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-gray-900">보안 가이드</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <li>영문, 숫자, 특수문자를 포함한 8자 이상으로 설정해 주세요.</li>
              <li>기존에 쓰던 비밀번호와 너무 비슷한 조합은 피하는 게 좋아요.</li>
              <li>변경 후에는 새 비밀번호로 다시 로그인해야 할 수 있어요.</li>
            </ul>
          </div>

          <div className="surface-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
              Password Form
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">새 비밀번호 설정</h2>
            <p className="mt-2 text-sm text-gray-500">현재 비밀번호를 확인한 뒤 새 비밀번호를 저장합니다.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="oldPassword" className="mb-2 block text-sm font-medium text-gray-700">
                  현재 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="현재 비밀번호를 입력해 주세요"
                    disabled={isLoading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    onClick={() => setShowOldPass((prev) => !prev)}
                  >
                    {showOldPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.oldPassword ? <p className="mt-2 text-xs text-red-500">{errors.oldPassword}</p> : null}
              </div>

              <div className="rounded-[24px] border border-[var(--getchu-border)] bg-[var(--getchu-cream)]/55 p-4">
                <Label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="새 비밀번호를 입력해 주세요"
                    disabled={isLoading}
                    className="bg-white pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    onClick={() => setShowNewPass((prev) => !prev)}
                  >
                    {showNewPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-500">영문, 숫자, 특수문자를 포함한 8자 이상으로 입력해 주세요.</p>
                {errors.newPassword ? <p className="mt-2 text-xs text-red-500">{errors.newPassword}</p> : null}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                  새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="새 비밀번호를 한 번 더 입력해 주세요"
                    disabled={isLoading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                    onClick={() => setShowConfirmPass((prev) => !prev)}
                  >
                    {showConfirmPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword ? <p className="mt-2 text-xs text-red-500">{errors.confirmPassword}</p> : null}
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]"
                disabled={isLoading}
              >
                {isLoading ? "변경 중..." : "비밀번호 변경"}
              </Button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
