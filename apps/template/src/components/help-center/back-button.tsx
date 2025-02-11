import { Button, ButtonProps } from '@chakra-ui/react'
import { LuArrowLeft } from 'react-icons/lu'

export const BackButton = (props: ButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={<LuArrowLeft />}
      {...props}
    />
  )
} 