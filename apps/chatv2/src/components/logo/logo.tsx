import { Flex, FlexProps } from '@chakra-ui/react'

import { SaasUILogo } from './saas-ui'

export const Logo = (props: FlexProps & { logo?: React.ReactNode }) => {
  const { logo } = props
  return (
    <Flex width="160px" justify="center" align="center" {...props}>
      {logo || <SaasUILogo />}
    </Flex>
  )
}
