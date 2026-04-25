import axiosInstance from './axiosInstance';

export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatbotResponse {
  reply: string;
  live: boolean;
}

export async function askChatbot(messages: ChatTurn[]): Promise<ChatbotResponse> {
  const res = await axiosInstance.post<ChatbotResponse>('/chatbot/ask', { messages });
  return res.data;
}
