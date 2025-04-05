export interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view' | 'join';
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
    question?: {
      title: string;
      description: string;
      color?: string;
      fields: Array<any>;
      options: Array<any>;
      footer: {
        text: string;
        iconURL?: string;
      };
      app?: any;
    };
  };
  timestamp: Date;
  icon?: string;
  content?: string;
}

export interface MessagesProps {
  messages: Message[];
  app?: any;
} 