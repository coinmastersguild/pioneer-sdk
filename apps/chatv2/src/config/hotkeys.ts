import { platformSelect } from '@saas-ui-pro/react'
import { HotkeysConfig } from '@saas-ui/use-hotkeys'

export const appHotkeys = {
  general: {
    title: 'General',
    hotkeys: {
      help: {
        label: 'Help & support',
        command: '?',
      },
      search: {
        label: 'Search',
        command: '/',
      },
      filter: {
        label: 'Add filter',
        command: 'F',
      },
      logout: {
        label: 'Log out',
        command: platformSelect({ mac: '⌥ ⇧ Q' }, 'Ctrl+Shift+Q'),
      },
    },
  },
  navigation: {
    title: 'Navigation',
    hotkeys: {
      updates: {
        label: 'Go to Updates',
        command: 'G then U',
      },
      people: {
        label: 'Go to People',
        command: 'G then P',
      },
      companies: {
        label: 'Go to Companies',
        command: 'G then C',
      },
      workflows: {
        label: 'Go to Workflows',
        command: 'G then W',
      },
      reports: {
        label: 'Go to Reports',
        command: 'G then R',
      },
    },
  },
  contacts: {
    title: 'Contacts',
    hotkeys: {
      add: {
        label: 'Add a person',
        command: 'A',
      },
    },
  },
  settings: {
    hotkeys: {
      close: {
        label: 'Close settings',
        command: 'Esc',
      },
    },
  },
} satisfies HotkeysConfig
