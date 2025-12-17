import React, { useState } from 'react';
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

const Exam4Solver: React.FC = () => {
    const [tool, setTool] = useState<'rk4' | 'higher'>('rk4');

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Tool Selector */}
            <div className="bg-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col md:flex-row gap-2 border border-white/10 shadow-lg">
                <button
                    onClick={() => setTool('rk4')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        tool === 'rk4' 
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    4th Order Runge-Kutta
                </button>
                <button
                    onClick={() => setTool('higher')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        tool === 'higher' 
                        ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' 
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                >
                    Higher Order ODE
                </button>
            </div>

            {tool === 'rk4' ? <RK4Solver /> : <HigherOrderSolver />}
        </div>
    );
};

// ==========================================
// CLASSICAL RK4 SOLVER (1st Order)
// ==========================================
const RK4Solver: React.FC = () => {
    const [funcStr, setFuncStr] = useState("");
    const [x0, setX0] = useState("");
    const [y0, setY0] = useState("");
    const [hVal, setHVal] = useState("");
    const [targetX, setTargetX] = useState("");

    const [steps, setSteps] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const solve = () => {
        try {
            setError(null);
            setSteps([]);

            if (!funcStr.trim() || !x0.trim() || !y0.trim() || !hVal.trim() || !targetX.trim()) {
                throw new Error("Please fill in all fields.");
            }

            const x_start = parseFloat(x0);
            const y_start = parseFloat(y0);
            const h = parseFloat(hVal);
            const x_end = parseFloat(targetX);

            if (isNaN(x_start) || isNaN(y_start) || isNaN(h) || isNaN(x_end)) {
                throw new Error("Invalid numerical inputs.");
            }
            if (h <= 0) throw new Error("Step size must be positive.");
            if (x_end <= x_start) throw new Error("Target X must be greater than Initial X.");

            const node = math.parse(funcStr);
            const f = (x: number, y: number) => {
                return Number(node.evaluate({ x, y }));
            };

            const iterations = [];
            let currX = x_start;
            let currY = y_start;
            const maxIter = 100; // safety break

            // To avoid infinite loops with float precision, verify step count
            const numStepsEstimate = Math.ceil((x_end - x_start) / h);
            if (numStepsEstimate > 100) throw new Error("Step size too small (too many iterations). Increase h.");

            let i = 0;
            while (currX < x_end - 1e-9 && i < maxIter) {
                const k1 = f(currX, currY);
                const k2 = f(currX + 0.5*h, currY + 0.5*k1*h);
                const k3 = f(currX + 0.5*h, currY + 0.5*k2*h);
                const k4 = f(currX + h, currY + k3*h);

                const slope = (k1 + 2*k2 + 2*k3 + k4) / 6;
                const nextY = currY + slope * h;
                const nextX = currX + h;

                iterations.push({
                    iter: i,
                    xi: currX,
                    yi: currY,
                    k1, k2, k3, k4,
                    slope,
                    nextY,
                    nextX
                });

                currX = nextX;
                currY = nextY;
                i++;
            }

            setSteps(iterations);

        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-bold text-cyan-200 mb-6">Runge-Kutta 4th Order Method</h3>
                <p className="text-sm text-gray-400 mb-6">Solving first order ODE: <span className="font-mono text-white">dy/dx = f(x, y)</span></p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-3">
                        <label className="block text-sm text-gray-400 mb-1">Function f(x, y)</label>
                        <input type="text" value={funcStr} onChange={e => setFuncStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono" placeholder="e.g. x + y" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial x (x₀)</label>
                        <input type="number" value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial y (y₀)</label>
                        <input type="number" value={y0} onChange={e => setY0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="1" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Step Size (h)</label>
                        <input type="number" value={hVal} onChange={e => setHVal(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0.1" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Target x</label>
                        <input type="number" value={targetX} onChange={e => setTargetX(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0.2" />
                    </div>
                </div>

                <button onClick={solve} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg">
                    Solve ODE
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {steps.length > 0 && (
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 overflow-hidden">
                     <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Iteration Table</h4>
                     
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-center border-collapse">
                            <thead>
                                <tr className="text-cyan-300 border-b border-white/20 bg-white/5">
                                    <th className="p-3 whitespace-nowrap">i</th>
                                    <th className="p-3 whitespace-nowrap">x<sub>i</sub></th>
                                    <th className="p-3 whitespace-nowrap">y<sub>i</sub></th>
                                    <th className="p-3 whitespace-nowrap">k₁</th>
                                    <th className="p-3 whitespace-nowrap">k₂</th>
                                    <th className="p-3 whitespace-nowrap">k₃</th>
                                    <th className="p-3 whitespace-nowrap">k₄</th>
                                    <th className="p-3 whitespace-nowrap font-bold">y<sub>i+1</sub></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono">
                                {steps.map((row) => (
                                    <tr key={row.iter} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-gray-500">{row.iter}</td>
                                        <td className="p-3 text-gray-300">{formatNumber(row.xi)}</td>
                                        <td className="p-3 text-gray-300">{formatNumber(row.yi)}</td>
                                        <td className="p-3 text-cyan-200/70">{formatNumber(row.k1)}</td>
                                        <td className="p-3 text-cyan-200/70">{formatNumber(row.k2)}</td>
                                        <td className="p-3 text-cyan-200/70">{formatNumber(row.k3)}</td>
                                        <td className="p-3 text-cyan-200/70">{formatNumber(row.k4)}</td>
                                        <td className="p-3 font-bold text-white bg-cyan-900/20">{formatNumber(row.nextY)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>

                     <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl">
                         <h5 className="text-sm font-bold text-cyan-200 mb-2">Final Answer</h5>
                         <p className="text-2xl font-bold text-white">
                             y({formatNumber(steps[steps.length-1].nextX)}) ≈ {formatNumber(steps[steps.length-1].nextY)}
                         </p>
                     </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// HIGHER ORDER ODE SOLVER (2nd Order -> System)
// ==========================================
const HigherOrderSolver: React.FC = () => {
    const [funcStr, setFuncStr] = useState("");
    const [x0, setX0] = useState("");
    const [y0, setY0] = useState("");
    const [z0, setZ0] = useState(""); // y'
    const [hVal, setHVal] = useState("");
    const [targetX, setTargetX] = useState("");

    const [steps, setSteps] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const solve = () => {
        try {
            setError(null);
            setSteps([]);

            if (!funcStr.trim() || !x0.trim() || !y0.trim() || !z0.trim() || !hVal.trim() || !targetX.trim()) {
                throw new Error("Please fill in all fields.");
            }

            const x_start = parseFloat(x0);
            const y_start = parseFloat(y0);
            const z_start = parseFloat(z0);
            const h = parseFloat(hVal);
            const x_end = parseFloat(targetX);

            if (isNaN(x_start) || isNaN(y_start) || isNaN(z_start) || isNaN(h) || isNaN(x_end)) {
                throw new Error("Invalid numerical inputs.");
            }
            if (h <= 0) throw new Error("Step size must be positive.");
            if (x_end <= x_start) throw new Error("Target X must be greater than Initial X.");

            // System:
            // dy/dx = z  (= f1(x, y, z))
            // dz/dx = f(x, y, z) (= f2(x, y, z)) where z represents y'

            const node = math.parse(funcStr);
            // f2 is the second derivative function provided by user: y'' = f(x, y, y')
            // User inputs f(x, y, z) where z is y'
            const f2 = (x: number, y: number, z: number) => {
                return Number(node.evaluate({ x, y, z })); // z variable in mathjs expression
            };
            const f1 = (x: number, y: number, z: number) => z;

            const iterations = [];
            let currX = x_start;
            let currY = y_start;
            let currZ = z_start;
            const maxIter = 100;

            const numStepsEstimate = Math.ceil((x_end - x_start) / h);
            if (numStepsEstimate > 100) throw new Error("Step size too small (too many iterations). Increase h.");

            let i = 0;
            while (currX < x_end - 1e-9 && i < maxIter) {
                // RK4 for Systems
                // k1
                const k1_y = f1(currX, currY, currZ);
                const k1_z = f2(currX, currY, currZ);

                // k2
                const k2_y = f1(currX + 0.5*h, currY + 0.5*k1_y*h, currZ + 0.5*k1_z*h);
                const k2_z = f2(currX + 0.5*h, currY + 0.5*k1_y*h, currZ + 0.5*k1_z*h);

                // k3
                const k3_y = f1(currX + 0.5*h, currY + 0.5*k2_y*h, currZ + 0.5*k2_z*h);
                const k3_z = f2(currX + 0.5*h, currY + 0.5*k2_y*h, currZ + 0.5*k2_z*h);

                // k4
                const k4_y = f1(currX + h, currY + k3_y*h, currZ + k3_z*h);
                const k4_z = f2(currX + h, currY + k3_y*h, currZ + k3_z*h);

                // Slope averages
                const slope_y = (k1_y + 2*k2_y + 2*k3_y + k4_y) / 6;
                const slope_z = (k1_z + 2*k2_z + 2*k3_z + k4_z) / 6;

                const nextY = currY + slope_y * h;
                const nextZ = currZ + slope_z * h;
                const nextX = currX + h;

                iterations.push({
                    iter: i,
                    xi: currX,
                    yi: currY,
                    zi: currZ,
                    nextY,
                    nextZ,
                    nextX
                });

                currX = nextX;
                currY = nextY;
                currZ = nextZ;
                i++;
            }

            setSteps(iterations);

        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-bold text-blue-200 mb-6">Higher Order ODE (2nd Order)</h3>
                <p className="text-sm text-gray-400 mb-6">
                    Solving <span className="font-mono text-white">d²y/dx² = f(x, y, y')</span> using RK4 system reduction.<br/>
                    Let <span className="font-mono text-blue-300">z = dy/dx</span>. Use 'z' in your function string for the first derivative.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-3">
                        <label className="block text-sm text-gray-400 mb-1">Function f(x, y, z)</label>
                        <input type="text" value={funcStr} onChange={e => setFuncStr(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white font-mono" placeholder="e.g. 2*z - y + x" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial x (x₀)</label>
                        <input type="number" value={x0} onChange={e => setX0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial y (y₀)</label>
                        <input type="number" value={y0} onChange={e => setY0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="1" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Initial y' (z₀)</label>
                        <input type="number" value={z0} onChange={e => setZ0(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Step Size (h)</label>
                        <input type="number" value={hVal} onChange={e => setHVal(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0.1" />
                    </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-1">Target x</label>
                        <input type="number" value={targetX} onChange={e => setTargetX(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2 text-white" placeholder="0.5" />
                    </div>
                </div>

                <button onClick={solve} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg">
                    Solve System
                </button>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-red-200">
                    {error}
                </div>
            )}

            {steps.length > 0 && (
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 overflow-hidden">
                     <h4 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Solution Table</h4>
                     
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-center border-collapse">
                            <thead>
                                <tr className="text-blue-300 border-b border-white/20 bg-white/5">
                                    <th className="p-3 whitespace-nowrap">i</th>
                                    <th className="p-3 whitespace-nowrap">x<sub>i</sub></th>
                                    <th className="p-3 whitespace-nowrap">y<sub>i</sub></th>
                                    <th className="p-3 whitespace-nowrap">z<sub>i</sub> (y')</th>
                                    <th className="p-3 whitespace-nowrap font-bold">y<sub>i+1</sub></th>
                                    <th className="p-3 whitespace-nowrap font-bold">z<sub>i+1</sub></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono">
                                {steps.map((row) => (
                                    <tr key={row.iter} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-gray-500">{row.iter}</td>
                                        <td className="p-3 text-gray-300">{formatNumber(row.xi)}</td>
                                        <td className="p-3 text-gray-300">{formatNumber(row.yi)}</td>
                                        <td className="p-3 text-gray-300">{formatNumber(row.zi)}</td>
                                        <td className="p-3 font-bold text-white bg-blue-900/20">{formatNumber(row.nextY)}</td>
                                        <td className="p-3 font-bold text-white bg-blue-900/10">{formatNumber(row.nextZ)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>

                     <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                         <h5 className="text-sm font-bold text-blue-200 mb-2">Final Answer</h5>
                         <p className="text-2xl font-bold text-white">
                             y({formatNumber(steps[steps.length-1].nextX)}) ≈ {formatNumber(steps[steps.length-1].nextY)}
                         </p>
                     </div>
                </div>
            )}
        </div>
    );
};

export default Exam4Solver;