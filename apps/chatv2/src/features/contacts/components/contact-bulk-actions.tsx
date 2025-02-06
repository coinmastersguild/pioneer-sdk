import { Button } from '@chakra-ui/react'
import { Command, Tooltip } from '@saas-ui/react'
import { LuCommand, LuTag } from 'react-icons/lu'

export const bulkActions = ({ selections }: { selections: Array<string> }) => {
  const handleAddTags = () => {
    console.log('Add tags', selections)
  }

  const handleCommand = () => {
    console.log('Command', selections)
  }

  return (
    <>
      <Tooltip
        positioning={{
          placement: 'top',
        }}
        content={
          <>
            Add tags <Command>⇧ T</Command>
          </>
        }
      >
        <Button variant="surface" size="sm" onClick={handleAddTags}>
          <LuTag size="1em" /> Add tags
        </Button>
      </Tooltip>
      <Tooltip
        positioning={{
          placement: 'top',
        }}
        content={
          <>
            Command <Command>⇧ K</Command>
          </>
        }
      >
        <Button variant="surface" size="sm" onClick={handleCommand}>
          <LuCommand size="1em" /> Command
        </Button>
      </Tooltip>
    </>
  )
}
