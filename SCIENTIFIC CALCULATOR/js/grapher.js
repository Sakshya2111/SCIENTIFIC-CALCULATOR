// QuantumCalc Pro - Interactive 2D Function Grapher Engine
// High-performance canvas renderer with smooth pan, zoom, gridlines, crosshair, and multi-function plotting

class FunctionGrapher {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');

        // View bounds
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -6;
        this.yMax = 6;

        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoverX = null;
        this.hoverY = null;

        // Expressions to plot
        this.functions = [
            { id: 'f1', expr: 'sin(x)', color: '#00f0ff', label: 'f(x)', active: true },
            { id: 'f2', expr: 'cos(x)', color: '#ff007f', label: 'g(x)', active: false }
        ];

        this.initCanvas();
        this.attachEvents();
        this.draw();
    }

    initCanvas() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        const width = rect.width || 600;
        const height = rect.height || 400;

        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);

        this.cssWidth = width;
        this.cssHeight = height;
    }

    resize() {
        this.initCanvas();
        this.draw();
    }

    attachEvents() {
        if (!this.canvas) return;

        // Mouse Pan
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                if (this.canvas) this.canvas.style.cursor = 'crosshair';
            }
        });

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;

                const xSpan = this.xMax - this.xMin;
                const ySpan = this.yMax - this.yMin;

                const xChange = (dx / this.cssWidth) * xSpan;
                const yChange = (dy / this.cssHeight) * ySpan;

                this.xMin -= xChange;
                this.xMax -= xChange;
                this.yMin += yChange;
                this.yMax += yChange;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.draw();
            } else if (mouseX >= 0 && mouseX <= this.cssWidth && mouseY >= 0 && mouseY <= this.cssHeight) {
                this.hoverX = this.toMathX(mouseX);
                this.hoverY = this.toMathY(mouseY);
                this.draw();
            } else {
                if (this.hoverX !== null) {
                    this.hoverX = null;
                    this.hoverY = null;
                    this.draw();
                }
            }
        });

        // Mouse Wheel Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const mathMouseX = this.toMathX(mouseX);
            const mathMouseY = this.toMathY(mouseY);

            const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18;

            const xSpan = (this.xMax - this.xMin) * zoomFactor;
            const ySpan = (this.yMax - this.yMin) * zoomFactor;

            const xRatio = mouseX / this.cssWidth;
            const yRatio = mouseY / this.cssHeight;

            this.xMin = mathMouseX - xSpan * xRatio;
            this.xMax = mathMouseX + xSpan * (1 - xRatio);
            this.yMin = mathMouseY - ySpan * (1 - yRatio);
            this.yMax = mathMouseY + ySpan * yRatio;

            this.draw();
        }, { passive: false });
    }

    // Coordinates conversion
    toScreenX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.cssWidth;
    }

    toScreenY(y) {
        return (1 - (y - this.yMin) / (this.yMax - this.yMin)) * this.cssHeight;
    }

    toMathX(screenX) {
        return this.xMin + (screenX / this.cssWidth) * (this.xMax - this.xMin);
    }

    toMathY(screenY) {
        return this.yMin + (1 - screenY / this.cssHeight) * (this.yMax - this.yMin);
    }

    setFunction(id, exprStr, active = true) {
        const fn = this.functions.find(f => f.id === id);
        if (fn) {
            fn.expr = exprStr;
            fn.active = active;
        } else {
            this.functions.push({ id, expr: exprStr, color: '#7928ca', label: id, active });
        }
        this.draw();
    }

    resetView() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -6;
        this.yMax = 6;
        this.draw();
    }

    zoom(delta) {
        const factor = delta > 0 ? 0.75 : 1.33;
        const xCenter = (this.xMin + this.xMax) / 2;
        const yCenter = (this.yMin + this.yMax) / 2;
        const xHalfSpan = ((this.xMax - this.xMin) * factor) / 2;
        const yHalfSpan = ((this.yMax - this.yMin) * factor) / 2;

        this.xMin = xCenter - xHalfSpan;
        this.xMax = xCenter + xHalfSpan;
        this.yMin = yCenter - yHalfSpan;
        this.yMax = yCenter + yHalfSpan;

        this.draw();
    }

    getGridStep(span) {
        const targetSteps = 8;
        const rawStep = span / targetSteps;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const norm = rawStep / mag;

        let step;
        if (norm < 1.5) step = 1 * mag;
        else if (norm < 3.5) step = 2 * mag;
        else if (norm < 7.5) step = 5 * mag;
        else step = 10 * mag;

        return step;
    }

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.cssWidth;
        const h = this.cssHeight;

        // Clear background
        ctx.clearRect(0, 0, w, h);

        // Draw background grid
        const xSpan = this.xMax - this.xMin;
        const ySpan = this.yMax - this.yMin;

        const xStep = this.getGridStep(xSpan);
        const yStep = this.getGridStep(ySpan);

        ctx.lineWidth = 1;

        // Minor grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        const firstX = Math.floor(this.xMin / xStep) * xStep;
        for (let x = firstX; x <= this.xMax; x += xStep / 2) {
            const sx = this.toScreenX(x);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
        }
        const firstY = Math.floor(this.yMin / yStep) * yStep;
        for (let y = firstY; y <= this.yMax; y += yStep / 2) {
            const sy = this.toScreenY(y);
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
        }
        ctx.stroke();

        // Major grid lines & labels
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const originX = this.toScreenX(0);
        const originY = this.toScreenY(0);

        ctx.beginPath();
        for (let x = firstX; x <= this.xMax; x += xStep) {
            if (Math.abs(x) < 1e-10) continue;
            const sx = this.toScreenX(x);
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);

            // Label x
            const labelY = Math.max(10, Math.min(h - 20, originY + 6));
            ctx.fillText(this.formatGridNum(x), sx, labelY);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = firstY; y <= this.yMax; y += yStep) {
            if (Math.abs(y) < 1e-10) continue;
            const sy = this.toScreenY(y);
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);

            // Label y
            const labelX = Math.max(30, Math.min(w - 10, originX - 8));
            ctx.fillText(this.formatGridNum(y), labelX, sy);
        }
        ctx.stroke();

        // Main Axes (X and Y axis) with glow
        ctx.save();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;

        ctx.beginPath();
        // X Axis
        if (originY >= 0 && originY <= h) {
            ctx.moveTo(0, originY);
            ctx.lineTo(w, originY);
        }
        // Y Axis
        if (originX >= 0 && originX <= w) {
            ctx.moveTo(originX, 0);
            ctx.lineTo(originX, h);
        }
        ctx.stroke();
        ctx.restore();

        // Plot each active function
        this.functions.forEach((fn) => {
            if (!fn.active || !fn.expr.trim()) return;
            this.plotCurve(fn.expr, fn.color);
        });

        // Hover Crosshair & Tooltip
        if (this.hoverX !== null) {
            this.drawInspectionCursor();
        }
    }

    plotCurve(exprStr, color) {
        const ctx = this.ctx;
        const w = this.cssWidth;
        const numSamples = Math.min(w * 1.5, 1200);
        const dx = (this.xMax - this.xMin) / numSamples;

        ctx.save();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        let isDrawing = false;
        let prevY = null;

        for (let i = 0; i <= numSamples; i++) {
            const mathX = this.xMin + i * dx;
            try {
                // Ensure RAD mode is used for graphing standard equations
                const oldMode = window.mathEngine.angleMode;
                window.mathEngine.setAngleMode('RAD');
                const mathY = window.mathEngine.evaluateForVariable(exprStr, 'x', mathX);
                window.mathEngine.setAngleMode(oldMode);

                if (typeof mathY === 'number' && !isNaN(mathY) && isFinite(mathY)) {
                    const screenX = this.toScreenX(mathX);
                    const screenY = this.toScreenY(mathY);

                    // Check for extreme jumps (asymptotes like tan(x) or 1/x)
                    if (prevY !== null && Math.abs(screenY - prevY) > this.cssHeight * 0.8) {
                        isDrawing = false;
                    }

                    if (!isDrawing) {
                        ctx.moveTo(screenX, screenY);
                        isDrawing = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                    prevY = screenY;
                } else {
                    isDrawing = false;
                    prevY = null;
                }
            } catch (err) {
                isDrawing = false;
                prevY = null;
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    drawInspectionCursor() {
        const ctx = this.ctx;
        const screenX = this.toScreenX(this.hoverX);
        const screenY = this.toScreenY(this.hoverY);

        // Dashed lines
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, this.cssHeight);
        ctx.moveTo(0, screenY);
        ctx.lineTo(this.cssWidth, screenY);
        ctx.stroke();
        ctx.restore();

        // Calculate values for active functions at this X
        let tooltips = [`x: ${this.hoverX.toFixed(3)}`];

        this.functions.forEach(fn => {
            if (!fn.active || !fn.expr.trim()) return;
            try {
                const oldMode = window.mathEngine.angleMode;
                window.mathEngine.setAngleMode('RAD');
                const yVal = window.mathEngine.evaluateForVariable(fn.expr, 'x', this.hoverX);
                window.mathEngine.setAngleMode(oldMode);

                if (typeof yVal === 'number' && isFinite(yVal)) {
                    tooltips.push(`${fn.label}: ${yVal.toFixed(3)}`);

                    // Dot on the curve
                    const fnScreenY = this.toScreenY(yVal);
                    ctx.save();
                    ctx.fillStyle = fn.color;
                    ctx.shadowColor = fn.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(screenX, fnScreenY, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            } catch (e) {}
        });

        // Draw Tooltip Box
        const boxWidth = 140;
        const boxHeight = tooltips.length * 18 + 12;
        let tipX = screenX + 12;
        let tipY = screenY - boxHeight - 8;

        if (tipX + boxWidth > this.cssWidth) tipX = screenX - boxWidth - 12;
        if (tipY < 10) tipY = screenY + 14;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tipX, tipY, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        tooltips.forEach((text, i) => {
            ctx.fillText(text, tipX + 10, tipY + 14 + i * 18);
        });
        ctx.restore();
    }

    formatGridNum(num) {
        if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.01 && num !== 0)) {
            return num.toExponential(1);
        }
        return Number(num.toFixed(2)).toString();
    }
}
