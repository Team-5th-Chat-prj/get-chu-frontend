import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Sparkles, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import FormErrorState from "../components/ui/state/FormErrorState";
import FormLoadingState from "../components/ui/state/FormLoadingState";
import FormSuccessFeedback from "../components/ui/state/FormSuccessFeedback";
import FormValidationMessage from "../components/ui/state/FormValidationMessage";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../../assets/logo.png";
import foxHeadImage from "../../assets/logo-fox-head.png";

type SignupValidationErrors = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(value: string) {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(value);
}

function resizeAndConvertToBase64(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
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
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState<SignupValidationErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      return;
    }

    const base64 = await resizeAndConvertToBase64(event.target.files[0], 200);
    setProfileImageUrl(base64);
  };

  const removeImage = () => {
    setProfileImageUrl("");
  };

  const validateForm = () => {
    const nextErrors: SignupValidationErrors = {};

    if (!email.trim() || !isValidEmail(email.trim())) {
      nextErrors.email = "이메일을 다시 확인해주세요.";
    }

    if (!password.trim() || !validatePassword(password)) {
      nextErrors.password = "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 해요.";
    }

    if (!passwordConfirm.trim() || password !== passwordConfirm) {
      nextErrors.passwordConfirm = "비밀번호 확인을 다시 확인해주세요.";
    }

    if (!nickname.trim()) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signup(email.trim(), password, nickname.trim(), profileImageUrl || undefined);
      setSuccessMessage("회원가입이 완료됐어요! 로그인 후 동네 인증을 이어갈게요.");
      setIsLoading(false);
      window.setTimeout(() => navigate("/login", {
        state: {
          afterSignup: true,
          redirectTo: "/location/verify",
        },
      }), 900);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const { data } = err.response;
        if (data?.code === "DUPLICATE_EMAIL" || data?.code === "A001") {
          setErrors({ email: "이미 사용 중인 이메일이에요." });
        } else if (data?.code === "DUPLICATE_NICKNAME" || data?.code === "M004") {
          setErrors({ nickname: "이미 사용 중인 닉네임이에요." });
        } else if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setFormError(data.errors[0].message || "문제가 발생했어요. 다시 시도해주세요.");
        } else {
          setFormError(data?.message || "문제가 발생했어요. 다시 시도해주세요.");
        }
      } else {
        setFormError(err.message === "Network Error" ? "서버와 연결할 수 없어요." : "문제가 발생했어요. 다시 시도해주세요.");
      }
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
                부드럽고 귀여운 거래 경험, 지금부터 함께 시작해요.
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-white/90">
                기본 정보만 입력하면 바로 둘러볼 수 있어요. 프로필 이미지는 원하는 분위기로 가볍게 설정할 수 있어요.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <button type="button" onClick={() => navigate("/")} className="group flex flex-col items-center gap-4">
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

              <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2" noValidate>
                <div className="surface-panel col-span-full flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-[var(--getchu-orange-pale)] text-4xl shadow-sm">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="프로필 이미지" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[var(--getchu-orange-strong)]">G</span>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[var(--getchu-ink)]">프로필 이미지</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        선택 사항이에요. 친근한 첫인상을 만들 수 있어요.
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
                      disabled={isLoading || Boolean(successMessage)}
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
                        disabled={isLoading || Boolean(successMessage)}
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
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="user@example.com"
                    disabled={isLoading || Boolean(successMessage)}
                    aria-invalid={Boolean(errors.email)}
                  />
                  <FormValidationMessage message={errors.email} />
                </div>

                <div>
                  <Label htmlFor="nickname" className="mb-2 block text-sm font-medium">
                    닉네임
                  </Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(event) => {
                      setNickname(event.target.value);
                      setErrors((prev) => ({ ...prev, nickname: undefined }));
                    }}
                    placeholder="겟츄에서 사용할 이름"
                    disabled={isLoading || Boolean(successMessage)}
                    aria-invalid={Boolean(errors.nickname)}
                  />
                  <FormValidationMessage message={errors.nickname} />
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
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((prev) => ({ ...prev, password: undefined, passwordConfirm: undefined }));
                      }}
                      placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                      disabled={isLoading || Boolean(successMessage)}
                      className="pr-11"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                      onClick={() => setShowNewPass((prev) => !prev)}
                      disabled={isLoading || Boolean(successMessage)}
                    >
                      {showNewPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <FormValidationMessage message={errors.password} />
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
                      onChange={(event) => {
                        setPasswordConfirm(event.target.value);
                        setErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                      }}
                      placeholder="비밀번호를 한 번 더 입력해주세요"
                      disabled={isLoading || Boolean(successMessage)}
                      className="pr-11"
                      aria-invalid={Boolean(errors.passwordConfirm)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                      onClick={() => setShowConfirmPass((prev) => !prev)}
                      disabled={isLoading || Boolean(successMessage)}
                    >
                      {showConfirmPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  <FormValidationMessage message={errors.passwordConfirm} />
                </div>

                {isLoading ? (
                  <div className="col-span-full">
                    <FormLoadingState
                      title="회원가입 처리 중이에요..."
                      description="여우가 선물 상자를 준비하듯 계정을 만들고 있어요."
                      mascotImage={foxHeadImage}
                    />
                  </div>
                ) : null}

                {formError ? (
                  <div className="col-span-full">
                    <FormErrorState description={formError} mascotImage={foxHeadImage} />
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="col-span-full">
                    <FormSuccessFeedback
                      title="회원가입이 완료됐어요!"
                      description={successMessage}
                      mascotImage={foxHeadImage}
                    />
                  </div>
                ) : null}

                <div className="col-span-full pt-2">
                  <Button
                    type="submit"
                    className="w-full rounded-full text-base"
                    disabled={isLoading || Boolean(successMessage)}
                  >
                    {isLoading ? "회원가입 처리 중이에요..." : "회원가입"}
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
