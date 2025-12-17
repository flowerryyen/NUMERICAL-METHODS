import React, { useState, useEffect } from 'react';
import { create, all } from 'mathjs';

// Initialize mathjs
const math = create(all, {});

type Tool = 'roots' | 'curve' | 'interpolation';

// Helper for formatting decimals as requested
const formatNumber = (num: any): string => {
    const val = Number(num);
    if (isNaN(val)) return "NaN";
    if (Math.abs(val) < 1e-12) return "0";
    const s6 = val.toFixed(6);
    // Check if the formatted string ends in "99" (e.g. 0.123499)
    if (s6.endsWith('99')) {
        return parseFloat(val.toFixed(7)).toString();
    }
    return parseFloat(s6).toString();
};

const Exam2Solver: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('roots');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tool Selection */}
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col md:flex-row gap-2 border border-white/10 shadow-lg">
                <button
                    onClick={() => setActiveTool('roots')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        activeTool === 'roots' 
                        ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Root Finding
                </button>
                <button
                    onClick={() => setActiveTool('curve')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        activeTool === 'curve' 
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Curve Fitting
                </button>
                <button
                    onClick={() => setActiveTool('interpolation')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        activeTool === 'interpolation' 
                        ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Interpolation
                </button>
            </div>

            {activeTool === 'roots' && <RootFinder />}
            {activeTool === 'curve' && <CurveFitter />}
            {activeTool === 'interpolation' && <Interpolator />}
        </div>
    );
};

// --- ROOT FINDER ---
type RootMethod = 'bisection' | 'secant' | 'newton';

interface SolutionData {
    k: number;
    value: number;
    converged: boolean;
}

const RootFinder: React.FC = () => {
    const [method, setMethod] = useState<RootMethod>('bisection');
    // Start blank
    const [funcStr, setFuncStr] = useState("");
    
    // Bounds for Bisection/False Position (Blank)
    const [xl, setXl] = useState("");
    const [xu, setXu] = useState("");
    
    // Initial guess for Newton (Blank)
    const [x0, setX0] = useState("");
    
    // Tolerance (Blank)
    const [tolerance, setTolerance] = useState(""); 

    const [iterations, setIterations] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [solution, setSolution] = useState<SolutionData | null>(null);

    const solve = () => {
        setErrorMsg(null);
        setIterations([]);
        setSolution(null);

        try {
            if(!funcStr.trim() || !tolerance.trim()) throw new Error("Please fill in all fields");

            const tol = parseFloat(tolerance);
            if(isNaN(tol) || tol <= 0) throw new Error("Invalid tolerance");

            const node = math.parse(funcStr);
            const compiled = node.compile();
            const f = (x: number) => Number(compiled.evaluate({ x }));

            const rows: any[] = [];
            let k = 0; 
            const maxIter = 15;
            let converged = false;
            let currentVal = 0;
            let currentK = 0;

            if (method === 'bisection' || method === 'secant') {
                if(!xl.trim() || !xu.trim()) throw new Error("Please enter upper and lower bounds");
                let lower = parseFloat(xl);
                let upper = parseFloat(xu);
                if(isNaN(lower) || isNaN(upper)) throw new Error("Invalid bounds");
                
                if (f(lower) * f(upper) >= 0) throw new Error("f(xl) and f(xu) must have opposite signs.");

                while (k < maxIter) {
                    let xm = 0;
                    
                    if (method === 'bisection') {
                        xm = (lower + upper) / 2;
                    } else {
                        // False Position Formula
                        const fl = f(lower);
                        const fu = f(upper);
                        if (Math.abs(fu - fl) < 1e-12) throw new Error("Division by zero in False Position");
                        xm = (lower * fu - upper * fl) / (fu - fl);
                    }

                    currentVal = xm;
                    currentK = k;
                    
                    const fXm = f(xm);
                    const absFXm = Math.abs(fXm);

                    const isConverged = absFXm < tol;

                    rows.push({
                        k,
                        xl: formatNumber(lower),
                        xu: formatNumber(upper),
                        xm: formatNumber(xm),
                        fxm: formatNumber(fXm),
                        absFxm: formatNumber(absFXm),
                        remarks: isConverged ? `< ${tol}` : `> ${tol}`
                    });

                    if (isConverged) {
                        converged = true;
                        break;
                    }

                    // Update bounds
                    if (f(lower) * fXm < 0) {
                        upper = xm;
                    } else {
                        lower = xm;
                    }
                    k++;
                }
            } 
            else if (method === 'newton') {
                if(!x0.trim()) throw new Error("Please enter initial guess");
                let curr = parseFloat(x0); // x_k
                if(isNaN(curr)) throw new Error("Invalid initial guess");
                
                const deriv = math.derivative(node, 'x');
                const derivCompiled = deriv.compile();
                const df = (x: number) => Number(derivCompiled.evaluate({ x }));

                while (k < maxIter) {
                    const fx = f(curr);
                    const dfx = df(curr);

                    if (Math.abs(dfx) < 1e-12) throw new Error("Derivative is zero. Newton-Raphson fails.");

                    const next = curr - fx / dfx; // x_{k+1}
                    currentVal = next;
                    currentK = k;

                    // Relative Error
                    const errVal = Math.abs((next - curr) / next);
                    const isConverged = errVal < tol;

                    rows.push({
                        k,
                        xk: formatNumber(curr),
                        fx: formatNumber(fx),
                        dfx: formatNumber(dfx),
                        xk_plus_1: formatNumber(next),
                        dk: formatNumber(errVal),
                        remarks: isConverged ? `< ${tol}` : `> ${tol}`
                    });

                    if (isConverged) {
                        converged = true;
                        break;
                    }
                    curr = next;
                    k++;
                }
            }

            setIterations(rows);
            if (rows.length > 0) {
                setSolution({
                    k: currentK,
                    value: currentVal,
                    converged
                });
            }

        } catch (err: any) {
            setErrorMsg(err.message);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-pink-200 mb-4">Root Finding</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Method</label>
                    <select 
                        value={method} 
                        onChange={(e) => {
                            setMethod(e.target.value as RootMethod);
                            setIterations([]);
                            setSolution(null);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                    >
                        <option value="bisection" className="bg-slate-900">Bisection Method</option>
                        <option value="secant" className="bg-slate-900">Secant (False Position)</option>
                        <option value="newton" className="bg-slate-900">Newton-Raphson</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Function f(x)</label>
                    <input 
                        type="text" 
                        value={funcStr} 
                        onChange={(e) => setFuncStr(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono"
                        placeholder="e.g. sin(x) - 0.52" 
                    />
                    <p className="text-xs text-pink-400/50 mt-1">Trig functions use Radians</p>
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Tolerance</label>
                    <input 
                        type="number" 
                        step="0.0001"
                        value={tolerance} 
                        onChange={(e) => setTolerance(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                        placeholder="e.g. 0.001" 
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                {(method === 'bisection' || method === 'secant') && (
                    <>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400">
                                <span className="font-mono">x<sup>0</sup><sub>+</sub></span> (Lower Bound)
                            </label>
                            <input type="number" value={xl} onChange={e => setXl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" placeholder="e.g. 1" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400">
                                <span className="font-mono">x<sup>0</sup><sub>-</sub></span> (Upper Bound)
                            </label>
                            <input type="number" value={xu} onChange={e => setXu(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" placeholder="e.g. 2" />
                        </div>
                    </>
                )}
                {method === 'newton' && (
                    <div className="flex-1">
                        <label className="block text-sm text-gray-400">Initial Guess (x<sup>0</sup>)</label>
                        <input type="number" value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" placeholder="e.g. 0.5" />
                    </div>
                )}
            </div>

            <button onClick={solve} className="w-full bg-pink-600 hover:bg-pink-500 py-2 rounded-lg font-bold mb-6">Solve</button>

            {errorMsg && <div className="text-red-400 bg-red-900/20 p-4 rounded mb-4 flex items-center gap-2"><span className="text-xl">⚠️</span> {errorMsg}</div>}

            {iterations.length > 0 && (
                <div className="space-y-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center border-separate border-spacing-0">
                            <thead className="bg-green-500 text-black font-bold">
                                {(method === 'bisection' || method === 'secant') && (
                                    <tr>
                                        <th className="p-3 border-b border-black/10">k</th>
                                        <th className="p-3 border-b border-black/10">x<sup>k</sup><sub>+</sub></th>
                                        <th className="p-3 border-b border-black/10">x<sup>k</sup><sub>-</sub></th>
                                        <th className="p-3 border-b border-black/10">x<sup>k+1</sup></th>
                                        <th className="p-3 border-b border-black/10">f(x<sup>k+1</sup>)</th>
                                        <th className="p-3 border-b border-black/10">|f(x<sup>k+1</sup>)|</th>
                                        <th className="p-3 border-b border-black/10">Remarks</th>
                                    </tr>
                                )}
                                {method === 'newton' && (
                                    <tr>
                                        <th className="p-3 border-b border-black/10">k</th>
                                        <th className="p-3 border-b border-black/10">x<sub>k</sub></th>
                                        <th className="p-3 border-b border-black/10">f(x<sub>k</sub>)</th>
                                        <th className="p-3 border-b border-black/10">f'(x<sub>k</sub>)</th>
                                        <th className="p-3 border-b border-black/10 whitespace-nowrap">
                                            x<sub>k+1</sub>
                                        </th>
                                        <th className="p-3 border-b border-black/10 whitespace-nowrap">
                                            d<sup>k</sup> (Error)
                                        </th>
                                        <th className="p-3 border-b border-black/10">Remarks</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="bg-white text-black divide-y divide-gray-200">
                                {iterations.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-2 font-mono">{row.k}</td>
                                        
                                        {(method === 'bisection' || method === 'secant') && (
                                            <>
                                                <td className="p-2 font-mono">{row.xl}</td>
                                                <td className="p-2 font-mono">{row.xu}</td>
                                                <td className="p-2 font-mono font-bold">{row.xm}</td>
                                                <td className="p-2 font-mono">{row.fxm}</td>
                                                <td className="p-2 font-mono">{row.absFxm}</td>
                                                <td className="p-2 font-bold">{row.remarks}</td>
                                            </>
                                        )}

                                        {method === 'newton' && (
                                            <>
                                                <td className="p-2 font-mono">{row.xk}</td>
                                                <td className="p-2 font-mono text-gray-600">{row.fx}</td>
                                                <td className="p-2 font-mono text-gray-600">{row.dfx}</td>
                                                <td className="p-2 font-mono font-bold">{row.xk_plus_1}</td>
                                                <td className="p-2 font-mono">{row.dk}</td>
                                                <td className="p-2 font-bold">{row.remarks}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {solution && (
                        <div className="mt-4 p-4 text-white">
                            <p className="text-lg font-medium mb-2">
                                Therefore, the root of the equation is 
                                <span className="font-bold mx-2">
                                    x<sup>{solution.k}+1</sup> = x<sup>{solution.k+1}</sup> = {formatNumber(solution.value)}
                                </span>.
                                Since k starts at 0, the iteration number of the accepted root based on the criteria is k+1, which is {solution.k} + 1 = {solution.k + 1}.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- CURVE FITTER ---
const CurveFitter: React.FC = () => {
    const [numPoints, setNumPoints] = useState<number>(3);
    // Initialize with empty strings
    const [points, setPoints] = useState<{x:string, y:string}[]>([{x:'',y:''}, {x:'',y:''}, {x:'',y:''}]);
    const [model, setModel] = useState<'linear'|'quadratic'|'exponential'|'custom'>('linear');
    // Start blank
    const [customBasis, setCustomBasis] = useState<string>(""); 
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        setPoints(curr => {
            if (curr.length === numPoints) return curr;
            if (curr.length < numPoints) {
                const add = Array(numPoints - curr.length).fill(0).map(() => ({x:'', y:''}));
                return [...curr, ...add];
            }
            return curr.slice(0, numPoints);
        });
    }, [numPoints]);

    const updatePoint = (idx: number, field: 'x'|'y', val: string) => {
        const newPoints = [...points];
        newPoints[idx][field] = val;
        setPoints(newPoints);
    };

    const fit = () => {
        try {
            const data = points.map(p => ({x: parseFloat(p.x), y: parseFloat(p.y)})).filter(p => !isNaN(p.x) && !isNaN(p.y));
            if (data.length < 2) throw new Error("Need at least 2 valid points");

            const N = data.length;
            let matrixA: number[][] = [];
            let vectorB: number[] = [];
            let solution: number[] = [];
            let eqString = "";
            let summationTable: any = null;

            if (model === 'custom' || model === 'linear' || model === 'quadratic') {
                let basisExprs: string[] = [];
                let colHeaders: string[] = [];
                let rowCalcs: any[] = [];
                
                if (model === 'linear') {
                    basisExprs = ['1', 'x'];
                    colHeaders = ['x', 'y', 'x²', 'xy'];
                } else if (model === 'quadratic') {
                    basisExprs = ['1', 'x', 'x^2'];
                    colHeaders = ['x', 'y', 'x²', 'x³', 'x⁴', 'xy', 'x²y'];
                } else {
                    if(!customBasis.trim()) throw new Error("Please enter basis functions");
                    basisExprs = customBasis.split(',').map(s => s.trim()).filter(s => s);
                    colHeaders = ['x', 'y', ...basisExprs];
                }

                const M = basisExprs.length;
                const funcs = basisExprs.map(str => math.compile(str));
                const evalBasis = (idx: number, x: number) => Number(funcs[idx].evaluate({x}));

                // Build Matrix & Summation Table
                matrixA = Array(M).fill(0).map(() => Array(M).fill(0));
                vectorB = Array(M).fill(0);

                let sums: Record<string, number> = {};
                // Initialize sums based on column headers
                colHeaders.forEach(h => sums[h] = 0);

                for(let k=0; k<N; k++) {
                    const x = data[k].x;
                    const y = data[k].y;
                    const row: any = { x, y };
                    
                    if (model === 'linear') {
                        row['x²'] = x*x;
                        row['xy'] = x*y;
                    } else if (model === 'quadratic') {
                        row['x²'] = x*x;
                        row['x³'] = x*x*x;
                        row['x⁴'] = x*x*x*x;
                        row['xy'] = x*y;
                        row['x²y'] = x*x*y;
                    }

                    // Add to total sums
                    Object.keys(row).forEach(key => {
                        sums[key] = (sums[key] || 0) + row[key];
                    });
                    rowCalcs.push(row);
                }

                summationTable = { headers: colHeaders, rows: rowCalcs, sums };

                // Build Matrix System
                for (let i = 0; i < M; i++) {
                    for (let j = 0; j < M; j++) {
                        let sum = 0;
                        for (let k = 0; k < N; k++) {
                            sum += evalBasis(i, data[k].x) * evalBasis(j, data[k].x);
                        }
                        matrixA[i][j] = sum;
                    }
                    let sumB = 0;
                    for (let k = 0; k < N; k++) {
                        sumB += data[k].y * evalBasis(i, data[k].x);
                    }
                    vectorB[i] = sumB;
                }

                // Solve A * x = B using Gaussian elimination
                const aug = matrixA.map((r, i) => [...r, vectorB[i]]);
                for(let i=0; i<M; i++) {
                    let maxRow = i;
                    for(let k=i+1; k<M; k++) if(Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow=k;
                    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];
                    
                    if (Math.abs(aug[i][i]) < 1e-12) throw new Error("Singular matrix - improper basis functions or insufficient data.");

                    for(let k=i+1; k<M; k++) {
                        const f = aug[k][i] / aug[i][i];
                        for(let j=i; j<=M; j++) aug[k][j] -= f * aug[i][j];
                    }
                }
                const x = Array(M).fill(0);
                for(let i=M-1; i>=0; i--) {
                    let s = 0;
                    for(let j=i+1; j<M; j++) s += aug[i][j] * x[j];
                    x[i] = (aug[i][M] - s) / aug[i][i];
                }
                solution = x;

                eqString = "y = " + solution.map((c, i) => {
                    const cStr = formatNumber(c);
                    const base = basisExprs[i];
                    if (base === '1') return cStr;
                    return `(${cStr})${base.includes('+') || base.includes('-') ? `(${base})` : base}`;
                }).join(" + ");
                eqString = eqString.replace(/\+ -/g, "- ");
            }
            else if (model === 'exponential') {
                const expData = data.map(p => {
                     if (p.y <= 0) throw new Error("Exponential fit requires positive Y values.");
                     return {x: p.x, y: Math.log(p.y), origY: p.y};
                });
                
                // Summation for linearized form: Y = A + Bx (Y = ln y)
                // Cols: x, y(orig), ln(y), x^2, x*ln(y)
                const colHeaders = ['x', 'y', 'ln(y)', 'x²', 'x·ln(y)'];
                let sums: Record<string, number> = {};
                colHeaders.forEach(h => sums[h] = 0);
                const rowCalcs = [];

                for (let i = 0; i < N; i++) {
                    const { x, y: lny, origY } = expData[i];
                    const row = {
                        'x': x,
                        'y': origY,
                        'ln(y)': lny,
                        'x²': x*x,
                        'x·ln(y)': x*lny
                    };
                    rowCalcs.push(row);
                     // Add to total sums
                    Object.keys(row).forEach(key => {
                        sums[key] = (sums[key] || 0) + (row as any)[key];
                    });
                }
                summationTable = { headers: colHeaders, rows: rowCalcs, sums };

                const sumX = sums['x'];
                const sumY = sums['ln(y)']; // Note: Vector B uses sum of ln(y)
                const sumX2 = sums['x²'];
                const sumXY = sums['x·ln(y)'];

                matrixA = [[N, sumX], [sumX, sumX2]];
                vectorB = [sumY, sumXY];

                const det = matrixA[0][0]*matrixA[1][1] - matrixA[0][1]*matrixA[1][0];
                const A_val = (vectorB[0]*matrixA[1][1] - vectorB[1]*matrixA[0][1]) / det;
                const B_val = (matrixA[0][0]*vectorB[1] - matrixA[1][0]*vectorB[0]) / det;
                
                const a = Math.exp(A_val);
                const b = B_val;
                
                solution = [a, b];
                eqString = `y = ${formatNumber(a)}e^(${formatNumber(b)}x)`;
            }

            setResult({ matrixA, vectorB, solution, eqString, summationTable });

        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-purple-200 mb-4">Curve Fitting (Least Squares)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-gray-400 block mb-2">Equation Type</label>
                    <select value={model} onChange={e => setModel(e.target.value as any)} className="bg-white/5 border border-white/10 rounded p-2 text-white w-full">
                        <option value="linear" className="bg-slate-900">Linear (y = A + Bx)</option>
                        <option value="quadratic" className="bg-slate-900">Quadratic (y = A + Bx + Cx²)</option>
                        <option value="exponential" className="bg-slate-900">Exponential (y = Ae^Bx)</option>
                        <option value="custom" className="bg-slate-900">Custom Basis (y = c₁f₁(x) + ...)</option>
                    </select>
                </div>
                <div>
                    <label className="text-gray-400 block mb-2">Number of Data Points</label>
                    <input 
                        type="number" 
                        min="2" 
                        max="20"
                        value={numPoints} 
                        onChange={e => setNumPoints(Math.max(2, parseInt(e.target.value) || 2))} 
                        className="bg-white/5 border border-white/10 rounded p-2 text-white w-full" 
                    />
                </div>
            </div>

            {model === 'custom' && (
                <div className="mb-6">
                    <label className="text-purple-300 block mb-2 font-semibold">Enter Basis Functions (comma separated)</label>
                    <input 
                        type="text" 
                        value={customBasis} 
                        onChange={e => setCustomBasis(e.target.value)}
                        className="w-full bg-white/5 border border-purple-500/50 rounded p-2 text-white font-mono placeholder-gray-500"
                        placeholder="e.g. 1, x, cos(x)" 
                    />
                </div>
            )}

            <div className="mb-4">
                <div className="grid grid-cols-2 gap-4 mb-2">
                    <div className="text-gray-400 font-bold text-center">X</div>
                    <div className="text-gray-400 font-bold text-center">Y</div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {points.map((p, i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                            <input type="text" value={p.x} onChange={e => updatePoint(i, 'x', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-center" placeholder={`x${i+1}`} />
                            <input type="text" value={p.y} onChange={e => updatePoint(i, 'y', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-center" placeholder={`y${i+1}`} />
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={fit} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold mb-6">Calculate Best Fit</button>

            {result && (
                <div className="space-y-6">
                    {result.summationTable && (
                        <div className="bg-black/40 p-6 rounded border border-white/5">
                            <h4 className="text-lg font-bold text-white mb-4">Step 1: Summation Table</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center text-sm">
                                    <thead className="text-purple-300 border-b border-purple-500/30">
                                        <tr>
                                            {result.summationTable.headers.map((h:string) => <th key={h} className="p-2">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {result.summationTable.rows.map((row:any, i:number) => (
                                            <tr key={i}>
                                                {result.summationTable.headers.map((h:string) => (
                                                    <td key={h} className="p-2 text-gray-300 font-mono">
                                                        {formatNumber(row[h])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        <tr className="bg-purple-900/20 font-bold border-t border-purple-500/50">
                                            {result.summationTable.headers.map((h:string) => (
                                                <td key={h} className="p-2 text-white font-mono">
                                                    Σ = {formatNumber(result.summationTable.sums[h])}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="bg-black/40 p-6 rounded border border-white/5">
                        <h4 className="text-lg font-bold text-white mb-2">Step 2: Normal Equations (Matrix Form)</h4>
                        <p className="text-sm text-gray-400 mb-4">
                            Solving for coefficients: 
                            <span className="font-mono text-purple-300"> [A] {model === 'exponential' ? '{ ln(a), b }' : '{ c }'} = [B]</span>
                        </p>
                        <div className="flex flex-col md:flex-row items-center gap-4 justify-center font-mono text-sm overflow-x-auto p-4 bg-black/20 rounded-lg">
                            {/* Matrix A */}
                            <div className="border-l-2 border-r-2 border-white/50 px-2 grid" style={{ gridTemplateColumns: `repeat(${result.matrixA.length}, minmax(60px, auto))` }}>
                                {result.matrixA.map((row: number[], i: number) => (
                                    row.map((val: number, j: number) => (
                                        <div key={`${i}-${j}`} className="p-2 text-right text-gray-200">
                                            {formatNumber(val)}
                                        </div>
                                    ))
                                ))}
                            </div>
                            <span className="text-2xl text-gray-500">×</span>
                            {/* Vector X (Unknowns) */}
                            <div className="border-l-2 border-r-2 border-white/50 px-2 flex flex-col justify-center gap-4">
                                {result.solution.map((_:any, i:number) => (
                                    <div key={i} className="text-purple-300 font-bold px-2">
                                        {model === 'exponential' ? (i===0 ? 'ln(a)' : 'b') : `c${i}`}
                                    </div>
                                ))}
                            </div>
                            <span className="text-2xl text-gray-500">=</span>
                            {/* Vector B */}
                            <div className="border-l-2 border-r-2 border-white/50 px-2 flex flex-col justify-center gap-4">
                                {result.vectorB.map((val: number, i: number) => (
                                    <div key={i} className="text-right text-gray-200 p-2">
                                        {formatNumber(val)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/40 p-6 rounded border border-white/5">
                        <h4 className="text-lg font-bold text-white mb-2">Step 3: Solution</h4>
                        <div className="text-xl text-purple-200 font-bold mb-4 font-mono">{result.eqString}</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-300">
                            {result.solution.map((c: number, i: number) => (
                                <div key={i} className="bg-white/5 p-2 rounded">
                                    {model === 'exponential' && i === 0 ? 'a' : `C${i}`} = <span className="text-purple-300 font-bold">{formatNumber(c)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- INTERPOLATOR ---
const Interpolator: React.FC = () => {
    const [numPoints, setNumPoints] = useState<number>(4);
    // Init empty
    const [points, setPoints] = useState<{x:string, y:string}[]>([
        {x:'',y:''}, {x:'',y:''}, {x:'',y:''}, {x:'',y:''}
    ]);
    const [method, setMethod] = useState<'newton'|'lagrange'>('newton');
    // Init empty
    const [estimateX, setEstimateX] = useState<string>("");
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        setPoints(curr => {
            if (curr.length === numPoints) return curr;
            if (curr.length < numPoints) {
                const add = Array(numPoints - curr.length).fill(0).map(() => ({x:'', y:''}));
                return [...curr, ...add];
            }
            return curr.slice(0, numPoints);
        });
    }, [numPoints]);

    const updatePoint = (idx: number, field: 'x'|'y', val: string) => {
        const newPoints = [...points];
        newPoints[idx][field] = val;
        setPoints(newPoints);
    };

    const solve = () => {
        try {
            const data = points.map(p => ({x: parseFloat(p.x), y: parseFloat(p.y)})).filter(p => !isNaN(p.x) && !isNaN(p.y));
            if (data.length < 2) throw new Error("Need at least 2 points");

            if(!estimateX.trim()) throw new Error("Please enter estimate x value");
            const xVal = parseFloat(estimateX);
            if(isNaN(xVal)) throw new Error("Invalid estimate x");

            let polynomialStr = "";
            let finalValue = 0;
            let steps: any = null;

            if (method === 'newton') {
                // Divided Differences
                const n = data.length;
                const divDiff = Array(n).fill(0).map(() => Array(n).fill(0));
                
                // Initialize column 0
                for(let i=0; i<n; i++) divDiff[i][0] = data[i].y;

                for(let j=1; j<n; j++) {
                    for(let i=0; i < n-j; i++) {
                        divDiff[i][j] = (divDiff[i+1][j-1] - divDiff[i][j-1]) / (data[i+j].x - data[i].x);
                    }
                }

                // Construct Polynomial String
                // b0 + b1(x-x0) + b2(x-x0)(x-x1) ...
                const b = divDiff[0]; // Top row is the coeffs
                let terms: string[] = [`${formatNumber(b[0])}`];
                finalValue = b[0];
                
                for(let i=1; i<n; i++) {
                    let termVal = b[i];
                    for(let k=0; k<i; k++) termVal *= (xVal - data[k].x);
                    finalValue += termVal;

                    let termStr = `${b[i] >= 0 ? '+' : '-'} ${formatNumber(Math.abs(b[i]))}`;
                    for(let k=0; k<i; k++) termStr += `(x - ${data[k].x})`;
                    terms.push(termStr);
                }
                
                polynomialStr = terms.join(" ");
                steps = { divDiff, b };
            }
            else {
                // Lagrange
                // Sum (yi * Li(x))
                const n = data.length;
                let sum = 0;
                let termsStr: string[] = [];

                for(let i=0; i<n; i++) {
                    let term = data[i].y;
                    let numStr = "";
                    let denStr = "";
                    
                    for(let j=0; j<n; j++) {
                        if (i !== j) {
                            term *= (xVal - data[j].x) / (data[i].x - data[j].x);
                            numStr += `(x - ${data[j].x})`;
                            denStr += `(${data[i].x} - ${data[j].x})`;
                        }
                    }
                    sum += term;
                    termsStr.push(`${data[i].y}[ ${numStr} / ${denStr} ]`);
                }
                finalValue = sum;
                polynomialStr = `L(x) = ` + termsStr.join(" + ");
            }

            setResult({ polynomialStr, finalValue, steps, data });

        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10">
            {/* ... rest of the existing Interpolator component ... */}
            <h3 className="text-xl font-bold text-fuchsia-200 mb-4">Interpolation</h3>
            
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <label className="text-gray-400 block mb-2">Method</label>
                    <select value={method} onChange={e => setMethod(e.target.value as any)} className="bg-white/5 border border-white/10 rounded p-2 text-white w-full">
                        <option value="newton" className="bg-slate-900">Newton's Divided Difference</option>
                        <option value="lagrange" className="bg-slate-900">Lagrange Polynomial</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-gray-400 block mb-2">Estimate value at x = ?</label>
                    <input type="number" value={estimateX} onChange={e => setEstimateX(e.target.value)} className="bg-white/5 border border-white/10 rounded p-2 text-white w-full" placeholder="e.g. 2" />
                </div>
            </div>

            <div className="mb-4">
                 <label className="text-gray-400 block mb-2">Number of Data Points</label>
                    <input 
                        type="number" 
                        min="2" 
                        max="20"
                        value={numPoints} 
                        onChange={e => setNumPoints(Math.max(2, parseInt(e.target.value) || 2))} 
                        className="bg-white/5 border border-white/10 rounded p-2 text-white w-full" 
                    />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-gray-400 font-bold text-center">X</div>
                <div className="text-gray-400 font-bold text-center">f(X)</div>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-4">
                {points.map((p, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4">
                        <input type="text" value={p.x} onChange={e => updatePoint(i, 'x', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-center" />
                        <input type="text" value={p.y} onChange={e => updatePoint(i, 'y', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-center" />
                    </div>
                ))}
            </div>
            
            <button onClick={solve} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 py-2 rounded-lg font-bold mb-6">Interpolate</button>

            {result && (
                <div className="bg-black/40 p-6 rounded border border-white/5">
                    {method === 'newton' && result.steps && (
                        <div className="mb-6 overflow-x-auto">
                            <h4 className="text-sm font-bold text-gray-400 mb-2">Divided Difference Table</h4>
                            <table className="text-sm text-right">
                                <thead>
                                    <tr className="text-fuchsia-300">
                                        <th className="p-2">x</th>
                                        <th className="p-2">f(x)</th>
                                        {result.data.slice(1).map((_:any, i:number) => <th key={i} className="p-2">Order {i+1}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.data.map((p:any, i:number) => (
                                        <tr key={i}>
                                            <td className="p-2 text-gray-300">{p.x}</td>
                                            {result.steps.divDiff[i].slice(0, result.data.length-i).map((val:number, j:number) => (
                                                <td key={j} className={`p-2 ${j===0 && i===0 ? '' : 'text-gray-400'}`}>
                                                    {formatNumber(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <h4 className="text-lg font-bold text-white mb-2">Polynomial</h4>
                    <div className="text-sm text-fuchsia-200 font-mono mb-4 break-words">{result.polynomialStr}</div>

                    <h4 className="text-lg font-bold text-white mb-2">Final Answer at x={estimateX}</h4>
                    <div className="text-3xl text-fuchsia-400 font-bold">{formatNumber(result.finalValue)}</div>
                </div>
            )}
        </div>
    );
};

export default Exam2Solver;