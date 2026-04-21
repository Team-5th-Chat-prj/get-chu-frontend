import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { authApi } from "../api/auth";
import { membersApi } from "../api/members";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Member } from "../types";

interface AuthContextType {
  user: Member | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname: string, profileImageUrl?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (nickname: string, profileImageUrl?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<Member | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // 세션 만료 이벤트 처리
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/login");
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      membersApi.getMe()
        .then(data => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => {
          logout();
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem("accessToken", response.accessToken);
    if (response.refreshToken) localStorage.setItem("refreshToken", response.refreshToken);

    const me = await membersApi.getMe();
    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));
  };

  const signup = async (email: string, password: string, nickname: string, profileImageUrl?: string) => {
    await authApi.signup({
      email,
      password,
      nickname,
      ...(profileImageUrl ? { profileImageUrl } : {}),
    });
  };

  const logout = async () => {
    if (localStorage.getItem("accessToken")) {
      try {
        await authApi.logout();
      } catch (err) {
        console.error("Logout API failed", err);
      }
    }
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const updateProfile = async (nickname: string, profileImageUrl?: string) => {
    if (!user) return;
    
    const payload: { nickname: string; profileImageUrl?: string } = { nickname };
    
    if (profileImageUrl !== undefined) {
      // "" = 이미지 삭제, data: = Base64 이미지, https: = 외부 URL 모두 전송
      // blob: URL만 제외 (로컬 임시 URL이라 서버에 저장 불가)
      if (!profileImageUrl.startsWith("blob:")) {
        payload.profileImageUrl = profileImageUrl;
      }
    }
    
    const updatedUser = await membersApi.updateProfile(payload);
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    const me = await membersApi.getMe();
    setUser(me);
    localStorage.setItem("user", JSON.stringify(me));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
