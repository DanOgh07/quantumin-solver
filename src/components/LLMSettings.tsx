import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Eye, EyeOff, Brain } from "lucide-react";
import { toast } from "sonner";

interface LLMSettingsProps {
  onConfigChange: (config: { apiKey: string; model: string } | null) => void;
}

export const LLMSettings = ({ onConfigChange }: LLMSettingsProps) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('llm-api-key') || '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');
  const [model, setModel] = useState(localStorage.getItem('llm-model') || 'meta-llama/Meta-Llama-3.2-8B-Instruct');
  const [showKey, setShowKey] = useState(false);
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem('llm-api-key'));

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    localStorage.setItem('llm-api-key', apiKey);
    localStorage.setItem('llm-model', model);

    setIsConnected(true);
    onConfigChange({ apiKey, model });
    toast.success("LLM configuration saved!");
  };

  const handleDisconnect = () => {
    localStorage.removeItem('llm-api-key');
    localStorage.removeItem('llm-model');

    setApiKey('');
    setIsConnected(false);
    onConfigChange(null);
    toast.success("LLM disconnected");
  };

  const readableModel = (model: string) => {
    if (model.includes('Meta-Llama-3.2-1B')) return 'LLaMA 3.2 1B';
    if (model.includes('Meta-Llama-3.2-8B')) return 'LLaMA 3.2 8B';
    if (model.includes('DialoGPT')) return 'DialoGPT Medium';
    if (model.includes('gpt2')) return 'GPT-2';
    if (model.includes('blenderbot')) return 'BlenderBot';
    return model;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-math-primary" />
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            {isConnected && (
              <Badge variant="outline" className="border-green-500 text-green-500">
                Connected
              </Badge>
            )}
          </div>
          <Settings className="w-4 h-4 text-muted-foreground" />
        </div>

        {!isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-background/30 rounded-lg border border-border/30">
              <p className="text-sm text-muted-foreground mb-2">
                Connect an AI assistant for enhanced features:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Natural language problem input</li>
                <li>• Enhanced step-by-step explanations</li>
                <li>• Interactive tutoring mode</li>
                <li>• Problem generation</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta-llama/Meta-Llama-3.2-1B-Instruct">
                      LLaMA 3.2 1B Instruct (Free)
                    </SelectItem>
                    <SelectItem value="meta-llama/Meta-Llama-3.2-8B-Instruct">
                      LLaMA 3.2 8B Instruct (Free)
                    </SelectItem>
                    <SelectItem value="mistralai/Mistral-7B-Instruct-v0.1">
                      Mistral 7B Instruct (Free)
                    </SelectItem>
                    <SelectItem value="microsoft/DialoGPT-medium">
                      DialoGPT Medium
                    </SelectItem>
                    <SelectItem value="gpt2">
                      GPT-2
                    </SelectItem>
                    <SelectItem value="facebook/blenderbot-400M-distill">
                      BlenderBot
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="apiKey">Hugging Face API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="hf_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get your free API key at{" "}
                  <a 
                    href="https://huggingface.co/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-math-primary hover:underline"
                  >
                    huggingface.co
                  </a>
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">
                Connect AI Assistant
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <div>
                <p className="text-sm font-medium">AI Assistant Connected</p>
                <p className="text-xs text-muted-foreground">
                  Model: {readableModel(model)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>

            <div className="p-3 bg-background/20 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground">
                ✨ AI features are now active! Try typing natural language like "find the derivative of x squared"
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
