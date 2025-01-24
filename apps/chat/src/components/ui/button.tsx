import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import {
  AbsoluteCenter,
  Button as ChakraButton,
  Spinner,
  chakra,
} from "@chakra-ui/react"
import * as React from "react"

interface ButtonLoadingProps {
  loading?: boolean
  loadingText?: React.ReactNode
}

export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

// Use chakra("span") instead of `Span` if you want a styled span from Chakra
const Span = chakra("span")

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { loading, disabled, loadingText, children, ...rest } = props

    return (
      <ChakraButton
        ref={ref}
        disabled={loading || disabled}
        // Make the button solid gold
        bg="#DAA520"
        // Ensure text color is readable on gold
        color="black"
        // Use a solid variant
        variant="solid"
        // Make the button big
        size="lg"
        // Add padding on all sides
        px={8}
        py={6}
        // Allow further customization via rest spread
        {...rest}
      >
        {loading && !loadingText ? (
          <>
            <AbsoluteCenter display="inline-flex">
              <Spinner size="inherit" color="inherit" />
            </AbsoluteCenter>
            <Span opacity={0}>{children}</Span>
          </>
        ) : loading && loadingText ? (
          <>
            <Spinner size="inherit" color="inherit" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ChakraButton>
    )
  }
)
