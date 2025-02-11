import * as React from 'react'

import { Breadcrumb } from '@saas-ui/react'
import Link from 'next/link'

export interface BreadcrumbItem {
  href: string
  title: string
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

/**
 * Render a list of breadcrumbs.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = (props) => {
  const { items = [], ...rest } = props
  return (
    // @ts-ignore
    <Breadcrumb {...rest}>
      {items?.map((item, i) => {
        const { href, title } = item
        return (
          <React.Fragment key={i}>
            {/* @ts-ignore */}
            <Link href={href}>{title}</Link>
            {i < items.length - 1 && ' / '}
          </React.Fragment>
        )
      })}
    </Breadcrumb>
  )
}
