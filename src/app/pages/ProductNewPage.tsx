import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { productsApi } from "../api/products";
import { Category } from "../types";
import axios from "axios";
import { resizeToBase64 } from "../utils/imageUtils";
import { useAuth } from "../contexts/AuthContext";
import { getVerifiedLocation } from "../utils/verifiedLocation";

export default function ProductNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    productsApi.getCategories()
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem("accessToken"));

    if (!hasToken) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (!user) {
      return;
    }

    if (!getVerifiedLocation(user.id)) {
      toast.info("상품을 등록하려면 동네 인증이 먼저 필요해요.");
      navigate("/location/verify");
    }
  }, [navigate, user]);

  const handleImageFiles = async (files: FileList) => {
    const remaining = 10 - imageUrls.length;
    if (remaining <= 0) { toast.error("사진은 최대 10장까지 가능합니다"); return; }
    const selected = Array.from(files).slice(0, remaining);
    const base64List = await Promise.all(selected.map((f) => resizeToBase64(f, 800)));
    setImageUrls((prev) => [...prev, ...base64List]);
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user || !getVerifiedLocation(user.id)) {
      toast.info("상품을 등록하려면 동네 인증이 먼저 필요해요.");
      navigate("/location/verify");
      return;
    }

    if (!title.trim() || title.length < 2) {
      toast.error("제목은 2자 이상 입력해주세요"); return;
    }
    if (!price || Number(price) < 100) {
      toast.error("가격은 100원 이상 입력해주세요"); return;
    }
    if (Number(price) > 2147483647) {
      toast.error("가격은 21억원을 초과할 수 없습니다"); return;
    }
    if (!description.trim()) {
      toast.error("상품 설명을 입력해주세요"); return;
    }
    if (categoryId === 0) {
      toast.error("카테고리를 선택해주세요"); return;
    }

    setIsLoading(true);
    try {
      const result = await productsApi.createProduct({
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        categoryId,
        imageUrls,
      });
      toast.success("상품이 등록되었습니다");
      navigate(`/products/${result.id}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const { status, data } = err.response;
        if (status === 401) { toast.error("로그인이 필요합니다"); navigate("/login"); }
        else if (status === 400) toast.error(data?.errors?.[0]?.message ?? data?.message ?? "입력값을 확인해주세요");
        else toast.error(data?.message ?? "상품 등록에 실패했습니다");
      } else {
        toast.error("서버와 연결할 수 없습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} disabled={isLoading}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-medium">상품 등록</h1>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-[var(--getchu-orange)] hover:bg-[var(--getchu-orange-strong)]">
            {isLoading ? "등록 중..." : "완료"}
          </Button>
        </div>
      </header>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* 이미지 */}
        <div>
          <Label className="text-sm mb-2 block">이미지 ({imageUrls.length}/10)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={imageUrls.length >= 10}
            className="w-full gap-2 mb-3"
          >
            <Upload className="w-4 h-4" /> 사진 추가
          </Button>
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 shrink-0">
                  <img src={url} alt="상품" className="w-full h-full object-cover rounded-lg border bg-gray-100" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리 */}
        <div>
          <Label className="text-sm mb-2 block">카테고리 *</Label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 제목 */}
        <div>
          <Label htmlFor="title" className="text-sm mb-2 block">제목 * (2~40자)</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="상품 제목을 입력하세요" maxLength={40} />
        </div>

        {/* 가격 */}
        <div>
          <Label htmlFor="price" className="text-sm mb-2 block">가격 *</Label>
          <div className="relative">
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="pr-8" min={100} max={2147483647} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">원</span>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <Label htmlFor="description" className="text-sm mb-2 block">설명 * (최대 1000자)</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품 설명을 입력하세요" maxLength={1000} rows={6} />
          <p className="text-xs text-gray-500 mt-1">{description.length}/1000자</p>
        </div>
      </div>
    </div>
  );
}
