import { LayoutDashboard, Map, BarChart3, BrainCircuit, AlertTriangle, Briefcase, HardHat, FileText, Trophy, UserCog, Users } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Task Management', url: '/gov/mayor', icon: LayoutDashboard },
  { title: 'City Heatmap', url: '/gov/mayor/heatmap', icon: Map },
  { title: 'Dept. Scorecard', url: '/gov/mayor/scorecard', icon: BarChart3 },
  { title: 'Predictive', url: '/gov/mayor/predictive', icon: BrainCircuit },
  { title: 'SLA Alerts', url: '/gov/mayor/sla', icon: AlertTriangle },
  { title: 'CSR & Audits', url: '/gov/mayor/csr', icon: Briefcase },
  { title: 'Contractors', url: '/gov/mayor/contractors', icon: HardHat },
  { title: 'Dept. Heads', url: '/gov/mayor/dept-heads', icon: UserCog },
  { title: 'City leaderboard', url: '/gov/mayor/leaderboard', icon: Trophy },
  { title: 'Volunteer Hub', url: '/volunteer', icon: Users },
  { title: 'Write article', url: '/articles/write', icon: FileText },
];

const MayorSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mayor Dashboard</SidebarGroupLabel>
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

export default MayorSidebar;
