import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, PackageSearch, Search, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { productsApi } from "../api/products";
import { ProductSummary } from "../types";
import FeedbackState from "../components/FeedbackState";

const STATUS_LABEL: Record<string, string> = {
  SALE: "판매중",
  RESERVED: "예약중",
  SOLD_OUT: "판매완료",
};

export default function SearchPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [suggestions, setSuggestions] = useState<ProductSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    productsApi
      .getPopularKeywords()
      .then((data) => setPopularKeywords(data.keywords.slice(0, 10)))
      .catch(() => {
        setPopularKeywords(["아이패드", "카메라", "의자", "책상", "헤드폰", "자전거"]);
      });
  }, []);

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
        const startsWithKeyword = data.content.filter((item) =>
          item.title.toLowerCase().startsWith(value.toLowerCase()),
        );
        const sorted = startsWithKeyword.slice(0, 5);
        setSuggestions(sorted);
        setShowSuggestions(sorted.length > 0);
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
    setShowResults(true);
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await productsApi.searchProducts({ keyword: searchTerm, size: 50 });
      setResults(data.content);
    } catch {
      setResults([]);
      setErrorMessage("검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = () => {
    setKeyword("");
    setShowResults(false);
    setShowSuggestions(false);
    setResults([]);
    setSuggestions([]);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen pb-10">
      <div className="app-shell px-4 py-6 sm:py-8">
        <section className="surface-panel-strong overflow-visible p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-interactive flex size-11 items-center justify-center rounded-full border border-orange-100 bg-white text-[var(--getchu-orange-strong)]"
            >
              <ArrowLeft className="size-5" />
            </button>

            <div className="relative flex-1">
              <Input
                value={keyword}
                onChange={(event) => handleKeywordChange(event.target.value)}
                placeholder="찾고 싶은 상품을 입력해 보세요"
                className="h-12 rounded-[1.1rem] border-orange-100 bg-white pr-10"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && keyword.trim()) {
                    handleSearch(keyword);
                  }
                  if (event.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {keyword ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                >
                  <X className="size-4" />
                </button>
              ) : null}

              {showSuggestions ? (
                <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-[1.2rem] border border-orange-100 bg-white shadow-[0_24px_42px_rgba(255,138,61,0.18)]">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        handleSearch(item.title);
                      }}
                      className="flex w-full items-center gap-3 border-b border-orange-50 px-4 py-3 text-left last:border-b-0 hover:bg-[var(--getchu-orange-pale)]"
                    >
                      <Search className="size-4 shrink-0 text-[var(--getchu-orange)]" />
                      <span className="truncate text-sm text-stone-800">{item.title}</span>
                      <span className="ml-auto shrink-0 text-xs font-medium text-[var(--getchu-orange-strong)]">
                        {item.price.toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => keyword.trim() && handleSearch(keyword)}
              className="btn-interactive hidden rounded-full bg-[var(--getchu-orange)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(255,138,61,0.24)] sm:inline-flex"
            >
              검색
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                Search Lounge
              </p>
              <h1 className="mt-2 text-2xl font-bold text-[var(--getchu-ink)] sm:text-3xl">
                필요한 상품을 넓은 화면에서 편하게 찾아보세요.
              </h1>
            </div>
            {showResults ? (
              <p className="text-sm text-[var(--muted-foreground)]">{results.length}개의 결과</p>
            ) : null}
          </div>
        </section>

        {!showResults ? (
          <section className="mt-6 surface-panel p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--getchu-ink)]">인기 검색어</h2>
              <span className="text-sm text-[var(--muted-foreground)]">TOP 10</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {popularKeywords.map((keywordItem, index) => (
                <button
                  key={`${keywordItem}-${index}`}
                  type="button"
                  onClick={() => handleSearch(keywordItem)}
                  className="btn-interactive rounded-[1.3rem] border border-orange-100 bg-white px-4 py-4 text-left shadow-sm hover:border-orange-200 hover:bg-[var(--getchu-orange-pale)]"
                >
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                    Top {index + 1}
                  </span>
                  <span className="mt-2 block text-base font-semibold text-[var(--getchu-ink)]">
                    {keywordItem}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[1.6rem] border border-orange-100 bg-white">
                    <div className="skeleton aspect-[1.2]" />
                    <div className="space-y-3 p-4">
                      <div className="skeleton h-4 w-1/3" />
                      <div className="skeleton h-6 w-4/5" />
                      <div className="skeleton h-4 w-2/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <FeedbackState
                variant="error"
                title="검색 결과를 불러오지 못했어요"
                description={errorMessage}
                actionLabel="검색 다시 시도"
                onAction={() => void handleSearch(keyword)}
              />
            ) : results.length === 0 ? (
              <FeedbackState
                title="검색 결과가 없어요"
                description="키워드를 조금 다르게 입력해 보거나 인기 검색어를 다시 둘러보세요."
                actionLabel="인기 검색어 보기"
                onAction={handleClear}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {results.map((product) => (
                  <article
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="card-hover cursor-pointer overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white"
                  >
                    <div className="relative aspect-[1.15] overflow-hidden bg-[linear-gradient(180deg,#fff7ec,#fff1df)]">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--getchu-orange-strong)]">
                          <PackageSearch className="size-10" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[var(--getchu-orange-pale)] px-3 py-1 text-xs font-semibold text-[var(--getchu-orange-strong)]">
                          {STATUS_LABEL[product.status] ?? product.status}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {new Date(product.createdAt).toLocaleDateString("ko-KR", {
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div>
                        <h3 className="line-clamp-2 text-lg font-semibold text-[var(--getchu-ink)]">
                          {product.title}
                        </h3>
                        <p className="mt-2 text-xl font-bold text-[var(--getchu-orange-strong)]">
                          {product.price.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
