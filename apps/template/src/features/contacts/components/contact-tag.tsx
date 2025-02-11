import { Box, Tag } from '@chakra-ui/react'

import { useTags } from '../hooks/use-tags'

export const ContactTag: React.FC<Tag.RootProps & { tag: string }> = (
  props,
) => {
  const { tag, ...rest } = props

  const { data } = useTags()

  const t = data?.tags.find((t) => t.id === tag)

  if (!t) return null

  return (
    <Tag.Root
      size="sm"
      colorPalette="gray"
      variant="outline"
      borderRadius="full"
      h="6"
      {...rest}
    >
      <Box bg={t.color} boxSize="2" rounded="full" />

      <Tag.Label>{t.label}</Tag.Label>
    </Tag.Root>
  )
}
