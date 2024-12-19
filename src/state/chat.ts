import { createGlobalState } from "~/state";
import { toast } from "~/hooks/use-toast";

interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  timestamp: number;
  seen: boolean;
}

interface ChatState {
  messages: Message[];
  activeRoom: string | null;
  unreadCount: number;
  connected: boolean;
  error: string | null;
}

export const useChatState = createGlobalState<ChatState>(
  "chat",
  {
    messages: [],
    activeRoom: null,
    unreadCount: 0,
    connected: false,
    error: null,
  },
  {
    devtools: true,
    middleware: [
      (state) => {
        // Show error toast if error exists
        if (state.error) {
          toast({
            title: "Chat Error",
            description: state.error,
            variant: "destructive",
          });
        }
      },
    ],
  },
);
