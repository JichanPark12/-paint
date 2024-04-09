'use client';
import { KonvaEventObject } from 'konva/lib/Node';
import { useRef, useState } from 'react';
import { Stage, Layer, Text, Line } from 'react-konva';
import { useEffect } from 'react';

interface ILine {
  tool: string;
  points: Array<number>;
}

interface History {
  currentIdx: number;
  lines: Array<ILine>;
}

const INIT_HISTORY: History = {
  currentIdx: 0,
  lines: [],
};

const Paint = () => {
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState<History>(INIT_HISTORY);

  const lines = history.lines.slice(0, history.currentIdx);
  const isPainting = useRef(false);

  const handleStartPaint = (e: KonvaEventObject<MouseEvent>) => {
    isPainting.current = true;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const lines = history.lines.slice(0, history.currentIdx);

    setHistory({
      ...history,
      currentIdx: history.currentIdx + 1,
      lines: [...lines, { tool, points: [pos.x, pos.y] }],
    });
  };

  const handlePainting = (e: KonvaEventObject<MouseEvent>) => {
    if (!isPainting.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const lastLine = history.lines[history.lines.length - 1];
    lastLine.points = [...lastLine.points, point.x, point.y];

    const newLines = [...history.lines];
    newLines[newLines.length - 1] = { ...newLines[newLines.length - 1] };
    setHistory({ ...history, lines: [...newLines] });
  };

  const handleStopPaint = () => {
    isPainting.current = false;
  };

  const handleUndo = () => {
    setHistory((history) => {
      if (history.currentIdx === 0) return { ...history, currentIdx: 0 };
      return { ...history, currentIdx: history.currentIdx - 1 };
    });
  };

  const handleRedo = () => {
    setHistory((history) => {
      if (history.currentIdx === history.lines.length) return { ...history };
      return { ...history, currentIdx: history.currentIdx + 1 };
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'z') {
        handleUndo();
      }
      if (e.ctrlKey && key === 'y') {
        handleRedo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <div className="flex">
        <button
          className="mr-5"
          onClick={handleUndo}>
          Undo
        </button>
        <button
          className="mr-5"
          onClick={handleRedo}>
          Redo
        </button>
        <select
          value={tool}
          onChange={(e) => {
            setTool(e.target.value);
          }}>
          <option value="pen">Pen</option>
          <option value="eraser">Eraser</option>
        </select>
      </div>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleStartPaint}
        onMousemove={handlePainting}
        onMouseup={handleStopPaint}
        onMouseLeave={handleStopPaint}>
        <Layer>
          <Text
            text="Just start drawing"
            x={5}
            y={30}
          />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Paint;
