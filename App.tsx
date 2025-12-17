import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, CalculatorIcon, GridIcon } from './components/Icons';
import MatrixCalculator from './components/MatrixCalculator';
import LinearSystemSolver from './components/LinearSystemSolver';
import Exam2Solver from './components/Exam2Solver';
import Exam3Solver from './components/Exam3Solver';
import Exam4Solver from './components/Exam4Solver';
import { ExamTopic } from './types';

const examTopics: Record<number, ExamTopic> = {
    1: {
        id: 1,
        title: "First Exam Topics",
        // Green Aurora
        color: "from-emerald-500/80 via-green-500/80 to-teal-600/80",
        topics: [
            "Algebra of Matrices",
            "Direct Methods for Solving Linear Systems",
            "  Gauss Elimination Method",
            "  Gauss Elimination with Maximum Pivot Strategy",
            "  Gauss-Jordan Method",
            "Iterative Methods for Solving Linear Systems",
            "  Gauss-Seidel Method",
            "  Jacobi Method"
        ]
    },
    2: {
        id: 2,
        title: "Second Exam Topics",
        // Pink Aurora
        color: "from-pink-500/80 via-rose-500/80 to-fuchsia-600/80",
        topics: [
            "Approximation Methods (Roots of Single Equation)",
            "  Bisection Method",
            "  Secant Method",
            "  Newton-Raphson Method",
            "Curve Fitting (Least Squares)",
            "  Linear (y = C1 + C2x)",
            "  Quadratic & Exponential",
            "Interpolation",
            "  Newton's Divided Difference Polynomial",
            "  Lagrange Interpolating Polynomial"
        ]
    },
    3: {
        id: 3,
        title: "Third Exam Topics",
        // Yellow Aurora
        color: "from-yellow-400/80 via-amber-500/80 to-orange-500/80",
        topics: [
            "Numerical Differentiation",
            "  Finite Divided Difference",
            "Numerical Integration",
            "  Trapezoidal Rule",
            "  Simpson's 1/3 Rule",
            "  Simpson's 3/8 Rule",
            "  Romberg Integration"
        ]
    },
    4: {
        id: 4,
        title: "Fourth Exam Topics",
        // Blue Aurora
        color: "from-cyan-500/80 via-blue-600/80 to-indigo-600/80",
        topics: [
            "4th Order Runge-Kutta (Classical RK Method)",
            "Higher Order ODEs"
        ]
    }
};

const App: React.FC = () => {
    const [selectedExam, setSelectedExam] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<'matrix' | 'linear'>('matrix');

    const resetSelection = () => {
        setSelectedExam(null);
        setActiveTool('matrix'); // Reset tool preference
    };

    if (!selectedExam) {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-900 via-slate-950 to-black p-8 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 mb-4 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                            Numerical Methods
                        </h1>
                        <p className="text-xl text-teal-100/70">Select Your Exam Topic</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map((examNum) => (
                            <div
                                key={examNum}
                                onClick={() => setSelectedExam(examNum)}
                                className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.03]"
                            >
                                <div className={`h-full bg-gradient-to-br ${examTopics[examNum].color} backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10 relative overflow-hidden group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div className="bg-white/10 rounded-full p-4 backdrop-blur-sm border border-white/20">
                                            <BookOpen />
                                        </div>
                                        <span className="text-7xl font-bold text-white/10 absolute right-0 -top-4 select-none">
                                            {examNum}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-3 relative z-10">
                                        {examTopics[examNum].title}
                                    </h2>
                                    <ul className="space-y-2 relative z-10">
                                        {examTopics[examNum].topics.slice(0, 3).map((topic, idx) => (
                                            <li key={idx} className="text-white/90 text-sm flex items-start">
                                                <span className="mr-2 text-white/70">•</span> {topic.trim()}
                                            </li>
                                        ))}
                                        {examTopics[examNum].topics.length > 3 && (
                                            <li className="text-white/60 text-sm italic mt-2">
                                                + {examTopics[examNum].topics.length - 3} more topics
                                            </li>
                                        )}
                                    </ul>
                                    <div className="mt-6 flex items-center text-white font-semibold relative z-10">
                                        <span>View Details</span>
                                        <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block text-white/80">
                                            <ChevronRight />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const currentExam = examTopics[selectedExam];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-900 via-slate-950 to-black p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={resetSelection}
                    className="mb-8 flex items-center text-teal-200 hover:text-white transition-colors group"
                >
                    <span className="mr-2 group-hover:-translate-x-1 transition-transform"><ChevronLeft /></span>
                    Back to Exam Selection
                </button>

                <div className={`bg-gradient-to-br ${currentExam.color} backdrop-blur-lg rounded-2xl p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-8 border border-white/10`}>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">
                        {currentExam.title}
                    </h1>
                    <div className="bg-black/30 rounded-xl p-6 backdrop-blur-md border border-white/10">
                        <h3 className="text-xl font-semibold text-white/90 mb-3">Topics to Master:</h3>
                        <ul className="space-y-3">
                            {(() => {
                                let mainTopicIndex = 0;
                                return currentExam.topics.map((topic, idx) => {
                                    // Check if topic is a subtopic (starts with spaces)
                                    const isSubtopic = topic.startsWith('  ');
                                    const displayTopic = isSubtopic ? topic.trim() : topic;
                                    
                                    // Only increment counter for main topics
                                    if (!isSubtopic) mainTopicIndex++;

                                    return (
                                        <li key={idx} className={`flex items-start text-white/80 ${isSubtopic ? 'ml-4' : ''}`}>
                                            {isSubtopic ? (
                                                // Unnumbered bullet for subtopics
                                                <span className="mr-3 mt-2.5 w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                                            ) : (
                                                // Numbered circle for main topics
                                                <span className="text-black/80 mr-3 font-bold bg-white/90 w-6 h-6 flex items-center justify-center rounded-full text-sm flex-shrink-0 shadow-lg">
                                                    {mainTopicIndex}
                                                </span>
                                            )}
                                            <span className={isSubtopic ? 'text-white/70' : ''}>{displayTopic}</span>
                                        </li>
                                    );
                                });
                            })()}
                        </ul>
                    </div>
                </div>

                {selectedExam === 1 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white/5 p-2 rounded-xl backdrop-blur-md flex flex-col sm:flex-row gap-2 border border-white/10 shadow-lg">
                            <button
                                onClick={() => setActiveTool('matrix')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                                    activeTool === 'matrix' 
                                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-400/30' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <CalculatorIcon />
                                Matrix Calculator
                            </button>
                            <button
                                onClick={() => setActiveTool('linear')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                                    activeTool === 'linear' 
                                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.2)] border border-teal-400/30' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <GridIcon />
                                Linear System Solver
                            </button>
                        </div>

                        {activeTool === 'matrix' ? (
                            <MatrixCalculator />
                        ) : (
                            <LinearSystemSolver />
                        )}
                    </div>
                )}

                {selectedExam === 2 && (
                    <Exam2Solver />
                )}

                {selectedExam === 3 && (
                    <Exam3Solver />
                )}

                {selectedExam === 4 && (
                    <Exam4Solver />
                )}

                <div className="mt-8">
                    <button
                        onClick={resetSelection}
                        className="w-full bg-slate-900/50 hover:bg-slate-800/60 text-gray-300 hover:text-white font-semibold py-4 px-6 rounded-lg transition-colors border border-white/10 shadow-lg backdrop-blur-sm"
                    >
                        Choose Different Exam
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;