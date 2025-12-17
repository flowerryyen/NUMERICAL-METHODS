export interface ExamTopic {
    id: number;
    title: string;
    color: string;
    topics: string[];
}

export type Operation = 'add' | 'subtract' | 'multiply' | 'determinant';

export type Matrix = string[][];
export type NumberMatrix = number[][];