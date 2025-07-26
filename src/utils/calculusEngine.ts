import * as Algebrite from 'algebrite';
import * as mathsteps from 'mathsteps';

export interface CalculusStep {
  step: string;
  expression: string;
  explanation: string;
  method?: string;
}

export interface CalculusSolution {
  original: string;
  result: string;
  steps: CalculusStep[];
  type: string;
  method?: string;
}

export class CalculusEngine {
  // Initialize Algebrite
  static init() {
    Algebrite.run('');
  }

  // Detect calculus expression type
  static detectCalculusType(expr: string): string {
    if (expr.includes('d/dx') || expr.includes('derivative')) return 'Derivative';
    if (expr.includes('integral') || expr.includes('∫')) return 'Integral';
    if (expr.includes('limit')) return 'Limit';
    if (expr.includes('∂')) return 'Partial Derivative';
    if (expr.match(/\b\w+\(\w+\)\s*=.*d\w+\/d\w+/)) return 'Implicit Differentiation';
    if (expr.includes('x^2') || expr.includes('**2')) return 'Quadratic';
    if (expr.includes('sin') || expr.includes('cos') || expr.includes('tan')) return 'Trigonometric';
    if (expr.includes('log') || expr.includes('ln')) return 'Logarithmic';
    if (expr.includes('=')) return 'Equation';
    return 'Expression';
  }

  // Solve derivatives
  static solveDerivative(expr: string): CalculusSolution {
    try {
      const cleanExpr = expr.replace(/d\/dx\s*\(?(.*?)\)?/, '$1').replace(/derivative\s*\(?(.*?)\)?/, '$1');
      const result = Algebrite.derivative(cleanExpr, 'x').toString();
      
      const steps = this.generateDerivativeSteps(cleanExpr, result);
      
      return {
        original: expr,
        result,
        steps,
        type: 'Derivative',
        method: 'Power Rule / Chain Rule'
      };
    } catch (error) {
      throw new Error('Failed to compute derivative');
    }
  }

  // Solve integrals
  static solveIntegral(expr: string): CalculusSolution {
    try {
      const cleanExpr = expr.replace(/integral\s*\(?(.*?)\)?/, '$1').replace(/∫\s*(.*?)\s*dx/, '$1');
      const result = Algebrite.integral(cleanExpr, 'x').toString();
      
      const steps = this.generateIntegralSteps(cleanExpr, result);
      const method = this.detectIntegrationMethod(cleanExpr);
      
      return {
        original: expr,
        result: result + ' + C',
        steps,
        type: 'Integral',
        method
      };
    } catch (error) {
      throw new Error('Failed to compute integral');
    }
  }

  // Solve implicit differentiation
  static solveImplicitDifferentiation(expr: string): CalculusSolution {
    try {
      // Parse equation like x^2 + y^2 = 25
      const [leftSide, rightSide] = expr.split('=');
      
      // Take derivative of both sides
      const leftDerivative = Algebrite.derivative(leftSide.trim(), 'x').toString();
      const rightDerivative = Algebrite.derivative(rightSide.trim(), 'x').toString();
      
      // Solve for dy/dx
      const equation = `${leftDerivative} = ${rightDerivative}`;
      const result = Algebrite.solve(equation, 'dy/dx').toString();
      
      const steps = this.generateImplicitSteps(expr, leftDerivative, rightDerivative, result);
      
      return {
        original: expr,
        result,
        steps,
        type: 'Implicit Differentiation',
        method: 'Chain Rule'
      };
    } catch (error) {
      throw new Error('Failed to solve implicit differentiation');
    }
  }

  // Generate derivative steps
  static generateDerivativeSteps(expr: string, result: string): CalculusStep[] {
    const steps: CalculusStep[] = [];
    
    steps.push({
      step: '1',
      expression: `d/dx(${expr})`,
      explanation: 'Find the derivative of the given function'
    });

    // Identify the rule being used
    if (expr.includes('^')) {
      steps.push({
        step: '2',
        expression: `Apply power rule: d/dx(x^n) = n·x^(n-1)`,
        explanation: 'Use the power rule for differentiation'
      });
    }

    if (expr.includes('sin') || expr.includes('cos')) {
      steps.push({
        step: '2',
        expression: `Apply trigonometric rules`,
        explanation: 'd/dx(sin(x)) = cos(x), d/dx(cos(x)) = -sin(x)'
      });
    }

    steps.push({
      step: String(steps.length + 1),
      expression: result,
      explanation: 'Final derivative'
    });

    return steps;
  }

  // Generate integral steps
  static generateIntegralSteps(expr: string, result: string): CalculusStep[] {
    const steps: CalculusStep[] = [];
    
    steps.push({
      step: '1',
      expression: `∫ ${expr} dx`,
      explanation: 'Find the indefinite integral'
    });

    // Detect integration method
    if (expr.includes('x^')) {
      steps.push({
        step: '2',
        expression: `Apply power rule: ∫ x^n dx = x^(n+1)/(n+1)`,
        explanation: 'Use the power rule for integration'
      });
    } else if (this.needsSubstitution(expr)) {
      steps.push({
        step: '2',
        expression: `Use substitution method`,
        explanation: 'Let u = inner function, du = derivative dx'
      });
    } else if (this.needsIntegrationByParts(expr)) {
      steps.push({
        step: '2',
        expression: `Use integration by parts: ∫ u dv = uv - ∫ v du`,
        explanation: 'Choose u and dv appropriately'
      });
    }

    steps.push({
      step: String(steps.length + 1),
      expression: result + ' + C',
      explanation: 'Final integral with constant of integration'
    });

    return steps;
  }

  // Generate implicit differentiation steps
  static generateImplicitSteps(original: string, leftDeriv: string, rightDeriv: string, result: string): CalculusStep[] {
    return [
      {
        step: '1',
        expression: original,
        explanation: 'Original equation'
      },
      {
        step: '2',
        expression: `d/dx(${original.split('=')[0]}) = d/dx(${original.split('=')[1]})`,
        explanation: 'Take derivative of both sides with respect to x'
      },
      {
        step: '3',
        expression: `${leftDeriv} = ${rightDeriv}`,
        explanation: 'Apply chain rule to terms involving y'
      },
      {
        step: '4',
        expression: `dy/dx = ${result}`,
        explanation: 'Solve for dy/dx'
      }
    ];
  }

  // Detect integration method needed
  static detectIntegrationMethod(expr: string): string {
    if (this.needsIntegrationByParts(expr)) return 'Integration by Parts';
    if (this.needsSubstitution(expr)) return 'U-Substitution';
    if (expr.includes('sin') || expr.includes('cos')) return 'Trigonometric Integration';
    if (expr.includes('1/(x^2')) return 'Partial Fractions';
    return 'Power Rule';
  }

  // Check if integration by parts is needed
  static needsIntegrationByParts(expr: string): boolean {
    return (expr.includes('x') && (expr.includes('sin') || expr.includes('cos') || expr.includes('e^') || expr.includes('ln')));
  }

  // Check if substitution is needed
  static needsSubstitution(expr: string): boolean {
    return expr.includes('(') && (expr.includes('sin') || expr.includes('cos') || expr.includes('^'));
  }

  // Solve general expressions using symbolic computation
  static solveExpression(expr: string): CalculusSolution {
    try {
      const type = this.detectCalculusType(expr);
      
      // Route to appropriate solver
      if (type === 'Derivative') {
        return this.solveDerivative(expr);
      } else if (type === 'Integral') {
        return this.solveIntegral(expr);
      } else if (type === 'Implicit Differentiation') {
        return this.solveImplicitDifferentiation(expr);
      } else {
        // Use mathsteps for algebraic step-by-step
        try {
          const steps = mathsteps.simplifyExpression(expr);
          const result = Algebrite.run(expr);
          
          return {
            original: expr,
            result: result.toString(),
            steps: steps.map((step: any, index: number) => ({
              step: String(index + 1),
              expression: step.newNode ? step.newNode.toString() : step.toString(),
              explanation: step.changeType || 'Simplification step'
            })),
            type,
            method: 'Algebraic Simplification'
          };
        } catch {
          // Fallback to basic Algebrite evaluation
          const result = Algebrite.run(expr);
          return {
            original: expr,
            result: result.toString(),
            steps: [
              {
                step: '1',
                expression: expr,
                explanation: 'Original expression'
              },
              {
                step: '2',
                expression: result.toString(),
                explanation: 'Evaluated result'
              }
            ],
            type,
            method: 'Direct Evaluation'
          };
        }
      }
    } catch (error) {
      throw new Error(`Failed to solve: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}