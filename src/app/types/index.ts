// ─── 공통 ────────────────────────────────────────────────
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface CursorResponse<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

// ─── 상품 ────────────────────────────────────────────────
// 백엔드 ProductEnum: SALE | RESERVED | SOLD_OUT
export type ProductStatus = "SALE" | "RESERVED" | "SOLD_OUT";

/** GET /products 목록 응답 (ProductListResponse) */
export interface ProductSummary {
  id: number;
  title: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl: string | null;
  likeCount?: number;
  createdAt: string;
}

/** GET /products/:id 상세 응답 (ProductResponse) */
export interface ProductDetail {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  likeCount?: number;
  categoryName: string | null;
  sellerNickname: string;
  imageUrls: string[];
  createdAt: string;
}

/** POST /products, PATCH /products/:id 요청 */
export interface ProductPayload {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrls: string[] | null;  // null이면 백엔드에서 기존 이미지 유지
}

/** 카테고리 */
export interface Category {
  id: number;
  name: string;
}

/** GET /search/popular */
export interface PopularKeywordsResponse {
  keywords: string[];
  cachedAt: string;
}

// ─── 회원 ────────────────────────────────────────────────
/** GET /members/me (MemberResponse) */
export interface Member {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt?: string;
}

/** GET /members/:id (MemberProfileResponse) */
export interface PublicMember {
  id: number;
  nickname: string;
  profileImageUrl?: string | null;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

// ─── 거래 ────────────────────────────────────────────────
// 백엔드 TradeStatus: SALE | RESERVED | TRADING | SOLD | REVIEWED
export type TradeStatus = "SALE" | "RESERVED" | "TRADING" | "SOLD" | "REVIEWED";

// 백엔드 TradeRole: SELLER | BUYER
export type TradeRole = "SELLER" | "BUYER";

/** GET /members/me/trades 목록 아이템 (GetAllTradeResponse) */
export interface Trade {
  tradeId: number;
  productTitle: string;
  productId: number;
  price: number;
  status: TradeStatus;
  updatedAt: string;
}

/** GET /trades/:id 상세 (GetTradeDetailResponse) */
export interface TradeDetail {
  productTitle: string;
  status: TradeStatus;
  price: number;
  productCreatedAt: string;
  soldAt: string | null;
  sellerNickname: string;
  buyerNickname: string;
}

/** POST /products/:id/reserve 응답 (TradeReserveResponse) */
export interface TradeReserveResponse {
  tradeId: number;
  productTitle: string;
  sellerNickname: string;
  buyerNickname: string;
}

// ─── 채팅 ────────────────────────────────────────────────
/** GET /chat-rooms 목록 아이템 (ChatRoomSummaryResponse) */
export interface ChatRoomSummary {
  chatRoomId: number;
  opponentId: number;
  opponentNickname: string;
  opponentProfileImageUrl: string | null;
  productId: number;
  lastMessage: string | null;
  unreadCount: number;
}

/** POST /chat-rooms 응답 (ChatRoomResponse) */
export interface ChatRoomResponse {
  chatRoomId: number;
  created: boolean;
}

/** GET /chat-rooms/:id/messages 아이템 (ChatMessageResponse) */
export interface ChatMessage {
  messageId: number;
  chatRoomId: number;
  senderId: number;
  senderNickname: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// ─── 리뷰 ────────────────────────────────────────────────
/** GET /members/:id/reviews 아이템 (ReviewResponse) */
export interface Review {
  id: number;
  reviewerId: number;
  rating: number;
  content: string;
  createdAt: string;
  reviewerNickname: string;
  reviewerProfileImageUrl?: string | null;
  productTitle: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

// ─── 하위 호환 ───────────────────────────────────────────
/** @deprecated ProductSummary 또는 ProductDetail 사용 권장 */
export interface Product extends ProductSummary {
  categoryName?: string | null;
  description: string;
  sellerNickname: string;
  imageUrls: string[];
}
