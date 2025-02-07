import { ReactNode } from 'react';
import { HiHeart } from "react-icons/hi";

export interface Message {
  type?: string;
  message?: string;
  from?: string;
  text?: string;
  icon?: any;
  view?: any;
}

export interface ChatProps {
  usePioneer: any;
}

export interface MessagesProps {
  messages: Message[];
}

export type AvatarMap = Record<string, typeof HiHeart | string>;

export interface EmailSetupProps {
  app: any;
  setMessages: (messages: any) => void;
  username: string | null;
} 