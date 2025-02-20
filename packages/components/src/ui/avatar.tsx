"use client"

import * as React from 'react'
import { Avatar as ChakraAvatar } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

export interface AvatarProps extends ComponentProps<typeof ChakraAvatar> {
  bgColor?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(props, ref) {
    const { bgColor, ...rest } = props
    return <ChakraAvatar ref={ref} bg={bgColor} {...rest} />
  }
)

Avatar.displayName = 'Avatar'

function getInitials(name: string) {
  const names = name.trim().split(" ")
  const firstName = names[0] != null ? names[0] : ""
  const lastName = names.length > 1 ? names[names.length - 1] : ""
  return firstName && lastName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`
    : firstName.charAt(0)
}

// Note: Removing AvatarGroup for now as it requires additional setup
// We can add it back once we have the proper types from Chakra UI
