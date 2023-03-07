import React, { BaseSyntheticEvent, useState } from 'react';
import './App.css';
import { solve, randomBoard, sleep, zeroPosition } from './solver';

function App() {
  return (
    <div className="App">
        <h1>Number Puzzle</h1>
        <MakeTable />
    </div>
  );
}

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


type Point = {
  i: number;
  j: number;
};
enum Status {
  Manual = "Manual",
  Solving = "Solving",
  Solved = "Solved",
  Playing = "Playing",
  Clear = "Clear"
};

function slidable(board: number[][], p: Point): boolean {
  if (board[p.i][p.j] === 0)
    return true;
  if (p.i + 1 < board.length && board[p.i + 1][p.j] === 0)
    return true;
  if (p.i - 1 >= 0 && board[p.i - 1][p.j] === 0)
    return true;
  if (p.j + 1 < board.length && board[p.i][p.j + 1] === 0)
    return true;
  if (p.j - 1 >= 0 && board[p.i][p.j - 1] === 0)
    return true;

  return false;
}


let interrupt = { stop: false };
let globalSpeed = 500;
function MakeTable() {
  const [size, setSize] = useState(3);
  const [speed, setSpeed] = useState(globalSpeed);
  const [board, setBoard] = useState(randomBoard(size));
  const [dragPoint, setDragPoint] = useState<Point>({ j: -1, i: -1 });
  const [answer, setAnswer] = useState<number[][][]>([]);
  const [status, setStatus] = useState<Status>(Status.Manual);

  const dragStart = (p: Point) => {
    setDragPoint(p);
  };
  const dragEnter = (p: Point) => {
    if (status === Status.Solving || status === Status.Playing)
      return;
    if (slidable(board, p) && slidable(board, dragPoint) && (board[p.i][p.j] === 0 || board[dragPoint.i][dragPoint.j] === 0)) {
      const newBoard = board.map(x => x.concat());
      [newBoard[dragPoint.i][dragPoint.j], newBoard[p.i][p.j]] = [newBoard[p.i][p.j], newBoard[dragPoint.i][dragPoint.j]];
      setBoard(newBoard);
      setDragPoint(p);
      setStatus(isGoal(newBoard) ? Status.Clear : Status.Manual);
      interrupt.stop = false;
    }
  };
  const clickSwap = (p: Point) => {
    if (status === Status.Solving || status === Status.Playing)
      return;
    const [x, y] = zeroPosition(board);
    if (slidable(board, p) && board[p.i][p.j] !== 0) {
      const newBoard = board.map(x => x.concat());
      [newBoard[x][y], newBoard[p.i][p.j]] = [newBoard[p.i][p.j], newBoard[x][y]];
      setBoard(newBoard);
      setStatus(isGoal(newBoard) ? Status.Clear : Status.Manual);
      interrupt.stop = false;
    }
  };
  const onClickReset = () => {
    setBoard(randomBoard(size));
    setAnswer([]);
    setStatus(Status.Manual);
    interrupt.stop = false;
  };
  const onClickSolve = async () => {
    setStatus(Status.Solving);
    await sleep(1);
    const path = await solve(board, interrupt);
    if (path.length === 0) {
      interrupt.stop = false;
      return;
    }
    setStatus(Status.Solved);
    console.log(path);
    setAnswer(path);
    interrupt.stop = false;
  };
  const onClickPlay = async () => {
    if (answer.length === 0)
      return;
    setStatus(Status.Playing);
    for (const brd of answer) {
      setBoard(brd);
      console.log(brd);
      await sleep(globalSpeed);
      if (interrupt.stop) {
        interrupt.stop = false;
        return;
      }
    }
    setStatus(Status.Clear);
    interrupt.stop = false;
  };
  const onClickStop = () => {
    interrupt.stop = true;
    setStatus(Status.Manual);
  };
  const onChangeSize = (e: BaseSyntheticEvent) => {
    const newSize = Number.parseInt(e.target.value);
    setSize(newSize);
    setBoard(randomBoard(newSize));
    setAnswer([]);
    setStatus(Status.Manual);
    interrupt.stop = false;
  };
  const onChangeSpeed = (e: BaseSyntheticEvent) => {
    const newSpeed = -Number(e.target.value);
    setSpeed(newSpeed);
    globalSpeed = newSpeed;
  };
  return (
    <div>
      <p>
        <select onChange={onChangeSize} defaultValue={size} disabled={status === Status.Solving || status === Status.Playing}>
          <option value="3">8パズル</option>
          <option value="4">15パズル</option>
        </select>
      </p>
      <p>
        <button onClick={onClickReset} disabled={status === Status.Solving || status === Status.Playing}>reset</button>
        <button onClick={onClickSolve} disabled={status !== Status.Manual}>solve</button>
        <button onClick={onClickPlay} disabled={answer.length === 0 || status === Status.Solving || status === Status.Playing}>play</button>
        <button onClick={onClickStop} disabled={status !== Status.Solving && status !== Status.Playing}>stop</button>
      </p>
      <p>
        speed: <input type="range" min="-1500" max="-1" value={-speed} onChange={onChangeSpeed} />
      </p>
      <table>
        <tbody>
          {board.map(
            (row, i) =>
              <tr key={"row_" + i}>
                {row.map((x, j) => <td key={i + "_" + j}
                  draggable={slidable(board, { i: i, j: j })}
                  onDragStart={() => dragStart({ i: i, j: j })}
                  onDragEnter={() => dragEnter({ i: i, j: j })}
                  onClick={() => clickSwap({ i: i, j: j })}
                >{x === 0 ? "" : x}</td>)}
              </tr>
          )}
        </tbody>
      </table>
      <p>Status: {status}</p>
    </div>
  );
}

export default App;
