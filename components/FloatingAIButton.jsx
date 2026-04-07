'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Bot, X, Send, Loader2, MessageSquare, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

const FloatingAIButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI payroll assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Clear chat function
  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I help you today?'
      }
    ]);
    setInput('');
    // Focus input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const token = localStorage.getItem('token');
      
      // Comprehensive debugging
      console.log('=== AI Chat Debug Info ===');
      console.log('Raw token from localStorage:', token);
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('Token starts with Bearer:', token?.startsWith('Bearer ') || false);
      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log('Current URL:', window.location.href);
      console.log('User agent:', navigator.userAgent);
      
      // Check all possible token keys
      const possibleTokenKeys = ['token', 'authToken', 'jwt', 'accessToken', 'auth_token'];
      let foundToken = null;
      let foundKey = null;
      
      for (const key of possibleTokenKeys) {
        const value = localStorage.getItem(key);
        if (value && value.length > 10) {
          foundToken = value;
          foundKey = key;
          console.log(`Found token in key "${key}":`, value.substring(0, 20) + '...');
          break;
        }
      }
      
      const finalToken = token || foundToken;
      
      if (!finalToken) {
        // Add a helpful message instead of throwing an error
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `No authentication token found. Please make sure you're logged in. 

Debug info:
- Checked localStorage for: ${possibleTokenKeys.join(', ')}
- Current page: ${window.location.href}
- Try refreshing the page and logging in again

If you're already logged in, there might be an issue with token storage. Please contact support.`
          }
        ]);
        setIsLoading(false);
        // Refocus input field
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }

      // Clean token if it has Bearer prefix
      const cleanToken = finalToken.startsWith('Bearer ') ? finalToken.slice(7) : finalToken;
      console.log('Cleaned token (first 20 chars):', cleanToken.substring(0, 20) + '...');
      
      const response = await axios.post(
        '/api/ai/chat',
        { message: userMessage },
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: response.data.response }
        ]);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'I apologize, but I encountered an error while processing your request.';
      
      if (error.response?.status === 401) {
        errorMessage = `Your session has expired or the token is invalid. 

Please try:
1. Log out and log back in
2. Refresh the page
3. Clear browser cache and try again

Debug info: ${error.response?.data?.message || 'No additional info'}`;
        
        // Optionally redirect to login after showing message
        setTimeout(() => {
          if (window.confirm('Your session has expired. Would you like to log in again?')) {
            window.location.href = '/login';
          }
        }, 3000);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to use the AI assistant. Please contact your administrator.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'The AI service is currently unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage
        }
      ]);
    } finally {
      setIsLoading(false);
      // Refocus input field after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const Message = ({ message, isAI }) => {
    return (
      <div className={`flex gap-3 p-3 ${isAI ? 'bg-gray-50 dark:bg-muted/30' : ''} ${!isAI ? 'flex-row-reverse' : ''}`}>
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs bg-muted dark:bg-muted/80">
            {isAI ? <Bot className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
          </AvatarFallback>
        </Avatar>
        <div className={`flex-1 space-y-1 ${!isAI ? 'text-right' : ''}`}>
          <p className="text-xs font-medium text-foreground">
            {isAI ? 'AI Assistant' : 'You'}
          </p>
          <div className="text-xs whitespace-pre-wrap text-foreground">
            {message}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "bg-gradient-to-r from-teal-500 to-teal-600",
          "text-white shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-300 hover:scale-110",
          "border-2 border-white/20 backdrop-blur-sm",
          "group"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
        ) : (
          <Bot className="h-6 w-6 transition-transform group-hover:scale-110" />
        )}
        
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-teal-500 animate-ping opacity-75" />
        )}
        
        {/* Glow effect */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Window */}
          <div className="relative w-full max-w-lg h-[600px] animate-in slide-in-from-bottom-10 fade-in-0 duration-300">
            <Card className="h-full flex flex-col shadow-2xl border-0 bg-background/95 backdrop-blur-md dark:bg-card/95">
              {/* Header */}
              <CardHeader className="pb-3 bg-gradient-to-r from-teal-500/10 to-teal-600/10 border-b dark:border-border flex-shrink-0">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                    <span className="text-foreground">AI Payroll Assistant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearChat}
                      className="h-6 w-6 hover:bg-muted/50 dark:hover:bg-muted/30"
                      title="Clear chat"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 hover:bg-muted/50 dark:hover:bg-muted/30"
                      title="Close chat"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              {/* Messages - Fixed height with scroll */}
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                <div className="flex-1 overflow-y-auto bg-background dark:bg-card">
                  <div className="space-y-0 p-4">
                    {messages.map((message, index) => (
                      <Message
                        key={index}
                        message={message.content}
                        isAI={message.role === 'assistant'}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-muted/30">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-muted dark:bg-muted/80">
                            <Bot className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          AI is thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Input - Fixed at bottom */}
                <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/30 dark:bg-muted/20 flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about payroll, taxes, HR..."
                      disabled={isLoading}
                      className="flex-1 h-9 text-sm bg-background dark:bg-card border-border dark:border-border"
                    />
                    {input.trim() && !isLoading && (
                      <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 transition-all duration-200"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIButton;
