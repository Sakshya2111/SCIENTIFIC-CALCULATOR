// QuantumCalc Pro - Specialized Modules: Programmer Bitwise, Equation Solvers & Unit Converter

class SolverAndConverter {
    constructor() {
        this.progWordSize = 32; // 8, 16, 32, 64
        this.progValue = 0;
        this.progActiveBase = 'DEC';

        this.unitCategories = {
            length: {
                name: 'Length',
                base: 'meter',
                units: {
                    meter: { name: 'Meters (m)', factor: 1 },
                    kilometer: { name: 'Kilometers (km)', factor: 1000 },
                    centimeter: { name: 'Centimeters (cm)', factor: 0.01 },
                    millimeter: { name: 'Millimeters (mm)', factor: 0.001 },
                    mile: { name: 'Miles (mi)', factor: 1609.344 },
                    yard: { name: 'Yards (yd)', factor: 0.9144 },
                    foot: { name: 'Feet (ft)', factor: 0.3048 },
                    inch: { name: 'Inches (in)', factor: 0.0254 },
                    nautical_mile: { name: 'Nautical Miles', factor: 1852 }
                }
            },
            mass: {
                name: 'Mass & Weight',
                base: 'kilogram',
                units: {
                    kilogram: { name: 'Kilograms (kg)', factor: 1 },
                    gram: { name: 'Grams (g)', factor: 0.001 },
                    milligram: { name: 'Milligrams (mg)', factor: 0.000001 },
                    metric_ton: { name: 'Metric Tons (t)', factor: 1000 },
                    pound: { name: 'Pounds (lb)', factor: 0.45359237 },
                    ounce: { name: 'Ounces (oz)', factor: 0.028349523125 }
                }
            },
            temperature: {
                name: 'Temperature',
                custom: true,
                units: {
                    celsius: { name: 'Celsius (°C)' },
                    fahrenheit: { name: 'Fahrenheit (°F)' },
                    kelvin: { name: 'Kelvin (K)' }
                }
            },
            speed: {
                name: 'Speed',
                base: 'mps',
                units: {
                    mps: { name: 'Meters/sec (m/s)', factor: 1 },
                    kmh: { name: 'Kilometers/hour (km/h)', factor: 1 / 3.6 },
                    mph: { name: 'Miles/hour (mph)', factor: 0.44704 },
                    knot: { name: 'Knots (kn)', factor: 0.514444 }
                }
            },
            data: {
                name: 'Data & Storage',
                base: 'byte',
                units: {
                    byte: { name: 'Bytes (B)', factor: 1 },
                    kilobyte: { name: 'Kilobytes (KB)', factor: 1024 },
                    megabyte: { name: 'Megabytes (MB)', factor: 1024 * 1024 },
                    gigabyte: { name: 'Gigabytes (GB)', factor: 1024 * 1024 * 1024 },
                    terabyte: { name: 'Terabytes (TB)', factor: Math.pow(1024, 4) },
                    bit: { name: 'Bits (b)', factor: 0.125 }
                }
            },
            energy: {
                name: 'Energy',
                base: 'joule',
                units: {
                    joule: { name: 'Joules (J)', factor: 1 },
                    kilojoule: { name: 'Kilojoules (kJ)', factor: 1000 },
                    calorie: { name: 'Calories (cal)', factor: 4.184 },
                    kilocalorie: { name: 'Kilocalories (kcal)', factor: 4184 },
                    watt_hour: { name: 'Watt-hours (Wh)', factor: 3600 },
                    kilowatt_hour: { name: 'Kilowatt-hours (kWh)', factor: 3600000 },
                    electronvolt: { name: 'Electronvolts (eV)', factor: 1.602176634e-19 }
                }
            }
        };
    }

    // --- Programmer Mode Methods ---

    setProgWordSize(size) {
        this.progWordSize = parseInt(size, 10);
        this.clampProgValue();
    }

    getMask() {
        switch (this.progWordSize) {
            case 8: return 0xFFn;
            case 16: return 0xFFFFn;
            case 32: return 0xFFFFFFFFn;
            case 64: return 0xFFFFFFFFFFFFFFFFn;
            default: return 0xFFFFFFFFn;
        }
    }

    clampProgValue() {
        try {
            let bn = BigInt(this.progValue);
            const mask = this.getMask();
            bn = bn & mask;
            this.progValue = bn;
        } catch (e) {
            this.progValue = 0n;
        }
    }

    setProgValueFromBase(valStr, base) {
        try {
            let bn = 0n;
            const cleanStr = valStr.trim();
            if (!cleanStr) {
                this.progValue = 0n;
                return;
            }

            if (base === 'HEX') {
                bn = BigInt('0x' + cleanStr.replace(/[^0-9a-fA-F]/g, ''));
            } else if (base === 'DEC') {
                bn = BigInt(cleanStr.replace(/[^0-9\-]/g, ''));
            } else if (base === 'OCT') {
                bn = BigInt('0o' + cleanStr.replace(/[^0-7]/g, ''));
            } else if (base === 'BIN') {
                bn = BigInt('0b' + cleanStr.replace(/[^01]/g, ''));
            }
            this.progValue = bn;
            this.clampProgValue();
        } catch (e) {
            // Keep previous value if parse fails
        }
    }

    getProgValues() {
        const bn = BigInt(this.progValue);
        const hex = bn.toString(16).toUpperCase();
        const dec = bn.toString(10);
        const oct = bn.toString(8);
        let bin = bn.toString(2);

        // Pad binary to multiples of 4
        while (bin.length % 4 !== 0) {
            bin = '0' + bin;
        }
        // Format with space every 4 bits
        const binFormatted = bin.match(/.{1,4}/g)?.join(' ') || '0000';

        return { hex, dec, oct, bin, binFormatted, rawBigInt: bn };
    }

    toggleBit(bitIndex) {
        try {
            let bn = BigInt(this.progValue);
            const mask = 1n << BigInt(bitIndex);
            bn = bn ^ mask;
            this.progValue = bn;
            this.clampProgValue();
        } catch (e) {}
    }

    executeBitwiseOp(op, operand2) {
        try {
            let a = BigInt(this.progValue);
            let b = BigInt(operand2 || 0);

            switch (op) {
                case 'AND': this.progValue = a & b; break;
                case 'OR': this.progValue = a | b; break;
                case 'XOR': this.progValue = a ^ b; break;
                case 'NOT': this.progValue = ~a; break;
                case 'NAND': this.progValue = ~(a & b); break;
                case 'NOR': this.progValue = ~(a | b); break;
                case 'SHL': this.progValue = a << b; break;
                case 'SHR': this.progValue = a >> b; break;
            }
            this.clampProgValue();
        } catch (e) {}
    }

    // --- Equation Solver ---

    solveQuadratic(a, b, c) {
        a = parseFloat(a);
        b = parseFloat(b);
        c = parseFloat(c);

        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            throw new Error('Please enter valid numeric coefficients.');
        }

        if (a === 0) {
            if (b === 0) {
                return { type: 'degenerate', msg: c === 0 ? 'Infinite solutions (0 = 0)' : 'No solution (contradiction)' };
            }
            const root = -c / b;
            return {
                type: 'linear',
                steps: [`Linear equation: ${b}x + ${c} = 0`, `x = -(${c}) / ${b} = ${root}`],
                roots: [root]
            };
        }

        const discriminant = b * b - 4 * a * c;
        const vertexX = -b / (2 * a);
        const vertexY = a * vertexX * vertexX + b * vertexX + c;

        const steps = [
            `Standard Form: (${a})x² + (${b})x + (${c}) = 0`,
            `Discriminant: Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${discriminant}`,
            `Vertex (h, k) = (${vertexX.toFixed(4)}, ${vertexY.toFixed(4)})`
        ];

        if (discriminant > 0) {
            const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            steps.push(`Two distinct real roots: x = (-b ± √Δ) / (2a)`);
            return {
                type: 'two_real',
                discriminant,
                steps,
                roots: [root1, root2],
                vertex: { x: vertexX, y: vertexY }
            };
        } else if (discriminant === 0) {
            const root = -b / (2 * a);
            steps.push(`One repeated real root (double root): x = -b / (2a) = ${root}`);
            return {
                type: 'one_real',
                discriminant,
                steps,
                roots: [root],
                vertex: { x: vertexX, y: vertexY }
            };
        } else {
            const realPart = -b / (2 * a);
            const imagPart = Math.sqrt(-discriminant) / (2 * a);
            steps.push(`Two complex conjugate roots: x = ${realPart.toFixed(4)} ± ${Math.abs(imagPart).toFixed(4)}i`);
            return {
                type: 'complex',
                discriminant,
                steps,
                complexRoots: [
                    { real: realPart, imag: imagPart },
                    { real: realPart, imag: -imagPart }
                ],
                vertex: { x: vertexX, y: vertexY }
            };
        }
    }

    solveLinearSystem2x2(a1, b1, c1, a2, b2, c2) {
        a1 = parseFloat(a1); b1 = parseFloat(b1); c1 = parseFloat(c1);
        a2 = parseFloat(a2); b2 = parseFloat(b2); c2 = parseFloat(c2);

        // Using Cramer's Rule:
        // D = a1*b2 - a2*b1
        // Dx = c1*b2 - c2*b1
        // Dy = a1*c2 - a2*c1
        const D = a1 * b2 - a2 * b1;
        const Dx = c1 * b2 - c2 * b1;
        const Dy = a1 * c2 - a2 * c1;

        const steps = [
            `System: [${a1}x + ${b1}y = ${c1}] and [${a2}x + ${b2}y = ${c2}]`,
            `Determinant D = (${a1})(${b2}) - (${a2})(${b1}) = ${D}`,
            `Dx = (${c1})(${b2}) - (${c2})(${b1}) = ${Dx}`,
            `Dy = (${a1})(${c2}) - (${a2})(${c1}) = ${Dy}`
        ];

        if (D === 0) {
            if (Dx === 0 && Dy === 0) {
                return { type: 'infinite', steps, msg: 'Infinite solutions (dependent lines coincident)' };
            } else {
                return { type: 'none', steps, msg: 'No solution (parallel inconsistent lines)' };
            }
        }

        const x = Dx / D;
        const y = Dy / D;
        steps.push(`x = Dx / D = ${Dx} / ${D} = ${x}`);
        steps.push(`y = Dy / D = ${Dy} / ${D} = ${y}`);

        return { type: 'unique', x, y, steps, D, Dx, Dy };
    }

    // --- Unit Converter ---

    convertUnits(categoryKey, fromUnit, toUnit, val) {
        val = parseFloat(val);
        if (isNaN(val)) return 0;

        const cat = this.unitCategories[categoryKey];
        if (!cat) return 0;

        // Custom temperature conversion
        if (categoryKey === 'temperature') {
            let inCelsius = val;
            if (fromUnit === 'fahrenheit') inCelsius = (val - 32) * (5 / 9);
            else if (fromUnit === 'kelvin') inCelsius = val - 273.15;

            let result = inCelsius;
            if (toUnit === 'fahrenheit') result = (inCelsius * 9 / 5) + 32;
            else if (toUnit === 'kelvin') result = inCelsius + 273.15;

            return result;
        }

        // Standard factor-based conversion
        const fromFactor = cat.units[fromUnit]?.factor || 1;
        const toFactor = cat.units[toUnit]?.factor || 1;

        const baseVal = val * fromFactor;
        const result = baseVal / toFactor;
        return result;
    }
}

window.solverAndConverter = new SolverAndConverter();
