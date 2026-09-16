import { SidebarProvider, useSidebar } from './SidebarContext';
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  sidebarMenuButtonVariants,
} from './SidebarMenu';
import { SidebarInset, SidebarRail, SidebarRoot, SidebarTrigger } from './SidebarRoot';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
} from './SidebarSections';

const Sidebar = Object.assign(
  () => {
    throw new Error('Sidebar is not a component. Render Sidebar.Root instead.');
  },
  {
    Provider: SidebarProvider,
    Root: SidebarRoot,
    Trigger: SidebarTrigger,
    Rail: SidebarRail,
    Inset: SidebarInset,
    Header: SidebarHeader,
    Footer: SidebarFooter,
    Content: SidebarContent,
    Separator: SidebarSeparator,
    Input: SidebarInput,
    Group: SidebarGroup,
    GroupLabel: SidebarGroupLabel,
    GroupAction: SidebarGroupAction,
    GroupContent: SidebarGroupContent,
    Menu: SidebarMenu,
    MenuItem: SidebarMenuItem,
    MenuButton: SidebarMenuButton,
    MenuAction: SidebarMenuAction,
    MenuBadge: SidebarMenuBadge,
    MenuSkeleton: SidebarMenuSkeleton,
    MenuSub: SidebarMenuSub,
    MenuSubItem: SidebarMenuSubItem,
    MenuSubButton: SidebarMenuSubButton,
  },
);

export { Sidebar, useSidebar, sidebarMenuButtonVariants };
export {
  SidebarProvider,
  SidebarRoot,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarSeparator,
  SidebarInput,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
};
export { SIDEBAR_COOKIE_NAME } from './constants';
export type { SidebarProviderProps } from './SidebarContext';
export type { SidebarMenuButtonProps } from './SidebarMenu';
export type { SidebarRootProps } from './SidebarRoot';
