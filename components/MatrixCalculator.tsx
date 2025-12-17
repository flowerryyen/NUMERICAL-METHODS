import React, { useState } from 'react';
import { CalculatorIcon, ErrorIcon } from './Icons';
import { Matrix, NumberMatrix, Operation } from '../types';

interface DetStep {
    description: string;
    calculation: string;
}

const calculateDeterminant = (matrix: NumberMatrix, steps: DetStep[] = []): { value: number, steps: DetStep[] } => {
    const n = matrix.length;
    
    if (n === 1) {
        return { value: matrix[0][0], steps };
    }
    
    if (n === 2) {
        const val = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        steps.push({
            description: '2×2 Determinant',
            calculation: `(${matrix[0][0]} × ${matrix[1][1]}) - (${matrix[0][1]} × ${matrix[1][0]}) = ${parseFloat(val.toFixed(6))}`
        });
        return { value: val, steps };
    }
    
    let det = 0;
    let expansionStr = "";
    let currentSteps = [...steps];
    
    for (let j = 0; j < n; j++) {
        const minor = matrix.slice(1).map(row => row.filter((_, idx) => idx !== j));
        const { value: minorDet, steps: minorSteps } = calculateDeterminant(minor, []);
        
        currentSteps = [...currentSteps, ...minorSteps];
        
        const sign = j % 2 === 0 ? 1 : -1;
        const term = matrix[0][j] * minorDet;
        det += sign * term;
        
        const op = j === 0 ? (sign === 1 ? '' : '-') : (sign === 1 ? ' + ' : ' - ');
        expansionStr += `${op}${Math.abs(matrix[0][j])}(${parseFloat(minorDet.toFixed(4))})`;
    }
    
    currentSteps.push({
        description: `${n}×${n} Cofactor Expansion (Row 1)`,
        calculation: `${expansionStr} = ${parseFloat(det.toFixed(6))}`
    });
    
    return { value: det, steps: currentSteps };
};

const MatrixCalculator: React.FC = () => {
    const [rowsA, setRowsA] = useState<number>(2);
    const [colsA, setColsA] = useState<number>(2);
    const [rowsB, setRowsB] = useState<number>(2);
    const [colsB, setColsB] = useState<number>(2);
    
    // Using string arrays for input to handle empty states and partial inputs gracefully
    // Initialize blank
    const [matrixA, setMatrixA] = useState<Matrix>([['', ''], ['', '']]);
    const [matrixB, setMatrixB] = useState<Matrix>([['', ''], ['', '']]);
    
    const [operation, setOperation] = useState<Operation>('add');
    const [result, setResult] = useState<NumberMatrix | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [detSteps, setDetSteps] = useState<DetStep[]>([]);

    const updateMatrixSizeA = (newRowsVal: string, newColsVal: string) => {
        const r = Math.min(Math.max(parseInt(newRowsVal) || 2, 1), 10);
        const c = Math.min(Math.max(parseInt(newColsVal) || 2, 1), 10);
        
        setRowsA(r);
        setColsA(c);
        
        const newA = Array(r).fill(0).map((_, i) => 
            Array(c).fill(0).map((_, j) => matrixA[i]?.[j] || '')
        );
        setMatrixA(newA);
        setResult(null);
        setError(null);
        setDetSteps([]);
    };

    const updateMatrixSizeB = (newRowsVal: string, newColsVal: string) => {
        const r = Math.min(Math.max(parseInt(newRowsVal) || 2, 1), 10);
        const c = Math.min(Math.max(parseInt(newColsVal) || 2, 1), 10);
        
        setRowsB(r);
        setColsB(c);
        
        const newB = Array(r).fill(0).map((_, i) => 
            Array(c).fill(0).map((_, j) => matrixB[i]?.[j] || '')
        );
        setMatrixB(newB);
        setResult(null);
        setError(null);
    };

    const updateCell = (matrixName: 'A' | 'B', row: number, col: number, value: string) => {
        if (matrixName === 'A') {
            const newMatrix = matrixA.map((r, i) => 
                r.map((c, j) => (i === row && j === col) ? value : c)
            );
            setMatrixA(newMatrix);
        } else {
            const newMatrix = matrixB.map((r, i) => 
                r.map((c, j) => (i === row && j === col) ? value : c)
            );
            setMatrixB(newMatrix);
        }
        setResult(null);
        setError(null);
        setDetSteps([]);
    };

    const calculate = () => {
        try {
            setError(null);
            setDetSteps([]);
            
            const A = matrixA.map(row => row.map(val => {
                if(!val.trim()) throw new Error("Please fill in all matrix cells");
                const num = parseFloat(val);
                if (isNaN(num)) throw new Error('Invalid input in Matrix A: Please enter valid numbers in all cells');
                return num;
            }));
            
            let B: NumberMatrix = [];
            if (operation !== 'determinant') {
                B = matrixB.map(row => row.map(val => {
                    if(!val.trim()) throw new Error("Please fill in all matrix cells");
                    const num = parseFloat(val);
                    if (isNaN(num)) throw new Error('Invalid input in Matrix B: Please enter valid numbers in all cells');
                    return num;
                }));
            }
            
            let res: NumberMatrix = [];

            if (operation === 'add' || operation === 'subtract') {
                if (A.length !== B.length || A[0].length !== B[0].length) {
                    throw new Error(`${operation === 'add' ? 'Addition' : 'Subtraction'} Error: Matrices must have the same dimensions. Matrix A is ${A.length}×${A[0].length}, Matrix B is ${B.length}×${B[0].length}`);
                }
                
                if (operation === 'add') {
                    res = A.map((row, i) => row.map((val, j) => parseFloat((val + B[i][j]).toFixed(6))));
                } else {
                    res = A.map((row, i) => row.map((val, j) => parseFloat((val - B[i][j]).toFixed(6))));
                }
            } else if (operation === 'multiply') {
                if (A[0].length !== B.length) {
                    throw new Error(`Multiplication Error: Cannot multiply ${A.length}×${A[0].length} matrix with ${B.length}×${B[0].length} matrix. Number of columns in Matrix A (${A[0].length}) must equal number of rows in Matrix B (${B.length})`);
                }
                
                res = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0));
                for (let i = 0; i < A.length; i++) {
                    for (let j = 0; j < B[0].length; j++) {
                        for (let k = 0; k < A[0].length; k++) {
                            res[i][j] += A[i][k] * B[k][j];
                        }
                        res[i][j] = parseFloat(res[i][j].toFixed(6));
                    }
                }
            } else if (operation === 'determinant') {
                if (A.length !== A[0].length) {
                    throw new Error(`Determinant Error: Matrix A must be square. Current dimensions are ${A.length}×${A[0].length}.`);
                }
                const { value, steps } = calculateDeterminant(A);
                setDetSteps(steps);
                res = [[parseFloat(value.toFixed(6))]];
            }

            setResult(res);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred');
            setResult(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/80 to-indigo-600/80 rounded-xl p-6 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <CalculatorIcon />
                    <h3 className="text-2xl font-bold drop-shadow-md">Matrix Calculator</h3>
                </div>
                <p className="opacity-90 text-blue-50">Perform matrix operations with step-by-step solutions</p>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                <h4 className="text-lg font-semibold mb-4 text-blue-100">
                    {operation === 'determinant' ? 'Matrix Configuration' : 'Matrix Dimensions'}
                </h4>
                
                <div className="mb-6">
                    <h5 className="text-md font-semibold text-blue-300 mb-3">Matrix A Dimensions</h5>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rows</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={rowsA}
                                onChange={(e) => updateMatrixSizeA(e.target.value, String(colsA))}
                                className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Columns</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={colsA}
                                onChange={(e) => updateMatrixSizeA(String(rowsA), e.target.value)}
                                className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none"
                            />
                        </div>
                    </div>
                </div>

                {operation !== 'determinant' && (
                    <div className="mb-6">
                        <h5 className="text-md font-semibold text-indigo-300 mb-3">Matrix B Dimensions</h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Rows</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    value={rowsB}
                                    onChange={(e) => updateMatrixSizeB(e.target.value, String(colsB))}
                                    className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Columns</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="10" 
                                    value={colsB}
                                    onChange={(e) => updateMatrixSizeB(String(rowsB), e.target.value)}
                                    className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 className="text-lg font-semibold mb-3 text-blue-300">Matrix A ({rowsA}×{colsA})</h4>
                        <div className="space-y-2 overflow-x-auto pb-2">
                            {matrixA.map((row, i) => (
                                <div key={i} className="flex gap-2 min-w-max">
                                    {row.map((val, j) => (
                                        <input
                                            key={j}
                                            type="text"
                                            value={val}
                                            onChange={(e) => updateCell('A', i, j, e.target.value)}
                                            className="w-16 px-2 py-2 border border-white/10 bg-black/20 rounded-lg text-center focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-500 focus:outline-none transition-all"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {operation !== 'determinant' && (
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-indigo-300">Matrix B ({rowsB}×{colsB})</h4>
                            <div className="space-y-2 overflow-x-auto pb-2">
                                {matrixB.map((row, i) => (
                                    <div key={i} className="flex gap-2 min-w-max">
                                        {row.map((val, j) => (
                                            <input
                                                key={j}
                                                type="text"
                                                value={val}
                                                onChange={(e) => updateCell('B', i, j, e.target.value)}
                                                className="w-16 px-2 py-2 border border-white/10 bg-black/20 rounded-lg text-center focus:ring-2 focus:ring-indigo-400 text-white placeholder-gray-500 focus:outline-none transition-all"
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Operation</label>
                    <select 
                        value={operation}
                        onChange={(e) => { setOperation(e.target.value as Operation); setResult(null); setError(null); setDetSteps([]); }}
                        className="w-full px-4 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white/5 text-white transition-all appearance-none cursor-pointer hover:bg-white/10"
                    >
                        <option value="add" className="bg-slate-900">Addition (A + B)</option>
                        <option value="subtract" className="bg-slate-900">Subtraction (A - B)</option>
                        <option value="multiply" className="bg-slate-900">Multiplication (A × B)</option>
                        <option value="determinant" className="bg-slate-900">Determinant (Det A)</option>
                    </select>
                </div>

                <button
                    onClick={calculate}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-white/10"
                >
                    Calculate
                </button>
            </div>

            {error && (
                <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-fade-in backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <ErrorIcon />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-red-200 mb-2">Error</h4>
                            <p className="text-red-300 font-medium">{error}</p>
                            <div className="mt-4 bg-red-950/50 border border-red-900 rounded-lg p-4">
                                <p className="text-sm text-red-300">
                                    <strong>Tip:</strong> {operation === 'multiply' 
                                        ? 'For matrix multiplication A×B, the number of columns in A must equal the number of rows in B.'
                                        : operation === 'determinant'
                                        ? 'Determinant can only be calculated for square matrices (Rows = Columns).'
                                        : 'For addition and subtraction, both matrices must have exactly the same dimensions.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/10">
                    <h4 className="text-xl font-bold mb-4 text-white">Solution Process</h4>
                    
                    <div className="bg-black/40 rounded-lg p-4 mb-4 border border-white/5">
                        {operation === 'determinant' ? (
                            <div className="space-y-4">
                                <p className="text-gray-300 font-medium border-b border-gray-700 pb-2">
                                    Recursive Cofactor Expansion (Laplace Expansion)
                                </p>
                                <div className="max-h-96 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                    {detSteps.length > 0 ? detSteps.map((step, idx) => (
                                        <div key={idx} className="border-b border-gray-700 pb-2 last:border-0">
                                            <div className="text-sm font-semibold text-blue-300 mb-1">{step.description}</div>
                                            <div className="font-mono text-gray-400 text-sm overflow-x-auto">
                                                {step.calculation}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500">No complex steps required (1×1 matrix).</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-300 font-medium mb-3">
                                    {operation === 'add' ? 'Addition: Add corresponding elements' : 
                                     operation === 'subtract' ? 'Subtraction: Subtract corresponding elements' :
                                     'Multiplication: Dot product of rows and columns'}
                                </p>
                                
                                {operation !== 'multiply' ? (
                                    <div className="space-y-3">
                                        {result.map((row, i) => (
                                            <div key={i} className="flex items-center gap-3 flex-wrap">
                                                <span className="text-gray-400 font-semibold">Row {i + 1}:</span>
                                                {row.map((val, j) => (
                                                    <span key={j} className="text-sm bg-white/5 px-3 py-1 rounded border border-white/10 text-gray-300">
                                                        {matrixA[i][j]} {operation === 'add' ? '+' : '−'} {matrixB[i][j]} = <strong className="text-blue-300">{val}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                        {result.map((row, i) => (
                                            <div key={i} className="border-b border-gray-700 pb-2 last:border-0">
                                                <span className="font-medium text-gray-400">Result Row {i + 1}:</span>
                                                {row.map((val, j) => (
                                                    <div key={j} className="ml-4 text-sm text-gray-500 mt-1">
                                                        <strong>Position [{i+1},{j+1}]:</strong> {matrixA[i].map((a, k) => `(${a}×${matrixB[k][j]})`).join(' + ')} = <strong className="text-blue-300">{val}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-green-500/30">
                        <h5 className="text-lg font-bold mb-3 text-white">
                            {operation === 'determinant' ? 'Determinant Value' : `Final Answer (${result.length}×{result[0].length})`}
                        </h5>
                        <div className="space-y-2 overflow-x-auto">
                            {result.map((row, i) => (
                                <div key={i} className="flex gap-3 min-w-max">
                                    {row.map((val, j) => (
                                        <div key={j} className="bg-black/20 px-4 py-3 rounded-lg border border-blue-400/50 font-bold text-blue-300 text-center min-w-[70px] shadow-lg">
                                            {val}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatrixCalculator;