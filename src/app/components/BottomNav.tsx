import { Home, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "홈" },
    { path: "/chat", icon: MessageSquare, label: "채팅" },
    { path: "/my", icon: User, label: "마이" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? "text-orange-500" : "text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
