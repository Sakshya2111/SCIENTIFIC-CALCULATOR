// QuantumCalc Pro - Core Mathematical Engine
// Robust tokenizer, parser, evaluator, calculus & constants system

class MathEngine {
    constructor() {
        this.angleMode = 'DEG'; // 'DEG' or 'RAD'
        this.memory = 0;
        this.lastAnswer = 0;

        this.constants = {
            'π': Math.PI,
            'pi': Math.PI,
            'PI': Math.PI,
            'e': Math.E,
            'E': Math.E,
            'φ': (1 + Math.sqrt(5)) / 2, // Golden Ratio
            'phi': (1 + Math.sqrt(5)) / 2,
            'c': 299792458, // Speed of light (m/s)
            'G': 6.67430e-11, // Gravitational constant (N·m²/kg²)
            'h': 6.62607015e-34, // Planck constant (J·s)
            'k_B': 1.380649e-23, // Boltzmann constant (J/K)
            'N_A': 6.02214076e23 // Avogadro constant (mol⁻¹)
        };
    }

    setAngleMode(mode) {
        if (mode === 'DEG' || mode === 'RAD') {
            this.angleMode = mode;
        }
    }

    toRadians(val) {
        return this.angleMode === 'DEG' ? (val * Math.PI) / 180 : val;
    }

    fromRadians(val) {
        return this.angleMode === 'DEG' ? (val * 180) / Math.PI : val;
    }

    // Memory operations
    memoryClear() { this.memory = 0; }
    memoryRecall() { return this.memory; }
    memoryAdd(val) { this.memory += Number(val) || 0; }
    memorySubtract(val) { this.memory -= Number(val) || 0; }
    memoryStore(val) { this.memory = Number(val) || 0; }

    // Factorial & Combinatorics
    factorial(n) {
        if (n < 0) throw new Error('Factorial of negative number undefined');
        if (Math.floor(n) !== n) {
            // Lanczos approximation for Gamma function
            return this.gammaLanczos(n + 1);
        }
        if (n > 170) return Infinity;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    gammaLanczos(z) {
        const p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.138571095831109, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gammaLanczos(1 - z));
        z -= 1;
        let x = p[0];
        for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
        const t = z + p.length - 1.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
    }

    nPr(n, r) {
        if (n < 0 || r < 0 || r > n) return 0;
        return this.factorial(n) / this.factorial(n - r);
    }

    nCr(n, r) {
        if (n < 0 || r < 0 || r > n) return 0;
        return this.factorial(n) / (this.factorial(r) * this.factorial(n - r));
    }

    gcd(a, b) {
        a = Math.abs(Math.round(a));
        b = Math.abs(Math.round(b));
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    lcm(a, b) {
        if (a === 0 || b === 0) return 0;
        return Math.abs(Math.round(a * b)) / this.gcd(a, b);
    }

    // Numerical Derivative: f'(x) approx
    derivative(exprStr, xVal, h = 1e-6) {
        const f_plus = this.evaluateForVariable(exprStr, 'x', xVal + h);
        const f_minus = this.evaluateForVariable(exprStr, 'x', xVal - h);
        return (f_plus - f_minus) / (2 * h);
    }

    // Numerical Definite Integration using Simpson's Rule
    integral(exprStr, a, b, n = 100) {
        if (n % 2 !== 0) n++; // Must be even
        const h = (b - a) / n;
        let sum = this.evaluateForVariable(exprStr, 'x', a) + this.evaluateForVariable(exprStr, 'x', b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;
            const fx = this.evaluateForVariable(exprStr, 'x', x);
            sum += (i % 2 === 0 ? 2 : 4) * fx;
        }
        return (h / 3) * sum;
    }

    // Preprocessing Expression: fix symbols and implicit multiplication
    preprocess(expr) {
        if (!expr) return '0';
        let str = expr.toString().trim();

        // Replace display symbols with standard symbols
        str = str
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/–/g, '-')
            .replace(/\u00B2/g, '^2') // ²
            .replace(/\u00B3/g, '^3') // ³
            .replace(/√\s*\(([^)]+)\)/g, 'sqrt($1)')
            .replace(/√(\d+(\.\d+)?)/g, 'sqrt($1)')
            .replace(/Ans/gi, `(${this.lastAnswer})`)
            .replace(/π/g, 'pi')
            .replace(/φ/g, 'phi');

        // Insert implicit multiplication:
        // 1. Number followed by parenthesis: 2(3) -> 2*(3)
        str = str.replace(/(\d+(\.\d+)?)\s*\(/g, '$1*(');
        // 2. Closing paren followed by opening paren: )( -> )*(
        str = str.replace(/\)\s*\(/g, ')*(');
        // 3. Closing paren followed by number/constant/variable: )2 -> )*2 or )x -> )*x
        str = str.replace(/\)\s*([0-9a-zA-Zπφ])/g, ')*$1');
        // 4. Number followed by variable or function: 2x -> 2*x, 2sin -> 2*sin, 2pi -> 2*pi
        str = str.replace(/(\d+(\.\d+)?)\s*([a-zA-Zπφ])/g, (match, p1, p2, p3) => {
            // If it's something like 1e5 (scientific notation), don't insert *
            if ((p3 === 'e' || p3 === 'E') && match.match(/^\d+[eE]/)) {
                return match;
            }
            return `${p1}*${p3}`;
        });

        // 5. Postfix percentage: 50% -> (50/100), 50%*2 -> (50/100)*2
        str = str.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

        return str;
    }

    // Tokenizer
    tokenize(expr) {
        const preprocessed = this.preprocess(expr);
        const tokens = [];
        let i = 0;
        const len = preprocessed.length;

        while (i < len) {
            const char = preprocessed[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            // Numbers (including scientific notation like 1.23e-4)
            if (/[0-9.]/.test(char)) {
                let numStr = '';
                while (i < len && /[0-9.]/.test(preprocessed[i])) {
                    numStr += preprocessed[i];
                    i++;
                }
                // Check for scientific notation (e.g., 2.5e+3 or 1e-4)
                if (i < len && (preprocessed[i] === 'e' || preprocessed[i] === 'E') &&
                    i + 1 < len && /[0-9+\-]/.test(preprocessed[i + 1])) {
                    numStr += preprocessed[i++];
                    if (preprocessed[i] === '+' || preprocessed[i] === '-') {
                        numStr += preprocessed[i++];
                    }
                    while (i < len && /[0-9]/.test(preprocessed[i])) {
                        numStr += preprocessed[i++];
                    }
                }
                tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
                continue;
            }

            // Identifiers: Functions, Constants, Variables
            if (/[a-zA-Z_]/.test(char)) {
                let idStr = '';
                while (i < len && /[a-zA-Z0-9_]/.test(preprocessed[i])) {
                    idStr += preprocessed[i];
                    i++;
                }
                const lowerId = idStr.toLowerCase();

                if (this.constants.hasOwnProperty(idStr) || this.constants.hasOwnProperty(lowerId)) {
                    const constVal = this.constants[idStr] !== undefined ? this.constants[idStr] : this.constants[lowerId];
                    tokens.push({ type: 'NUMBER', value: constVal });
                } else {
                    tokens.push({ type: 'IDENTIFIER', value: lowerId });
                }
                continue;
            }

            // Factorial operator !
            if (char === '!') {
                tokens.push({ type: 'POSTFIX', value: '!' });
                i++;
                continue;
            }

            // Operators & Parentheses
            if ('+-*/^,()'.includes(char)) {
                // Check if '-' or '+' is unary
                if (char === '-' || char === '+') {
                    const prevToken = tokens[tokens.length - 1];
                    const isUnary = !prevToken || 
                                    prevToken.type === 'OPERATOR' || 
                                    prevToken.type === 'COMMA' ||
                                    (prevToken.type === 'PAREN' && prevToken.value === '(');
                    if (isUnary) {
                        tokens.push({ type: 'UNARY_OPERATOR', value: char === '-' ? 'neg' : 'pos' });
                        i++;
                        continue;
                    }
                }

                if (char === '(' || char === ')') {
                    tokens.push({ type: 'PAREN', value: char });
                } else if (char === ',') {
                    tokens.push({ type: 'COMMA', value: ',' });
                } else {
                    tokens.push({ type: 'OPERATOR', value: char });
                }
                i++;
                continue;
            }

            // Unknown character
            throw new Error(`Unexpected character '${char}' at index ${i}`);
        }

        return tokens;
    }

    // Shunting-Yard Algorithm to convert Infix Tokens to RPN (Reverse Polish Notation)
    toRPN(tokens) {
        const outQueue = [];
        const opStack = [];

        const precedence = {
            'neg': 4,
            'pos': 4,
            '^': 3,
            '*': 2,
            '/': 2,
            '+': 1,
            '-': 1
        };

        const rightAssociative = {
            '^': true,
            'neg': true,
            'pos': true
        };

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'NUMBER') {
                outQueue.push(token);
            } else if (token.type === 'IDENTIFIER') {
                // Check if next token is '(', meaning it's a function call
                opStack.push({ type: 'FUNCTION', value: token.value, argCount: 1 });
            } else if (token.type === 'POSTFIX') {
                outQueue.push(token);
            } else if (token.type === 'COMMA') {
                while (opStack.length && opStack[opStack.length - 1].value !== '(') {
                    outQueue.push(opStack.pop());
                }
                if (opStack.length === 0) {
                    throw new Error('Misplaced comma in expression');
                }
                // Increment argument count on the parent function
                for (let k = opStack.length - 1; k >= 0; k--) {
                    if (opStack[k].type === 'FUNCTION') {
                        opStack[k].argCount++;
                        break;
                    }
                }
            } else if (token.type === 'OPERATOR' || token.type === 'UNARY_OPERATOR') {
                const op1 = token.value;
                while (opStack.length) {
                    const top = opStack[opStack.length - 1];
                    if (top.type === 'OPERATOR' || top.type === 'UNARY_OPERATOR') {
                        const op2 = top.value;
                        const p1 = precedence[op1] || 0;
                        const p2 = precedence[op2] || 0;
                        if ((!rightAssociative[op1] && p1 <= p2) || (rightAssociative[op1] && p1 < p2)) {
                            outQueue.push(opStack.pop());
                            continue;
                        }
                    }
                    break;
                }
                opStack.push(token);
            } else if (token.type === 'PAREN' && token.value === '(') {
                opStack.push(token);
            } else if (token.type === 'PAREN' && token.value === ')') {
                while (opStack.length && opStack[opStack.length - 1].value !== '(') {
                    outQueue.push(opStack.pop());
                }
                if (opStack.length === 0) {
                    throw new Error('Mismatched parentheses (extra closing parenthesis)');
                }
                opStack.pop(); // Pop '('

                // If function on top of stack, pop to output
                if (opStack.length && opStack[opStack.length - 1].type === 'FUNCTION') {
                    outQueue.push(opStack.pop());
                }
            }
        }

        while (opStack.length) {
            const top = opStack.pop();
            if (top.type === 'PAREN') {
                throw new Error('Mismatched parentheses (unclosed open parenthesis)');
            }
            outQueue.push(top);
        }

        return outQueue;
    }

    // Evaluate RPN Queue
    evaluateRPN(rpnQueue, variableContext = {}) {
        const stack = [];

        for (let i = 0; i < rpnQueue.length; i++) {
            const token = rpnQueue[i];

            if (token.type === 'NUMBER') {
                stack.push(token.value);
            } else if (token.type === 'POSTFIX' && token.value === '!') {
                if (stack.length < 1) throw new Error('Invalid factorial operand');
                const val = stack.pop();
                stack.push(this.factorial(val));
            } else if (token.type === 'UNARY_OPERATOR') {
                if (stack.length < 1) throw new Error('Missing operand for unary operator');
                const val = stack.pop();
                stack.push(token.value === 'neg' ? -val : val);
            } else if (token.type === 'OPERATOR') {
                if (stack.length < 2) throw new Error(`Missing operands for operator '${token.value}'`);
                const b = stack.pop();
                const a = stack.pop();
                let res = 0;

                switch (token.value) {
                    case '+': res = a + b; break;
                    case '-': res = a - b; break;
                    case '*': res = a * b; break;
                    case '/': 
                        if (b === 0) throw new Error('Division by zero');
                        res = a / b; 
                        break;
                    case '^': res = Math.pow(a, b); break;
                    default: throw new Error(`Unknown operator '${token.value}'`);
                }
                stack.push(res);
            } else if (token.type === 'FUNCTION') {
                const funcName = token.value;
                const argCount = token.argCount || 1;

                if (stack.length < argCount) {
                    throw new Error(`Not enough arguments for function '${funcName}'`);
                }

                const args = [];
                for (let a = 0; a < argCount; a++) {
                    args.unshift(stack.pop());
                }

                const result = this.executeFunction(funcName, args, variableContext);
                stack.push(result);
            }
        }

        if (stack.length !== 1) {
            throw new Error('Invalid expression structure');
        }

        const finalResult = stack[0];
        // Clean floating point errors (e.g. 0.1 + 0.2 = 0.30000000000000004)
        return this.cleanFloat(finalResult);
    }

    cleanFloat(num) {
        if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return num;
        // Fix extreme precision issues close to zero (e.g., sin(180 deg) = 1.22e-16 -> 0)
        if (Math.abs(num) < 1e-14) return 0;
        // Round to 12 decimal places if very close to integer
        const rounded = Math.round(num * 1e12) / 1e12;
        return rounded;
    }

    // Function dispatcher
    executeFunction(name, args, variableContext = {}) {
        const x = args[0];
        const y = args[1];

        switch (name) {
            // Trigonometry
            case 'sin': return Math.sin(this.toRadians(x));
            case 'cos': return Math.cos(this.toRadians(x));
            case 'tan': {
                const rad = this.toRadians(x);
                if (Math.abs(Math.cos(rad)) < 1e-15) throw new Error('Tangent undefined (asymptote)');
                return Math.tan(rad);
            }
            case 'asin': 
                if (x < -1 || x > 1) throw new Error('asin argument must be in [-1, 1]');
                return this.fromRadians(Math.asin(x));
            case 'acos': 
                if (x < -1 || x > 1) throw new Error('acos argument must be in [-1, 1]');
                return this.fromRadians(Math.acos(x));
            case 'atan': return this.fromRadians(Math.atan(x));
            case 'atan2': return this.fromRadians(Math.atan2(x, y));

            // Hyperbolic
            case 'sinh': return Math.sinh(x);
            case 'cosh': return Math.cosh(x);
            case 'tanh': return Math.tanh(x);
            case 'asinh': return Math.asinh(x);
            case 'acosh': 
                if (x < 1) throw new Error('acosh requires x >= 1');
                return Math.acosh(x);
            case 'atanh': 
                if (x <= -1 || x >= 1) throw new Error('atanh requires -1 < x < 1');
                return Math.atanh(x);

            // Logarithms & Powers
            case 'ln': 
                if (x <= 0) throw new Error('ln requires x > 0');
                return Math.log(x);
            case 'log': 
            case 'log10': 
                if (x <= 0) throw new Error('log10 requires x > 0');
                return Math.log10(x);
            case 'log2': 
                if (x <= 0) throw new Error('log2 requires x > 0');
                return Math.log2(x);
            case 'exp': return Math.exp(x);
            case 'sqrt': 
                if (x < 0) throw new Error('sqrt of negative number requires complex mode');
                return Math.sqrt(x);
            case 'cbrt': return Math.cbrt(x);
            case 'root': 
                if (y === undefined) throw new Error('root requires 2 arguments: root(val, degree)');
                return Math.pow(x, 1 / y);
            case 'pow': return Math.pow(x, y);
            case 'sqr': return x * x;
            case 'cube': return x * x * x;
            case 'inv': 
                if (x === 0) throw new Error('Division by zero (1/x)');
                return 1 / x;

            // Stats & Combinatorics
            case 'fact':
            case 'factorial': return this.factorial(x);
            case 'npr': return this.nPr(x, y);
            case 'ncr': return this.nCr(x, y);
            case 'gcd': return this.gcd(x, y);
            case 'lcm': return this.lcm(x, y);
            case 'mod': return x % y;

            // Math Utilities
            case 'abs': return Math.abs(x);
            case 'floor': return Math.floor(x);
            case 'ceil': return Math.ceil(x);
            case 'round': return Math.round(x);
            case 'rand': return Math.random();
            case 'sign': return Math.sign(x);

            // Variable lookup for Grapher & Calculus
            default:
                if (variableContext.hasOwnProperty(name)) {
                    return variableContext[name];
                }
                throw new Error(`Unknown function or variable '${name}'`);
        }
    }

    // Main Evaluate Method
    evaluate(expressionStr) {
        if (!expressionStr || expressionStr.trim() === '') return 0;
        const tokens = this.tokenize(expressionStr);
        const rpn = this.toRPN(tokens);
        const result = this.evaluateRPN(rpn);
        this.lastAnswer = result;
        return result;
    }

    // Evaluate expression containing a variable (e.g., for Graphing f(x) or Calculus)
    evaluateForVariable(exprStr, varName = 'x', varVal = 0) {
        const replaced = exprStr.replace(new RegExp(`\\b${varName}\\b`, 'gi'), `(${varVal})`);
        return this.evaluate(replaced);
    }

    // Format number for display (handles standard, scientific notation, precision)
    formatResult(num, precision = 10) {
        if (num === null || num === undefined || isNaN(num)) return 'Error';
        if (!isFinite(num)) return num > 0 ? 'Infinity' : '-Infinity';

        if (num === 0) return '0';

        const absNum = Math.abs(num);
        if (absNum >= 1e14 || (absNum < 1e-6 && absNum > 0)) {
            return num.toExponential(precision - 4).replace(/e\+?/, 'e');
        }

        const str = num.toLocaleString('en-US', {
            maximumFractionDigits: precision,
            useGrouping: false
        });

        return str;
    }

    // HTML Syntax Highlighter for interactive expression view
    highlightExpression(expr) {
        if (!expr) return '';
        let escaped = expr
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Highlight functions
        escaped = escaped.replace(/\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|ln|log|log10|log2|exp|sqrt|cbrt|root|pow|sqr|cube|inv|abs|floor|ceil|round|rand|fact|npr|ncr|gcd|lcm|mod)\b/gi, 
            '<span class="tok-func">$1</span>');

        // Highlight constants
        escaped = escaped.replace(/\b(pi|phi|Ans|PI|E)\b|π|φ/g, 
            '<span class="tok-const">$&</span>');

        // Highlight operators
        escaped = escaped.replace(/([\+\-\*\/\^\!\×\÷\−\–])/g, 
            '<span class="tok-op">$1</span>');

        // Highlight parentheses
        escaped = escaped.replace(/([\(\)])/g, 
            '<span class="tok-paren">$1</span>');

        // Highlight numbers
        escaped = escaped.replace(/\b(\d+(\.\d+)?(e[\+\-]?\d+)?)\b/gi, 
            '<span class="tok-num">$1</span>');

        return escaped;
    }
}

window.mathEngine = new MathEngine();
