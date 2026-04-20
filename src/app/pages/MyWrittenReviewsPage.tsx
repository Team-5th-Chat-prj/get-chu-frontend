import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, House, MessageSquareText, Package2, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { membersApi } from "../api/members";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { Review } from "../types";

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyWrittenReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    membersApi
      .getWrittenReviews(user.id)
      .then((response) => setReviews(response.content))
      .catch(() => toast.error("작성한 리뷰를 불러오지 못했어요."))
      .finally(() => setLoading(false));
  }, [user]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55 pb-24">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--getchu-border)] bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[var(--getchu-orange)] hover:text-[var(--getchu-orange-strong)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Review History
              </p>
              <h1 className="text-xl font-semibold text-gray-900">내가 작성한 리뷰</h1>
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
        <section className="grid gap-3 md:grid-cols-3">
          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">작성한 리뷰 수</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{reviews.length}</p>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">평균 별점</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{averageRating.toFixed(1)}</p>
            <div className="mt-3">
              <ReviewStars rating={Math.round(averageRating)} />
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">최근 활동</p>
            <p className="mt-2 text-base font-semibold text-gray-900">
              {reviews[0] ? new Date(reviews[0].createdAt).toLocaleDateString("ko-KR") : "아직 없음"}
            </p>
          </div>
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="border-b border-[var(--getchu-border)] px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">리뷰 목록</h2>
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loading ? (
              <div className="rounded-[26px] border border-dashed border-[var(--getchu-border)] bg-[var(--getchu-cream)]/60 px-6 py-16 text-center text-sm text-gray-500">
                리뷰 목록을 불러오고 있어요.
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-[var(--getchu-border)] bg-[var(--getchu-cream)]/60 px-6 py-16 text-center">
                <MessageSquareText className="mx-auto h-10 w-10 text-[var(--getchu-orange)]/70" />
                <p className="mt-4 text-base font-medium text-gray-900">아직 작성한 리뷰가 없어요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[28px] border border-[var(--getchu-border)] bg-white p-5 shadow-[0_12px_32px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(148,163,184,0.14)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
                            작성 완료
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <ReviewStars rating={review.rating} />
                          <span className="text-sm font-semibold text-gray-700">{review.rating.toFixed(1)}</span>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--getchu-border)] bg-[var(--getchu-cream)]/45 px-4 py-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Package2 className="h-4 w-4 text-[var(--getchu-orange-strong)]" />
                            {review.productTitle}
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
                          {review.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
