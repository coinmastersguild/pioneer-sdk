import React from 'react'
import { type FC, type RefAttributes, forwardRef } from 'react'

import {
  LinkProps as ChakraLinkProps,
  HTMLChakraProps,
  type RecipeProps,
  chakra,
  useRecipe,
} from '@chakra-ui/react'
import NextLink, { LinkProps as NextLinkProps } from 'next/link'

const cx = (...classNames: any[]) => classNames.filter(Boolean).join(' ')

/* eslint-disable-next-line */
type Pretty<T> = { [K in keyof T]: T[K] } & {}
type Merge<P, T> = Pretty<Omit<P, keyof T> & T>
type LegacyProps = 'as' | 'legacyBehavior' | 'passHref'

type LinkComponent = FC<RefAttributes<HTMLAnchorElement> & LinkProps>

export type LinkProps = Merge<
  HTMLChakraProps<'a'> & RecipeProps<'link'> & ChakraLinkProps,
  Omit<NextLinkProps, LegacyProps>
>

export const Link: LinkComponent = forwardRef(function Link(props, ref) {
  const recipe = useRecipe({
    key: 'link',
  })
  const [variantProps, linkProps] = recipe.splitVariantProps(props)
  const styles = recipe(variantProps)

  const { className, href, children, ...rest } = linkProps

  return (
    <chakra.a
      ref={ref}
      href={href as any}
      {...rest}
      className={cx('chakra-link', className)}
      css={[styles, rest.css]}
      as={NextLink}
    >
      {children}
    </chakra.a>
  )
})
