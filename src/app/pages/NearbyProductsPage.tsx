import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, LocateFixed, MapPin } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { productsApi } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/ui/button";
import EmptyState from "../components/ui/state/EmptyState";
import ErrorState from "../components/ui/state/ErrorState";
import LoadingState from "../components/ui/state/LoadingState";
import { NearbyProduct } from "../types";
import { waitForKakaoMap } from "../utils/kakaoMap";
import { getVerifiedLocation, StoredVerifiedLocation } from "../utils/verifiedLocation";
import foxHeadImage from "../../assets/logo-fox-head.png";

const RADIUS_OPTIONS = [1, 3, 5, 10];

interface UserLocation {
  lat: number;
  lng: number;
  locationName?: string;
  source: "verified" | "browser";
}

function getMapLevel(radius: number) {
  if (radius <= 1) return 5;
  if (radius <= 3) return 6;
  if (radius <= 5) return 7;
  return 8;
}

function formatPrice(price: number) {
  return `${price.toLocaleString()}원`;
}

export default function NearbyProductsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const infoWindowsRef = useRef<KakaoInfoWindow[]>([]);
  const initialRadiusRef = useRef(3);

  const [radius, setRadius] = useState(3);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    infoWindowsRef.current.forEach((infoWindow) => infoWindow.close());
    markersRef.current = [];
    infoWindowsRef.current = [];
  }, []);

  const renderMap = useCallback(async (nextLocation: UserLocation, nextProducts: NearbyProduct[], nextRadius: number) => {
    if (!mapRef.current) {
      return;
    }

    await waitForKakaoMap();

    const center = new window.kakao!.maps.LatLng(nextLocation.lat, nextLocation.lng);

    if (!kakaoMapRef.current) {
      kakaoMapRef.current = new window.kakao!.maps.Map(mapRef.current, {
        center,
        level: getMapLevel(nextRadius),
      });
    } else {
      kakaoMapRef.current.relayout();
      kakaoMapRef.current.setCenter(center);
      kakaoMapRef.current.setLevel(getMapLevel(nextRadius));
    }

    clearMarkers();

    const myMarker = new window.kakao!.maps.Marker({
      map: kakaoMapRef.current,
      position: center,
    });
    markersRef.current.push(myMarker);

    nextProducts.forEach((product) => {
      if (product.lat == null || product.lng == null || !kakaoMapRef.current) {
        return;
      }

      const position = new window.kakao!.maps.LatLng(product.lat, product.lng);
      const marker = new window.kakao!.maps.Marker({
        map: kakaoMapRef.current,
        position,
      });
      const infoWindow = new window.kakao!.maps.InfoWindow({
        content: `
          <div style="padding:10px 12px;min-width:170px;font-size:13px;line-height:1.5">
            <strong style="display:block;margin-bottom:4px">${product.title}</strong>
            <span style="color:#ff7f35;font-weight:700">${formatPrice(product.price)}</span>
            <span style="display:block;color:#78716c">${product.distanceKm.toFixed(1)}km</span>
          </div>
        `,
        removable: true,
      });

      window.kakao!.maps.event.addListener(marker, "click", () => {
        infoWindowsRef.current.forEach((item) => item.close());
        infoWindow.open(kakaoMapRef.current!, marker);
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });
  }, [clearMarkers]);

  const fetchNearbyProducts = useCallback(async (nextLocation: UserLocation, nextRadius: number) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await productsApi.getNearbyProducts({
        lat: nextLocation.lat,
        lng: nextLocation.lng,
        radius: nextRadius,
        page: 0,
      });
      const nextProducts = response.content ?? [];
      setProducts(nextProducts);
      await renderMap(nextLocation, nextProducts, nextRadius);
    } catch {
      setProducts([]);
      setErrorMessage("근처 상품을 불러오지 못했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [renderMap]);

  const useLocationForProducts = useCallback((nextLocation: UserLocation, nextRadius: number) => {
    setLocation(nextLocation);
    void fetchNearbyProducts(nextLocation, nextRadius);
  }, [fetchNearbyProducts]);

  useEffect(() => {
    const verifiedLocation: StoredVerifiedLocation | null = getVerifiedLocation(user?.id);

    if (verifiedLocation) {
      useLocationForProducts(
        {
          lat: verifiedLocation.lat,
          lng: verifiedLocation.lng,
          locationName: verifiedLocation.locationName,
          source: "verified",
        },
        initialRadiusRef.current,
      );
      return () => clearMarkers();
    }

    if (!navigator.geolocation) {
      setLoading(false);
      setErrorMessage("인증된 동네가 없고, 이 브라우저에서는 현재 위치도 사용할 수 없어요.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          source: "browser" as const,
        };
        useLocationForProducts(nextLocation, initialRadiusRef.current);
      },
      () => {
        setLoading(false);
        setErrorMessage("동네 인증을 먼저 완료하거나 위치 권한을 허용해주세요.");
        toast.error("동네 인증 또는 위치 권한이 필요해요.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );

    return () => clearMarkers();
  }, [clearMarkers, useLocationForProducts, user?.id]);

  const handleRadiusChange = (nextRadius: number) => {
    setRadius(nextRadius);

    if (!location) {
      return;
    }

    void fetchNearbyProducts(location, nextRadius);
  };

  const retry = () => {
    const verifiedLocation = getVerifiedLocation(user?.id);

    if (verifiedLocation) {
      useLocationForProducts(
        {
          lat: verifiedLocation.lat,
          lng: verifiedLocation.lng,
          locationName: verifiedLocation.locationName,
          source: "verified",
        },
        radius,
      );
      return;
    }

    if (location) {
      void fetchNearbyProducts(location, radius);
      return;
    }

    window.location.reload();
  };

  const locationLabel = location?.locationName ?? (location?.source === "browser" ? "브라우저 현재 위치" : "동네 인증 필요");

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55 pb-20">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--getchu-border)] bg-white text-gray-700 transition hover:-translate-y-0.5 hover:border-[var(--getchu-orange)] hover:text-[var(--getchu-orange-strong)]"
              aria-label="이전 페이지로 이동"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange)]">
                Nearby Market
              </p>
              <h1 className="text-xl font-semibold text-gray-900">내 근처 상품</h1>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={retry}
            className="hidden border-orange-200 bg-white text-[var(--getchu-orange-strong)] sm:inline-flex"
          >
            <LocateFixed className="h-4 w-4" />
            다시 찾기
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        <section className="sticky top-0 z-20 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(255,138,61,0.12)]">
          <div ref={mapRef} className="h-[320px] w-full bg-[linear-gradient(135deg,#fff7ed,#f7f0ff)]" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 bg-white/95 px-4 py-4 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-gray-950">기준 위치</p>
              <p className="mt-1 text-xs text-gray-500">
                {locationLabel}
                {location?.source === "verified" ? " 인증 위치를 기준으로 가까운 상품을 찾아요." : " 기준으로 임시 조회 중이에요."}
              </p>
              <button
                type="button"
                onClick={() => (isAuthenticated ? navigate("/location/verify") : navigate("/login"))}
                className="mt-2 text-xs font-semibold text-[var(--getchu-orange-strong)] underline-offset-4 hover:underline"
              >
                동네 다시 인증하기
              </button>
            </div>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleRadiusChange(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    radius === option
                      ? "bg-[var(--getchu-orange)] text-white shadow-[0_12px_22px_rgba(255,138,61,0.22)]"
                      : "bg-[var(--getchu-orange-pale)] text-[var(--getchu-orange-strong)] hover:bg-orange-100"
                  }`}
                >
                  {option}km
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--getchu-orange-strong)]">
                Around You
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--getchu-ink)]">가까운 상품</h2>
            </div>
            <p className="text-sm font-semibold text-gray-500">{products.length}개의 상품</p>
          </div>

          {loading ? (
            <LoadingState
              mascotImage={foxHeadImage}
              title="근처 상품을 찾고 있어요..."
              description="여우가 가까운 상품을 지도 위에 올려두고 있어요."
              cardCount={6}
            />
          ) : errorMessage ? (
            <ErrorState
              mascotImage={foxHeadImage}
              title="근처 상품을 불러오지 못했어요"
              description={errorMessage}
              actionLabel="다시 시도"
              onAction={retry}
            />
          ) : products.length === 0 ? (
            <EmptyState
              mascotImage={foxHeadImage}
              title="근처에 등록된 상품이 없어요"
              description="반경을 넓히거나 잠시 후 다시 확인해보세요."
              actionLabel="10km로 넓히기"
              onAction={() => handleRadiusChange(10)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
