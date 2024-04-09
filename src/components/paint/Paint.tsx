'use client';
import { KonvaEventObject } from 'konva/lib/Node';
import { useRef, useState } from 'react';
import { Stage, Layer, Text, Star, Image, Shape, Line } from 'react-konva';
import useImage from 'use-image';

interface ILine {
  tool: string;
  points: Array<number>;
}

const Paint = () => {
  const [tool, setTool] = useState('pen');
  const [historyLines, setHistoryLines] = useState<Array<ILine>>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  const lines = historyLines.slice(0, historyIdx);
  const isDrawing = useRef(false);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const lines = historyLines.slice(0, historyIdx);

    setHistoryLines([...lines, { tool, points: [pos.x, pos.y] }]);
    setHistoryIdx(historyIdx + 1);
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const lastLine = historyLines[historyLines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    historyLines.splice(historyLines.length - 1, 1, lastLine);
    setHistoryLines(historyLines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClickUndo = () => {
    if (historyIdx === 0) return;
    setHistoryIdx(historyIdx - 1);
  };

  const handleClickRedo = () => {
    if (historyLines.length === historyIdx) return;
    setHistoryIdx(historyIdx + 1);
  };
  return (
    <div>
      <div className="flex">
        <button
          className="mr-5"
          onClick={handleClickUndo}>
          Undo
        </button>
        <button
          className="mr-5"
          onClick={handleClickRedo}>
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
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onMouseLeave={handleMouseUp}>
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
      <select
        value={tool}
        onChange={(e) => {
          setTool(e.target.value);
        }}>
        <option value="pen">Pen</option>
        <option value="eraser">Eraser</option>
      </select>
    </div>
  );
};

export default Paint;
