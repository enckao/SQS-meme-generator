import { ReactElement, useEffect, useState } from 'react';
import { Card, CardActionArea, CardMedia, Grid } from '@mui/material';
import './style/gallery.css';
import DialogCreator from './dialogCreator.tsx';
import { BlankMeme } from '../types.ts';

export default function Gallery(): ReactElement {
  const [memeCollection, setMemeCollection] = useState<BlankMeme[]>([]);
  const [currentSelectedImg, setCurrentSelectedImage] = useState<number>();
  const [dialogIsOpen, setDialogIsOpen] = useState<boolean>(false);
  const [currentSelectedBase64, setCurrentSelectedBase64] = useState<string>('');
  const [dimension, setDimension] = useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  });

  /**
   * Ce useEffect permet de récupérer les memes depuis l'API imgflip
   */
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

  /**
   * Ce useEffect permet de mettre à jour la hauteur de notre svg en fonction de la largeur
   */
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
    setDialogIsOpen((prevDialogIsOpen) => !prevDialogIsOpen);
  };

  return (
    <>
      <Grid container direction="row" justifyContent="space-evenly" alignItems="center" spacing={6}>
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

      <DialogCreator
        open={dialogIsOpen}
        onClose={() => toggleDialog()}
        dimension={dimension}
        href={currentSelectedBase64}
      />
    </>
  );
}
