import { Dispatch, SetStateAction, } from 'react';
import PriorityQueue from "./priorityQueue";
import ZobristHashing from "./zobristHashing";
import { sleep } from "./tools";


function isGoal(board: number[][]): boolean {
	const size = board.length;
	const nums = size * size;
	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++)
			if (board[i][j] !== (i * size + j + 1) % nums)
				return false;
	}
	return true;
}


function goalBoard(size: number): number[][] {
	const nums = size * size;
	const board = [];
	for (let i = 0; i < size; ++i) {
		const row = [];
		for (let j = 0; j < size; ++j)
			row.push((i * size + j + 1) % nums);
		board.push(row);
	}
	return board;
}


function randomBoard(size: number): number[][] {
	const board = goalBoard(size);
	const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
	const loop = size ** 4;
	let i = size - 1, j = size - 1;
	for (let k = 0; k < loop; ++k) {
		const [di, dj] = directions[Math.floor(Math.random() * directions.length)];
		const x = i + di, y = j + dj;
		if (0 > x || x >= size || 0 > y || y >= size)
			continue;
		[board[i][j], board[x][y]] = [board[x][y], board[i][j]];
		i = x; j = y;
	}
	return board;
}

const zeroPosition = (board: number[][]): [number, number] => {
	for (let i = 0; i < board.length; ++i) {
		for (let j = 0; j < board.length; ++j) {
			if (board[i][j] === 0)
				return [i, j];
		}
	}
	return [-1, -1];
};

async function solve(board: number[][], property: { stop: boolean, progress: Dispatch<SetStateAction<string>> | undefined }) {
	const size = board.length;
	const nums = size * size;
	// Zobrist hashing
	const hash = new ZobristHashing(nums * nums);
	const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

	// ヒューリスティック関数 h
	const heuristic = (data: number[][]) => {
		let dist = 0;
		for (let i = 0; i < size; ++i) {
			for (let j = 0; j < size; ++j) {
				const a = (data[i][j] - 1 + nums) % nums;
				const x = Math.floor(a / size), y = a % size;
				dist += Math.abs(x - i) + Math.abs(y - j);
			}
		}
		return dist;
	};

	type Node = {
		fValue: number,
		parent: number | undefined,
		data: number[][],
	};
	// f=g+h
	const fValue = new Map<number, Node>();
	const goalHash = hash.hashData(goalBoard(board.length));

	// f, state
	const pq = new PriorityQueue<number[][]>();
	fValue.set(hash.hashData(board), { fValue: heuristic(board), parent: undefined, data: board });
	pq.push(heuristic(board), board);

	let loop = 0;
	while (pq.size()) {
		const { key: nowF, value: array } = pq.pop();
		const nowHash = hash.hashData(array);
		// ゴール
		if (nowHash === goalHash)
			break;
		loop++;
		if (loop % 10000 === 0) {
			if (property.progress)
				property.progress(`visit: ${loop} < queue: ${pq.size()}`);
			console.log(loop);
			await sleep(0);
			if (property.stop)
				return [];
		}
		let node = fValue.get(nowHash);
		if (node !== undefined && node.fValue < nowF)
			continue;
		// 現在の真のコスト
		const nowG = nowF - heuristic(array);
		const [nowRow, nowCol] = zeroPosition(array);
		// 次のノードへ
		for (const [di, dj] of directions) {
			const nextRow = nowRow + di, nextCol = nowCol + dj;
			if (0 > nextRow || nextRow >= size || 0 > nextCol || nextCol >= size)
				continue;
			const nextArray = array.map(x => x.concat());
			[nextArray[nowRow][nowCol], nextArray[nextRow][nextCol]] = [nextArray[nextRow][nextCol], nextArray[nowRow][nowCol]];
			const nextCost = nowG + 1 + heuristic(nextArray);
			const nextHash = hash.hashData(nextArray);
			const nextNode = fValue.get(nextHash);
			if (nextNode === undefined || nextCost < nextNode.fValue) {
				fValue.set(nextHash, { fValue: nextCost, parent: nowHash, data: nextArray });
				pq.push(nextCost, nextArray);
			}
		}
	}
	console.log("goal");
	if (property.progress)
		property.progress(`visit: ${loop} < queue: ${pq.size()}`);

	const path = [];
	let node = fValue.get(goalHash);
	while (node !== undefined) {
		path.push(node.data);
		if (node.parent === undefined) break;
		node = fValue.get(node.parent);
	}
	console.log("path");
	path.reverse();
	return path;
}



export { solve, randomBoard, zeroPosition, isGoal };
