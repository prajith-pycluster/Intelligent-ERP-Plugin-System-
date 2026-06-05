import { 
  LayoutDashboard, PackageSearch, Terminal, UserCircle, 
  Settings, BookOpen, PlusCircle, PanelLeft, 
  ChevronsUpDown, Plus, Sparkles, LogOut, HelpCircle, Palette, ShoppingCart, Warehouse
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
import { useLocation } from "react-router-dom";
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

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Product Insights", url: "/insights", icon: PackageSearch },
  { title: "Exploratory Insight", url: "/query", icon: Terminal },
  { title: "Product Management", url: "/product-management", icon: PlusCircle },
  { title: "Predictive Inventory", url: "/predictive-inventory", icon: Sparkles },
  { title: "Godown", url: "/godown", icon: Warehouse },
  { title: "Billing", url: "/billing", icon: ShoppingCart },
  { title: "Query Guide", url: "/guide", icon: BookOpen },
];

// Footer items will now be inside the DropdownMenu instead

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`h-14 flex flex-row items-center px-4 border-b border-sidebar-border bg-sidebar shrink-0 ${collapsed ? "justify-center px-2" : "justify-between"}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden group/logo">
              <img src="/android-chrome-192x192.png" alt="Logo" className="w-7 h-7 rounded-md shrink-0 object-cover" />
              <h1 className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight transition-all duration-300">
                Intelligent ERP Plugin
              </h1>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-all shrink-0 outline-none"
              title="Close sidebar"
            >
              <PanelLeft className="w-[18px] h-[18px]" />
            </button>
          </>
        ) : (
          <button 
            onClick={toggleSidebar} 
            className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all shrink-0 outline-none"
            title="Open sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2 px-4">
              Overview
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 text-sidebar-foreground/80 transition-all duration-200 rounded-lg group"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground align-middle h-12 w-full justify-between hover:bg-sidebar-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 rounded-full shadow-sm">
                      <AvatarFallback className="bg-red-500 text-white font-semibold text-xs">KA</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="flex flex-col flex-1 text-left text-sm leading-none shrink-0">
                        <span className="font-semibold text-sidebar-foreground">Karoyl</span>
                      </div>
                    )}
                  </div>
                  {!collapsed && <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground shrink-0" />}
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
                      <AvatarFallback className="bg-red-500 text-white font-semibold text-xs">KA</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-semibold text-sm">Karoyl</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="opacity-50" />
                
                <DropdownMenuGroup className="p-1">
                  <DropdownMenuItem className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground">
                    <Avatar className="h-4 w-4 rounded-full">
                      <AvatarFallback className="bg-red-500 text-white font-semibold" style={{ fontSize: '7px' }}>KA</AvatarFallback>
                    </Avatar>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground">
                    <Settings className="h-4 w-4 opacity-70" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                

                
                <DropdownMenuSeparator className="opacity-50" />
                
                <div className="p-1">
                  <DropdownMenuItem className="py-2.5 px-3 cursor-pointer text-sm gap-3 rounded-md focus:bg-accent focus:text-accent-foreground text-foreground">
                    <LogOut className="h-4 w-4 opacity-70" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
