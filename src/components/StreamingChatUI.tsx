import React, { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LiveRegion, useLiveRegion } from "@/components/ui/live-region";
import { V0AIProcessingPanel } from "@/components/v0-components/composition-patterns";
import { ContextIndicator } from "@/components/v0-components/context-indicator";
import { 
  Send, 
  User, 
  Bot, 
  AlertCircle,
  Copy,
  Check,
  Trash2,
  RotateCcw
} from 'lucide-react';

// Types for chat messages and streaming
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

interface StreamChunk {
  content: string;
  is_final: boolean;
  metadata?: {
    provider: string;
    model: string;
    timestamp: string;
  };
}

interface ChatRequest {
  message: string;
  context?: string;
  include_context?: boolean;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  session_id?: string;
}

export const StreamingChatUI: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const { announcement, announce } = useLiveRegion();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Set up streaming event listener
  useEffect(() => {
    const setupEventListener = async () => {
      try {
        // Listen for streaming chunks
        const unlisten = await listen<StreamChunk>('ai_suggestion_chunk', (event) => {
          const chunk = event.payload;
          
          if (currentStreamingId) {
            setMessages(prev => prev.map(msg => {
              if (msg.id === currentStreamingId && msg.isStreaming) {
                return {
                  ...msg,
                  content: msg.content + chunk.content,
                  isStreaming: !chunk.is_final
                };
              }
              return msg;
            }));

            // If this is the final chunk, clear the streaming ID
            if (chunk.is_final) {
              setCurrentStreamingId(null);
              setIsLoading(false);
              announce('AI response completed', 'polite');
            }
          }
        });

        unlistenRef.current = unlisten;
      } catch (err) {
        console.error('Failed to set up event listener:', err);
        setError('Failed to set up streaming connection');
      }
    };

    setupEventListener();

    // Cleanup on unmount
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [currentStreamingId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send a chat message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    // Add user message and prepare assistant message
    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setCurrentStreamingId(assistantMessageId);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Send chat request to backend
      const request: ChatRequest = {
        message: userMessage.content,
        include_context: true // Enable context retrieval
      };

      const response = await invoke<ChatResponse>('send_chat_message', request);

      if (!response.success) {
        throw new Error(response.message || 'Failed to send message');
      }

      // The streaming response will be handled by the event listener
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => {
        if (msg.id === assistantMessageId) {
          return {
            ...msg,
            content: 'Sorry, I encountered an error processing your request.',
            error: errorMessage,
            isStreaming: false
          };
        }
        return msg;
      }));

      setError(errorMessage);
      setCurrentStreamingId(null);
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy message content to clipboard
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    setError(null);
    setCurrentStreamingId(null);
  };

  // Retry last message
  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage && !isLoading) {
      setInputMessage(lastUserMessage.content);
    }
  };

  // Get message icon
  const getMessageIcon = (role: string, isStreaming?: boolean, error?: string) => {
    if (error) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (isStreaming) {
      return (
        <V0AIProcessingPanel
          isProcessing={true}
          processedItems={0}
          totalItems={1}
          title="AI"
          status="active"
          className="scale-75 origin-left"
        />
      );
    }
    if (role === 'user') {
      return <User className="h-4 w-4 text-blue-500" />;
    }
    return <Bot className="h-4 w-4 text-v0-teal" />;
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-v0-space-3 border-b border-v0-border-primary">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Chat</span>
          <ContextIndicator 
            isProcessing={isLoading || !!currentStreamingId}
            processedItems={messages.filter(m => m.role === 'assistant' && m.content).length}
            totalItems={messages.filter(m => m.role === 'user').length}
            phase={isLoading || currentStreamingId ? 'processing' : 'idle'}
            ariaLabel={`Chat status: ${messages.length} messages`}
          />
        </div>
        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={retryLastMessage}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Retry last message"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
                className="h-6 w-6 p-0"
                title="Clear chat"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* AI Processing Panel - Show during AI processing */}
      {(isLoading || currentStreamingId) && (
        <div className="p-v0-space-3 border-b border-v0-border-primary">
          <V0AIProcessingPanel 
            isProcessing={isLoading || !!currentStreamingId}
            processedItems={currentStreamingId ? 
              Math.min(messages.find(m => m.id === currentStreamingId)?.content?.length || 0, 1000) : 
              messages.filter(m => m.role === 'assistant' && m.content).length * 100}
            totalItems={currentStreamingId ? 1000 : 
              (messages.filter(m => m.role === 'user').length + messages.filter(m => m.role === 'assistant').length) * 100}
            title="AI Chat Assistant"
            status={isLoading || currentStreamingId ? 'active' : 'completed'}
            onStop={() => {
              if (currentStreamingId) {
                // Stop current streaming
                setCurrentStreamingId(null);
              }
              setIsLoading(false);
            }}
            className="mb-0"
          />
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-v0-space-3">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4" role="log" aria-label="Chat conversation" aria-live="polite">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-8 w-8 mx-auto mb-v0-space-2 opacity-50" />
              <p className="text-sm">Start a conversation with your AI assistant</p>
              <p className="text-xs mt-v0-space-1">Type a message below to begin</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex flex-col space-y-1">
                <div className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  {message.role !== 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      {getMessageIcon(message.role, message.isStreaming, message.error)}
                    </div>
                  )}
                  
                  <Card className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.error 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : 'bg-v0-bg-secondary'
                  }`}>
                    <CardContent className="p-3">
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content || (message.isStreaming ? 'Thinking...' : '')}
                      </div>
                      
                      {/* Message Actions */}
                      {message.content && !message.isStreaming && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-v0-border-primary/50">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content, message.id)}
                            className="h-5 w-5 p-0"
                            title="Copy message"
                            aria-label={copiedMessageId === message.id ? "Message copied" : "Copy message to clipboard"}
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="h-3 w-3 text-v0-teal" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-v0-border-primary">
        <div className="flex items-center space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            {isLoading ? (
              <V0AIProcessingPanel
                isProcessing={true}
                processedItems={0}
                totalItems={1}
                title=""
                status="active"
                className="scale-50 origin-center"
              />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Input Hint */}
        <div className="text-xs text-muted-foreground mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
      
      {/* Live Region for Screen Reader Announcements */}
      <LiveRegion politeness="polite">
        {announcement}
      </LiveRegion>
    </div>
  );
};
