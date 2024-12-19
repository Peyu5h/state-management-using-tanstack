/* eslint-disable react-hooks/rules-of-hooks */
import { useChatState } from "~/state/chat";

export class ChatSocket {
  private ws: WebSocket | null = null;
  private readonly url: string;

  constructor() {
    this.url = `${process.env.NEXT_PUBLIC_WS_URL}/chat`;
  }

  connect(userId: string) {
    const { set } = useChatState();

    this.ws = new WebSocket(`${this.url}?userId=${userId}`);

    this.ws.onopen = () => {
      set({ connected: true, error: null });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      set({ error: "WebSocket error occurred", connected: false });
    };
  }

  private handleMessage(data: any) {
    const { set, update } = useChatState();

    switch (data.type) {
      case "message":
        update((draft) => {
          draft.messages.push(data.message);
          if (data.message.roomId !== draft.activeRoom) {
            draft.unreadCount++;
          }
        });
        break;
      // Add other message handlers
    }
  }

  sendMessage(message: string, roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(
      JSON.stringify({
        type: "message",
        roomId,
        content: message,
      }),
    );
  }
}

export const chatSocket = new ChatSocket();
