import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, History, Lightbulb, Zap, BookOpen, Target, Brain, Dice6 } from "lucide-react";
import { toast } from "sonner";
import { CalculusEngine, type CalculusSolution } from "@/utils/calculusEngine";
import { LLMService } from "@/services/llmService";
import { LLMSettings } from "@/components/LLMSettings";
import { AIChat } from "@/components/AIChat";

export const MathSolver = () => {
  const [expression, setExpression] = useState("");
  const [solution, setSolution] = useState<CalculusSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<CalculusSolution[]>([]);
  const [llmService, setLLMService] = useState<LLMService | null>(null);
  const [isNaturalLanguage, setIsNaturalLanguage] = useState(false);

  useEffect(() => {
    // Initialize the calculus engine
    CalculusEngine.init();
    
    // Check if LLM config exists
    const apiKey = localStorage.getItem('llm-api-key');
    const model = localStorage.getItem('llm-model');
    if (apiKey && model) {
      setLLMService(new LLMService({ apiKey, model: model as any }));
    }
  }, []);

  const solveExpression = async () => {
    if (!expression.trim()) {
      toast.error("Please enter a mathematical expression");
      return;
    }

    setIsLoading(true);
    let finalExpression = expression;
    
    try {
      // Check if this looks like natural language and we have LLM service
      if (llmService && isNaturalLanguageInput(expression)) {
        setIsNaturalLanguage(true);
        toast.info("Converting natural language to math expression...");
        finalExpression = await llmService.parseNaturalLanguage(expression);
        toast.success("Converted to: " + finalExpression);
      }

      // Use advanced calculus engine
      const newSolution = CalculusEngine.solveExpression(finalExpression);

      setSolution(newSolution);
      setHistory(prev => [newSolution, ...prev.slice(0, 9)]); // Keep last 10
      toast.success("Solution found!");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid mathematical expression");
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsNaturalLanguage(false);
    }
  };

  const isNaturalLanguageInput = (input: string): boolean => {
    const mathSymbols = /[+\-*/^()=∫∂]/;
    const mathFunctions = /\b(sin|cos|tan|log|ln|exp|sqrt|integral|derivative|d\/dx)\b/i;
    const naturalLanguageWords = /\b(find|solve|what|is|the|of|derivative|integral|integrate|differentiate)\b/i;
    
    return naturalLanguageWords.test(input) && (!mathSymbols.test(input) || naturalLanguageWords.test(input));
  };

  const handleLLMConfig = (config: { apiKey: string; model: string } | null) => {
    if (config) {
      setLLMService(new LLMService({ 
        apiKey: config.apiKey, 
        model: config.model as 'meta-llama/Llama-3.2-90B-Vision-Instruct' | 'microsoft/DialoGPT-medium'
      }));
    } else {
      setLLMService(null);
    }
  };

  const generatePracticeProblem = async () => {
    if (!llmService) {
      toast.error("Connect AI assistant to generate problems");
      return;
    }

    setIsLoading(true);
    try {
      const problem = await llmService.generateProblem("calculus", "intermediate");
      setExpression(problem.problem);
      toast.success("Practice problem generated!");
    } catch (error) {
      toast.error("Failed to generate problem");
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      solveExpression();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="w-8 h-8 text-math-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Advanced Math Solver
            </h1>
          </div>
            <p className="text-muted-foreground text-lg">
              Advanced calculus solver with derivatives, integrals, and step-by-step solutions
            </p>
        </div>

        {/* Input Section */}
        <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={llmService ? "Enter math expression or natural language (e.g., 'find the derivative of x cubed')" : "Enter calculus expression (e.g., d/dx(x^3), integral(x^2), x^2 + y^2 = 25)"}
                className="text-lg bg-background/50 border-border/50 focus:border-math-primary transition-all duration-300"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={solveExpression}
                  disabled={isLoading}
                  className="bg-math-primary hover:bg-math-primary/90 text-primary-foreground px-6 transition-all duration-300 hover:shadow-math"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : isNaturalLanguage ? (
                    <Brain className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {isNaturalLanguage ? 'Converting...' : 'Solve'}
                </Button>
                
                {llmService && (
                  <Button
                    variant="outline"
                    onClick={generatePracticeProblem}
                    disabled={isLoading}
                    className="border-math-primary/50 hover:bg-math-primary/10"
                  >
                    <Dice6 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Calculus Examples:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  "d/dx(x^3 + 2x^2 - 5x + 1)",
                  "integral(x^2 + 3x)",
                  "d/dx(sin(x^2))",
                  "integral(x*e^x)"
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setExpression(example)}
                    className="text-xs border-border/50 hover:border-math-primary/50 hover:bg-math-primary/10"
                  >
                    {example}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Target className="w-4 h-4" />
                <span>Advanced Examples:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  "x^2 + y^2 = 25",
                  "integral(x*sin(x))",
                  "d/dx(ln(x^2 + 1))",
                  "integral(1/(x^2 + 1))"
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setExpression(example)}
                    className="text-xs border-border/50 hover:border-math-primary/50 hover:bg-math-primary/10"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="solver" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solver">Solver</TabsTrigger>
            <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="solver" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Solution Display */}
          <div className="lg:col-span-2">
            {solution && (
              <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm animate-math-reveal">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-math-secondary" />
                      Solution
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="border-math-primary text-math-primary">
                        {solution.type}
                      </Badge>
                      {solution.method && (
                        <Badge variant="outline" className="border-math-secondary text-math-secondary">
                          {solution.method}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-background/30 rounded-lg border border-border/30">
                      <p className="text-sm text-muted-foreground mb-1">Original Expression:</p>
                      <p className="text-lg font-mono">{solution.original}</p>
                    </div>
                    
                    <div className="p-4 bg-math-primary/10 rounded-lg border border-math-primary/30">
                      <p className="text-sm text-muted-foreground mb-1">Result:</p>
                      <p className="text-2xl font-bold text-math-primary font-mono">{solution.result}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Step-by-Step Solution:</h4>
                    {solution.steps.map((step, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-background/20 rounded-lg border border-border/30 transition-all duration-300 hover:bg-background/30"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <div className="flex gap-3">
                          <Badge variant="outline" className="border-math-secondary text-math-secondary">
                            Step {step.step}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-mono text-lg mb-1">{step.expression}</p>
                            <p className="text-sm text-muted-foreground">{step.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
            
            {!solution && (
              <Card className="p-12 bg-gradient-card border-border/50 backdrop-blur-sm text-center">
                <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Solve</h3>
                <p className="text-muted-foreground">
                  Enter a mathematical expression above and click solve to see step-by-step solutions
                </p>
              </Card>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gradient-card border-border/50 backdrop-blur-sm h-fit">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-math-secondary" />
                <h3 className="font-semibold">Recent Solutions</h3>
              </div>
              
              <ScrollArea className="h-96">
                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-background/20 rounded-lg border border-border/30 cursor-pointer transition-all duration-300 hover:bg-background/30 hover:border-math-primary/30"
                        onClick={() => setExpression(item.original)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" size="sm" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono truncate mb-1">{item.original}</p>
                        <p className="text-xs text-math-primary font-semibold">= {item.result}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No solutions yet</p>
                  </div>
                )}
              </ScrollArea>
            </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ai-chat">
          <AIChat 
            llmService={llmService}
            currentExpression={expression}
            currentSolution={solution?.result}
          />
        </TabsContent>
        
        <TabsContent value="settings">
          <LLMSettings onConfigChange={handleLLMConfig} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};