export {};

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }

  interface KakaoNamespace {
    maps: {
      LatLng: new (lat: number, lng: number) => KakaoLatLng;
      Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
      Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
      InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
      event: {
        addListener(target: object, type: string, callback: () => void): void;
      };
      services?: {
        Geocoder: new () => KakaoGeocoder;
        Places: new () => KakaoPlaces;
        Status: {
          OK: string;
          ZERO_RESULT: string;
          ERROR: string;
        };
      };
      load?: (callback: () => void) => void;
    };
  }

  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }

  interface KakaoMapOptions {
    center: KakaoLatLng;
    level?: number;
  }

  interface KakaoMap {
    setCenter(latlng: KakaoLatLng): void;
    setLevel(level: number): void;
    relayout(): void;
  }

  interface KakaoMarkerOptions {
    map?: KakaoMap;
    position: KakaoLatLng;
  }

  interface KakaoMarker {
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
  }

  interface KakaoInfoWindowOptions {
    content: string;
    removable?: boolean;
  }

  interface KakaoInfoWindow {
    open(map: KakaoMap, marker: KakaoMarker): void;
    close(): void;
  }

  interface KakaoGeocoder {
    addressSearch(
      address: string,
      callback: (result: KakaoAddressResult[], status: string) => void
    ): void;

    coord2RegionCode(
      lng: number,
      lat: number,
      callback: (result: KakaoRegionResult[], status: string) => void
    ): void;
  }

  interface KakaoPlaces {
    keywordSearch(
      keyword: string,
      callback: (result: KakaoKeywordResult[], status: string) => void
    ): void;
  }

  interface KakaoAddressResult {
    x: string;
    y: string;
    address_name: string;
  }

  interface KakaoKeywordResult {
    x: string;
    y: string;
    place_name: string;
    address_name: string;
    road_address_name: string;
  }

  interface KakaoRegionResult {
    region_type: string;
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
  }
}
