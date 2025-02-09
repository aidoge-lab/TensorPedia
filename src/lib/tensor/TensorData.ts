import * as tf from '@tensorflow/tfjs';
import { TensorIndices } from './TensorIndices';

export class TensorData {
    private tfTensor: tf.Tensor;

    constructor(tfTensor: tf.Tensor) {
        this.tfTensor = tfTensor;
    }

    static createDefault2D(): TensorData {
        const data = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36]);
        const dims = [6, 6];
        return new TensorData(tf.tensor(data, dims));
    }

    // Get dimensions of the tensor
    getDims(): readonly number[] {
        return this.tfTensor.shape;
    }

    // Get value at specified indices
    getValue(...indices: number[]): number {
        const dims = this.getDims();
        let index = 0;
        let stride = 1;
        
        // Calculate index starting from the last dimension
        for (let i = indices.length - 1; i >= 0; i--) {
            index += indices[i] * stride;
            stride *= dims[i];
        }
        
        return this.tfTensor.dataSync()[index];
    }

    getValueByIndices(indices: TensorIndices): number {
        return this.getValue(...indices.getIndices());
    }

    add(other: TensorData): TensorData {
        const result = this.tfTensor.add(other.tfTensor);
        return new TensorData(result);
    }

    relu(): TensorData {
        const result = this.tfTensor.relu();
        return new TensorData(result);
    }

    getMaxData(): number {
        return Math.max(...this.tfTensor.dataSync());
    }

    getMinData(): number {
        return Math.min(...this.tfTensor.dataSync());
    }
}
