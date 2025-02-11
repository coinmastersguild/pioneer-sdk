import * as React from 'react'
import { Form, FormLayout, Field } from '@saas-ui/forms'

export interface ConfirmPasswordProps {
  name?: string
  label?: string
  confirmLabel?: string
  placeholder?: string
  confirmPlaceholder?: string
  onChange?: (value: { password: string; passwordConfirm: string }) => void
}

export const ConfirmPasswordField: React.FC<ConfirmPasswordProps> = ({
  name = 'password',
  label = 'Password',
  confirmLabel = 'Confirm password',
  placeholder = 'Enter password',
  confirmPlaceholder = 'Confirm password',
  onChange,
}) => {
  const handleSubmit = (data: any) => {
    onChange?.(data)
  }

  return (
    <Form onSubmit={handleSubmit}>
      <FormLayout>
        <Field
          name={name}
          label={label}
          type="password"
          placeholder={placeholder}
          rules={{ required: 'Password is required' }}
        />
        <Field
          name={`${name}Confirm`}
          label={confirmLabel}
          type="password"
          placeholder={confirmPlaceholder}
          rules={{
            required: 'Confirm password is required',
            validate: (value, values) =>
              value === values[name] || 'Passwords do not match',
          }}
        />
      </FormLayout>
    </Form>
  )
}
