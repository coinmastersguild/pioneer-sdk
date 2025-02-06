'use client'

import { Sidebar } from '@saas-ui/react'

import { AppSidebar } from '../components/sidebar'
import { AppLayout, AppLayoutProps } from './app-layout'

/**
 * Default sidebar layout.
 */
export const SidebarLayout: React.FC<AppLayoutProps> = ({
  children,
  sidebar = <AppSidebar />,
  ...rest
}) => {
  return (
    <Sidebar.Provider>
      <Sidebar.FlyoutTrigger />
      <AppLayout sidebar={sidebar} {...rest}>
        {children}
      </AppLayout>
      <Sidebar.Backdrop />
    </Sidebar.Provider>
  )
}
