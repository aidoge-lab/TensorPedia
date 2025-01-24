import * as tf from '@tensorflow/tfjs';

export interface OperatorInfo {
    name: string;
    description: string;
    formula: string;
    category: string;
    subcategory: string;
}

export class Relu {
    static info: OperatorInfo = {
        name: 'ReLU',
        description: 'Rectified Linear Unit activation function',
        formula: 'f(x) = max(0, x)',
        category: 'Activation',
        subcategory: 'Non-linear'
    };

    static forward(input: tf.Tensor): tf.Tensor {
        return tf.relu(input);
    }

    static backward(input: tf.Tensor, gradOutput: tf.Tensor): tf.Tensor {
        return tf.mul(gradOutput, tf.step(input));
    }

    static example(): void {
        const input = tf.tensor([-2, -1, 0, 1, 2]);
        console.log('Input:', input.arraySync());
        
        const output = this.forward(input);
        console.log('Output:', output.arraySync());
    }
}
