import type { BoxProps, InputElementProps } from "@chakra-ui/react"
import { Group, InputElement } from "@chakra-ui/react"
import * as React from "react"

// @ts-ignore
export interface InputGroupProps extends BoxProps {
  startElementProps?: InputElementProps
  endElementProps?: InputElementProps
  startElement?: React.ReactNode
  endElement?: React.ReactNode
  // @ts-ignore
  children: any
  startOffset?: InputElementProps["paddingStart"]
  endOffset?: InputElementProps["paddingEnd"]
}

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup(props, ref) {
    const {
      startElement,
      startElementProps,
      endElement,
      endElementProps,
      children,
      startOffset = "6px",
      endOffset = "6px",
      ...rest
    } = props

    // @ts-ignore
    const child = React.Children.only(children)

    return (
      <Group ref={ref} {...rest}>
        {startElement ? (
          // @ts-ignore
          <InputElement pointerEvents="none" {...startElementProps}>
            {/* @ts-ignore */}
            {startElement as React.ReactElement}
          </InputElement>
        ) : null}
        {/* @ts-ignore */}
        {React.cloneElement(child, {
          ...(startElement && {
            ps: `calc(var(--input-height) - ${startOffset})`,
          }),
          ...(endElement && { pe: `calc(var(--input-height) - ${endOffset})` }),
          ...children.props,
        })}
        {endElement ? (
          // @ts-ignore
          <InputElement placement="end" {...endElementProps}>
            {/* @ts-ignore */}
            {endElement as React.ReactElement}
          </InputElement>
        ) : null}
      </Group>
    )
  },
)
