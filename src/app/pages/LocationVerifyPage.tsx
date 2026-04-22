import { useState } from "react";
import { ArrowLeft, CheckCircle2, LocateFixed, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { locationApi } from "../api/location";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import ErrorState from "../components/ui/state/ErrorState";
import LoadingState from "../components/ui/state/LoadingState";
import { waitForKakaoServices } from "../utils/kakaoMap";
import { saveVerifiedLocation } from "../utils/verifiedLocation";
import foxHeadImage from "../../assets/logo-fox-head.png";

type VerifyMode = "gps" | "address";

interface LocationCandidate {
  locationName: string;
  lat: number;
  lng: number;
  sourceLabel?: string;
}

interface PendingLocation extends LocationCandidate {
  mode: VerifyMode;
}

async function getKakaoGeocoder() {
  await waitForKakaoServices();
  return new window.kakao.maps.services!.Geocoder();
}

async function getKakaoPlaces() {
  await waitForKakaoServices();
  return new window.kakao.maps.services!.Places();
}

function formatRegionName(result: KakaoRegionResult) {
  return [result.region_2depth_name, result.region_3depth_name].filter(Boolean).join(" ");
}

function uniqueCandidates(candidates: LocationCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = candidate.locationName;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function resolveRegionName(lat: number, lng: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const geocoder = await getKakaoGeocoder();

      geocoder.coord2RegionCode(lng, lat, (result, status) => {
        if (status !== window.kakao.maps.services?.Status.OK || result.length === 0) {
          reject(new Error("현재 위치의 동네를 찾지 못했어요."));
          return;
        }

        const administrativeRegion = result.find((item) => item.region_type === "H") ?? result[0];
        resolve(formatRegionName(administrativeRegion) || administrativeRegion.address_name);
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function buildCandidate(lat: number, lng: number, sourceLabel?: string): Promise<LocationCandidate> {
  const locationName = await resolveRegionName(lat, lng);
  return { lat, lng, locationName, sourceLabel };
}

async function searchAddressCandidates(address: string): Promise<LocationCandidate[]> {
  const geocoder = await getKakaoGeocoder();
  const candidates: LocationCandidate[] = [];

  const addressResults = await new Promise<KakaoAddressResult[]>((resolve) => {
    geocoder.addressSearch(address, (result, status) => {
      resolve(status === window.kakao.maps.services?.Status.OK ? result.slice(0, 5) : []);
    });
  });

  for (const result of addressResults) {
    const lng = Number(result.x);
    const lat = Number(result.y);
    candidates.push(await buildCandidate(lat, lng, result.address_name));
  }

  const places = await getKakaoPlaces();
  const keywordResults = await new Promise<KakaoKeywordResult[]>((resolve) => {
    places.keywordSearch(address, (result, status) => {
      resolve(status === window.kakao.maps.services?.Status.OK ? result.slice(0, 8) : []);
    });
  });

  for (const result of keywordResults) {
    const lng = Number(result.x);
    const lat = Number(result.y);
    candidates.push(await buildCandidate(lat, lng, result.address_name || result.place_name));
  }

  return uniqueCandidates(candidates).slice(0, 5);
}

export default function LocationVerifyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<VerifyMode>("gps");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [candidates, setCandidates] = useState<LocationCandidate[]>([]);

  const handlePreviewSuccess = (location: PendingLocation) => {
    setPendingLocation(location);
    setErrorMessage("");
    toast.success(`${location.locationName}으로 확인됐어요. 맞는지 확인해주세요.`);
  };

  const handleConfirmLocation = async () => {
    if (!pendingLocation) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const result = await locationApi.verifyByGps(pendingLocation.lat, pendingLocation.lng);
      saveVerifiedLocation({
        memberId: user?.id,
        lat: pendingLocation.lat,
        lng: pendingLocation.lng,
        locationName: result.locationName,
        locationRadius: result.locationRadius,
      });
      toast.success(`${result.locationName} 동네 인증이 완료됐어요`);
      navigate(-1);
    } catch {
      setErrorMessage("동네 인증 저장에 실패했어요. 다시 시도해주세요.");
      toast.error("동네 인증 저장에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLocation = () => {
    const wasGpsResult = pendingLocation?.mode === "gps";

    setPendingLocation(null);
    setErrorMessage("");

    if (wasGpsResult) {
      setMode("address");
      toast.info("직접 입력으로 정확한 동네를 다시 확인해주세요.");
      return;
    }

    toast.info("다시 인증해볼게요.");
  };

  const handleError = (message = "동네 인증에 실패했어요. 다시 시도해주세요.") => {
    setErrorMessage(message);
    toast.error(message);
  };

  const handleGpsVerify = () => {
    if (!navigator.geolocation) {
      handleError("이 브라우저에서는 GPS 인증을 사용할 수 없어요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setPendingLocation(null);
    setCandidates([]);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const locationName = await resolveRegionName(coords.latitude, coords.longitude);
          handlePreviewSuccess({
            mode: "gps",
            locationName,
            lat: coords.latitude,
            lng: coords.longitude,
          });
        } catch (error) {
          handleError(error instanceof Error ? error.message : undefined);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        handleError("위치 권한을 허용한 뒤 다시 시도해주세요.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleAddressVerify = async () => {
    const trimmedAddress = address.trim();

    if (!trimmedAddress) {
      handleError("인증할 동네명을 입력해주세요.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setPendingLocation(null);
    setCandidates([]);

    try {
      const nextCandidates = await searchAddressCandidates(trimmedAddress);

      if (nextCandidates.length === 0) {
        throw new Error("입력한 동네를 찾지 못했어요.");
      }

      setCandidates(nextCandidates);
      toast.success("가까운 동네 후보를 찾았어요.");
    } catch (error) {
      handleError(error instanceof Error ? error.message : "입력한 동네를 찾지 못했어요. 다시 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate: LocationCandidate) => {
    handlePreviewSuccess({
      mode: "address",
      ...candidate,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--getchu-cream)]/55 pb-16">
      <header className="border-b border-[var(--getchu-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
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
              Neighborhood
            </p>
            <h1 className="text-xl font-semibold text-gray-900">동네 인증</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
        <section className="surface-panel overflow-hidden p-0">
          <div className="bg-[radial-gradient(circle_at_top_left,#fff7ed,#ffffff_54%,#f8f3ff)] p-6 sm:p-8">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top,#fff7ee,#ffe8cc_62%,#ffc98b)] shadow-[0_16px_32px_rgba(255,138,61,0.16)] ring-1 ring-orange-100">
              <img
                src={foxHeadImage}
                alt="Get-chu"
                className="h-full w-full -translate-x-[8%] scale-[0.72] object-contain mix-blend-multiply"
              />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--getchu-orange)]">
              Get-chu Local
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950">
              내 동네를 인증하고 가까운 상품을 만나보세요.
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              PC에서는 위치가 부정확할 수 있어요. 감지된 동네가 다르면 직접 입력으로 확인해주세요.
            </p>
          </div>

          {pendingLocation ? (
            <div className="border-t border-[var(--getchu-border)] bg-white px-6 py-5 sm:px-8">
              <div className="rounded-[1.5rem] bg-orange-50 px-4 py-4 text-[var(--getchu-orange-strong)]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold">이 동네가 맞나요?</p>
                    <p className="text-lg font-bold">{pendingLocation.locationName}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="bg-[var(--getchu-orange)] text-white hover:bg-[var(--getchu-orange-strong)]"
                    disabled={loading}
                  >
                    네, 맞아요
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetryLocation}
                    className="border-orange-200 bg-white text-[var(--getchu-orange-strong)] hover:bg-orange-50"
                    disabled={loading}
                  >
                    아니오, 직접 입력
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface-panel p-5 sm:p-6">
          {loading ? (
            <LoadingState
              title="동네를 확인하고 있어요..."
              description="여우가 가까운 동네를 찾는 중이에요."
              mascotImage={foxHeadImage}
              cardCount={0}
            />
          ) : (
            <Tabs value={mode} onValueChange={(value) => setMode(value as VerifyMode)} className="gap-5">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-[var(--getchu-cream)] p-1">
                <TabsTrigger
                  value="gps"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[var(--getchu-orange-strong)]"
                >
                  <LocateFixed className="h-4 w-4" />
                  GPS 인증
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-[var(--getchu-orange-strong)]"
                >
                  <MapPin className="h-4 w-4" />
                  직접 입력
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gps" className="space-y-5">
                <div className="rounded-[1.7rem] border border-orange-100 bg-orange-50/50 p-5">
                  <p className="text-lg font-semibold text-gray-950">현재 위치로 확인하기</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    브라우저 위치 권한을 허용하면 현재 위치 기준으로 동네를 먼저 확인해요.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGpsVerify}
                  className="h-12 w-full bg-[var(--getchu-orange)] text-white hover:bg-[var(--getchu-orange-strong)]"
                >
                  <LocateFixed className="h-4 w-4" />
                  GPS로 동네 확인하기
                </Button>
              </TabsContent>

              <TabsContent value="address" className="space-y-5">
                <div className="rounded-[1.7rem] border border-orange-100 bg-orange-50/50 p-5">
                  <p className="text-lg font-semibold text-gray-950">동네명으로 확인하기</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    예: 서울 마포구 합정동, 인천 계양구 작전동
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="동네명을 입력해주세요"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleAddressVerify();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddressVerify}
                    className="h-12 w-full bg-[var(--getchu-orange)] text-white hover:bg-[var(--getchu-orange-strong)]"
                  >
                    <Search className="h-4 w-4" />
                    동네 후보 찾기
                  </Button>
                </div>

                {candidates.length > 0 ? (
                  <div className="space-y-2 rounded-[1.7rem] border border-orange-100 bg-white p-3">
                    <p className="px-2 text-sm font-semibold text-gray-900">가까운 동네 후보</p>
                    {candidates.map((candidate) => (
                      <button
                        key={`${candidate.locationName}-${candidate.lat}-${candidate.lng}`}
                        type="button"
                        onClick={() => handleSelectCandidate(candidate)}
                        className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-orange-50"
                      >
                        <span>
                          <span className="block font-semibold text-gray-950">{candidate.locationName}</span>
                          {candidate.sourceLabel ? (
                            <span className="mt-1 block text-xs text-gray-500">{candidate.sourceLabel}</span>
                          ) : null}
                        </span>
                        <span className="text-xs font-semibold text-[var(--getchu-orange-strong)]">선택</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          )}

          {errorMessage ? (
            <div className="mt-5">
              <ErrorState
                title="동네 인증을 완료하지 못했어요"
                description={errorMessage}
                actionLabel={mode === "gps" ? "GPS 다시 시도" : "다시 인증하기"}
                onAction={mode === "gps" ? handleGpsVerify : handleAddressVerify}
                mascotImage={foxHeadImage}
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
