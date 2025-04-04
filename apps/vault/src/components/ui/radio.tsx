import { RadioGroup as ChakraRadioGroup } from "@chakra-ui/react"
import * as React from "react"

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  // @ts-ignore
  rootRef?: any
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  function Radio(props, ref) {
    const { children, inputProps, rootRef, ...rest } = props
    return (
      // @ts-ignore
      <ChakraRadioGroup.Item ref={rootRef} {...rest}>
        {/* @ts-ignore */}
        <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
        <ChakraRadioGroup.ItemIndicator />
        {children && (
          <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
        )}
      </ChakraRadioGroup.Item>
    )
  },
)

export const RadioGroup = ChakraRadioGroup.Root
