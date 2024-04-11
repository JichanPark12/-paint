'use client';
import { KonvaEventObject } from 'konva/lib/Node';
import { useRef, useState } from 'react';
import { Stage, Layer, Text, Line } from 'react-konva';
import { useEffect } from 'react';
import { Socket, io } from 'socket.io-client';
import { throttle } from 'lodash';

interface ILine {
  tool: string;
  points: Array<number>;
}

interface History {
  currentIdx: number;
  lines: Array<ILine>;
}

interface EmitData {
  type: 'painting' | 'startPaint' | 'undo' | 'redo';
  tool: string;
  position: {
    x: number;
    y: number;
  };
}

const INIT_HISTORY: History = {
  currentIdx: 0,
  lines: [],
};

const Paint = () => {
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState<History>(INIT_HISTORY);
  const [socket, setSocket] = useState<Socket>();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const lines = history.lines.slice(0, history.currentIdx);
  const isPainting = useRef(false);
  console.log(history);
  const handleStartPaint = (e: KonvaEventObject<MouseEvent>) => {
    isPainting.current = true;

    const point = e.target.getStage()?.getPointerPosition();
    if (!point) return;
    // setHistory({
    //   ...history,
    //   currentIdx: history.currentIdx + 1,
    //   lines: [...lines, { tool, points: [point.x, point.y, point.x, point.y] }],
    // });
    emitMessage({
      type: 'startPaint',
      tool,
      position: {
        x: point.x,
        y: point.y,
      },
    });
  };

  const throttledHandlePainting = throttle((e: KonvaEventObject<MouseEvent>) => {
    if (!isPainting.current) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    // const lastLine = history.lines[history.lines.length - 1];
    // lastLine.points = [...lastLine.points, point.x, point.y];

    // const newLines = [...history.lines];
    // newLines[newLines.length - 1] = { ...newLines[newLines.length - 1] };
    // setHistory((history) => ({
    //   ...history,
    //   lines: [...newLines]
    // }));

    emitMessage({
      type: 'painting',
      tool,
      position: {
        x: point.x,
        y: point.y,
      },
    });
  }, 200); // 100밀리초 간격으로 스로틀링

  const handlePainting = (e: KonvaEventObject<MouseEvent>) => {
    throttledHandlePainting(e);
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

  const emitMessage = async (message: EmitData) => {
    await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        ...message,
      }),
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
  useEffect(() => {
    const initSocket = () => {
      const socket = io('http://localhost:3000', {
        path: '/api/socket/io',
        addTrailingSlash: false,
      });
      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('message', (res) => {
        const data = JSON.parse(res) as EmitData;

        if (data.type === 'startPaint') {
          setHistory((history) => {
            const lines = history.lines.slice(0, history.currentIdx);
            const newHistory = {
              ...history,
              currentIdx: history.currentIdx + 1,
              lines: [
                ...lines,
                {
                  tool: data.tool,
                  points: [
                    data.position.x,
                    data.position.y,
                    data.position.x,
                    data.position.y,
                  ],
                },
              ],
            };
            return newHistory;
          });
        }
        if (data.type === 'painting') {
          setHistory((history) => {
            const lastLine = history.lines[history.lines.length - 1];
            lastLine.points = [...lastLine.points, data.position.x, data.position.y];

            const newLines = [...history.lines];
            newLines[newLines.length - 1] = { ...newLines[newLines.length - 1] };
            return { ...history, lines: [...newLines] };
          });
        }
      });

      setSocket(socket);
    };
    initSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
  if (!isConnected) {
    return <div>로딩중입니다</div>;
  }
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
