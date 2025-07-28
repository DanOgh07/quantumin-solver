import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Lightbulb, BookOpen } from "lucide-react";
import { LLMService } from "@/services/llmService";
import { toast } from "sonner";

type MessageType = 'explanation' | 'tutoring' | 'problem';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'explanation' | 'tutoring' | 'problem';
}

interface AIChatProps {
  llmService: LLMService | null;
  currentExpression?: string;
  currentSolution?: string;
}

export const AIChat = ({ llmService, currentExpression, currentSolution }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, type?: MessageType) => {
    const message: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      type,
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSend = async () => {
    if (!input.trim() || !llmService) return;

    const userMessage = input.trim();
    setInput("");
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const context = currentExpression 
        ? `Current expression: ${currentExpression}${currentSolution ? `\nCurrent solution: ${currentSolution}` : ''}`
        : 'No current problem';

      const response = await llmService.chatAssistance(context, userMessage);
      addMessage('assistant', response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get AI response");
      addMessage('assistant', "I'm sorry, I'm having trouble responding right now. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getEnhancedExplanation = async () => {
    if (!llmService || !currentExpression || !currentSolution) {
      toast.error("No current problem to explain");
      return;
    }

    setIsLoading(true);
    try {
      const explanation = await llmService.enhanceExplanation(currentExpression, currentSolution);
      addMessage('assistant', explanation, 'explanation');
      toast.success("Enhanced explanation generated!");
    } catch (error) {
      toast.error("Failed to generate explanation");
    } finally {
      setIsLoading(false);
    }
  };

  const startTutoring = async () => {
    if (!llmService || !currentExpression) {
      toast.error("No current problem for tutoring");
      return;
    }

    setIsLoading(true);
    try {
      const guidance = await llmService.provideTutoring(currentExpression, "Can you help me understand this step by step?");
      addMessage('assistant', guidance, 'tutoring');
      toast.success("Tutoring session started!");
    } catch (error) {
      toast.error("Failed to start tutoring");
    } finally {
      setIsLoading(false);
    }
  };

  if (!llmService) {
    return (
      <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
        <p className="text-muted-foreground text-sm">
          Connect an AI assistant to get enhanced explanations and tutoring
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-math-primary" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex gap-2">
            {currentExpression && currentSolution && (
              <Button
                variant="outline"
                size="sm"
                onClick={getEnhancedExplanation}
                disabled={isLoading}
                className="text-xs"
              >
                <Lightbulb className="w-3 h-3 mr-1" />
                Explain
              </Button>
            )}
            {currentExpression && (
              <Button
                variant="outline"
                size="sm"
                onClick={startTutoring}
                disabled={isLoading}
                className="text-xs"
              >
                <BookOpen className="w-3 h-3 mr-1" />
                Tutor
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80" ref={scrollRef}>
          <div className="space-y-3 pr-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about math!</p>
                <p className="text-xs mt-1">Try: "Explain integration by parts" or "Help me with this problem"</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-math-primary text-white' 
                      : 'bg-background border border-border'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-math-primary text-white'
                      : 'bg-background/50 border border-border/50'
                  }`}>
                    {message.type && message.role === 'assistant' && (
                      <Badge variant="outline" size="sm" className="mb-2 text-xs">
                        {message.type === 'explanation' && 'Enhanced Explanation'}
                        {message.type === 'tutoring' && 'Tutoring Mode'}
                        {message.type === 'problem' && 'Generated Problem'}
                      </Badge>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-background/50 border border-border/50 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-math-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-math-primary animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-math-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about math concepts, get help with problems..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};