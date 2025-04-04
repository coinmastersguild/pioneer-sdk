import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"
import * as React from "react"

export interface CheckboxProps extends ChakraCheckbox.RootProps {
  icon?: React.ReactNode
  // @ts-ignore - Using any type to fix type issues
  inputProps?: any
  // @ts-ignore - Using any type to fix type issues
  rootRef?: any
}

// @ts-ignore - Using any type to fix type issues
export const Checkbox: any = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const { icon, children, inputProps, rootRef, ...rest } = props
    return (
      <ChakraCheckbox.Root ref={rootRef} {...rest}>
        {/* @ts-ignore - Using any to fix type issues */}
        <ChakraCheckbox.HiddenInput ref={ref} {...inputProps} />
        <ChakraCheckbox.Control>
          {/* @ts-ignore - Using any to fix type issues */}
          {icon || <ChakraCheckbox.Indicator />}
        </ChakraCheckbox.Control>
        {children != null && (
          <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label>
        )}
      </ChakraCheckbox.Root>
    )
  },
)
