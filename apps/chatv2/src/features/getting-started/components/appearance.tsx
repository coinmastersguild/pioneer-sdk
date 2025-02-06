import * as z from 'zod'
import {
  AspectRatio,
  Flex,
  Image,
  Stack,
  Text,
  useStepsContext,
} from '@chakra-ui/react'

import { OnboardingStep } from './onboarding-step'
import { useColorMode } from '#components/ui/color-mode'

const schema = z.object({
  mode: z.enum(['light', 'dark']),
})

export const AppearanceStep = () => {
  const stepper = useStepsContext()
  const { colorMode, setColorMode } = useColorMode()

  return (
    <OnboardingStep
      schema={schema}
      title="Choose your style"
      description="You can change the color mode at any time in your profile settings."
      defaultValues={{
        mode: colorMode,
      }}
      onSubmit={async (data) => {
        setColorMode(data.mode)
        stepper.goToNextStep()
      }}
      submitLabel="Continue"
      maxW={{ base: '100%', md: 'lg' }}
    >
      <Flex m="-6">
        <Stack
          flex="1"
          p="8"
          role="button"
          aria-label="Enable light mode"
          cursor="pointer"
          _hover={{ bg: 'blackAlpha.50' }}
          _dark={{ _hover: { bg: 'whiteAlpha.50' } }}
          onClick={() => setColorMode('light')}
        >
          <AspectRatio
            ratio={16 / 9}
            height="100px"
            borderRadius="md"
            overflow="hidden"
            borderWidth="1px"
            bg="gray.50"
            data-selected={colorMode === 'light' ? '' : undefined}
            _selected={{
              borderColor: 'primary.500',
              shadow: 'outline',
            }}
          >
            <Image src="/img/onboarding/light.svg" alt="Light dashboard" />
          </AspectRatio>
          <Text>Light</Text>
        </Stack>
        <Stack
          flex="1"
          p="8"
          role="button"
          aria-label="Enable dark mode"
          cursor="pointer"
          _hover={{ bg: 'blackAlpha.50' }}
          _dark={{ _hover: { bg: 'whiteAlpha.50' } }}
          onClick={() => setColorMode('dark')}
        >
          <AspectRatio
            ratio={16 / 9}
            height="100px"
            borderRadius="md"
            overflow="hidden"
            borderWidth="1px"
            bg="gray.800"
            data-selected={colorMode === 'dark' ? '' : undefined}
            _selected={{
              borderColor: 'primary.500',
              shadow: 'outline',
            }}
          >
            <Image src="/img/onboarding/dark.svg" alt="Dark dashboard" />
          </AspectRatio>
          <Text>Dark</Text>
        </Stack>
      </Flex>
    </OnboardingStep>
  )
}
