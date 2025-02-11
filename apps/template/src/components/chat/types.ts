export interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view';
  from: 'user' | 'computer';
  text?: string;
  view?: {
    type: string;
    article?: {
      title: string;
      description: string;
      color?: string;
      fields?: Array<{
        name: string;
        value: string;
      }>;
      footer?: {
        text: string;
        iconURL?: string;
      };
    };
  };
  timestamp: Date;
  icon?: string;
}

export interface MessagesProps {
  messages: Message[];
} 