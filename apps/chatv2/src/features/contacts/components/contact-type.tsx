import { Badge, Box, Tag } from '@chakra-ui/react'

const contactTypes: Record<string, { label: string; color: string }> = {
  lead: {
    label: 'Lead',
    color: 'cyan',
  },
  customer: {
    label: 'Customer',
    color: 'purple',
  },
}
export const ContactType: React.FC<
  Tag.RootProps & { type?: keyof typeof contactTypes }
> = (props) => {
  const { type: typeProp, ...rest } = props
  const type = (typeProp && contactTypes[typeProp]) || contactTypes.lead
  return (
    <Tag.Root
      size="md"
      variant="outline"
      colorPalette="gray"
      borderRadius="full"
      alignItems="center"
      h="6"
      {...rest}
    >
      <Box bg={`${type.color}.500`} boxSize="2" rounded="full" />

      <Tag.Label>{type.label}</Tag.Label>
    </Tag.Root>
  )
}
