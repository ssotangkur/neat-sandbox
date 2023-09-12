import { useState } from "react";
import { styled } from "styled-components";

export type TwoAxisInputProps = {
  // Numbers here will be [0,1]
  onDrag?: (position: [number, number]) => void;
  onRelease?: () => void;
};

const size = 200;

const InputDiv = styled.div`
  position: absolute;
  width: ${size}px;
  height: ${size}px;
  right: 50px;
  bottom: 50px;
  background-color: darkgray;
  border-radius: ${size / 2}px;
  z-index: 100;
  overflow: hidden;
`;

export const TwoAxisInput = (props: TwoAxisInputProps) => {
  const [isDown, setIsDown] = useState(false);
  const [position, setPosition] = useState<[number, number]>([0, 0]);

  const handleEvent = (e: any) => {
    const half = size / 2;
    let rect = e.currentTarget.getBoundingClientRect();
    const pos: [number, number] = [
      (e.clientX - rect.left - half) / half,
      -(e.clientY - rect.top - half) / half,
    ];
    props.onDrag?.(pos);
    setPosition(pos);
  };

  const onDown = (e: any) => {
    e.stopPropagation();
    setIsDown(true);
    handleEvent(e);
  };

  const onUp = (e: any) => {
    e.stopPropagation();
    setIsDown(false);
    props.onRelease?.();
  };

  const onMove = (e: any) => {
    e.stopPropagation();
    if (isDown) {
      handleEvent(e);
    }
  };

  const onLeave = (e: any) => {
    e.stopPropagation();
    setIsDown(false);
    props.onRelease?.();
  };

  const onEnter = (e: any) => {
    e.stopPropagation();
    // Button is being pressed while entering
    if (e.buttons === 1) {
      setIsDown(true);
      handleEvent(e);
    }
  };

  /**
   * Must use "onPointerXXX" handlers instead of "onMouseXXX" handlers since the canvas
   * is intercepting the mouse ones.
   */
  return (
    <InputDiv
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onLeave}
      onPointerEnter={onEnter}
    >
      <svg width={size} height={size} viewBox={`${-1} ${-1} ${2} ${2}`}>
        <line
          x1={-1}
          y1={0}
          x2={1}
          y2={0}
          stroke="black"
          strokeWidth={1 / size}
        />
        <line
          x1={0}
          y1={-1}
          x2={0}
          y2={1}
          stroke="black"
          strokeWidth={1 / size}
        />
        <circle
          cx={0}
          cy={0}
          r={0.25}
          fillOpacity={0}
          fill="white"
          stroke="black"
          strokeWidth={1 / size}
        ></circle>
        <circle
          cx={0}
          cy={0}
          r={0.5}
          fillOpacity={0}
          fill="white"
          stroke="black"
          strokeWidth={1 / size}
        ></circle>
        <circle
          cx={0}
          cy={0}
          r={0.75}
          fillOpacity={0}
          fill="white"
          stroke="black"
          strokeWidth={1 / size}
        ></circle>
        <circle
          cx={0}
          cy={0}
          r={1}
          fillOpacity={0}
          fill="white"
          stroke="black"
          strokeWidth={1 / size}
        ></circle>
        <circle
          cx={position[0]}
          cy={-position[1]}
          r={0.075}
          fill={"red"}
          fillOpacity={isDown ? 1 : 0}
        />
      </svg>
      {/* <svg width={size} height={size} viewBox={`${-1} ${-1} ${2} ${2}`}>
        
      </svg> */}
    </InputDiv>
  );
};
