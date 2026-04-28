import { apiClient } from "./client";
import { ApiResponse, LocationVerifyResponse } from "../types";

export const locationApi = {
  verifyByGps: async (lat: number, lng: number): Promise<LocationVerifyResponse> => {
    const response = await apiClient.post<ApiResponse<LocationVerifyResponse>>(
      "/api/location/verify/gps",
      { lat, lng }
    );
    return response.data.data;
  },

  verifyByAddress: async (address: string): Promise<LocationVerifyResponse> => {
    const response = await apiClient.post<ApiResponse<LocationVerifyResponse>>(
      "/api/location/verify/address",
      { address }
    );
    return response.data.data;
  },
};
