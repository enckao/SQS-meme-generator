import React, { ReactElement, useCallback, useState } from 'react';
import { DraggableState, DraggableTextProps } from '../types.ts';

const DraggableText = React.memo(
  ({ textStyle, memeText, initY, initX, imageRef }: DraggableTextProps): ReactElement => {
    const [dragState, setDragState] = useState<DraggableState>({
      isDown: false,
      posY: initY,
      posX: initX,
      screenY: 0,
      screenX: 0,
    });

    const onMouseDown = (e: React.MouseEvent<SVGTextElement, MouseEvent>) => {
      const { clientX, clientY } = e;
      setDragState((prevDragState) => ({
        ...prevDragState,
        isDown: true,
        screenX: clientX,
        screenY: clientY,
      }));
    };

    const onMouseMove = useCallback(
      (e: React.MouseEvent<SVGTextElement, MouseEvent>) => {
        const rect = imageRef?.getBoundingClientRect();
        if (!dragState.isDown || !rect) return;
        const { left: rectLeft, top: rectTop } = rect;
        const { clientX, clientY } = e;
        const xOffset = clientX - rectLeft;
        const yOffset = clientY - rectTop;

        setDragState((prevDragState) => ({
          ...prevDragState,
          posX: `${xOffset}px`,
          posY: `${yOffset}px`,
          screenX: e.screenX,
          screenY: e.screenY,
        }));
      },
      [dragState.isDown, imageRef]
    );

    const onMouseUp = () => {
      setDragState((prevDragState) => ({
        ...prevDragState,
        isDown: false,
        screenX: 0,
        screenY: 0,
      }));
    };

    return (
      <text
        style={{
          ...textStyle,
          zIndex: dragState.isDown ? 4 : 1,
        }}
        x={dragState.posX}
        y={dragState.posY}
        dominantBaseline="middle"
        textAnchor="middle"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {memeText}
      </text>
    );
  }
);

export default DraggableText;
