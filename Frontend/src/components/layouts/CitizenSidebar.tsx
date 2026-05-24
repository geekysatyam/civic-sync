import { Home, PlusCircle, User, Heart, Vote, Gift, Bell, Search, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { canWriteArticles } from '@/lib/authRouting';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const baseItems = [
  { title: 'Feed', url: '/feed', icon: Home },
  { title: 'Post Issue', url: '/post', icon: PlusCircle },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Volunteer', url: '/volunteer', icon: Heart },
  { title: 'Polls', url: '/polls', icon: Vote },
  { title: 'Karma', url: '/karma', icon: Gift },
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Ghost Inspector', url: '/ghost-audits', icon: Search },
];

const CitizenSidebar = () => {
  const { role, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const items = canWriteArticles(role, user?.rank)
    ? [...baseItems.slice(0, 3), { title: 'Write article', url: '/articles/write', icon: FileText }, ...baseItems.slice(3)]
    : baseItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Citizen</SidebarGroupLabel>
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

export default CitizenSidebar;
