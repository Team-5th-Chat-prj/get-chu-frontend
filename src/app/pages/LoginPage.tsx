import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
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

type LoginValidationErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const locationState = location.state as { afterSignup?: boolean; redirectTo?: string } | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<LoginValidationErrors>({});
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const nextErrors: LoginValidationErrors = {};

    if (!email.trim() || !isValidEmail(email.trim())) {
      nextErrors.email = "이메일을 다시 확인해주세요.";
    }

    if (!password.trim()) {
      nextErrors.password = "비밀번호를 다시 확인해주세요.";
    }

    setValidationErrors(nextErrors);
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
      await login(email.trim(), password);
      const nextPath = locationState?.redirectTo ?? "/";
      setSuccessMessage(locationState?.afterSignup ? "로그인됐어요! 동네 인증으로 이어갈게요." : "로그인됐어요! 홈으로 이동할게요.");
      window.setTimeout(() => navigate(nextPath, {
        replace: true,
        state: locationState?.afterSignup ? { returnTo: "/", afterSignup: true } : undefined,
      }), 450);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        setFormError(err.response.data.message || "이메일 또는 비밀번호를 다시 확인해주세요.");
      } else {
        setFormError("문제가 발생했어요. 다시 시도해주세요.");
      }
      setIsLoading(false);
    }
  };

  const setDummyAccount = (type: "buyer" | "seller") => {
    setEmail(type === "buyer" ? "buyer@test.com" : "seller@test.com");
    setPassword("Test1234!");
    setValidationErrors({});
    setFormError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-orange-100 bg-white/88 shadow-[0_30px_80px_rgba(255,138,61,0.18)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="brand-gradient relative hidden overflow-hidden px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-10 top-12 size-32 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-10 right-6 size-40 rounded-full bg-white/15 blur-3xl" />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
              <Sparkles className="size-4" />
              Get-chu Brand Lounge
            </div>
            <h1 className="mt-6 max-w-lg text-5xl font-bold leading-tight">
              따뜻한 여우와 함께, 믿음 가는 중고 거래를 시작해요.
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/90">
              귀엽고 편안한 거래 화면으로 정리했어요. 필요한 물건을 빠르게 찾고, 판매자와 자연스럽게 이어져요.
            </p>
          </div>

          <div className="relative flex items-end justify-between gap-8">
            <button type="button" onClick={() => navigate("/")} className="group flex flex-col items-center gap-4">
              <div className="flex size-[22rem] items-center justify-center rounded-[3rem] bg-[radial-gradient(circle_at_top,#fffdf9,#fff1de_58%,#ffd8b0)] p-10 shadow-[0_28px_60px_rgba(125,63,11,0.2),inset_0_1px_0_rgba(255,255,255,0.85)]">
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

            <div className="space-y-4">
              {["귀여운 상품 탐색", "부드러운 상호작용", "따뜻한 브랜드 톤"].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 whitespace-nowrap rounded-2xl bg-white/16 px-4 py-3 backdrop-blur-sm"
                >
                  <Check className="size-4 shrink-0" />
                  <span className="whitespace-nowrap font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="group mb-4 flex size-36 items-center justify-center rounded-[2.4rem] bg-[radial-gradient(circle_at_top,#fffdf9,#fff1de_58%,#ffd8b0)] shadow-[0_20px_36px_rgba(255,138,61,0.2)]"
              >
                <img
                  src={logoImage}
                  alt="Get-chu"
                  className="h-28 w-auto object-contain mix-blend-multiply drop-shadow-[0_14px_20px_rgba(255,138,61,0.18)] transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </button>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                Welcome Back
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
                Login
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--getchu-ink)]">다시 만나서 반가워요.</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                {locationState?.afterSignup
                  ? "로그인 후 동네를 인증하면 가까운 상품을 바로 만날 수 있어요."
                  : "계정에 로그인하고 관심 상품과 채팅 흐름을 이어가 보세요."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="user@example.com"
                  disabled={isLoading}
                  aria-invalid={Boolean(validationErrors.email)}
                />
                <FormValidationMessage message={validationErrors.email} />
              </div>

              <div>
                <Label htmlFor="password" className="mb-2 block text-sm font-medium">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="비밀번호를 입력해주세요"
                  disabled={isLoading}
                  aria-invalid={Boolean(validationErrors.password)}
                />
                <FormValidationMessage message={validationErrors.password} />
              </div>

              {isLoading ? (
                <FormLoadingState
                  title="로그인 중이에요..."
                  description="여우가 계정을 확인하고 있어요."
                  mascotImage={foxHeadImage}
                />
              ) : null}

              {formError ? <FormErrorState description={formError} mascotImage={foxHeadImage} /> : null}

              {successMessage ? (
                <FormSuccessFeedback
                  title="로그인됐어요!"
                  description={successMessage}
                  mascotImage={foxHeadImage}
                />
              ) : null}

              <Button type="submit" className="w-full rounded-full text-base" disabled={isLoading || Boolean(successMessage)}>
                {isLoading ? "로그인 중이에요..." : "로그인"}
              </Button>

              <div className="rounded-[1.5rem] border border-orange-100 bg-[var(--getchu-orange-pale)] p-4">
                <p className="text-center text-xs font-medium leading-5 text-[var(--muted-foreground)]">
                  테스트 계정을 빠르게 채워 넣을 수 있어요. 비밀번호는 <strong>Test1234!</strong> 입니다.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
                    onClick={() => setDummyAccount("buyer")}
                    disabled={isLoading}
                  >
                    구매자 계정
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-orange-200 bg-white text-[var(--getchu-orange-strong)]"
                    onClick={() => setDummyAccount("seller")}
                    disabled={isLoading}
                  >
                    판매자 계정
                  </Button>
                </div>
              </div>

              <p className="flex items-center justify-center gap-2 text-center text-sm text-[var(--muted-foreground)]">
                계정이 아직 없으신가요?
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center gap-1 font-semibold text-[var(--getchu-orange-strong)]"
                  disabled={isLoading}
                >
                  회원가입
                  <ArrowRight className="size-4" />
                </button>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
