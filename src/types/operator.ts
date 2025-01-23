export interface Parameter {
  name: string;
  description: string;
  type: string;
  default?: any;
}

export interface Operator {
  id: string;
  name: string;
  category: string;
  description: string;
  formula: string;
  parameters: Parameter[];
  inputShape: number[];
  outputShape: number[];
}
