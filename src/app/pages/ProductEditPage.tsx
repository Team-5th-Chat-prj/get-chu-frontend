import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, House, ImagePlus, Upload, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import axios from "axios";
import { toast } from "sonner";
import { productsApi } from "../api/products";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Category, ProductDetail } from "../types";
import { resizeToBase64 } from "../utils/imageUtils";

function formatPricePreview(value: string) {
  const amount = Number(value);

  if (!value || Number.isNaN(amount)) {
    return "가격을 입력하면 미리보기가 표시돼요";
  }

  return `${amount.toLocaleString()}원`;
}

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEditPrice = product?.status === "SALE";
  const pricePreview = useMemo(() => formatPricePreview(price), [price]);

  const handleImageFiles = async (files: FileList) => {
    const remaining = 10 - imageUrls.length;

    if (remaining <= 0) {
      toast.error("사진은 최대 10장까지 추가할 수 있어요.");
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    const base64List = await Promise.all(selected.map((file) => resizeToBase64(file, 800)));
    setImageUrls((prev) => [...prev, ...base64List]);
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    setPageLoading(true);

    productsApi
      .getProduct(Number(id))
      .then(async (productData) => {
        setProduct(productData);
        setTitle(productData.title);
        setPrice(productData.price.toString());
        setDescription(productData.description);
        setImageUrls(productData.imageUrls);

        const categoryList = await productsApi.getCategories();
        setCategories(categoryList);

        const matchedCategory = categoryList.find((category) => category.name === productData.categoryName);
        setCategoryId(matchedCategory ? matchedCategory.id : (categoryList[0]?.id ?? 0));
      })
      .catch(() => {
        toast.error("상품 정보를 불러오지 못했어요.");
        navigate(-1);
      })
      .finally(() => {
        setPageLoading(false);
      });
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!id || !product) {
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      toast.error("제목은 2자 이상 입력해 주세요.");
      return;
    }

    if (!price || Number(price) < 100) {
      toast.error("가격은 100원 이상 입력해 주세요.");
      return;
    }

    if (Number(price) > 2147483647) {
      toast.error("가격은 21억 원을 초과할 수 없어요.");
      return;
    }

    setIsLoading(true);

    try {
      const originalUrls = product.imageUrls;
      const urlsChanged = JSON.stringify(imageUrls) !== JSON.stringify(originalUrls);

      await productsApi.updateProduct(Number(id), {
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        categoryId,
        imageUrls: urlsChanged ? imageUrls : null,
      });

      toast.success("상품 정보를 수정했어요.");
      navigate(`/products/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response;

        if (status === 403) {
          toast.error("본인 상품만 수정할 수 있어요.");
        } else if (status === 404) {
          toast.error("상품을 찾을 수 없어요.");
        } else if (status === 400) {
          toast.error(data?.message ?? "입력값을 다시 확인해 주세요.");
        } else {
          toast.error(data?.message ?? "상품 수정에 실패했어요.");
        }
      } else {
        toast.error("서버와 연결할 수 없어요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--getchu-cream)]">
        <div className="surface-panel w-full max-w-md px-6 py-10 text-center text-sm text-gray-500">
          상품 수정 화면을 준비하고 있어요.
        </div>
      </div>
    );
  }

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
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Edit Product
              </p>
              <h1 className="text-xl font-semibold text-gray-900">상품 수정</h1>
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
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="surface-panel space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                  Media
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">상품 이미지</h2>
              </div>
              <span className="rounded-full bg-[var(--getchu-cream)] px-3 py-1 text-xs font-medium text-[var(--getchu-orange-strong)]">
                {imageUrls.length}/10장
              </span>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[var(--getchu-border)] bg-gradient-to-br from-[var(--getchu-cream)] via-white to-[var(--getchu-cream-strong)]">
              <div className="aspect-[4/3] w-full">
                {imageUrls[0] ? (
                  <img src={imageUrls[0]} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImagePlus className="mx-auto h-10 w-10 text-[var(--getchu-orange)]/70" />
                      <p className="mt-3 text-sm">대표 이미지를 추가해 주세요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => event.target.files && void handleImageFiles(event.target.files)}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUrls.length >= 10}
              className="w-full gap-2 border-orange-200 bg-[var(--getchu-cream)]/70 text-[var(--getchu-orange-strong)] hover:bg-[var(--getchu-cream-strong)]"
            >
              <Upload className="h-4 w-4" />
              사진 추가
            </Button>

            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {imageUrls.map((url, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-2xl border border-[var(--getchu-border)] bg-white">
                    <img src={url} alt="" className="h-20 w-full object-cover sm:h-24" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="surface-panel space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Basics
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">기본 정보</h2>
              <p className="mt-2 text-sm text-gray-500">수정이 자주 필요한 항목을 한눈에 확인할 수 있게 정리했어요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium text-gray-700">카테고리</Label>
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border border-[var(--getchu-border)] bg-white px-4 text-sm shadow-sm outline-none transition focus:border-[var(--getchu-orange)] focus:ring-4 focus:ring-[var(--getchu-orange)]/10"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                  제목
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={40}
                  placeholder="상품의 핵심 특징이 드러나게 적어 보세요"
                />
              </div>

              <div className="rounded-[26px] border border-[var(--getchu-border)] bg-[var(--getchu-cream)]/55 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                    가격
                  </Label>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                    {pricePreview}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_72px]">
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    disabled={!canEditPrice}
                    className="h-14 bg-white text-lg font-semibold"
                    placeholder="가격을 입력해 주세요"
                  />
                  <div className="flex h-14 items-center justify-center rounded-2xl border border-[var(--getchu-border)] bg-white text-base font-semibold text-[var(--getchu-orange-strong)] shadow-sm">
                    원
                  </div>
                </div>

                <p className={`mt-3 text-sm ${canEditPrice ? "text-gray-500" : "text-amber-700"}`}>
                  {canEditPrice
                    ? "구매자가 가격을 바로 알아볼 수 있도록 숫자를 정확히 입력해 주세요."
                    : "예약중 또는 거래중 상태에서는 가격을 수정할 수 없어요."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Details
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">상세 설명</h2>
            </div>
            <span className="text-sm text-gray-500">{description.length}/1000자</span>
          </div>

          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={1000}
            rows={8}
            placeholder="사용 기간, 상태, 구성품, 거래 희망 방식 등을 자세히 적어 주세요."
            className="min-h-[220px]"
          />
        </section>
      </main>
    </div>
  );
}
