import { Globe, Trophy, TrendingUp, Siren, FileText, FileCheck, Building2, Users } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'State Heatmap', url: '/gov/state', icon: Globe },
  { title: 'City Leaderboard', url: '/gov/state/leaderboard', icon: Trophy },
  { title: 'Top citizens', url: '/gov/state/citizens', icon: Users },
  { title: 'Dept. performance', url: '/gov/state/departments', icon: Building2 },
  { title: 'Article moderation', url: '/gov/state/moderation', icon: FileCheck },
  { title: 'Trend Analysis', url: '/gov/state/trends', icon: TrendingUp },
  { title: 'Emergency Override', url: '/gov/state/emergency', icon: Siren },
  { title: 'Write article', url: '/articles/write', icon: FileText },
];

const StateSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>State Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default StateSidebar;
