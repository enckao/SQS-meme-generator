import React, { ReactElement, useCallback, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import DraggableText from './draggableText.tsx';
import DownloadIcon from '@mui/icons-material/Download';
import { DialogCreatorProps, MemeText } from '../types.ts';

const textStyle: React.CSSProperties = {
  fontFamily: 'Impact',
  fontSize: '50px',
  textTransform: 'uppercase',
  fill: '#FFF',
  stroke: '#000',
  userSelect: 'none',
};

export default function DialogCreator({
  open,
  onClose,
  dimension,
  href,
}: DialogCreatorProps): ReactElement {
  const [memeText, setMemeText] = useState<MemeText>({
    topText: '',
    bottomText: '',
  });
  const [imageRef, setImageRef] = useState<SVGImageElement | null>(null);

  let svgRef: SVGSVGElement | null = null;

  /**
   * grosso modo ici :
   * - on récupère le node de notre svg via sa réf puis on le sérialise
   * - on crée une image à partir de notre string svg
   * - on dessine cette image dans un canvas
   * - canvas que l'on exporte en dataURL
   * - dataURL que l'on attache à un lien créé en caché dans le DOM pui autocliqué pour trigger le DL
   */
  const exportSVGAsPNG = async () => {
    const svg = svgRef;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgSize = svg?.getBoundingClientRect();

    if (!svg || !ctx || !svgSize) return;

    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    const svgData = new XMLSerializer().serializeToString(svg);

    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);

    await new Promise((resolve) => (img.onload = resolve));

    ctx.drawImage(img, 0, 0);

    const canvasData = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'meme.png';
    a.href = canvasData;
    a.click();
  };

  const handleDialogClose = () => {
    onClose();
    setMemeText({ topText: '', bottomText: '' });
  };

  const handleChangeText = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setMemeText((prevMemeText) => ({
        ...prevMemeText,
        [event.target.name]: event.target?.value,
      }));
    },
    []
  );

  return (
    <Dialog
      open={open}
      aria-labelledby="meme-edit-dialog"
      onClose={() => handleDialogClose()}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Créez votre propre meme !</DialogTitle>
      <DialogContent dividers>
        <svg
          width={dimension.width}
          id="svg_ref"
          height={dimension.height}
          ref={(el) => {
            svgRef = el;
          }}
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <image
            ref={(el) => setImageRef(el)}
            href={href}
            height={dimension.height}
            width={dimension.width}
          />
          <DraggableText
            textStyle={textStyle}
            memeText={memeText.topText}
            initX={'50%'}
            initY={'10%'}
            imageRef={imageRef}
          />
          <DraggableText
            textStyle={textStyle}
            memeText={memeText.bottomText}
            initX={'50%'}
            initY={'90%'}
            imageRef={imageRef}
          />
        </svg>
      </DialogContent>
      <DialogActions>
        <TextField
          autoFocus
          margin="dense"
          id="topText"
          name="topText"
          label="Top Text"
          type="text"
          onChange={handleChangeText}
          fullWidth
        />
        <TextField
          autoFocus
          margin="dense"
          id="bottomText"
          name="bottomText"
          label="Bottom Text"
          type="text"
          onChange={handleChangeText}
          size="medium"
          fullWidth
        />
        <Tooltip title="Télécharger ce meme">
          <IconButton onClick={exportSVGAsPNG}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}
