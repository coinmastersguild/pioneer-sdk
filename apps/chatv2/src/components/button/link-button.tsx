import * as React from 'react'

import { Button } from '@chakra-ui/react'
import Link from 'next/link'

export interface LinkButtonProps {
  href: string
  as?: string
  children?: React.ReactNode
  variant?: string
  colorScheme?: string
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  as,
  children,
  variant = 'solid',
  colorScheme = 'primary',
  ...rest
}) => {
  // @ts-ignore
  return (
    <Link href={href} as={as} passHref>
      {/* @ts-ignore */}
      <Button variant={variant} colorScheme={colorScheme} {...rest}>
        {children}
      </Button>
    </Link>
  )
}
