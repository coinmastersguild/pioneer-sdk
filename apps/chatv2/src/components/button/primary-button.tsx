import { Button, ButtonProps } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const PrimaryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function PrimaryButton(props, ref) {
    return <Button ref={ref} {...props} variant="solid" colorScheme="accent" />
  },
)
