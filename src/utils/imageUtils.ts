export const dataURItoBlob = (dataURI: string): Blob => {
  const binStr = atob(dataURI.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  
  return new Blob([arr], { type: 'image/png' });
};

export const generateFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(`.${extension}`, '');
    return `watermarked_${baseName}.${extension}`;
  };

export const makeRGBAStyle = (color: string, alpha: number): string => {
  const match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  
  if (!match) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  
  return `rgba(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}, ${alpha})`;
};