import { ComponentType } from 'react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

declare module '@chakra-ui/react' {
  // Fix for Chakra UI components
  export type ChakraComponent<T extends keyof JSX.IntrinsicElements> = ComponentType<any>;
  export type ChakraFactory<T> = ComponentType<T>;

  // Fix for specific components
  export const Box: ChakraComponent<'div'>;
  export const Flex: ChakraComponent<'div'>;
  export const Stack: ChakraComponent<'div'>;
  export const HStack: ChakraComponent<'div'>;
  export const VStack: ChakraComponent<'div'>;
  export const Text: ChakraComponent<'p'>;
  export const Link: ChakraComponent<'a'>;
  export const Icon: ChakraComponent<'svg'>;
  export const Image: ChakraComponent<'img'>;
  export const AspectRatio: ChakraComponent<'div'>;
  export const Input: ChakraComponent<'input'>;
  export const Button: ChakraComponent<'button'>;
  export const Card: {
    Root: ChakraComponent<'div'>;
    Body: ChakraComponent<'div'>;
    Footer: ChakraComponent<'div'>;
    Header: ChakraComponent<'div'>;
    Title: ChakraComponent<'h2'>;
    Description: ChakraComponent<'p'>;
  };
} 