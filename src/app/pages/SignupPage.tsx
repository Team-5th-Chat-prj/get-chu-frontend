import { useState, useRef } from "react";
import { ArrowLeft, Eye, EyeOff, Sparkles, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import logoImage from "../../assets/logo.png";
import { uploadMockImage, getMockImageUrl } from "../utils/imageStorage";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const fakeUrl = await uploadMockImage(file);
      setProfileImageUrl(fakeUrl);
    }
  };

  const removeImage = () => {
    setProfileImageUrl("");
  };

  const validatePassword = (value: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "이메일을 입력해 주세요.";
    }
    if (!password) {
      newErrors.password = "비밀번호를 입력해 주세요.";
    } else if (!validatePassword(password)) {
      newErrors.password = "영문, 숫자, 특수문자를 포함한 8자 이상이어야 해요.";
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호 확인이 일치하지 않아요.";
    }
    if (!nickname) {
      newErrors.nickname = "닉네임을 입력해 주세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, nickname);
      toast.success("회원가입이 완료되었어요.");
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { data } = err.response;
        if (data?.code === "DUPLICATE_EMAIL") {
          setErrors({ email: "이미 사용 중인 이메일이에요." });
        } else if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          toast.error(data.errors[0].message);
        } else {
          toast.error(data?.message || "회원가입 중 문제가 발생했어요.");
        }
      } else {
        toast.error(err.message === "Network Error" ? "서버에 연결할 수 없어요." : "문제가 발생했어요.");
      }
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error("Auto-login failed after signup:", err);
      toast.info("회원가입은 완료되었지만 자동 로그인에 실패했어요. 다시 로그인해 주세요.");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="btn-interactive mb-4 flex size-11 items-center justify-center rounded-full border border-orange-100 bg-white text-[var(--getchu-orange-strong)] shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="grid overflow-hidden rounded-[2rem] border border-orange-100 bg-white/88 shadow-[0_30px_80px_rgba(255,138,61,0.16)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]">
          <section className="brand-gradient relative hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-12 top-16 size-32 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-10 right-10 size-40 rounded-full bg-white/12 blur-3xl" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                <Sparkles className="size-4" />
                Join Get-chu
              </div>
              <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">
                따뜻하고 귀여운 거래 경험, 지금부터 함께 시작해요.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-white/90">
                기본 정보만 입력하면 바로 둘러볼 수 있어요. 프로필 이미지도 원하는 분위기로 가볍게
                설정할 수 있습니다.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="group flex flex-col items-center gap-4"
              >
                <div className="flex size-[22rem] items-center justify-center rounded-[3rem] bg-[radial-gradient(circle_at_top,#fffdf9,#fff1de_58%,#ffd8b0)] p-10 shadow-[0_28px_60px_rgba(125,63,11,0.18),inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <img
                    src={logoImage}
                    alt="Get-chu"
                    className="character-bounce h-full w-auto object-contain mix-blend-multiply drop-shadow-[0_18px_25px_rgba(255,138,61,0.2)] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <span className="rounded-full bg-white/18 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  로고를 누르면 홈으로 이동해요
                </span>
              </button>
            </div>
          </section>

          <section className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 lg:hidden">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="group mb-4 flex size-32 items-center justify-center rounded-[2.2rem] bg-[radial-gradient(circle_at_top,#fffdf9,#fff1de_58%,#ffd8b0)] shadow-[0_20px_36px_rgba(255,138,61,0.2)]"
                >
                  <img
                    src={logoImage}
                    alt="Get-chu"
                    className="h-24 w-auto object-contain mix-blend-multiply drop-shadow-[0_14px_20px_rgba(255,138,61,0.18)] transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                  Signup
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-2 text-sm font-semibold text-[var(--getchu-orange-strong)]"
                >
                  홈으로 돌아가기
                </button>
              </div>

              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                  Create Account
                </p>
                <h2 className="mt-3 text-3xl font-bold text-[var(--getchu-ink)]">새 계정을 만들어 볼까요?</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  필요한 정보만 간단히 입력하면 바로 거래를 시작할 수 있어요.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
                <div className="surface-panel col-span-full flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[var(--getchu-orange-pale)] text-4xl shadow-sm">
                      {profileImageUrl ? (
                        <img
                          src={getMockImageUrl(profileImageUrl)}
                          alt="프로필 이미지"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[var(--getchu-orange-strong)]">G</span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--getchu-ink)]">프로필 이미지</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        선택 사항이지만, 더 친근한 인상을 만들 수 있어요.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
                      disabled={isLoading}
                    >
                      <Upload className="size-3.5" />
                      이미지 업로드
                    </Button>
                    {profileImageUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="border-red-200 bg-white text-red-500 hover:bg-red-50"
                        disabled={isLoading}
                      >
                        <Trash2 className="size-3.5" />
                        제거
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2 block text-sm font-medium">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="user@example.com"
                    disabled={isLoading}
                  />
                  {errors.email ? <p className="mt-2 text-xs text-red-500">{errors.email}</p> : null}
                </div>

                <div>
                  <Label htmlFor="nickname" className="mb-2 block text-sm font-medium">
                    닉네임
                  </Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="겟츄에서 사용할 이름"
                    disabled={isLoading}
                  />
                  {errors.nickname ? <p className="mt-2 text-xs text-red-500">{errors.nickname}</p> : null}
                </div>

                <div>
                  <Label htmlFor="password" className="mb-2 block text-sm font-medium">
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showNewPass ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                      disabled={isLoading}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                      onClick={() => setShowNewPass((prev) => !prev)}
                    >
                      {showNewPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {errors.password ? <p className="mt-2 text-xs text-red-500">{errors.password}</p> : null}
                </div>

                <div>
                  <Label htmlFor="passwordConfirm" className="mb-2 block text-sm font-medium">
                    비밀번호 확인
                  </Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirm"
                      type={showConfirmPass ? "text" : "password"}
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
                      placeholder="비밀번호를 한 번 더 입력해 주세요"
                      disabled={isLoading}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                      onClick={() => setShowConfirmPass((prev) => !prev)}
                    >
                      {showConfirmPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {errors.passwordConfirm ? (
                    <p className="mt-2 text-xs text-red-500">{errors.passwordConfirm}</p>
                  ) : null}
                </div>

                <div className="col-span-full pt-2">
                  <Button type="submit" className="w-full text-base" disabled={isLoading}>
                    {isLoading ? "가입 중..." : "회원가입"}
                  </Button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
