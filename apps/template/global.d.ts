declare module '@chakra-ui/styled-system' {
  export function defineStyle<T>(callback: (props: T) => any): any;
}

declare module '@chakra-ui/theme-tools' {
  export function transparentize(color: string, opacity: number): (theme: any) => string;
} 