import React, { useState, useEffect } from 'react';
import { GridIcon, ErrorIcon } from './Icons';
import { NumberMatrix } from '../types';

type SolveMethod = 'gauss' | 'gauss-pivot' | 'gauss-jordan' | 'jacobi' | 'gauss-seidel';

interface DirectStep {
    title: string;
    description: string;
    matrix: NumberMatrix;
    highlightRow?: number;
    highlightCol?: number;
}

interface IterativeRow {
    iteration: number;
    values: number[];
    error: number;
}

interface IterativeResult {
    formulas: string[];
    samples: string[];
    rows: IterativeRow[];
}

// Helper for formatting decimals as requested
// "6 decimal places only if its 99 then make it 7 decimal places"
// "if the decimal is lower than 6 then just copy its decimal no need to add zeros in the last digits"
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

const LinearSystemSolver: React.FC = () => {
    const [numVars, setNumVars] = useState<number>(3);
    // Initialize with empty strings
    const [matrix, setMatrix] = useState<string[][]>([]);
    const [method, setMethod] = useState<SolveMethod>('gauss');
    // Start blank
    const [tolerance, setTolerance] = useState<string>("");
    
    // Results
    const [directSteps, setDirectSteps] = useState<DirectStep[]>([]);
    const [iterativeResult, setIterativeResult] = useState<IterativeResult | null>(null);
    const [finalSolution, setFinalSolution] = useState<number[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize matrix when numVars changes
    useEffect(() => {
        // Use empty string '' instead of '0'
        const newMatrix = Array(numVars).fill(0).map(() => Array(numVars + 1).fill(''));
        setMatrix(newMatrix);
        setDirectSteps([]);
        setIterativeResult(null);
        setFinalSolution(null);
        setError(null);
    }, [numVars]);

    const updateCell = (row: number, col: number, value: string) => {
        const newMatrix = [...matrix];
        newMatrix[row][col] = value;
        setMatrix(newMatrix);
        setDirectSteps([]);
        setIterativeResult(null);
        setFinalSolution(null);
        setError(null);
    };

    const cloneMatrix = (m: NumberMatrix): NumberMatrix => m.map(row => [...row]);

    const solve = () => {
        try {
            setError(null);
            setDirectSteps([]);
            setIterativeResult(null);
            setFinalSolution(null);

            // Parse Input
            const M: NumberMatrix = matrix.map(row => row.map(val => {
                if(!val.trim()) throw new Error("Please fill in all matrix cells.");
                const num = parseFloat(val);
                if (isNaN(num)) throw new Error("Invalid input: Please ensure all coefficients are numbers.");
                return num;
            }));

            if (method === 'jacobi' || method === 'gauss-seidel') {
                solveIterative(M);
            } else {
                solveDirect(M);
            }

        } catch (err: any) {
            setError(err.message);
        }
    };

    const solveDirect = (M: NumberMatrix) => {
        const n = numVars;
        const steps: DirectStep[] = [];
        
        steps.push({
            title: "Initial Augmented Matrix",
            description: "Setup the system as [A|B]",
            matrix: cloneMatrix(M)
        });

        const workM = cloneMatrix(M);

        // Forward Elimination
        for (let k = 0; k < n; k++) {
            let pivotRow = k;
            if (method === 'gauss-pivot') {
                let maxVal = Math.abs(workM[k][k]);
                for (let i = k + 1; i < n; i++) {
                    if (Math.abs(workM[i][k]) > maxVal) {
                        maxVal = Math.abs(workM[i][k]);
                        pivotRow = i;
                    }
                }
            } else {
                if (Math.abs(workM[k][k]) < 1e-10) {
                    for (let i = k + 1; i < n; i++) {
                        if (Math.abs(workM[i][k]) > 1e-10) {
                            pivotRow = i;
                            break;
                        }
                    }
                }
            }

            if (Math.abs(workM[pivotRow][k]) < 1e-10) {
                throw new Error(`Singular matrix encountered. Column ${k+1} has no valid pivot.`);
            }

            if (pivotRow !== k) {
                [workM[k], workM[pivotRow]] = [workM[pivotRow], workM[k]];
                steps.push({
                    title: `Pivoting (Column ${k + 1})`,
                    description: `Swap Row ${k + 1} with Row ${pivotRow + 1} to get a better pivot.`,
                    matrix: cloneMatrix(workM),
                    highlightRow: k
                });
            }

            if (method === 'gauss-jordan') {
                const pivot = workM[k][k];
                if (Math.abs(pivot - 1) > 1e-10) {
                    for (let j = k; j <= n; j++) {
                        workM[k][j] /= pivot;
                    }
                    steps.push({
                        title: `Normalize Row ${k + 1}`,
                        description: `Divide Row ${k + 1} by ${parseFloat(pivot.toFixed(4))} to make pivot 1.`,
                        matrix: cloneMatrix(workM),
                        highlightRow: k
                    });
                }

                for (let i = 0; i < n; i++) {
                    if (i !== k) {
                        const factor = workM[i][k];
                        if (Math.abs(factor) > 1e-10) {
                            for (let j = k; j <= n; j++) {
                                workM[i][j] -= factor * workM[k][j];
                            }
                            steps.push({
                                title: `Eliminate Var ${k + 1} from Row ${i + 1}`,
                                description: `R${i + 1} -> R${i + 1} - (${parseFloat(factor.toFixed(4))}) * R${k + 1}`,
                                matrix: cloneMatrix(workM),
                                highlightRow: i
                            });
                        }
                    }
                }
            } else {
                for (let i = k + 1; i < n; i++) {
                    const factor = workM[i][k] / workM[k][k];
                    if (Math.abs(factor) > 1e-10) {
                        for (let j = k; j <= n; j++) {
                            workM[i][j] -= factor * workM[k][j];
                        }
                        workM[i][k] = 0; 
                        steps.push({
                            title: `Eliminate Var ${k + 1} from Row ${i + 1}`,
                            description: `R${i + 1} -> R${i + 1} - (${parseFloat(factor.toFixed(4))}) * R${k + 1}`,
                            matrix: cloneMatrix(workM),
                            highlightRow: i
                        });
                    }
                }
            }
        }

        const x = Array(n).fill(0);
        
        if (method === 'gauss-jordan') {
            for (let i = 0; i < n; i++) {
                x[i] = workM[i][n];
            }
            steps.push({
                title: "Reduced Row Echelon Form Reached",
                description: "The matrix is now in RREF. The last column contains the solution.",
                matrix: cloneMatrix(workM)
            });
        } else {
            steps.push({
                title: "Row Echelon Form Reached",
                description: "Now performing back substitution to find variables.",
                matrix: cloneMatrix(workM)
            });

            for (let i = n - 1; i >= 0; i--) {
                let sum = 0;
                for (let j = i + 1; j < n; j++) {
                    sum += workM[i][j] * x[j];
                }
                x[i] = (workM[i][n] - sum) / workM[i][i];
            }
        }

        setDirectSteps(steps);
        setFinalSolution(x);
    };

    const solveIterative = (M: NumberMatrix) => {
        const n = numVars;
        if(!tolerance.trim()) throw new Error("Please enter tolerance value");
        const tol = parseFloat(tolerance);
        if (isNaN(tol) || tol <= 0) throw new Error("Please enter a valid positive tolerance value.");

        const A = M.map(row => row.slice(0, n));
        const B = M.map(row => row[n]);

        // Check diagonal non-zeros
        for (let i = 0; i < n; i++) {
            if (Math.abs(A[i][i]) < 1e-10) {
                throw new Error(`Diagonal element in row ${i + 1} is zero or too close to zero. Iterative methods require non-zero diagonal elements. Please reorder your equations.`);
            }
        }

        // Generate Formulas
        const formulaStrs: string[] = [];
        for(let i=0; i<n; i++) {
            let rhsParts: string[] = [`${B[i]}`];
            for(let j=0; j<n; j++) {
                if (i === j) continue;
                if (Math.abs(A[i][j]) < 1e-10) continue;
                const sign = A[i][j] >= 0 ? '-' : '+';
                const varTag = (method === 'gauss-seidel' && j < i) ? '⁽ᵏ⁺¹⁾' : '⁽ᵏ⁾';
                rhsParts.push(`${sign} ${Math.abs(A[i][j])}x_${j+1}${varTag}`);
            }
            formulaStrs.push(`x_${i+1}⁽ᵏ⁺¹⁾ = (${rhsParts.join(' ')}) / ${A[i][i]}`);
        }

        let x = Array(n).fill(0);
        const rows: IterativeRow[] = [];
        const samples: string[] = [];

        // Initial state
        rows.push({ iteration: 0, values: [...x], error: 0 });

        let converged = false;
        let iter = 0;
        const maxIter = 15;

        while (!converged && iter < maxIter) {
            iter++;
            const prevX = [...x]; // State at start of iteration
            const nextX = method === 'jacobi' ? Array(n).fill(0) : x; // For Seidel we update in place, but we need separate var logic for logic clarity

            for(let i=0; i<n; i++) {
                let sum = 0;
                let sampleParts: string[] = [];

                for(let j=0; j<n; j++) {
                    if (i === j) continue;
                    // For Jacobi, use prevX[j]. For Seidel, use x[j] (which acts as current state including updates)
                    const val = method === 'jacobi' ? prevX[j] : x[j];
                    sum += A[i][j] * val;
                    
                    if (iter === 1) {
                         const sign = A[i][j] >= 0 ? '-' : '+';
                         sampleParts.push(`${sign} ${Math.abs(A[i][j])}(${val})`);
                    }
                }

                const newVal = (B[i] - sum) / A[i][i];
                
                if (iter === 1) {
                    samples.push(`x_${i+1}⁽¹⁾ = (${B[i]} ${sampleParts.join(' ')}) / ${A[i][i]} = ${parseFloat(newVal.toFixed(6))}`);
                }

                if (method === 'jacobi') {
                    nextX[i] = newVal;
                } else {
                    x[i] = newVal;
                }
            }

            if (method === 'jacobi') {
                x = nextX;
            }

            // Calculate Error (Euclidean distance or Max absolute diff)
            // Using max absolute difference for standard textbook convergence check
            let maxErr = 0;
            for(let i=0; i<n; i++) {
                maxErr = Math.max(maxErr, Math.abs(x[i] - prevX[i]));
            }

            rows.push({ iteration: iter, values: [...x], error: maxErr });

            if (maxErr < tol) {
                converged = true;
            }
        }

        if (!converged) {
            setError(`Method did not converge within ${maxIter} iterations. The system might not be diagonally dominant.`);
        }

        setIterativeResult({ formulas: formulaStrs, samples, rows });
        setFinalSolution(x);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500/80 via-teal-500/80 to-cyan-600/80 rounded-xl p-6 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)] backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <GridIcon />
                    <h3 className="text-2xl font-bold drop-shadow-md">Linear System Solver</h3>
                </div>
                <p className="opacity-90 font-medium text-teal-50">
                    Solve systems of equations using Direct or Iterative Methods.
                </p>
            </div>

            {/* Input Configuration */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-teal-200 mb-2">Number of Variables</label>
                        <select 
                            value={numVars}
                            onChange={(e) => setNumVars(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                            {[2, 3, 4, 5].map(n => (
                                <option key={n} value={n} className="bg-slate-900">{n} Variables</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-teal-200 mb-2">Solving Method</label>
                        <select 
                            value={method}
                            onChange={(e) => {
                                setMethod(e.target.value as SolveMethod);
                                setDirectSteps([]);
                                setIterativeResult(null);
                                setFinalSolution(null);
                            }}
                            className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none cursor-pointer hover:bg-white/10"
                        >
                            <optgroup label="Direct Methods" className="bg-slate-900">
                                <option value="gauss">Gauss Elimination</option>
                                <option value="gauss-pivot">Gauss Elimination (Max Pivot)</option>
                                <option value="gauss-jordan">Gauss-Jordan</option>
                            </optgroup>
                            <optgroup label="Iterative Methods" className="bg-slate-900">
                                <option value="jacobi">Jacobi Iteration</option>
                                <option value="gauss-seidel">Gauss-Seidel Iteration</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {/* Conditional Tolerance Input */}
                {(method === 'jacobi' || method === 'gauss-seidel') && (
                    <div className="mb-6 animate-fade-in">
                        <label className="block text-sm font-semibold text-teal-200 mb-2">Tolerance (ε)</label>
                        <input 
                            type="number"
                            step="0.000001"
                            value={tolerance}
                            onChange={(e) => setTolerance(e.target.value)}
                            className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none"
                            placeholder="e.g. 0.0001"
                        />
                        <p className="text-xs text-teal-300/60 mt-1">Stopping criterion for iteration error.</p>
                    </div>
                )}

                {/* Matrix Input */}
                <div className="mb-6 overflow-x-auto">
                    <h4 className="text-lg font-semibold text-teal-100 mb-3">Input Augmented Matrix [A|B]</h4>
                    <p className="text-sm text-teal-300/70 mb-4">Enter the coefficients for the equations in the grid below.</p>
                    
                    <div className="inline-block min-w-full">
                        {matrix.map((row, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-teal-400/70 w-8 text-right font-bold">R{i+1}</span>
                                <div className="flex gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                    {row.map((val, j) => (
                                        <React.Fragment key={j}>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={val}
                                                    onChange={(e) => updateCell(i, j, e.target.value)}
                                                    className={`w-20 px-2 py-2 border rounded text-center focus:ring-2 focus:outline-none transition-all font-mono ${
                                                        j === numVars 
                                                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-200 focus:ring-teal-400' 
                                                        : 'border-white/10 bg-black/20 text-white focus:ring-teal-400 hover:border-teal-500/30'
                                                    }`}
                                                    placeholder={j === numVars ? 'b' : `x${j+1}`}
                                                />
                                                {j < numVars && <span className="absolute -right-3 top-2 text-teal-500/50 text-xs hidden sm:inline select-none">x{j+1}</span>}
                                            </div>
                                            {j === numVars - 1 && <div className="w-px bg-white/20 h-8 mx-1"></div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={solve}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:from-emerald-400 hover:to-cyan-500 transition-all transform hover:scale-[1.01] shadow-[0_0_20px_rgba(20,184,166,0.3)] border border-white/10"
                >
                    Solve System
                </button>
            </div>

            {error && (
                <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-fade-in backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <ErrorIcon />
                        <div>
                            <h4 className="text-xl font-bold text-red-200 mb-1">Error</h4>
                            <p className="text-red-300">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {finalSolution && (
                <div className="space-y-6 animate-fade-in">
                    {/* Final Answer */}
                    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-teal-500/30 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
                        <h4 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">Final Solution</h4>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {finalSolution.map((val, idx) => (
                                <div key={idx} className="bg-gradient-to-br from-teal-500/10 to-transparent px-6 py-4 rounded-xl border border-teal-500/20 flex flex-col items-center min-w-[120px] shadow-lg group-hover:border-teal-400/40 transition-colors">
                                    <span className="text-teal-400 font-mono mb-1 text-sm font-bold">x<sub>{idx + 1}</sub></span>
                                    <span className="text-2xl font-bold text-white drop-shadow-md">
                                        {Math.abs(val) < 1e-10 ? 0 : parseFloat(val.toFixed(6))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DIRECT METHODS STEPS */}
                    {directSteps.length > 0 && (
                        <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                            <h4 className="text-xl font-bold text-white mb-6">Step-by-Step Process</h4>
                            <div className="space-y-8">
                                {directSteps.map((step, idx) => (
                                    <div key={idx} className="relative pl-8 border-l-2 border-white/10 hover:border-teal-400 transition-colors group">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] group-hover:bg-teal-400 transition-colors"></div>
                                        <div className="mb-3">
                                            <h5 className="font-bold text-lg text-teal-100 group-hover:text-teal-300 transition-colors">{step.title}</h5>
                                            <p className="text-gray-400 text-sm">{step.description}</p>
                                        </div>
                                        <div className="overflow-x-auto bg-black/40 p-4 rounded-xl inline-block border border-white/10 shadow-inner">
                                            {step.matrix.map((row, rIdx) => (
                                                <div key={rIdx} className={`flex gap-3 font-mono text-sm mb-1 px-2 rounded ${step.highlightRow === rIdx ? 'bg-yellow-500/10 text-yellow-200 border border-yellow-500/20' : ''}`}>
                                                    <span className="w-4 text-gray-600 select-none">|</span>
                                                    {row.map((val, cIdx) => (
                                                        <React.Fragment key={cIdx}>
                                                            <span className={`w-24 text-right ${cIdx === numVars ? 'font-bold text-teal-200 pl-4 border-l border-white/10' : 'text-gray-300'}`}>
                                                                {parseFloat(val.toFixed(4))}
                                                            </span>
                                                        </React.Fragment>
                                                    ))}
                                                    <span className="w-4 text-gray-600 text-right select-none">|</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ITERATIVE METHODS STEPS */}
                    {iterativeResult && (
                        <div className="space-y-6">
                            {/* Formulas Card */}
                            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                <h4 className="text-xl font-bold text-white mb-4">Iteration Formulas</h4>
                                <div className="space-y-2 bg-black/40 p-4 rounded-lg border border-white/5">
                                    {iterativeResult.formulas.map((f, i) => (
                                        <div key={i} className="font-mono text-teal-200 text-sm md:text-base">{f}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Samples Card */}
                            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                                <h4 className="text-xl font-bold text-white mb-4">Substituted Values (Iteration 1)</h4>
                                <div className="space-y-2 bg-black/40 p-4 rounded-lg border border-white/5">
                                    {iterativeResult.samples.map((s, i) => (
                                        <div key={i} className="font-mono text-gray-300 text-sm md:text-base break-words">
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Table Card */}
                            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10 overflow-hidden">
                                <h4 className="text-xl font-bold text-white mb-4">Iteration Table</h4>
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/20 text-teal-300">
                                                <th className="p-3 text-sm font-bold">Iter</th>
                                                {Array.from({length: numVars}).map((_, i) => (
                                                    <th key={i} className="p-3 text-sm font-bold">x<sub>{i+1}</sub></th>
                                                ))}
                                                <th className="p-3 text-sm font-bold">Max Error</th>
                                            </tr>
                                        </thead>
                                        <tbody className="font-mono text-sm">
                                            {iterativeResult.rows.map((row, i) => (
                                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-3 text-gray-400">{row.iteration}</td>
                                                    {row.values.map((v, j) => (
                                                        <td key={j} className="p-3 text-white">{formatNumber(v)}</td>
                                                    ))}
                                                    <td className="p-3 text-yellow-300">{formatNumber(row.error)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LinearSystemSolver;