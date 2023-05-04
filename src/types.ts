import React from 'react';

export interface DraggableState {
  isDown: boolean;
  posX: string;
  posY: string;
  screenX: number;
  screenY: number;
}

export interface DraggableTextProps {
  textStyle: React.CSSProperties;
  memeText: string;
  initX: string;
  initY: string;
  imageRef: SVGImageElement | null;
}

export interface DialogCreatorProps {
  open: boolean;
  onClose: () => void;
  dimension: { width: number; height: number };
  href: string;
}

export interface MemeText {
  topText: string;
  bottomText: string;
}

export interface BlankMeme {
  id: string;
  height: number;
  name: string;
  url: string;
  width: number;
}
