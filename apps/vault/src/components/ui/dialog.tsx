import { Dialog as ChakraDialog, Portal } from "@chakra-ui/react"
import { CloseButton } from "./close-button"
import * as React from "react"

interface DialogContentProps extends ChakraDialog.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement>
  backdrop?: boolean
}

// @ts-ignore - Using any to fix type issues
export const DialogContent: any = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(function DialogContent(props, ref) {
  const {
    children,
    portalled = true,
    portalRef,
    backdrop = true,
    ...rest
  } = props

  return (
    <Portal disabled={!portalled} container={portalRef}>
      {backdrop && <ChakraDialog.Backdrop />}
      <ChakraDialog.Positioner>
        <ChakraDialog.Content ref={ref} {...rest} asChild={false}>
          {children}
        </ChakraDialog.Content>
      </ChakraDialog.Positioner>
    </Portal>
  )
})

// @ts-ignore - Using any to fix type issues
export const DialogCloseTrigger: any = React.forwardRef<
  HTMLButtonElement,
  ChakraDialog.CloseTriggerProps
>(function DialogCloseTrigger(props, ref) {
  const { children, asChild, ...rest } = props
  
  // If asChild is true and children are provided, avoid nesting buttons
  if (asChild && children) {
    return (
      <ChakraDialog.CloseTrigger {...rest}>
        {children}
      </ChakraDialog.CloseTrigger>
    )
  }
  
  // Default case - use the CloseButton component
  return (
    <ChakraDialog.CloseTrigger
      position="absolute"
      top="2"
      insetEnd="2"
      {...rest}
    >
      <CloseButton size="sm" ref={ref}>
        {children}
      </CloseButton>
    </ChakraDialog.CloseTrigger>
  )
})

export const DialogRoot = ChakraDialog.Root
export const DialogBackdrop = ChakraDialog.Backdrop
export const DialogHeader = ChakraDialog.Header
export const DialogBody = ChakraDialog.Body
export const DialogFooter = ChakraDialog.Footer
export const DialogTitle = ChakraDialog.Title
export const DialogDescription = ChakraDialog.Description

export const DialogTrigger = ChakraDialog.Trigger
export const DialogActionTrigger = ChakraDialog.ActionTrigger
