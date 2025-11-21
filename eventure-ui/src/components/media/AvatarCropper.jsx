'use client';
import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogTitle, DialogContent, DialogActions, Slider, Stack, Button } from '@mui/material';

async function getCroppedImg(imageSrc, crop, zoom, aspect=1) {
  const image = await createImage(imageSrc);
  const { width, height } = getRoi(image, crop, zoom, aspect);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const renderedWidth = image.naturalWidth / zoom;
  const renderedHeight = image.naturalHeight / zoom;

  ctx.drawImage(
    image,
    cropX, cropY, renderedWidth, renderedHeight,
    0, 0, width, height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (e) => reject(e));
    image.setAttribute('crossOrigin', 'anonymous'); // needed for cross-origin images
    image.src = url;
  });
}

function getRoi(image, crop, zoom, aspect=1) {
  // crop { x,y,width,height } în px pe canvasul logical (react-easy-crop calculează intern)
  const size = Math.min(image.width, image.height) / zoom;
  return { width: Math.round(size), height: Math.round(size) };
}

export default function AvatarCropper({ open, src, onCancel, onCropped }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, cropped) => {
    setCroppedAreaPixels(cropped);
  },[]);

  async function handleSave(){
    const blob = await getCroppedImg(src, croppedAreaPixels || {x:0,y:0,width:200,height:200}, zoom, 1);
    onCropped(blob);
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Crop avatar</DialogTitle>
      <DialogContent sx={{ position:'relative', height: 360 }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
          cropShape="round"
        />
      </DialogContent>
      <Stack direction="row" alignItems="center" spacing={2} sx={{px:3, pt:1}}>
        Zoom <Slider min={1} max={3} step={0.01} value={zoom} onChange={(_,v)=>setZoom(v)} />
      </Stack>
      <DialogActions>
        <Button onClick={onCancel}>Anulează</Button>
        <Button variant="contained" onClick={handleSave}>Salvează</Button>
      </DialogActions>
    </Dialog>
  );
}
