import React, { ReactElement, useEffect, useState } from 'react';
import {
  Card,
  CardActionArea,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface BlankMeme {
  id: string;
  height: number;
  name: string;
  url: string;
  width: number;
}

interface MemeTemplate {
  topText: string;
  bottomText: string;
  isDraggingTop: boolean;
  isDraggingBot: boolean;
  topY: string;
  topX: string;
  botY: string;
  botX: string;
}

export default function Gallery(): ReactElement {
  const [memeCollection, setMemeCollection] = useState<BlankMeme[]>([]);
  const [currentSelectedImg, setCurrentSelectedImage] = useState<number>();
  const [dialogIsOpen, setDialogIsOpen] = useState<boolean>(false);
  const [currentSelectedBase64, setCurrentSelectedBase64] = useState<string>('');
  const [memeCurrentTemplate, setMemeCurrentTemplate] = useState<MemeTemplate>();
  const [dimension, setDimension] = useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  });

  let svgRef: SVGSVGElement | null;
  let imageRef: SVGImageElement | null;

  const textStyle: React.CSSProperties | undefined = {
    fontFamily: 'Impact',
    fontSize: '50px',
    textTransform: 'uppercase',
    fill: '#FFF',
    stroke: '#000',
    userSelect: 'none',
  };

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const response = await fetch('https://api.imgflip.com/get_memes');
        const json = await response.json();
        setMemeCollection(json.data.memes);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMemes();
  }, []);

  useEffect(() => {
    if (currentSelectedImg === undefined) return;
    const image = memeCollection[currentSelectedImg];
    const ratio = image.width / image.height;
    setDimension((prevDimension) => ({ ...prevDimension, height: prevDimension.width / ratio }));
  }, [memeCollection, currentSelectedImg]);

  /**
   * Notre svg a besoin d'un href en dataURI pour pouvoir etre converti en PNG par la suite,
   * on récupère donc notre image qu'on transforme en dataURL (base64) via l'API FileReader()
   * NB : conversion possible via canvas mais FileReader offre moins de pertes
   */
  const openImageAsDataURL = async (index: number) => {
    try {
      const res = await fetch(memeCollection[index].url);
      const blob = await res.blob();
      const dataURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setCurrentSelectedImage(index);
      setCurrentSelectedBase64(dataURL);
      setDialogIsOpen((prevDialogIsOpen) => !prevDialogIsOpen);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * self-explanatory : permet de fermer ou d'ouvrir notre fenetre de dialogue
   */
  const toggleDialog = () => {
    setMemeCurrentTemplate((prevMemeCurrentTemplate) =>
      prevMemeCurrentTemplate
        ? {
            ...prevMemeCurrentTemplate,
            topText: '',
            bottomText: '',
          }
        : undefined
    );
    setDialogIsOpen((prevDialogIsOpen) => !prevDialogIsOpen);
  };

  /**
   * fonction essentielle pour prendre en compte ce que l'user tape dans le champ texte
   * et lui en afficher le retour
   */
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setMemeCurrentTemplate((prevMemeCurrentTemplate) =>
      prevMemeCurrentTemplate
        ? {
            ...prevMemeCurrentTemplate,
            [event.currentTarget.name]: event.currentTarget.value,
          }
        : undefined
    );
  };

  /**
   * permet de connaitre la position de la boite de texte par rapport à l'image en dessous
   */
  const getStateObj = (
    e: MouseEvent | React.MouseEvent<SVGTextElement, MouseEvent>,
    type: string
  ) => {
    const rect = imageRef?.getBoundingClientRect();
    if (!rect) return;

    const { left: rectLeft, top: rectTop } = rect;
    const { clientX, clientY } = e;
    const xOffset = clientX - rectLeft;
    const yOffset = clientY - rectTop;

    return type === 'bottom'
      ? {
          isDraggingBot: true,
          isDraggingTop: false,
          botX: `${xOffset}px`,
          botY: `${yOffset}px`,
        }
      : {
          isDraggingTop: true,
          isDraggingBot: false,
          topX: `${xOffset}px`,
          topY: `${yOffset}px`,
        };
  };

  /**
   * sur le clic de la souris, on attache un eventListener à notre page pour tracker la souris
   * au déclenchement de cet event, on exécute handleMouseDrag()
   */
  const handleMouseDown = (e: React.MouseEvent<SVGTextElement, MouseEvent>, type: string) => {
    const stateObj = getStateObj(e, type);
    document.addEventListener('mousemove', (event) => handleMouseDrag(event, type));
    setMemeCurrentTemplate((prevMemeCurrentTemplate) =>
      prevMemeCurrentTemplate
        ? {
            ...prevMemeCurrentTemplate,
            ...stateObj,
          }
        : undefined
    );
  };

  /**
   * permet de récupérer les nouvelles coordonnées de la boite de texte et de les définir dans le state
   */
  const handleMouseDrag = (e: MouseEvent, type: string) => {
    const { isDraggingTop, isDraggingBot } = memeCurrentTemplate ?? {};
    if (isDraggingTop || isDraggingBot) {
      const stateObj = getStateObj(e, type) ?? {};
      setMemeCurrentTemplate((prevMemeCurrentTemplate) =>
        prevMemeCurrentTemplate
          ? {
              ...prevMemeCurrentTemplate,
              ...stateObj,
            }
          : undefined
      );
    }
  };

  /**
   * une fois le clic laché, on détache l'eventListener du DOM
   */
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', (event) => handleMouseDrag(event, ''));
    setMemeCurrentTemplate((prevMemeCurrentTemplate) =>
      prevMemeCurrentTemplate
        ? {
            ...prevMemeCurrentTemplate,
            isDraggingTop: false,
            isDraggingBot: false,
          }
        : undefined
    );
  };

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

  return (
    <>
      {memeCollection.length ? (
        <>
          <Grid container spacing={10} style={{ padding: '24px' }}>
            {memeCollection.map((memeTile, index) => (
              <Grid key={memeTile.id} item xs={12} sm={6} md={4} lg={4} xl={3}>
                <Card className="card" onClick={() => openImageAsDataURL(index)}>
                  <CardActionArea className="item">
                    <CardMedia className="media" image={memeTile.url} />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog
            open={dialogIsOpen}
            aria-labelledby="meme-edit-dialog"
            onClose={() => toggleDialog()}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>Créez votre propre meme !</DialogTitle>
            <DialogContent
              dividers
              style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
            >
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
                  ref={(el) => {
                    imageRef = el;
                  }}
                  href={currentSelectedBase64}
                  height={dimension.height}
                  width={dimension.width}
                />
                <text
                  style={{
                    ...textStyle,
                    zIndex: memeCurrentTemplate?.isDraggingTop ? 4 : 1,
                  }}
                  x={memeCurrentTemplate?.topX}
                  y={memeCurrentTemplate?.topY}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  onMouseDown={(event) => handleMouseDown(event, 'top')}
                  onMouseUp={handleMouseUp}
                >
                  {memeCurrentTemplate?.topText}
                </text>
                <text
                  style={textStyle}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  x={memeCurrentTemplate?.botX}
                  y={memeCurrentTemplate?.botY}
                  onMouseDown={(event) => handleMouseDown(event, 'bottom')}
                  onMouseUp={handleMouseUp}
                >
                  {memeCurrentTemplate?.bottomText}
                </text>
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
                onChange={handleTextChange}
                fullWidth
              />
              <TextField
                autoFocus
                margin="dense"
                id="bottomText"
                name="bottomText"
                label="Bottom Text"
                type="text"
                onChange={handleTextChange}
                size="medium"
                fullWidth
              />
              <Tooltip title="Télécharger ce meme">
                <IconButton onClick={() => exportSVGAsPNG()}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        'Loading memes, please stand by...'
      )}
    </>
  );
}
