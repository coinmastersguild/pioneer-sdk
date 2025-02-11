import { HStack, Icon, Spacer, Tag, Text } from '@chakra-ui/react'
import { TagIcon } from 'lucide-react'

import { DataBoardHeaderProps } from '#components/data-board'
import { OverflowMenu } from '#components/overflow-menu'

import { ContactStatus } from './contact-status'
import { ContactTag } from './contact-tag'
import { ContactType } from './contact-type'

export const ContactBoardHeader: React.FC<DataBoardHeaderProps> = (props) => {
  const value = props.groupingValue as string
  let title

  switch (props.groupingColumnId) {
    case 'status':
      title = <ContactStatus status={value} />
      break
    case 'tags':
      title = value ? (
        <ContactTag
          tag={value}
          px="0"
          bg="transparent"
          _dark={{ bg: 'transparent', color: 'app-text' }}
        />
      ) : (
        <Tag.Root
          size="sm"
          px="0"
          bg="transparent"
          _dark={{ bg: 'transparent', color: 'app-text' }}
        >
          <Icon as={TagIcon} fontSize="sm" me="1" />
          No tag
        </Tag.Root>
      )
      break
    case 'type':
      title = (
        <ContactType
          type={value}
          px="0"
          bg="transparent"
          _dark={{ bg: 'transparent', color: 'app-text' }}
        />
      )
      break
  }

  return (
    <HStack w="full" py="2" px="0" gap="1">
      {title}
      <Text color="fg.muted" textStyle="sm">
        {(props as any).leafRows?.length ?? 0}
      </Text>
      <Spacer />
      <OverflowMenu.Root>
        <OverflowMenu.Item value="hide">Hide</OverflowMenu.Item>
      </OverflowMenu.Root>
    </HStack>
  )
}
