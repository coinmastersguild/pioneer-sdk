'use client'

import * as React from 'react'

import {
  type HTMLChakraProps,
  type RecipeProps,
  chakra,
  useRecipe,
} from '@chakra-ui/react'
import { createField } from '@saas-ui/forms'
import Placeholder from '@tiptap/extension-placeholder'
import {
  EditorContent,
  EditorContentProps,
  Editor as TipTapEditor,
  useEditor,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export interface EditorProps
  extends Omit<
      EditorContentProps,
      'editor' | 'size' | keyof HTMLChakraProps<'div'>
    >,
    RecipeProps<'textarea'>,
    HTMLChakraProps<'div'> {
  value?: string
  defaultValue?: string
  placeholder?: string
  editorRef?: React.Ref<TipTapEditor>
  minHeight?: HTMLChakraProps<'div'>['minHeight']
}

export const Editor = React.forwardRef<HTMLDivElement, EditorProps>(
  function Editor(props, ref) {
    const {
      defaultValue,
      onChange,
      value,
      placeholder,
      editorRef,
      minHeight = '60px',
      ...rest
    } = props

    const recipe = useRecipe({
      key: 'textarea',
    })

    const [variantProps, rootProps] = recipe.splitVariantProps(rest)

    const styles = recipe(variantProps)

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder,
        }),
      ],
      content: defaultValue,
      onUpdate: ({ editor }) => {
        const html = editor?.getHTML()
        /* @ts-ignore */
        onChange?.(html || '')
      },
    }) as TipTapEditor

    React.useImperativeHandle(editorRef, () => editor)

    React.useEffect(() => {
      if (!editor) return

      const { from, to } = editor.state.selection

      editor.commands.setContent(value || '', false, {
        preserveWhitespace: 'full',
      })

      editor.commands.setTextSelection({ from, to })
    }, [editor, value])

    const editorStyles = {
      '& .ProseMirror': {
        outline: 0,
        width: '100%',
        minHeight: minHeight,
      },
      '& .ProseMirror p.is-editor-empty:first-of-type::before': {
        color: 'muted',
        content: 'attr(data-placeholder)',
        float: 'left',
        height: 0,
        pointerEvents: 'none',
      },
      ...styles,
      wordBreak: 'break-all',
      height: 'auto',
    }

    return (
      <chakra.div ref={ref} {...rootProps} css={editorStyles} asChild>
        <EditorContent editor={editor} />
      </chakra.div>
    )
  },
)

export const EditorField = createField<HTMLDivElement, EditorProps>(
  (props, ref) => {
    return <Editor ref={ref} {...props} />
  },
  { isControlled: true },
)
