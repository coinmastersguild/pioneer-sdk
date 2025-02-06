import { Box, BoxProps } from '@chakra-ui/react'
import { Tooltip } from '@saas-ui/react'
import { useState } from 'react'
import { useIntl } from 'react-intl'

import {
  DateTime as FormatDateTime,
  RelativeTime as FormatRelativeTime,
} from '#i18n/date-helpers'

export interface DateTimeSinceProps extends BoxProps {
  date: Date
  format?: 'short' | 'long' | 'narrow'
}

/**
 * Display a date and time in a relative or absolute format.
 */
export const DateTimeSince: React.FC<DateTimeSinceProps> = (props) => {
  const { date, format, ...rest } = props
  const [type, setType] = useState<'relative' | 'absolute'>('relative')

  const intl = useIntl()

  const formattedDate = `${intl.formatDate(date)}, ${intl.formatTime(date)}`

  return (
    <Tooltip content={formattedDate}>
      <Box
        as="span"
        cursor="pointer"
        {...rest}
        onClick={(e) => {
          e.stopPropagation()
          setType(type === 'relative' ? 'absolute' : 'relative')
        }}
      >
        {type === 'relative' ? (
          <FormatRelativeTime date={props.date} style={format} />
        ) : (
          <FormatDateTime date={props.date} style={format} />
        )}
      </Box>
    </Tooltip>
  )
}
