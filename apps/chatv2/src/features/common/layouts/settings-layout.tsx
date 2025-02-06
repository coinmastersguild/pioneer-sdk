'use client'

import { Sidebar } from '@saas-ui/react'

import { SettingsSidebar } from '#features/settings/components/sidebar'

import { AppLayout, AppLayoutProps } from './app-layout'

/**
 * Settings pages layout
 */
export const SettingsLayout: React.FC<AppLayoutProps> = ({
  children,
  ...rest
}) => {
  return (
    <Sidebar.Provider>
      <AppLayout {...rest} sidebar={<SettingsSidebar />}>
        {children}
      </AppLayout>
    </Sidebar.Provider>
  )
}
