class ZobristHashing {
	h: number[];
	constructor(size: number) {
		this.h = [];
		for (let i = 0; i < size; ++i) {
			this.h.push((Math.random() * ((~0) >>> 0)) >>> 0);
		}
	}
	hash(array: number[]): number {
		let value = 0 >>> 0;
		array.forEach(
			x => { value ^= this.h[x]; }
		);
		return value;
	}
	hashData(data: number[][]): number {
		const nums = data.length * data.length;
		let value = 0 >>> 0;
		data.forEach(
			(row, i) => {
				row.forEach(
					(x, j) => { value ^= this.h[x * nums + (i * data.length + j)]; }
				);
			}
		);
		return value;
	}
};
export default ZobristHashing;
