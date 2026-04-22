import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ArrowRight,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  PackageSearch,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { membersApi } from "../api/members";
import { productsApi } from "../api/products";
import { ProductSummary } from "../types";
import { toast } from "sonner";
import logoImage from "../../assets/logo.png";
import foxHeadImage from "../../assets/logo-fox-head.png";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";
import LoadingState from "../components/ui/state/LoadingState";

const categories = ["전체", "디지털기기", "생활가전", "가구/인테리어", "패션", "도서", "스포츠/레저", "기타"];

const CATEGORY_ID_MAP: Record<string, number> = {
  디지털기기: 1,
  생활가전: 2,
  "가구/인테리어": 3,
  패션: 4,
  도서: 5,
  "스포츠/레저": 6,
  기타: 7,
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  SALE: { label: "판매중", color: "bg-[var(--getchu-orange)] text-white" },
  RESERVED: { label: "예약중", color: "bg-amber-400 text-white" },
  SOLD_OUT: { label: "판매완료", color: "bg-stone-300 text-stone-600" },
};

type FeedProduct = ProductSummary & { isLiked?: boolean; isMine?: boolean };

function applyFeedState(
  products: ProductSummary[],
  likedProductIds: Set<number>,
  myProductIds: Set<number>,
): FeedProduct[] {
  return products.map((product) => ({
    ...product,
    isLiked: likedProductIds.has(product.id),
    isMine: myProductIds.has(product.id),
  }));
}

function ProductCard({
  product,
  onNavigate,
  onLike,
}: {
  product: FeedProduct;
  onNavigate: (id: number) => void;
  onLike: (e: React.MouseEvent, id: number) => void;
}) {
  const badge = STATUS_BADGE[product.status] ?? STATUS_BADGE.SALE;

  return (
    <article
      onClick={() => onNavigate(product.id)}
      className="card-hover group flex cursor-pointer flex-col overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white"
    >
      <div className="relative aspect-[0.95] overflow-hidden bg-[linear-gradient(180deg,#fff6ec,#fff1e1)]">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--getchu-orange-strong)]">
            <PackageSearch className="size-10" />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${badge.color}`}>
            {badge.label}
          </span>
          {product.isMine ? (
            <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)] shadow-sm">
              내 상품
            </span>
          ) : (
            <button
              onClick={(e) => onLike(e, product.id)}
              className="btn-interactive flex items-center gap-1 rounded-full bg-white/88 px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm"
              aria-label="찜하기"
            >
              <Heart className={`size-4 ${product.isLiked ? "fill-red-500 text-red-500" : ""}`} />
              <span>{product.likeCount ?? 0}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]">
            <Sparkles className="size-3.5 text-[var(--getchu-orange)]" />
            <span>매끈한 상태의 중고 거래</span>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-[var(--getchu-ink)]">{product.title}</h3>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--getchu-orange-strong)]">
              {product.price.toLocaleString()}원
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {new Date(product.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="rounded-full bg-[var(--getchu-orange-pale)] px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
            둘러보기
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);

  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<FeedProduct[]>([]);
  const [likedMode, setLikedMode] = useState(false);
  const [likedProducts, setLikedProducts] = useState<FeedProduct[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchLikedProductIds = useCallback(async () => {
    if (!isAuthenticated) {
      return new Set<number>();
    }

    try {
      const likes = await membersApi.getMyLikes({ size: 200 });
      return new Set(likes.content.map((product) => product.id));
    } catch {
      return new Set<number>();
    }
  }, [isAuthenticated]);

  const fetchMyProductIds = useCallback(async () => {
    if (!isAuthenticated) {
      return new Set<number>();
    }

    try {
      const myProducts = await membersApi.getMyProducts({ size: 200 });
      return new Set(myProducts.content.map((product) => product.id));
    } catch {
      return new Set<number>();
    }
  }, [isAuthenticated]);

  const fetchProducts = useCallback(async () => {
    if (searchMode || likedMode) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const categoryId = selectedCategory === "전체" ? undefined : CATEGORY_ID_MAP[selectedCategory];
      const [saleRes, reservedRes, likedProductIds, myProductIds] = await Promise.all([
        productsApi.getProducts({ size: 50, categoryId }),
        productsApi.getProducts({ size: 50, status: "RESERVED", categoryId }),
        fetchLikedProductIds(),
        fetchMyProductIds(),
      ]);

      setProducts(applyFeedState([...saleRes.content, ...reservedRes.content], likedProductIds, myProductIds));
    } catch {
      setProducts([]);
      setErrorMessage("상품 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [fetchLikedProductIds, fetchMyProductIds, likedMode, searchMode, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    productsApi
      .getPopularKeywords()
      .then((data) => setPopularKeywords(data.keywords.slice(0, 10)))
      .catch(() => {
        setPopularKeywords(["아이패드", "책상", "자전거", "헤드폰", "카메라", "의자"]);
      });
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.status !== "SOLD_OUT"),
    [products],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLikedCount(0);
      setLikedProducts([]);
      return;
    }

    membersApi
      .getMyLikes({ size: 50 })
      .then((likes) => setLikedCount(likes.content.length))
      .catch(() => setLikedCount(0));
  }, [isAuthenticated]);

  const handleKeywordChange = (value: string) => {
    setKeyword(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await productsApi.searchProducts({ keyword: value, size: 20 });
        const filtered = data.content
          .filter((item) => item.title.toLowerCase().startsWith(value.toLowerCase()))
          .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 280);
  };

  const handleSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return;
    }

    setKeyword(searchTerm);
    setShowSuggestions(false);
    setSearchMode(true);
    setLikedMode(false);
    setLoading(true);
    setErrorMessage("");

    try {
      const [data, likedProductIds, myProductIds] = await Promise.all([
        productsApi.searchProducts({ keyword: searchTerm, size: 50 }),
        fetchLikedProductIds(),
        fetchMyProductIds(),
      ]);
      setSearchResults(applyFeedState(data.content, likedProductIds, myProductIds));
    } catch {
      setSearchResults([]);
      setErrorMessage("검색 결과를 가져오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [fetchLikedProductIds, fetchMyProductIds]);

  const handleShowLikedProducts = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setKeyword("");
    setSearchMode(false);
    setLikedMode(true);
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setLoading(true);
    setErrorMessage("");

    try {
      const [likes, myProductIds] = await Promise.all([
        membersApi.getMyLikes({ size: 50 }),
        fetchMyProductIds(),
      ]);
      const likedProductIds = new Set(likes.content.map((product) => product.id));
      setLikedCount(likes.content.length);
      setLikedProducts(applyFeedState(likes.content, likedProductIds, myProductIds));
    } catch {
      setLikedProducts([]);
      setErrorMessage("찜한 상품을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [fetchMyProductIds, isAuthenticated, navigate]);

  const handleClearSearch = () => {
    setKeyword("");
    setSearchMode(false);
    setLikedMode(false);
    setSearchResults([]);
    setLikedProducts([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setErrorMessage("");
  };

  const toggleLike = async (event: React.MouseEvent, productId: number) => {
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const product =
      (likedMode ? likedProducts : searchMode ? searchResults : products).find((item) => item.id === productId) ??
      products.find((item) => item.id === productId) ??
      searchResults.find((item) => item.id === productId) ??
      likedProducts.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    if (product.isMine) {
      toast.info("내 상품은 찜할 수 없어요.");
      return;
    }

    const nextIsLiked = !product.isLiked;
    const optimisticLikeCount = Math.max(0, (product.likeCount ?? 0) + (nextIsLiked ? 1 : -1));
    const updateProductLike = (item: FeedProduct, isLiked = nextIsLiked, likeCount = optimisticLikeCount): FeedProduct =>
      item.id === productId
        ? {
            ...item,
            isLiked,
            likeCount,
          }
        : item;

    try {
      if (product.isLiked) {
        await productsApi.deleteLike(productId);
      } else {
        await productsApi.createLike(productId);
      }

      setProducts((prev) => prev.map((item) => updateProductLike(item)));
      setSearchResults((prev) => prev.map((item) => updateProductLike(item)));
      setLikedProducts((prev) =>
        nextIsLiked
          ? prev.map((item) => updateProductLike(item))
          : prev.filter((item) => item.id !== productId),
      );
      setLikedCount((prev) => Math.max(0, prev + (nextIsLiked ? 1 : -1)));

      const [freshProduct, likedProductIds] = await Promise.all([
        productsApi.getProduct(productId).catch(() => null),
        fetchLikedProductIds(),
      ]);
      const syncedLikeCount = freshProduct?.likeCount ?? optimisticLikeCount;
      const syncedIsLiked = likedProductIds.has(productId);
      setProducts((prev) =>
        prev.map((item) => updateProductLike(item, syncedIsLiked, syncedLikeCount)),
      );
      setSearchResults((prev) =>
        prev.map((item) => updateProductLike(item, syncedIsLiked, syncedLikeCount)),
      );
      setLikedProducts((prev) =>
        syncedIsLiked
          ? prev.map((item) => updateProductLike(item, syncedIsLiked, syncedLikeCount))
          : prev.filter((item) => item.id !== productId),
      );
      setLikedCount(likedProductIds.size);
    } catch {
      toast.error("찜 처리 중 문제가 발생했어요.");
    }
  };

  const displayProducts = likedMode ? likedProducts : searchMode ? searchResults : filteredProducts;
  const reservedCount = products.filter((product) => product.status === "RESERVED").length;

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/78 backdrop-blur-xl">
        <div className="app-shell px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-4 text-left"
            >
              <div className="flex size-[4.1rem] items-center justify-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_top,#fff7ee,#ffe8cc_62%,#ffc98b)] shadow-[0_14px_24px_rgba(255,138,61,0.17)] ring-1 ring-orange-100/70">
                <img
                  src={foxHeadImage}
                  alt="Get-chu"
                  className="h-full w-full -translate-x-[8%] scale-[0.7] object-contain object-center mix-blend-multiply saturate-[1.05] contrast-[1.01] drop-shadow-[0_8px_14px_rgba(255,138,61,0.1)]"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--getchu-orange-strong)]">
                  Get-chu Market
                </p>
                <h1 className="mt-1 text-2xl font-bold text-[var(--getchu-ink)]">폭넓게 둘러보는 중고 마켓</h1>
              </div>
            </button>

            <div className="flex items-center gap-3 self-end lg:self-auto">
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-interactive rounded-full bg-[var(--getchu-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(255,138,61,0.24)]"
                >
                  로그인
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/my")}
                  className="btn-interactive flex size-11 items-center justify-center rounded-full border border-orange-100 bg-white text-[var(--getchu-orange-strong)] shadow-sm"
                >
                  <User className="size-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-shell px-4 pt-6">
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="surface-panel-strong overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="mx-auto flex size-36 items-center justify-center rounded-[2.6rem] bg-[radial-gradient(circle_at_top,#fffdf9,#fff1de_58%,#ffd8b0)] shadow-[0_24px_48px_rgba(255,138,61,0.22)] lg:mx-0">
                <img
                  src={logoImage}
                  alt="Get-chu"
                  className="character-bounce h-28 w-auto object-contain mix-blend-multiply drop-shadow-[0_16px_24px_rgba(255,138,61,0.2)]"
                />
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--getchu-orange-pale)] px-4 py-2 text-sm font-semibold text-[var(--getchu-orange-strong)]">
                  <Sparkles className="size-4" />
                  오늘의 거래를 더 보기 좋게
                </div>
                <h2 className="max-w-2xl text-3xl font-bold leading-tight text-[var(--getchu-ink)] sm:text-4xl">
                  귀엽고 믿음 가는 분위기로, 데스크톱에서도 넓게 탐색해요.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                  인기 상품부터 예약 진행 중인 물건까지 한눈에 보고, 필요한 거래를 더 빠르게 찾을 수 있게
                  정리했어요.
                </p>
              </div>
            </div>

            <div className="relative mt-6">
              <div className="flex items-center gap-3 rounded-[1.4rem] border border-orange-100 bg-white px-4 py-3 shadow-[0_16px_30px_rgba(255,138,61,0.08)]">
                <Search className="size-5 shrink-0 text-[var(--getchu-orange)]" />
                <input
                  ref={inputRef}
                  value={keyword}
                  onChange={(event) => handleKeywordChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && keyword.trim()) {
                      handleSearch(keyword);
                    }
                    if (event.key === "Escape") {
                      setShowSuggestions(false);
                      inputRef.current?.blur();
                    }
                  }}
                  placeholder="원하는 상품을 검색해 보세요"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-orange-300 sm:text-base"
                />
                {keyword ? (
                  <button type="button" onClick={handleClearSearch} className="text-orange-300">
                    <X className="size-5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleSearch(keyword)}
                  className="btn-interactive hidden rounded-full bg-[var(--getchu-orange)] px-4 py-2 text-sm font-semibold text-white sm:inline-flex"
                >
                  검색
                </button>
              </div>

              {showSuggestions ? (
                <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-[1.4rem] border border-orange-100 bg-white shadow-[0_22px_40px_rgba(255,138,61,0.16)]">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        handleSearch(item.title);
                      }}
                      className="flex w-full items-center gap-3 border-b border-orange-50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--getchu-orange-pale)]"
                    >
                      <Search className="size-4 shrink-0 text-[var(--getchu-orange)]" />
                      <span className="truncate text-sm text-stone-700">{item.title}</span>
                      <span className="ml-auto shrink-0 text-xs font-medium text-[var(--getchu-orange-strong)]">
                        {item.price.toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {!searchMode && !likedMode && popularKeywords.length > 0 ? (
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--getchu-ink)]">인기 검색어 TOP 10</p>
                  <button
                    type="button"
                    onClick={() => navigate("/search")}
                    className="text-xs font-semibold text-[var(--getchu-orange-strong)]"
                  >
                    검색 페이지에서 더 보기
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularKeywords.map((keywordItem, index) => (
                    <button
                      key={`${keywordItem}-${index}`}
                      type="button"
                      onClick={() => void handleSearch(keywordItem)}
                      className="btn-interactive rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-medium text-[var(--getchu-ink)] shadow-sm hover:border-orange-200 hover:bg-[var(--getchu-orange-pale)]"
                    >
                      <span className="mr-2 text-xs font-bold text-[var(--getchu-orange-strong)]">
                        {index + 1}
                      </span>
                      {keywordItem}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="surface-panel hidden flex-col justify-between gap-4 p-6 xl:flex">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                Market Snapshot
              </p>
              <h3 className="mt-3 text-2xl font-bold text-[var(--getchu-ink)]">
                지금 둘러보기 좋은 상품이 모여 있어요.
              </h3>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.4rem] bg-[var(--getchu-orange-pale)] p-4">
                <p className="text-sm text-[var(--muted-foreground)]">활성 상품</p>
                <p className="mt-2 text-3xl font-bold text-[var(--getchu-orange-strong)]">{filteredProducts.length}</p>
              </div>
              <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <p className="text-sm text-[var(--muted-foreground)]">예약 진행</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--getchu-ink)]">{reservedCount}</p>
              </div>
              <div className="rounded-[1.4rem] bg-white p-4 shadow-sm">
                <p className="text-sm text-[var(--muted-foreground)]">현재 모드</p>
                <div className="mt-2 flex items-center justify-between text-[var(--getchu-ink)]">
                  <span className="text-lg font-semibold">
                    {likedMode ? "찜한 상품" : searchMode ? "검색 결과" : "추천 상품"}
                  </span>
                  <ArrowRight className="size-4 text-[var(--getchu-orange-strong)]" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      !searchMode && !likedMode
                        ? "bg-[var(--getchu-orange)] text-white shadow-[0_12px_22px_rgba(255,138,61,0.22)]"
                        : "bg-[var(--getchu-orange-pale)] text-[var(--getchu-orange-strong)] hover:bg-orange-100"
                    }`}
                  >
                    추천 상품
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShowLikedProducts()}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                      likedMode
                        ? "bg-red-500 text-white shadow-[0_12px_22px_rgba(248,113,113,0.22)]"
                        : "bg-red-50 text-red-500 hover:bg-red-100"
                    }`}
                  >
                    찜 {isAuthenticated ? likedCount : "로그인"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/nearby")}
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-[var(--getchu-orange-strong)] ring-1 ring-orange-100 transition hover:bg-orange-50"
                  >
                    <MapPin className="size-4" />
                    내 근처 상품
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {!searchMode && !likedMode ? (
        <div className="app-shell px-4 pt-5">
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`category-chip btn-interactive ${selectedCategory === category ? "active" : ""}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <main className="app-shell px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--getchu-orange-strong)]">
              {likedMode ? "Liked Items" : searchMode ? "Search Results" : "Curated Items"}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--getchu-ink)]">
              {likedMode ? "내가 찜한 상품" : searchMode ? `"${keyword}" 검색 결과` : "지금 둘러보기 좋은 상품"}
            </h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {likedMode
              ? `${likedProducts.length}개의 찜`
              : searchMode
                ? `${searchResults.length}개의 결과`
                : `${filteredProducts.length}개의 상품`}
          </p>
        </div>

        {loading ? (
          <LoadingState
            mascotImage={foxHeadImage}
            description={
              likedMode
                ? "찜해둔 상품을 모아보고 있어요."
                : searchMode && keyword.trim()
                  ? `"${keyword}"와 어울리는 상품을 모아보고 있어요.`
                  : "여우가 마음에 드는 상품을 고르고 있어요."
            }
          />
        ) : errorMessage ? (
          <ErrorState
            mascotImage={foxHeadImage}
            title="화면을 준비하지 못했어요"
            description={errorMessage}
            actionLabel={likedMode ? "찜 목록 다시 불러오기" : searchMode ? "검색 다시 시도" : "목록 다시 불러오기"}
            onAction={() => {
              if (likedMode) {
                void handleShowLikedProducts();
              } else if (searchMode && keyword.trim()) {
                void handleSearch(keyword);
              } else {
                void fetchProducts();
              }
            }}
          />
        ) : likedMode && displayProducts.length === 0 ? (
          <EmptyState
            mascotImage={foxHeadImage}
            title="아직 찜한 상품이 없어요"
            description="마음에 드는 상품의 하트를 눌러두면 여기에서 다시 볼 수 있어요."
            actionLabel="전체 상품 보기"
            onAction={handleClearSearch}
          />
        ) : displayProducts.length === 0 ? (
          <EmptyState
            mascotImage={foxHeadImage}
            title={searchMode ? "검색 결과가 없어요" : "아직 등록된 상품이 없어요"}
            description={
              searchMode
                ? "다른 검색어로 다시 찾아보면 더 많은 상품을 만날 수 있어요."
                : "조금 뒤 다시 둘러보거나 새로운 카테고리를 선택해 보세요."
            }
            actionLabel={searchMode ? "전체 상품 보기" : undefined}
            onAction={searchMode ? handleClearSearch : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={(id) => navigate(`/products/${id}`)}
                onLike={toggleLike}
              />
            ))}
          </div>
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/88 backdrop-blur-xl md:hidden">
        <div className="floating-nav flex items-center justify-around px-3 py-3">
          <button type="button" className="flex flex-col items-center gap-1 text-[var(--getchu-orange)]">
            <Home className="size-6" />
            <span className="text-xs font-semibold">홈</span>
          </button>
          <button
            type="button"
            onClick={() => (isAuthenticated ? navigate("/chat") : navigate("/login"))}
            className="flex flex-col items-center gap-1 text-stone-400"
          >
            <MessageCircle className="size-6" />
            <span className="text-xs">채팅</span>
          </button>
          <button
            type="button"
            onClick={() => (isAuthenticated ? navigate("/my") : navigate("/login"))}
            className="flex flex-col items-center gap-1 text-stone-400"
          >
            <User className="size-6" />
            <span className="text-xs">마이</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
