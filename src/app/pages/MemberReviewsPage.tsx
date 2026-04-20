import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, House, MessageSquareText, Star, User } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { membersApi } from "../api/members";
import { Button } from "../components/ui/button";
import { PublicMember, Review } from "../types";
import { getMockImageUrl } from "../utils/imageStorage";

function StarRating({ rating, size = 4 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const sizeClass = size === 5 ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= full) {
            return <Star key={star} className={`${sizeClass} fill-amber-400 text-amber-400`} />;
          }

          if (star === full + 1 && half) {
            return (
              <span key={star} className={`relative ${sizeClass}`}>
                <Star className={`${sizeClass} absolute inset-0 text-gray-300`} />
                <span className="absolute inset-0 w-[50%] overflow-hidden">
                  <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
                </span>
              </span>
            );
          }

          return <Star key={star} className={`${sizeClass} text-gray-300`} />;
        })}
      </div>
      <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function ReviewerProfile({
  reviewerId,
  nickname,
  profileImageUrl,
  onNavigate,
}: {
  reviewerId?: number;
  nickname: string;
  profileImageUrl?: string | null;
  onNavigate: (id: number) => void;
}) {
  const [profile, setProfile] = useState<PublicMember | null>(null);

  useEffect(() => {
    if (!reviewerId) {
      return;
    }

    membersApi.getMember(reviewerId).then(setProfile).catch(() => {});
  }, [reviewerId]);

  const isClickable = Boolean(reviewerId);

  return (
    <button
      type="button"
      className={`flex items-center gap-3 text-left ${isClickable ? "transition hover:opacity-80" : "cursor-default"}`}
      onClick={() => isClickable && onNavigate(reviewerId!)}
      disabled={!isClickable}
      title={isClickable ? `${nickname} 프로필 보기` : undefined}
    >
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--getchu-cream)] ring-1 ring-[var(--getchu-border)]">
        {profileImageUrl ? (
          <img
            src={getMockImageUrl(profileImageUrl) ?? profileImageUrl}
            alt={nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900">{nickname}</p>
        {profile ? (
          <p className="text-xs text-gray-500">
            평점 {Number(profile.averageRating).toFixed(1)} · 리뷰 {profile.reviewCount}개
          </p>
        ) : (
          <p className="text-xs text-gray-400">리뷰어 정보 불러오는 중</p>
        )}
      </div>
    </button>
  );
}

export default function MemberReviewsPage() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) {
      return;
    }

    membersApi
      .getMemberReviews(Number(memberId))
      .then((response) => setReviews(response.content))
      .catch(() => toast.error("받은 리뷰를 불러오지 못했어요."))
      .finally(() => setLoading(false));
  }, [memberId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const latestDate = useMemo(() => {
    if (reviews.length === 0) {
      return "아직 없음";
    }

    return new Date(reviews[0].createdAt).toLocaleDateString("ko-KR");
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
                Reputation
              </p>
              <h1 className="text-xl font-semibold text-gray-900">받은 리뷰</h1>
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
            <p className="text-sm font-medium text-gray-500">평균 평점</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{averageRating.toFixed(1)}</p>
            <div className="mt-3">
              <StarRating rating={averageRating} size={5} />
            </div>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">받은 리뷰 수</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{reviews.length}</p>
          </div>

          <div className="surface-panel p-5">
            <p className="text-sm font-medium text-gray-500">최근 리뷰</p>
            <p className="mt-2 text-base font-semibold text-gray-900">{latestDate}</p>
          </div>
        </section>

        <section className="surface-panel overflow-hidden p-0">
          <div className="border-b border-[var(--getchu-border)] px-4 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">리뷰 목록</h2>
          </div>

          <div className="px-4 py-5 sm:px-6">
            {loading ? (
              <div className="rounded-[26px] border border-dashed border-[var(--getchu-border)] bg-[var(--getchu-cream)]/60 px-6 py-16 text-center text-sm text-gray-500">
                받은 리뷰를 불러오고 있어요.
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-[var(--getchu-border)] bg-[var(--getchu-cream)]/60 px-6 py-16 text-center">
                <MessageSquareText className="mx-auto h-10 w-10 text-[var(--getchu-orange)]/70" />
                <p className="mt-4 text-base font-medium text-gray-900">아직 받은 리뷰가 없어요.</p>
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
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <ReviewerProfile
                            reviewerId={review.reviewerId}
                            nickname={review.reviewerNickname}
                            profileImageUrl={review.reviewerProfileImageUrl}
                            onNavigate={(id) => navigate(`/members/${id}/reviews`)}
                          />

                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-3">
                          <StarRating rating={review.rating} size={4} />
                          <span className="rounded-full bg-[var(--getchu-cream)] px-3 py-1 text-xs font-medium text-[var(--getchu-orange-strong)]">
                            {review.productTitle}
                          </span>
                        </div>

                        {review.content ? (
                          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">{review.content}</p>
                        ) : null}
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
