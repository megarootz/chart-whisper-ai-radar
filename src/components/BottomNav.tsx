
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Upload, History, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const BottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: location.pathname === "/"
    },
    {
      label: "Analyze",
      href: "/analyze",
      icon: Upload,
      isActive: location.pathname === "/analyze"
    },
    {
      label: "History",
      href: "/history",
      icon: History,
      isActive: location.pathname === "/history"
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      isActive: location.pathname === "/profile"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 flex justify-around items-center h-16">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.href}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full pt-1",
            "text-[11px] font-medium transition-colors",
            item.isActive ? "text-primary" : "text-gray-400"
          )}
        >
          <item.icon className={cn("h-5 w-5 mb-1", item.isActive ? "text-primary" : "text-gray-400")} />
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;
