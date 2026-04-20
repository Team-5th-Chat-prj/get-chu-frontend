import { Product, Member } from "../types";

// Mock 상품 데이터 (배열 기반)
export const mockProducts: Product[] = [
  {
    id: 1,
    title: "침대 프레임 퀸사이즈",
    price: 150000,
    status: "SALE",
    category: "가구",
    categoryId: 1,
    description: "2년 사용, 상태 양호합니다.\n이사 때문에 급처합니다.",
    createdAt: "2025-06-01T10:00:00",
    sellerId: 2,
    sellerNickname: "김민준",
    sellerRating: 4.8,
    sellerReviewCount: 23,
    imageUrls: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800",
    ],
    likeCount: 7,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400",
  },
  {
    id: 2,
    title: "아이패드 Pro 11인치",
    price: 200000,
    status: "RESERVED",
    category: "전자기기",
    categoryId: 2,
    description: "2022년 모델, 애플펜슬 포함입니다.\n거의 새 것 같아요.",
    createdAt: "2025-06-02T11:00:00",
    sellerId: 3,
    sellerNickname: "박준서",
    sellerRating: 4.5,
    sellerReviewCount: 15,
    imageUrls: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800",
    ],
    likeCount: 12,
    isLiked: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
  },
  {
    id: 3,
    title: "원피스 S사이즈",
    price: 30000,
    status: "SALE",
    category: "의류",
    categoryId: 3,
    description: "한두번 입었어요. 깨끗합니다.",
    createdAt: "2025-06-03T09:00:00",
    sellerId: 4,
    sellerNickname: "이수지",
    sellerRating: 4.9,
    sellerReviewCount: 8,
    imageUrls: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
    ],
    likeCount: 5,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
  },
  {
    id: 4,
    title: "자전거",
    price: 120000,
    status: "SALE",
    category: "기타",
    categoryId: 6,
    description: "잘 타다가 팝니다. 변속기 잘 됩니다.",
    createdAt: "2025-06-04T14:00:00",
    sellerId: 2,
    sellerNickname: "김민준",
    sellerRating: 4.8,
    sellerReviewCount: 23,
    imageUrls: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
    ],
    likeCount: 9,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400",
  },
  {
    id: 5,
    title: "책상 원목",
    price: 80000,
    status: "SALE",
    category: "가구",
    categoryId: 1,
    description: "튼튼한 원목 책상입니다.",
    createdAt: "2025-06-05T16:00:00",
    sellerId: 1,
    sellerNickname: "현재사용자",
    sellerRating: 5.0,
    sellerReviewCount: 2,
    imageUrls: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    ],
    likeCount: 4,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400",
  },
  {
    id: 6,
    title: "소설책 세트",
    price: 15000,
    status: "SALE",
    category: "도서",
    categoryId: 5,
    description: "베스트셀러 소설 10권 세트입니다.",
    createdAt: "2025-06-06T13:00:00",
    sellerId: 3,
    sellerNickname: "박준서",
    sellerRating: 4.5,
    sellerReviewCount: 15,
    imageUrls: [
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
    ],
    likeCount: 2,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
  },
  {
    id: 7,
    title: "소파 3인용",
    price: 200000,
    status: "SOLD",
    category: "가구",
    categoryId: 1,
    description: "편안한 소파입니다. 거래 완료되었습니다.",
    createdAt: "2025-05-28T10:00:00",
    sellerId: 1,
    sellerNickname: "현재사용자",
    sellerRating: 5.0,
    sellerReviewCount: 2,
    imageUrls: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      ],
      likeCount: 8,
      isLiked: false,
      thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
  },
  {
    id: 901,
    title: "이케아 침대 프레임",
    price: 150000,
    status: "SALE",
    category: "가구",
    categoryId: 1,
    description: "상태 좋음\n프레임 튼튼하고 디자인 아주 깔끔합니다.\n제가 이사가서 팝니다.",
    createdAt: new Date().toISOString(),
    sellerId: 1,
    sellerNickname: "테스터",
    sellerRating: 5.0,
    sellerReviewCount: 1,
    imageUrls: ["https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80"],
    likeCount: 5,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=500&q=80",
  },
  {
    id: 902,
    title: "아이패드 프로 11인치",
    price: 800000,
    status: "SALE",
    category: "전자기기",
    categoryId: 2,
    description: "거의 새거\n배터리 99% 입니다. 기스 없습니다.",
    createdAt: new Date().toISOString(),
    sellerId: 1,
    sellerNickname: "애플맨",
    sellerRating: 4.5,
    sellerReviewCount: 10,
    imageUrls: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80"],
    likeCount: 12,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80",
  },
  {
    id: 903,
    title: "나이키 맨투맨 L",
    price: 35000,
    status: "SALE",
    category: "의류",
    categoryId: 3,
    description: "사이즈 미스로 팝니다\n한번 시착만 했습니다.",
    createdAt: new Date().toISOString(),
    sellerId: 2,
    sellerNickname: "옷장정리",
    sellerRating: 4.0,
    sellerReviewCount: 3,
    imageUrls: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80"],
    likeCount: 2,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80",
  },
  {
    id: 904,
    title: "개발바닥 자바 책",
    price: 15000,
    status: "SALE",
    category: "도서",
    categoryId: 5,
    description: "안읽었습니다\n비닐도 안 뜯은 새제품입니다.",
    createdAt: new Date().toISOString(),
    sellerId: 3,
    sellerNickname: "백버드",
    sellerRating: 5.0,
    sellerReviewCount: 8,
    imageUrls: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80"],
    likeCount: 1,
    isLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80",
  },
  {
    id: 905,
    title: "캠핑용 랜턴",
    price: 25000,
    status: "SALE",
    category: "기타",
    categoryId: 6,
    description: "1회 사용\n충전 잘 되고 아주 밝습니다.",
    createdAt: new Date().toISOString(),
    sellerId: 4,
    sellerNickname: "캠린이",
    sellerRating: 3.5,
    sellerReviewCount: 2,
    imageUrls: ["https://images.unsplash.com/photo-1504280654066-6415774aeb65?w=500&q=80"],
    likeCount: 6,
    isLiked: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1504280654066-6415774aeb65?w=500&q=80",
  }
];

// Mock 회원 데이터
export const mockCurrentUser: Member = {
  id: 1,
  email: "user@example.com",
  nickname: "현재사용자",
  profileImageUrl: undefined,
  averageRating: 5.0,
  reviewCount: 2,
};

// 상품 찾기
export const findProductById = (id: number): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};

// 내 판매 상품 목록
export const getMyProducts = (userId: number): Product[] => {
  return mockProducts.filter((p) => p.sellerId === userId);
};

// 찜한 상품 목록 (isLiked === true인 상품들)
export const getLikedProducts = (): Product[] => {
  return mockProducts.filter((p) => p.isLiked);
};

// 카테고리별 필터링
export const filterProductsByCategory = (category: string): Product[] => {
  if (category === "전체") return mockProducts;
  return mockProducts.filter((p) => p.category === category);
};

// 검색
export const searchProducts = (keyword: string, category?: string): Product[] => {
  let results = mockProducts;

  if (category && category !== "전체") {
    results = results.filter((p) => p.category === category);
  }

  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    results = results.filter((p) =>
      p.title.toLowerCase().includes(lowerKeyword) ||
      p.description.toLowerCase().includes(lowerKeyword)
    );
  }

  return results;
};

// 상품 업데이트
export const updateProduct = (id: number, updates: Partial<Product>): Product | null => {
  const index = mockProducts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  mockProducts[index] = { ...mockProducts[index], ...updates };
  return mockProducts[index];
};

// 상품 삭제
export const deleteProduct = (id: number): boolean => {
  const index = mockProducts.findIndex((p) => p.id === id);
  if (index === -1) return false;

  mockProducts.splice(index, 1);
  return true;
};

// 찜하기/취소
export const toggleLike = (id: number): Product | null => {
  const product = findProductById(id);
  if (!product) return null;

  const newIsLiked = !product.isLiked;
  const newLikeCount = newIsLiked ? product.likeCount + 1 : product.likeCount - 1;

  return updateProduct(id, {
    isLiked: newIsLiked,
    likeCount: newLikeCount,
  });
};

// 예약하기
export const reserveProduct = (id: number): Product | null => {
  return updateProduct(id, { status: "RESERVED" });
};
