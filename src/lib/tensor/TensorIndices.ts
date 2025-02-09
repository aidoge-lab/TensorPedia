

export class TensorIndices {
    constructor(public indices: number[]) {
        this.indices = indices; 
    }

    getIndices(): number[] {
        return this.indices;
    }
}