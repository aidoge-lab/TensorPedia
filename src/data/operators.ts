import type { Operator } from "../types/operator";

export const operators: Record<string, Operator> = {
  relu: {
    id: "relu",
    name: "ReLU (Rectified Linear Unit)",
    category: "Activation",
    description: "The Rectified Linear Unit (ReLU) is a non-linear activation function that outputs the input directly if it is positive, otherwise, it outputs zero.",
    formula: "f(x) = \\max(0, x)",
    parameters: [],
    inputShape: [null, null],  // Any shape
    outputShape: [null, null]  // Same as input shape
  }
};

export const operatorCategories: Record<string, Operator[]> = {
  "Activation Functions": [operators.relu],
  "Convolution Operators": [],
  "Linear Operators": [],
  "Pooling Operators": [],
  "Normalization Operators": [],
  "Other Operators": []
};
