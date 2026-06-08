import { useState, useEffect } from "react";
import { 
  LayoutDashboard, PackageSearch, Terminal, UserCircle, 
  Settings, BookOpen, PlusCircle, PanelLeft, 
  ChevronsUpDown, Plus, Sparkles, LogOut, HelpCircle, Palette, ShoppingCart, Warehouse,
  Home, ShoppingBag, ClipboardList, AlertTriangle, Boxes
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

// Define nav groups based on user role
const adminGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Product Management", url: "/product-management", icon: PlusCircle },
      { title: "Billing", url: "/billing", icon: ShoppingCart },
      { title: "Orders", url: "/admin/orders", icon: ClipboardList },
      { title: "Query Guide", url: "/guide", icon: BookOpen },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { title: "Exploratory Insights", url: "/query", icon: Terminal },
      { title: "Predictive Inventory", url: "/predictive-inventory", icon: Sparkles },
      { title: "Market Basket", url: "/market-basket", icon: Boxes },
      { title: "Stock Alerts", url: "/stock-alerts", icon: AlertTriangle },
    ]
  }
];

const warehouseGroups = [
  {
    items: [
      { title: "Warehouse Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Inventory", url: "/warehouse/inventory", icon: Warehouse },
      { title: "History", url: "/warehouse/history", icon: ClipboardList },
      { title: "Profile", url: "/profile", icon: UserCircle },
    ]
  }
];

const customerGroups = [
  {
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "Products", url: "/browse", icon: PackageSearch },
      { title: "Cart", url: "/cart", icon: ShoppingCart },
      { title: "My Orders", url: "/orders", icon: ClipboardList },
      { title: "Profile", url: "/profile", icon: UserCircle },
    ]
  }
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    window.dispatchEvent(new Event("profileUpdate"));
    navigate("/");
  };

  const userRole = sessionStorage.getItem("user_role") || "admin";
  let groups = adminGroups;
  if (userRole === "customer") {
    groups = customerGroups;
  } else if (userRole === "warehouse") {
    groups = warehouseGroups;
  }

  const isLinkActive = (url: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    const hasSearch = url.includes("?");
    const pathPart = hasSearch ? url.split("?")[0] : url;
    const searchPart = hasSearch ? "?" + url.split("?")[1] : "";
    
    if (pathPart !== currentPath) return false;
    
    if (searchPart) {
      return currentSearch.includes(searchPart);
    }
    
    if (!searchPart && currentSearch.includes("tab=")) {
      return false;
    }
    
    return true;
  };

  const [username, setUsername] = useState(() => {
    const key = `user_profile_${userRole}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) return parsed.fullName;
      } catch (e) {}
    }
    if (userRole === "customer") {
      return sessionStorage.getItem("customer_name") || "Customer";
    }
    if (userRole === "warehouse") {
      return "Warehouse Operator";
    }
    return "Karoyl";
  });

  useEffect(() => {
    const loadProfile = () => {
      const key = `user_profile_${userRole}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) {
            setUsername(parsed.fullName);
            return;
          }
        } catch (e) {}
      }
      if (userRole === "warehouse") {
        setUsername("Warehouse Operator");
      } else if (userRole === "customer") {
        setUsername(sessionStorage.getItem("customer_name") || "Customer");
      } else {
        setUsername("Karoyl");
      }
    };
    loadProfile();

    window.addEventListener("storage", loadProfile);
    window.addEventListener("profileUpdate", loadProfile);
    return () => {
      window.removeEventListener("storage", loadProfile);
      window.removeEventListener("profileUpdate", loadProfile);
    };
  }, []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className={`flex flex-row items-center h-12 border border-black rounded-full shadow-sm ${collapsed ? "justify-center px-2" : "px-3 justify-between"}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2 overflow-hidden group/logo">
                <img src="/android-chrome-192x192.png" alt="Logo" className="w-7 h-7 rounded-md shrink-0 object-cover" />
                <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap tracking-tight transition-all duration-300">
                  Intelligent ERP Plugin
                </span>
              </div>
              <button 
                onClick={toggleSidebar} 
                className="p-1.5 rounded-full hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all shrink-0 outline-none"
                title="Close sidebar"
              >
                <PanelLeft className="w-[18px] h-[18px]" />
              </button>
            </>
          ) : (
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all shrink-0 outline-none"
              title="Open sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4 space-y-4">
        {groups.map((group, groupIdx) => (
          <SidebarGroup key={groupIdx} className="py-0">
            {!collapsed && group.label && (
              <SidebarGroupLabel className="px-3 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2 block">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-2">
                {group.items.map((item) => {
                  const active = isLinkActive(item.url);
                  const isLogout = item.title === "Logout";
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      {isLogout ? (
                        <SidebarMenuButton
                          onClick={handleLogout}
                          tooltip={item.title}
                          className="flex items-center hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-all duration-200 rounded-lg group p-2 w-full"
                        >
                          <item.icon className="mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                          {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <Link
                            to={item.url}
                            className={cn(
                              "flex items-center hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-all duration-200 rounded-lg group p-2 w-full",
                              active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            )}
                          >
                            <item.icon className="mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {userRole !== "customer" && userRole !== "warehouse" && (
        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground align-middle h-12 w-full justify-between hover:bg-sidebar-accent/50 transition-colors border border-black rounded-full shadow-sm px-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-8 w-8 rounded-full shadow-sm">
                        <AvatarFallback className="bg-red-500 text-white font-semibold text-xs">
                          {username.split(" ").map(n => n[0]).join("").toUpperCase() || "KA"}
                        </AvatarFallback>
                      </Avatar>
                      {!collapsed && (
                        <div className="flex flex-col flex-1 text-left text-sm leading-none shrink-0">
                          <span className="font-semibold text-sidebar-foreground text-base">{username}</span>
                        </div>
                      )}
                    </div>
                    {!collapsed && <ChevronsUpDown className="ml-auto h-5 w-5 text-muted-foreground shrink-0" />}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 rounded-xl shadow-xl mt-1 border-border/50 bg-popover"
                  side={collapsed ? "right" : "top"}
                  align="start"
                  sideOffset={10}
                >
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarFallback className="bg-red-500 text-white font-semibold text-xs">
                          {username.split(" ").map(n => n[0]).join("").toUpperCase() || "KA"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-semibold text-sm">{username}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="opacity-50" />
                  
                  <DropdownMenuGroup className="p-1">
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground">
                      <Link to="/profile">
                        <Avatar className="h-4 w-4 rounded-full">
                          <AvatarFallback className="bg-red-500 text-white font-semibold" style={{ fontSize: '7px' }}>
                            {username.split(" ").map(n => n[0]).join("").toUpperCase() || "KA"}
                          </AvatarFallback>
                        </Avatar>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground">
                      <Link to="/settings">
                        <Settings className="h-4 w-4 opacity-70" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  

                  
                  <DropdownMenuSeparator className="opacity-50" />
                  
                  <div className="p-1">
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground text-foreground"
                    >
                      <LogOut className="h-4 w-4 opacity-70" />
                      Log out
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
