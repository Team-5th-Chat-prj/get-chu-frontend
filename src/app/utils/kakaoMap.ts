let kakaoSdkLoader: Promise<void> | null = null;

function hasKakaoMap() {
  return Boolean(window.kakao?.maps?.Map);
}

function hasKakaoServices() {
  return Boolean(window.kakao?.maps?.services?.Geocoder && window.kakao.maps.services.Places);
}

function removeKakaoSdkScripts() {
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="dapi.kakao.com/v2/maps/sdk.js"]')
    .forEach((script) => script.remove());
}

export function waitForKakaoMap(): Promise<void> {
  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;

  if (hasKakaoMap() && hasKakaoServices()) {
    return Promise.resolve();
  }

  if (!appKey) {
    return Promise.reject(new Error("카카오 지도 키가 설정되지 않았어요."));
  }

  if (!kakaoSdkLoader) {
    kakaoSdkLoader = new Promise((resolve, reject) => {
      const handleReady = () => {
        if (hasKakaoMap() && hasKakaoServices()) {
          resolve();
          return;
        }

        reject(new Error("카카오 지도 서비스를 불러오지 못했어요. Web 플랫폼 도메인과 JavaScript 키를 확인해주세요."));
      };

      removeKakaoSdkScripts();
      delete window.kakao;

      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao?.maps?.load ? window.kakao.maps.load(handleReady) : handleReady();
      };
      script.onerror = () => reject(new Error("카카오 지도 SDK 로드에 실패했어요. Web 플랫폼 도메인과 JavaScript 키를 확인해주세요."));
      document.head.appendChild(script);
    }).catch((error) => {
      kakaoSdkLoader = null;
      throw error;
    });
  }

  return kakaoSdkLoader;
}

export function waitForKakaoServices(): Promise<void> {
  return waitForKakaoMap();
}
