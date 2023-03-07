import React, { BaseSyntheticEvent, Dispatch, SetStateAction, useState } from 'react';
import './App.css';
import { solve, randomBoard, zeroPosition, isGoal } from './solver';
import { sleep } from "./tools";

function App() {
  return (
    <div className="App">
      <h1>Number Puzzle</h1>
      <MakeTable />
    </div>
  );
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
type GlobalProperty = {
  stop: boolean;
  speed: number;
  progress: Dispatch<SetStateAction<string>> | undefined;
};

let property: GlobalProperty = { stop: false, speed: 500, progress: undefined };
function MakeTable() {
  const [size, setSize] = useState(3);
  const [speed, setSpeed] = useState(property.speed);
  const [board, setBoard] = useState(randomBoard(size));
  const [dragPoint, setDragPoint] = useState<Point>({ j: -1, i: -1 });
  const [answer, setAnswer] = useState<number[][][]>([]);
  const [status, setStatus] = useState<Status>(Status.Manual);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  property.progress = setProgress;

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
      property.stop = false;
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
      property.stop = false;
    }
  };
  const onClickReset = () => {
    setBoard(randomBoard(size));
    setAnswer([]);
    setStatus(Status.Manual);
    setProgress("");
    property.stop = false;
  };
  const onClickSolve = async () => {
    setStatus(Status.Solving);
    await sleep(0);
    const path = await solve(board, property);
    if (path.length === 0) {
      property.stop = false;
      return;
    }
    setStatus(Status.Solved);
    setMessage(`(${path.length - 1} step)`);
    console.log(path);
    setAnswer(path);
    property.stop = false;
  };
  const onClickPlay = async () => {
    if (answer.length === 0)
      return;
    setStatus(Status.Playing);
    for (const brd of answer) {
      setBoard(brd);
      console.log(brd);
      await sleep(property.speed);
      if (property.stop) {
        property.stop = false;
        return;
      }
    }
    setStatus(Status.Clear);
    property.stop = false;
  };
  const onClickStop = () => {
    property.stop = true;
    setStatus(Status.Manual);
  };
  const onChangeSize = (e: BaseSyntheticEvent) => {
    const newSize = Number.parseInt(e.target.value);
    setSize(newSize);
    setBoard(randomBoard(newSize));
    setAnswer([]);
    setStatus(Status.Manual);
    setProgress("");
    property.stop = false;
  };
  const onChangeSpeed = (e: BaseSyntheticEvent) => {
    const newSpeed = -Number(e.target.value);
    setSpeed(newSpeed);
    property.speed = newSpeed;
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
      <p>Status: {status} {status === Status.Solved ? message : ""}</p>
      <p>{progress}</p>
    </div>
  );
}

export default App;
