'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAction,
  MessageActions,
} from '@/components/ai-elements/message';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion';
import { Loader } from '@/components/ai-elements/loader';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Sparkles, Bot, Copy, RefreshCw } from 'lucide-react';
import { nanoid } from 'nanoid';

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'Find all invoices from 2024',
  'Total spending last month?',
  'Bank statements over $1000',
];

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'ready' | 'submitted' | 'streaming' | 'error'>('ready');

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setStatus('submitted');

    // Simulate AI response (will be replaced with useChat)
    setTimeout(() => {
      setStatus('streaming');
    }, 200);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `Welcome to the DocuFinance AI Assistant! How can I assist you today?`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus('ready');
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit({ text: suggestion, files: [] });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="fixed bottom-24 right-6 top-auto left-auto 
          translate-x-0 translate-y-0 
          h-[min(600px,80vh)] w-[min(420px,calc(100vw-3rem))] 
          flex flex-col p-0 gap-0 rounded-2xl shadow-2xl
          data-[state=open]:slide-in-from-bottom-4 data-[state=open]:fade-in-0
          data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:fade-out-0"
      >
        <DialogHeader className="border-b px-4 py-3 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            DocuFinance AI Assistant
          </DialogTitle>
        </DialogHeader>

        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Ask about your documents"
                description="I can help you find documents, summarize data, and answer questions about your documents."
                icon={<Bot className="h-8 w-8" />}
              />
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.role === 'assistant' ? (
                      <MessageResponse>{message.content}</MessageResponse>
                    ) : (
                      message.content
                    )}
                  </MessageContent>
                  {message.role === 'assistant' && (
                    <MessageActions>
                      <MessageAction tooltip="Copy" onClick={() => handleCopy(message.content)}>
                        <Copy className="h-3 w-3" />
                      </MessageAction>
                      <MessageAction tooltip="Retry" onClick={() => {}}>
                        <RefreshCw className="h-3 w-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Message>
              ))
            )}
            {(status === 'submitted' || status === 'streaming') && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 border-t bg-background">
          {messages.length === 0 && (
            <Suggestions className="px-4 pt-3">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={handleSuggestionClick}
                />
              ))}
            </Suggestions>
          )}
          <div className="p-3">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  placeholder="Ask about your documents..."
                  className="min-h-[44px] max-h-[120px]"
                />
              </PromptInputBody>
              <PromptInputFooter>
                <div /> {/* Spacer */}
                <PromptInputSubmit status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
