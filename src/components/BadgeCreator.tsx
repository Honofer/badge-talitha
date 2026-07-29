import React, { useState, useRef } from 'react';
import { DownloadIcon, UploadIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';

const W = 2048;
const H = 2048;
const PHOTO = { x: 629, y: 334, w: 791, h: 724, r: 55 };

const BadgeCreator = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setUploadedImage(event.target?.result as string);
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const increaseZoom = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const decreaseZoom = () => setZoom(prev => Math.max(prev - 0.1, 0.1));

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const downloadBadge = async () => {
    if (!uploadedImage) return;
    setIsLoading(true);
    try {
      const [template, userPhoto] = await Promise.all([
        loadImage('/badge.jpeg'),
        loadImage(uploadedImage)
      ]);

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(template, 0, 0, W, H);

      ctx.save();
      drawRoundedRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.r);
      ctx.clip();

      const { x, y, w, h } = PHOTO;
      const scale = Math.max(w / userPhoto.width, h / userPhoto.height) * zoom;
      const dw = userPhoto.width * scale;
      const dh = userPhoto.height * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;

      ctx.drawImage(userPhoto, dx, dy, dw, dh);
      ctx.restore();

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      if (!blob) throw new Error('Échec de génération');

      const file = new File([blob], 'mon-badge-talitha-koumi.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mon badge' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'mon-badge-talitha-koumi.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erreur", err);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[500px]">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photo-upload">
            Téléversez votre photo
          </label>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <UploadIcon className="w-8 h-8 mb-3 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Cliquez pour téléverser</span>{' '}
                  <span className="hidden sm:inline">ou glissez-déposez</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG ou JPEG</p>
              </div>
              <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="mb-6 w-full flex justify-center">
        <div className="relative w-full aspect-square bg-transparent overflow-hidden">
          <img src="/badge.jpeg" alt="Badge template" className="w-full h-full object-contain" />
          <div className="absolute flex items-center justify-center overflow-hidden rounded-[3.5%]"
            style={{
              top: '16.31%',
              left: '30.71%',
              width: '38.62%',
              height: '35.35%'
            }}>
            {uploadedImage && (
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="absolute inset-0 min-w-full min-h-full object-cover"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  objectPosition: 'center center'
                }}
              />
            )}
          </div>
        </div>
      </div>

      {uploadedImage && (
        <div className="flex items-center gap-4 mb-6">
          <button onClick={decreaseZoom} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300" title="Réduire">
            <ZoomOutIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">Ajuster la taille</span>
          <button onClick={increaseZoom} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300" title="Agrandir">
            <ZoomInIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <button
        onClick={downloadBadge}
        disabled={!uploadedImage || isLoading}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md text-white font-medium w-full sm:w-auto transition-all ${
          !uploadedImage || isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 shadow-md active:scale-95'
        }`}
      >
        <DownloadIcon className="w-5 h-5" />
        {isLoading ? 'Génération en cours...' : 'Télécharger mon badge'}
      </button>
    </div>
  );
};

export default BadgeCreator;
