
export interface OperatorInfo {
    name: string;
    description: string;
    formula: string;
    category: string;
    subcategory: string;
}

export const OperatorInfo = {
    ReLU: {
        name: 'ReLU',
        description: 'Rectified Linear Unit activation function',
        formula: 'f(x) = max(0, x)',
        category: 'Activation',
        subcategory: 'Non-linear'
    }
}