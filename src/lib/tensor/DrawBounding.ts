

// Tensor draw position on the canvas
// x, y: the top left corner
// width, height: the size of the tensor
export class DrawBounding {
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    x: number;
    y: number;
    width: number;
    height: number;
}