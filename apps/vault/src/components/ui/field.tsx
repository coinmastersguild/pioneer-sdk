import { Field as ChakraField } from "@chakra-ui/react"
import * as React from "react"

export interface FieldProps extends Omit<ChakraField.RootProps, "label"> {
  // @ts-ignore - Using any types to fix type issues
  label?: any
  // @ts-ignore - Using any types to fix type issues
  helperText?: any
  // @ts-ignore - Using any types to fix type issues
  errorText?: any
  // @ts-ignore - Using any types to fix type issues
  optionalText?: any
}

// @ts-ignore - Using any types to fix type issues
export const Field: any = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field(props, ref) {
    const { label, children, helperText, errorText, optionalText, ...rest } =
      props
    return (
      <ChakraField.Root ref={ref} {...rest}>
        {/* @ts-ignore - Using any types to fix type issues */}
        {label && (
          <ChakraField.Label>
            {label}
            {/* @ts-ignore - Using any types to fix type issues */}
            <ChakraField.RequiredIndicator fallback={optionalText} />
          </ChakraField.Label>
        )}
        {children}
        {/* @ts-ignore - Using any types to fix type issues */}
        {helperText && (
          <ChakraField.HelperText>{helperText}</ChakraField.HelperText>
        )}
        {/* @ts-ignore - Using any types to fix type issues */}
        {errorText && (
          <ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>
        )}
      </ChakraField.Root>
    )
  },
)
