export const dataURItoBlob = (dataURI: string): Blob => {
  const binStr = atob(dataURI.split(',')[1]);
  const len = binStr.length;
  const arr = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  
  return new Blob([arr], { type: 'image/png' });
};

export const generateFileName = (): string => {
  const pad = (n: number): string => n < 10 ? '0' + n : String(n);

  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.png`;
};

export const makeRGBAStyle = (color: string, alpha: number): string => {
  const match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  
  if (!match) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  
  return `rgba(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}, ${alpha})`;
};