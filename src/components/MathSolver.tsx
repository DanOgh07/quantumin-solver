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
    CalculusEngine.init();
    const apiKey = localStorage.getItem("llm-api-key");
    const model = localStorage.getItem("llm-model");
    if (apiKey && model) {
      setLLMService(new LLMService({ apiKey, model: model as "meta-llama/Meta-Llama-3.2-8B-Instruct" }));
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
      if (llmService && isNaturalLanguageInput(expression)) {
        setIsNaturalLanguage(true);
        toast.info("Converting natural language to math expression...");
        finalExpression = await llmService.parseNaturalLanguage(expression);
        toast.success("Converted to: " + finalExpression);
      }

      const newSolution = CalculusEngine.solveExpression(finalExpression);
      setSolution(newSolution);
      setHistory((prev) => [newSolution, ...prev.slice(0, 9)]);
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
    const naturalLanguageWords = /\b(find|solve|what|is|the|of|derivative|integral|integrate|differentiate)\b/i;
    return naturalLanguageWords.test(input) && !mathSymbols.test(input);
  };

  const handleLLMConfig = (config: { apiKey: string; model: string } | null) => {
    if (config) {
      setLLMService(
        new LLMService({
          apiKey: config.apiKey,
          model: "meta-llama/Meta-Llama-3.2-8B-Instruct"
        })
      );
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
                placeholder={
                  llmService
                    ? "Enter math expression or natural language (e.g., 'find the derivative of x cubed')"
                    : "Enter calculus expression (e.g., d/dx(x^3), integral(x^2), x^2 + y^2 = 25)"
                }
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
                  {isNaturalLanguage ? "Converting..." : "Solve"}
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
            {/* Examples omitted here for brevity — they remain unchanged */}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="solver" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solver">Solver</TabsTrigger>
            <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
            <TabsTrigger value="settings">AI Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="solver" className="space-y-6">
            {/* Solver content remains unchanged */}
            {/* Solution + History panels — unchanged */}
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChat llmService={llmService} currentExpression={expression} currentSolution={solution?.result} />
          </TabsContent>

          <TabsContent value="settings">
            <LLMSettings onConfigChange={handleLLMConfig} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
