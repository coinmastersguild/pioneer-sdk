import * as React from 'react'

import {
  FieldOptions,
  Form,
  FormLayout,
  SubmitButton,
  SubmitHandler,
} from '@saas-ui/forms'
import { Dialog } from '@saas-ui/react'

export interface InviteData {
  emails: string[]
  role?: 'admin' | 'member' | string
}

interface InviteInputs {
  emails: string
  role?: 'admin' | 'member' | string
}

export interface InviteDialogProps
  extends Omit<
    Dialog.RootProps,
    'onSubmit' | 'title' | 'scrollBehavior' | 'children'
  > {
  title?: string
  onInvite(data: InviteData): Promise<any>
  roles?: FieldOptions
  requiredLabel?: string
  placeholder?: string
  onError?: (error: any) => void
  defaultValues?: InviteInputs
}

export const defaultMemberRoles = [
  {
    value: 'admin',
    label: 'Admin',
  },
  {
    value: 'member',
    label: 'Member',
  },
]

export function InviteDialog(props: InviteDialogProps) {
  const {
    onOpenChange,
    onInvite,
    onError,
    roles,
    defaultValues,
    title = 'Invite people',
    placeholder = 'example@company.com, example2@company.com',
    requiredLabel = 'Add at least one email address.',
    ...rest
  } = props

  const fieldRef = React.useRef(null)

  const onSubmit: SubmitHandler<InviteInputs> = async ({ emails, role }) => {
    try {
      await onInvite?.({
        emails: emails.split(',').map((email: string) => email.trim()),
        role,
      })

      onOpenChange?.({
        open: false,
      })
    } catch (e: any) {
      onError?.(e)
    }
  }

  const roleOptions = roles || defaultMemberRoles

  return (
    <Dialog.Root
      {...rest}
      onOpenChange={onOpenChange}
      initialFocusEl={() => fieldRef.current}
    >
      <Dialog.Content>
        <Form
          onSubmit={onSubmit}
          defaultValues={{
            role: 'member',
            ...defaultValues,
          }}
        >
          {({ Field }) => (
            <>
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <FormLayout>
                  <Field
                    name="emails"
                    type="textarea"
                    placeholder={placeholder}
                    rules={{ required: requiredLabel }}
                    ref={fieldRef}
                  />
                  <Field
                    label="Role"
                    name="role"
                    type="select"
                    options={roleOptions}
                  />
                </FormLayout>
              </Dialog.Body>
              <Dialog.Footer>
                <SubmitButton>Invite</SubmitButton>
              </Dialog.Footer>
            </>
          )}
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
