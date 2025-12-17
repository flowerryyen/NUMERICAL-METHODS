import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';

const math = create(all, {});

// Helper for formatting decimals
const formatNumber = (num: any): string => {
    const val = Number(num);
    if (isNaN(val)) return "NaN";
    if (Math.abs(val) < 1e-12) return "0";
    const s6 = val.toFixed(6);
    if (s6.endsWith('99')) return parseFloat(val.toFixed(7)).toString();
    return parseFloat(s6).toString();
};

const Exam3Solver: React.FC = () => {
    const [tool, setTool] = useState<'diff' | 'int'>('diff');

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Tool Selector */}
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col md:flex-row gap-2 border border-white/10 shadow-lg">
                <button
                    onClick={() => setTool('diff')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        tool === 'diff' 
                        ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Numerical Differentiation
                </button>
                <button
                    onClick={() => setTool('int')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        tool === 'int' 
                        ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Numerical Integration
                </button>
            </div>

            {tool === 'diff' ? <DifferentiationSolver /> : <IntegrationSolver />}
        </div>
    );
};

// ==========================================
// DIFFERENTIATION SOLVER
// ==========================================
type DiffMethod = 'forward' | 'backward' | 'central';
type DiffOrder = 1 | 2;

const DifferentiationSolver: React.FC = () => {
    const [funcStr, setFuncStr] = useState("");
    const [xVal, setXVal] = useState("");
    const [hVal, setHVal] = useState("");
    const [method, setMethod] = useState<DiffMethod>('forward');
    const [order, setOrder] = useState<DiffOrder>(1);
    
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const solve = () => {
        try {
            setError(null);
            setResult(null);

            if (!funcStr.trim() || !xVal.trim() || !hVal.trim()) {
                throw new Error("Please fill in all fields.");
            }

            const x = parseFloat(xVal);
            const h = parseFloat(hVal);
            if (isNaN(x) || isNaN(h)) throw new Error("Invalid x or h values");
            if (h === 0) throw new Error("Step size h cannot be zero");

            const node = math.parse(funcStr);
            const f = (val: number) => {
                const res = node.evaluate({ x: val });
                return Number(res);
            };

            const xi = x;
            const xi_minus_1 = x - h;
            const xi_plus_1 = x + h;
            const xi_plus_2 = x + 2*h;
            const xi_minus_2 = x - 2*h;

            const f_xi = f(xi);
            const f_xi_minus_1 = f(xi_minus_1);
            const f_xi_plus_1 = f(xi_plus_1);
            
            let trueVal = 0;
            try {
                const deriv = math.derivative(node, 'x');
                if (order === 1) {
                    trueVal = Number(deriv.evaluate({ x }));
                } else {
                    const deriv2 = math.derivative(deriv, 'x');
                    trueVal = Number(deriv2.evaluate({ x }));
                }
            } catch (e) {
                console.warn("Could not calculate analytical derivative");
            }

            let approxVal = 0;
            let formulaLatex = "";
            let substStep = "";
            let methodTitle = "";

            if (order === 1) {
                if (method === 'forward') {
                    methodTitle = "Forward Finite Divided Difference";
                    approxVal = (f_xi_plus_1 - f_xi) / h;
                    formulaLatex = "f'(x_i) \\approx \\frac{f(x_{i+1}) - f(x_i)}{h}";
                    substStep = `(${formatNumber(f_xi_plus_1)} - ${formatNumber(f_xi)}) / ${h}`;
                } else if (method === 'backward') {
                    methodTitle = "Backward Finite Divided Difference";
                    approxVal = (f_xi - f_xi_minus_1) / h;
                    formulaLatex = "f'(x_i) \\approx \\frac{f(x_i) - f(x_{i-1})}{h}";
                    substStep = `(${formatNumber(f_xi)} - ${formatNumber(f_xi_minus_1)}) / ${h}`;
                } else {
                    methodTitle = "Central Finite Divided Difference";
                    approxVal = (f_xi_plus_1 - f_xi_minus_1) / (2 * h);
                    formulaLatex = "f'(x_i) \\approx \\frac{f(x_{i+1}) - f(x_{i-1})}{2h}";
                    substStep = `(${formatNumber(f_xi_plus_1)} - ${formatNumber(f_xi_minus_1)}) / ${2*h}`;
                }
            } else {
                if (method === 'central') {
                    methodTitle = "Second Order Central Difference";
                    approxVal = (f_xi_plus_1 - 2*f_xi + f_xi_minus_1) / (h*h);
                    formulaLatex = "f''(x_i) \\approx \\frac{f(x_{i+1}) - 2f(x_i) + f(x_{i-1})}{h^2}";
                    substStep = `(${formatNumber(f_xi_plus_1)} - 2(${formatNumber(f_xi)}) + ${formatNumber(f_xi_minus_1)}) / ${h}^2`;
                } else if (method === 'forward') {
                    const f_xi_plus_2 = f(xi_plus_2);
                    methodTitle = "Second Order Forward Difference";
                    approxVal = (f_xi_plus_2 - 2*f_xi_plus_1 + f_xi) / (h*h);
                    formulaLatex = "f''(x_i) \\approx \\frac{f(x_{i+2}) - 2f(x_{i+1}) + f(x_i)}{h^2}";
                    substStep = `(${formatNumber(f_xi_plus_2)} - 2(${formatNumber(f_xi_plus_1)}) + ${formatNumber(f_xi)}) / ${h}^2`;
                } else {
                     const f_xi_minus_2 = f(xi_minus_2);
                     methodTitle = "Second Order Backward Difference";
                     approxVal = (f_xi - 2*f_xi_minus_1 + f_xi_minus_2) / (h*h);
                     formulaLatex = "f''(x_i) \\approx \\frac{f(x_i) - 2f(x_{i-1}) + f(x_{i-2})}{h^2}";
                     substStep = `(${formatNumber(f_xi)} - 2(${formatNumber(f_xi_minus_1)}) + ${formatNumber(f_xi_minus_2)}) / ${h}^2`;
                }
            }

            const absError = Math.abs(trueVal - approxVal);
            const relError = trueVal !== 0 ? Math.abs(absError / trueVal) * 100 : 0;

            setResult({
                methodTitle,
                approxVal,
                trueVal,
                formulaLatex,
                substStep,
                xi, xi_minus_1, xi_plus_1, h,
                f_xi, f_xi_minus_1, f_xi_plus_1,
                absError, relError,
                points: {
                    curr: { x: xi, y: f_xi },
                    prev: { x: xi_minus_1, y: f_xi_minus_1 },
                    next: { x: xi_plus_1, y: f_xi_plus_1 }
                }
            });

        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-bold text-yellow-200 mb-6">Numerical Differentiation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Function f(x)</label>
                        <input 
                            type="text" 
                            value={funcStr} 
                            onChange={(e) => setFuncStr(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono"
                            placeholder="e.g. 3x^2 + 2" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Point x</label>
                        <input 
                            type="number" 
                            value={xVal} 
                            onChange={(e) => setXVal(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                            placeholder="e.g. 0.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Step Size h</label>
                        <input 
                            type="number" 
                            value={hVal} 
                            onChange={(e) => setHVal(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                            placeholder="e.g. 0.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Method</label>
                        <select 
                            value={method} 
                            onChange={(e) => setMethod(e.target.value as DiffMethod)}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        >
                            <option value="forward" className="bg-slate-900">Forward Difference</option>
                            <option value="backward" className="bg-slate-900">Backward Difference</option>
                            <option value="central" className="bg-slate-900">Central Difference</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Derivative Order</label>
                        <select 
                            value={order} 
                            onChange={(e) => setOrder(parseInt(e.target.value) as DiffOrder)}
                            className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        >
                            <option value="1" className="bg-slate-900">First Derivative f'(x)</option>
                            <option value="2" className="bg-slate-900">Second Derivative f''(x)</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={solve} 
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-400 hover:to-orange-500 transition-all shadow-lg"
                >
                    Calculate Derivative
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 space-y-6">
                        <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2">Step-by-Step Solution</h4>
                        
                        <div>
                            <h5 className="text-sm font-bold text-yellow-200 mb-2">1. Identify Points (h = {result.h})</h5>
                            <div className="font-mono text-sm text-gray-300 space-y-1 bg-black/20 p-3 rounded border border-white/5">
                                <p>x<sub>i</sub> = {formatNumber(result.xi)}</p>
                                <p>x<sub>i-1</sub> = {formatNumber(result.xi)} - {result.h} = {formatNumber(result.xi_minus_1)}</p>
                                <p>x<sub>i+1</sub> = {formatNumber(result.xi)} + {result.h} = {formatNumber(result.xi_plus_1)}</p>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-sm font-bold text-yellow-200 mb-2">2. Evaluate Function</h5>
                            <div className="font-mono text-sm text-gray-300 space-y-1 bg-black/20 p-3 rounded border border-white/5">
                                <p>f(x<sub>i</sub>) = f({formatNumber(result.xi)}) = {formatNumber(result.f_xi)}</p>
                                <p>f(x<sub>i-1</sub>) = f({formatNumber(result.xi_minus_1)}) = {formatNumber(result.f_xi_minus_1)}</p>
                                <p>f(x<sub>i+1</sub>) = f({formatNumber(result.xi_plus_1)}) = {formatNumber(result.f_xi_plus_1)}</p>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-sm font-bold text-yellow-200 mb-2">3. Apply {result.methodTitle}</h5>
                            <div className="bg-black/20 p-4 rounded border border-white/5 text-center">
                                <div className="mb-3 text-lg font-serif italic text-white/90">
                                    {order === 1 && method === 'forward' && "f'(x) ≈ ( f(x+h) - f(x) ) / h"}
                                    {order === 1 && method === 'backward' && "f'(x) ≈ ( f(x) - f(x-h) ) / h"}
                                    {order === 1 && method === 'central' && "f'(x) ≈ ( f(x+h) - f(x-h) ) / 2h"}
                                    {order === 2 && method === 'central' && "f''(x) ≈ ( f(x+h) - 2f(x) + f(x-h) ) / h²"}
                                </div>
                                
                                <div className="font-mono text-sm text-gray-300 border-t border-white/10 pt-3 break-all">
                                    = {result.substStep}
                                </div>
                                <div className="mt-2 text-2xl font-bold text-yellow-400">
                                    = {formatNumber(result.approxVal)}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-sm font-bold text-yellow-200 mb-2">Error Analysis</h5>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-3 rounded border border-white/10">
                                    <div className="text-xs text-gray-400">True Value</div>
                                    <div className="text-lg font-bold text-white">{formatNumber(result.trueVal)}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded border border-white/10">
                                    <div className="text-xs text-gray-400">Relative Error</div>
                                    <div className="text-lg font-bold text-red-300">{formatNumber(result.relError)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 flex flex-col">
                        <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Geometric Interpretation</h4>
                        <div className="flex-grow flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-4 relative overflow-hidden h-64">
                            <GraphVizDiff 
                                funcStr={funcStr} 
                                x={result.xi} 
                                h={result.h} 
                                method={method} 
                                order={order}
                                points={result.points}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center italic">
                            The graph illustrates the function (curve) and the slope (line) approximated by the {result.methodTitle}.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// INTEGRATION SOLVER
// ==========================================
type IntMethod = 'trapezoidal' | 'simpson13' | 'simpson38' | 'romberg';

const IntegrationSolver: React.FC = () => {
    const [funcStr, setFuncStr] = useState("");
    const [lowerStr, setLowerStr] = useState("");
    const [upperStr, setUpperStr] = useState("");
    const [nStr, setNStr] = useState("");
    const [method, setMethod] = useState<IntMethod>('trapezoidal');
    
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const solve = () => {
        try {
            setError(null);
            setResult(null);

            if(!funcStr.trim() || !lowerStr.trim() || !upperStr.trim() || !nStr.trim()) {
                throw new Error("Please fill in all fields.");
            }

            const a = parseFloat(lowerStr);
            const b = parseFloat(upperStr);
            const n = parseInt(nStr);

            if(isNaN(a) || isNaN(b) || isNaN(n)) throw new Error("Invalid numerical inputs.");
            if(n <= 0) throw new Error("n must be positive.");

            const node = math.parse(funcStr);
            const f = (x: number) => {
                const res = node.evaluate({ x });
                return Number(res);
            };

            if (method === 'simpson13' && n % 2 !== 0) throw new Error("Simpson's 1/3 Rule requires n to be even.");
            if (method === 'simpson38' && n % 3 !== 0) throw new Error("Simpson's 3/8 Rule requires n to be a multiple of 3.");

            let finalVal = 0;
            let h = (b - a) / n;
            let steps: any = {};
            let points: {x:number, y:number}[] = [];

            if (method !== 'romberg') {
                for(let i=0; i<=n; i++) {
                    const xi = a + i*h;
                    points.push({ x: xi, y: f(xi) });
                }

                if (method === 'trapezoidal') {
                    let sum = 0;
                    for(let i=1; i<n; i++) sum += points[i].y;
                    finalVal = (h/2) * (points[0].y + 2*sum + points[n].y);
                    steps = { type: 'basic', formula: 'I ≈ (h/2)[f(x₀) + 2Σf(x_i) + f(xₙ)]', sum };
                } 
                else if (method === 'simpson13') {
                    let sumOdd = 0;
                    let sumEven = 0;
                    for(let i=1; i<n; i++) {
                        if(i % 2 !== 0) sumOdd += points[i].y;
                        else sumEven += points[i].y;
                    }
                    finalVal = (h/3) * (points[0].y + 4*sumOdd + 2*sumEven + points[n].y);
                    steps = { type: 'basic', formula: 'I ≈ (h/3)[f(x₀) + 4Σf(odd) + 2Σf(even) + f(xₙ)]', sumOdd, sumEven };
                }
                else if (method === 'simpson38') {
                    let sumMod3 = 0;
                    let sumRest = 0;
                    for(let i=1; i<n; i++) {
                        if(i % 3 === 0) sumMod3 += points[i].y;
                        else sumRest += points[i].y;
                    }
                    finalVal = (3*h/8) * (points[0].y + 2*sumMod3 + 3*sumRest + points[n].y);
                    steps = { type: 'basic', formula: 'I ≈ (3h/8)[f(x₀) + 3Σf(non-3k) + 2Σf(3k) + f(xₙ)]', sumMod3, sumRest };
                }
            } else {
                const R: number[][] = [];
                const levelsData = [];

                for(let i=0; i<n; i++) {
                    R[i] = [];
                    const segs = Math.pow(2, i);
                    const h_rom = (b - a) / segs;
                    
                    let sumInternal = 0;
                    for(let k=1; k<segs; k++) {
                        sumInternal += f(a + k * h_rom);
                    }
                    const val = (h_rom / 2) * (f(a) + 2*sumInternal + f(b));
                    
                    R[i][0] = val;

                    // Generate points for this level's graph
                    const levelPoints = [];
                    for(let p=0; p<=segs; p++) {
                        const px = a + p * h_rom;
                        levelPoints.push({x: px, y: f(px)});
                    }

                    // Formula substitution string
                    const substStr = `J = (${formatNumber(h_rom)}/2) [ ${formatNumber(f(a))} + ${segs > 1 ? `2(${formatNumber(sumInternal)}) + ` : ''}${formatNumber(f(b))} ]`;

                    levelsData.push({
                        level: i,
                        segments: segs,
                        h: h_rom,
                        value: val,
                        substStr,
                        points: levelPoints
                    });
                }

                for(let j=1; j<n; j++) {
                    for(let i=j; i<n; i++) {
                        const numer = Math.pow(4, j) * R[i][j-1] - R[i-1][j-1];
                        const denom = Math.pow(4, j) - 1;
                        R[i][j] = numer / denom;
                    }
                }
                finalVal = R[n-1][n-1];
                steps = { type: 'romberg', table: R, levels: levelsData };
                
                // For main visualization (finest level)
                h = (b-a)/Math.pow(2, n-1);
                for(let i=0; i<=Math.pow(2, n-1); i++) {
                     const xi = a + i*h;
                     points.push({ x: xi, y: f(xi) });
                }
            }

            setResult({
                finalVal,
                h,
                points,
                steps,
                a, b, n
            });

        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-bold text-orange-200 mb-6">Numerical Integration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Function f(x)</label>
                        <input type="text" value={funcStr} onChange={e => setFuncStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono" placeholder="e.g. sin(x)" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Lower Limit (a)</label>
                        <input type="number" value={lowerStr} onChange={e => setLowerStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="e.g. 0" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Upper Limit (b)</label>
                        <input type="number" value={upperStr} onChange={e => setUpperStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="e.g. 3.14159" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Integration Method</label>
                        <select value={method} onChange={e => setMethod(e.target.value as IntMethod)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white">
                            <option value="trapezoidal" className="bg-slate-900">Trapezoidal Rule</option>
                            <option value="romberg" className="bg-slate-900">Romberg Integration</option>
                            <option value="simpson13" className="bg-slate-900">Simpson's 1/3 Rule</option>
                            <option value="simpson38" className="bg-slate-900">Simpson's 3/8 Rule</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">{method === 'romberg' ? 'Levels (Iterations)' : 'Segments (n)'}</label>
                        <input type="number" value={nStr} onChange={e => setNStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder={method === 'romberg' ? 'e.g. 3' : 'e.g. 6'} />
                    </div>
                </div>

                <button onClick={solve} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-500 hover:to-red-500 transition-all shadow-lg">
                    Evaluate Integral
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 space-y-6">
                        <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2">Calculation Details</h4>
                        
                        <div className="text-center p-4 bg-white/5 rounded border border-white/10">
                            <span className="text-2xl font-serif italic text-orange-200">
                                I = ∫<sub className="text-sm">{result.a}</sub><sup className="text-sm">{result.b}</sup> {funcStr} dx
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div className="bg-white/5 p-2 rounded">a = {result.a}</div>
                            <div className="bg-white/5 p-2 rounded">b = {result.b}</div>
                            <div className="bg-white/5 p-2 rounded">{method === 'romberg' ? 'Levels' : 'n'} = {result.n}</div>
                            {method !== 'romberg' && <div className="bg-white/5 p-2 rounded">h = {formatNumber(result.h)}</div>}
                        </div>

                        {method !== 'romberg' && (
                            <div className="overflow-x-auto max-h-60 custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-orange-300 border-b border-white/10">
                                        <tr><th className="p-2">i</th><th className="p-2">x</th><th className="p-2">f(x)</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                                        {result.points.map((p:any, i:number) => (
                                            <tr key={i}>
                                                <td className="p-2 text-gray-500">{i}</td>
                                                <td className="p-2">{formatNumber(p.x)}</td>
                                                <td className="p-2">{formatNumber(p.y)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {result.steps.type === 'basic' && (
                            <div className="bg-black/20 p-4 rounded border border-white/5">
                                <div className="text-sm text-orange-200 mb-2 font-mono break-all">{result.steps.formula}</div>
                                <div className="text-xs text-gray-400">
                                    Substituted sums calculated from table above...
                                </div>
                            </div>
                        )}

                        {result.steps.type === 'romberg' && (
                            <div className="space-y-6">
                                <div>
                                   <h5 className="font-bold text-orange-200 mb-3 text-lg border-b border-white/5 pb-2">1. Trapezoidal Estimates (Recursive Levels)</h5>
                                   <div className="space-y-6">
                                       {result.steps.levels.map((lvl: any, idx: number) => (
                                           <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all">
                                               <div className="flex flex-col md:flex-row items-center gap-6">
                                                   <div className="flex-1 w-full">
                                                       <div className="flex items-center justify-between mb-2">
                                                           <span className="font-bold text-orange-100 text-lg">Level {idx} (k={idx})</span>
                                                           <span className="text-xs bg-orange-900/30 text-orange-200 px-2 py-1 rounded border border-orange-500/20">Segments (n): {lvl.segments}</span>
                                                       </div>
                                                       <div className="text-sm text-gray-400 mb-1">Step Size h = {formatNumber(lvl.h)}</div>
                                                       
                                                       <div className="font-mono text-sm text-gray-300 bg-black/30 p-3 rounded border border-white/5 mb-2 overflow-x-auto">
                                                           <div className="text-gray-500 mb-1 border-b border-white/5 pb-1 italic">J = (h/2) [ f(a) + 2Σf(x) + f(b) ]</div>
                                                           <div className="text-white whitespace-nowrap pt-1">{lvl.substStr}</div>
                                                       </div>
                                                       <div className="text-right">
                                                           <span className="text-gray-400 mr-2 text-sm">Integral Area J ≈</span>
                                                           <span className="text-xl font-bold text-orange-400">{formatNumber(lvl.value)}</span>
                                                       </div>
                                                   </div>
                                                   
                                                   <div className="w-full md:w-56 h-40 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden flex-shrink-0">
                                                        <GraphVizInt 
                                                            funcStr={funcStr} 
                                                            points={lvl.points} 
                                                            a={result.a} 
                                                            b={result.b}
                                                            mini={true} 
                                                        />
                                                        <div className="absolute top-1 right-2 text-[10px] text-gray-400 bg-black/50 px-1 rounded">n={lvl.segments}</div>
                                                   </div>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <h5 className="font-bold text-orange-200 mb-3 text-lg border-b border-white/5 pb-2">2. Improved Area (Richardson Extrapolation)</h5>
                                    <table className="w-full text-xs text-center border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="p-2 border border-white/10 text-gray-400 bg-white/5">O(h²)</th>
                                                {result.steps.table.length > 1 && <th className="p-2 border border-white/10 text-gray-400 bg-white/5">O(h⁴)</th>}
                                                {result.steps.table.length > 2 && <th className="p-2 border border-white/10 text-gray-400 bg-white/5">O(h⁶)</th>}
                                                {result.steps.table.length > 3 && <th className="p-2 border border-white/10 text-gray-400 bg-white/5">...</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.steps.table.map((row: number[], i:number) => (
                                                <tr key={i}>
                                                    {row.map((val:number, j:number) => (
                                                        <td key={j} className={`p-2 border border-white/10 font-mono ${i===result.n-1 && j===result.n-1 ? 'text-orange-400 font-bold bg-orange-900/20' : 'text-gray-300'}`}>
                                                            {formatNumber(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 p-4 rounded-xl border border-orange-500/30 text-center">
                            <span className="text-gray-400 text-sm block mb-1">Final Answer</span>
                            <span className="text-3xl font-bold text-white">{formatNumber(result.finalVal)}</span>
                        </div>
                    </div>

                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 flex flex-col">
                        <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Area Visualization (Fine)</h4>
                        <div className="flex-grow flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-4 relative overflow-hidden h-64">
                             <GraphVizInt 
                                funcStr={funcStr} 
                                points={result.points} 
                                a={result.a} 
                                b={result.b} 
                            />
                        </div>
                         <p className="text-xs text-gray-400 mt-4 text-center italic">
                            Visual representation of the numerical integration with {result.points.length-1} segments.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// GRAPH VISUALIZATION COMPONENTS
// ==========================================

const GraphVizDiff: React.FC<{
    funcStr: string,
    x: number,
    h: number,
    method: DiffMethod,
    order: DiffOrder,
    points: { curr: any, prev: any, next: any }
}> = ({ funcStr, x, h, method, points }) => {
    // Generate graph points
    const pts = [];
    const range = h * 3;
    const startX = x - range;
    const endX = x + range;
    
    // Parse function once
    let f: any;
    try {
        const node = math.parse(funcStr);
        f = (v: number) => node.evaluate({x: v});
    } catch { return <div>Invalid Function</div>; }

    for(let i=0; i<=50; i++) {
        const currX = startX + (i/50)*(endX - startX);
        try {
            pts.push({ x: currX, y: f(currX) });
        } catch {}
    }

    if (pts.length === 0) return <div>No Graph Data</div>;

    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));

    // Simple Scaling
    const width = 300;
    const height = 200;
    const padding = 20;

    const scaleX = (v: number) => padding + ((v - minX) / (maxX - minX)) * (width - 2*padding);
    const scaleY = (v: number) => height - (padding + ((v - minY) / (maxY - minY)) * (height - 2*padding));

    const pathData = pts.map((p, i) => `${i===0?'M':'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');

    // secant/tangent line points
    let x1, y1, x2, y2;
    if (method === 'forward') {
        x1 = points.curr.x; y1 = points.curr.y;
        x2 = points.next.x; y2 = points.next.y;
    } else if (method === 'backward') {
        x1 = points.prev.x; y1 = points.prev.y;
        x2 = points.curr.x; y2 = points.curr.y;
    } else {
        x1 = points.prev.x; y1 = points.prev.y;
        x2 = points.next.x; y2 = points.next.y;
    }

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Function Curve */}
            <path d={pathData} fill="none" stroke="#FBBF24" strokeWidth="2" opacity="0.8" />
            
            {/* Points of Interest */}
            <circle cx={scaleX(x1)} cy={scaleY(y1)} r="3" fill="#EF4444" />
            <circle cx={scaleX(x2)} cy={scaleY(y2)} r="3" fill="#EF4444" />
            
            {/* Secant Line (Slope) */}
            <line 
                x1={scaleX(x1)} y1={scaleY(y1)} 
                x2={scaleX(x2)} y2={scaleY(y2)} 
                stroke="#60A5FA" strokeWidth="2" strokeDasharray="4"
            />
            
            {/* Current X marker */}
            <line x1={scaleX(x)} y1={0} x2={scaleX(x)} y2={height} stroke="white" strokeOpacity="0.1" />
        </svg>
    );
};

const GraphVizInt: React.FC<{
    funcStr: string,
    points: {x:number, y:number}[],
    a: number,
    b: number,
    mini?: boolean
}> = ({ funcStr, points, a, b, mini = false }) => {
    // Generate smooth curve points
    const curvePts = [];
    let f: any;
    try {
        const node = math.parse(funcStr);
        f = (v: number) => node.evaluate({x: v});
    } catch { return <div>Invalid Function</div>; }

    const numCurvePts = 100;
    const curveStep = (b - a) / numCurvePts;
    
    // Add margin to view slightly outside a and b
    const margin = (b - a) * 0.1;
    const startView = a - margin;
    const endView = b + margin;

    for(let i=0; i<=numCurvePts; i++) {
        const cx = a + i*curveStep;
        curvePts.push({ x: cx, y: f(cx) });
    }

    // Determine Min/Max for scaling
    const allY = [...curvePts.map(p => p.y), ...points.map(p => p.y), 0];
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);

    const width = 300;
    const height = 200;
    const padding = mini ? 10 : 20;

    const scaleX = (v: number) => padding + ((v - startView) / (endView - startView)) * (width - 2*padding);
    const scaleY = (v: number) => height - (padding + ((v - minY) / (maxY - minY)) * (height - 2*padding));
    const zeroY = scaleY(0);

    const pathData = curvePts.map((p, i) => `${i===0?'M':'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Trapezoids / Areas */}
            {points.map((p, i) => {
                if (i === points.length - 1) return null;
                const nextP = points[i+1];
                return (
                    <polygon 
                        key={i}
                        points={`${scaleX(p.x)},${scaleY(0)} ${scaleX(p.x)},${scaleY(p.y)} ${scaleX(nextP.x)},${scaleY(nextP.y)} ${scaleX(nextP.x)},${scaleY(0)}`}
                        fill="rgba(249, 115, 22, 0.2)"
                        stroke="rgba(249, 115, 22, 0.4)"
                        strokeWidth="1"
                    />
                );
            })}

            {/* X Axis */}
            <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="white" strokeOpacity="0.2" />

            {/* Function Curve */}
            <path d={pathData} fill="none" stroke="#FBBF24" strokeWidth="2" />
        </svg>
    );
};

export default Exam3Solver;