import { FormLayout, SubmitButton } from '@saas-ui/forms'
import { Dialog, toast } from '@saas-ui/react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { createContact } from '#api'
import { Form } from '#components/form/form.tsx'
import { usePath } from '#features/common/hooks/use-path.ts'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
})

export function AddPersonDialog(props: Dialog.RootProps) {
  const router = useRouter()

  const basePath = usePath()

  const createContactMutation = useMutation({
    mutationFn: createContact,
    onSuccess: ({ createContact }) => {
      toast.success({
        title: 'Person added',
        action: {
          label: 'View person',
          onClick: () => {
            router.push(`${basePath}/contacts/${createContact.id}`)
          },
        },
      })
    },
    onError: (error) => {
      console.error(error)
      toast.error({
        title: 'Failed to add person',
      })
    },
  })

  return (
    <Dialog.Root {...props}>
      <Dialog.Content>
        <Form
          schema={schema}
          defaultValues={{
            firstName: '',
            lastName: '',
            email: '',
          }}
          onSubmit={async (values) => {
            await createContactMutation.mutateAsync({
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
            })
          }}
          mode="onSubmit"
        >
          {({ Field }) => (
            <>
              <Dialog.Header>
                <Dialog.Title>Add person</Dialog.Title>
                <Dialog.CloseTrigger />
              </Dialog.Header>
              <Dialog.Body>
                <FormLayout>
                  <FormLayout columns={2}>
                    <Field name="firstName" label="First name" />
                    <Field name="lastName" label="Last name" />
                  </FormLayout>
                  <Field
                    name="email"
                    label="Email"
                    placeholder="john@doe.com"
                  />
                </FormLayout>
              </Dialog.Body>
              <Dialog.Footer>
                <SubmitButton>Add</SubmitButton>
              </Dialog.Footer>
            </>
          )}
        </Form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
