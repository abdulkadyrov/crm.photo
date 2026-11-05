// Monitor-specific preprocessing, independent of any names or source photographs.
function gaussian(input, width, height, sigma) {
  const radius = Math.ceil(sigma * 3), kernel = [];
  let total = 0;
  for (let x = -radius; x <= radius; x++) { const v = Math.exp(-x*x/(2*sigma*sigma)); kernel.push(v); total += v; }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
  const temp = new Float32Array(input.length), out = new Float32Array(input.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0; for (let k = -radius; k <= radius; k++) sum += input[y*width + Math.max(0,Math.min(width-1,x+k))]*kernel[k+radius];
    temp[y*width+x] = sum;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0; for (let k = -radius; k <= radius; k++) sum += temp[Math.max(0,Math.min(height-1,y+k))*width+x]*kernel[k+radius];
    out[y*width+x] = sum;
  }
  return out;
}
export function normalizeMonitor(gray, width, height, radius = 20) {
  const stride = width + 1, integral = new Float64Array(stride*(height+1));
  for (let y = 0; y < height; y++) {
    let sum = 0; for (let x = 0; x < width; x++) { sum += gray[y*width+x]; integral[(y+1)*stride+x+1] = sum + integral[y*stride+x+1]; }
  }
  const result = new Uint8ClampedArray(gray.length);
  for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
    const l=Math.max(0,x-radius),r=Math.min(width,x+radius+1),t=Math.max(0,y-radius),b=Math.min(height,y+radius+1);
    const mean=(integral[b*stride+r]-integral[t*stride+r]-integral[b*stride+l]+integral[t*stride+l])/((r-l)*(b-t));
    result[y*width+x]=235+(gray[y*width+x]-mean)*5;
  }
  return result;
}
export function estimateMonitorSkew(gray, width, height) {
  const points=[];
  for(let y=0;y<height;y++) for(let x=0;x<width;x+=3) if(gray[y*width+x]<130) points.push([x,y]);
  if (points.length < 30) return 0;
  let best=0, score=-Infinity;
  for(let angle=-10;angle<=10;angle+=.25) {
    const slope=Math.tan(angle*Math.PI/180),hist=new Uint32Array(height+width+4);
    for(const [x,y] of points) hist[Math.round(y+x*slope+width/2)]++;
    let sum=0;for(const count of hist)sum+=count*count;
    if(sum>score){score=sum;best=angle;}
  }
  return best;
}
export function monitorLineBands(gray,width,height) {
  const bands=[];let start=-1,last=-1;
  for(let y=0;y<height;y++) {
    let ink=0;for(let x=0;x<width;x++)if(gray[y*width+x]<150)ink++;
    if(ink>width*.035 && ink<width*.65) {
      if(start<0) start=y;
      else if(y-last>5){if(last-start>=10)bands.push({top:Math.max(0,start-6),bottom:Math.min(height,last+7)});start=y;}
      last=y;
    }
  }
  if(start>=0&&last-start>=10)bands.push({top:Math.max(0,start-6),bottom:Math.min(height,last+7)});
  return bands;
}
function grayCanvas(gray,width,height) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(width,height);
  for(let i=0;i<gray.length;i++){pixels.data[i*4]=pixels.data[i*4+1]=pixels.data[i*4+2]=gray[i];pixels.data[i*4+3]=255;}
  ctx.putImageData(pixels,0,0);return canvas;
}
function redPixels(canvas) {const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;return Uint8ClampedArray.from({length:p.length/4},(_,i)=>p[i*4]);}
export async function prepareMonitorImage(file,crop) {
  const bitmap=await createImageBitmap(file);
  try {
    const left=bitmap.width*crop.left/100,top=bitmap.height*crop.top/100;
    const width=bitmap.width*(crop.right-crop.left)/100,height=bitmap.height*(crop.bottom-crop.top)/100;
    const scale=Math.min(1,2400/Math.max(width,height));
    const source=document.createElement('canvas');source.width=Math.max(1,Math.round(width*scale));source.height=Math.max(1,Math.round(height*scale));
    const ctx=source.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,source.width,source.height);ctx.drawImage(bitmap,left,top,width,height,0,0,source.width,source.height);
    const sigma=Math.max(1,Math.max(bitmap.width,bitmap.height)*scale/1280);
    const smooth=grayCanvas(gaussian(redPixels(source),source.width,source.height,sigma),source.width,source.height);
    const shrink=Math.min(1,1200/Math.max(source.width,source.height));
    const small=document.createElement('canvas');small.width=Math.round(source.width*shrink);small.height=Math.round(source.height*shrink);
    const sc=small.getContext('2d');sc.imageSmoothingQuality='high';sc.drawImage(smooth,0,0,small.width,small.height);
    const normalized=normalizeMonitor(redPixels(small),small.width,small.height);
    const angle=estimateMonitorSkew(normalized,small.width,small.height);
    const clean=grayCanvas(normalized,small.width,small.height),rad=angle*Math.PI/180;
    const rotated=document.createElement('canvas');rotated.width=Math.ceil(Math.abs(clean.width*Math.cos(rad))+Math.abs(clean.height*Math.sin(rad)));rotated.height=Math.ceil(Math.abs(clean.height*Math.cos(rad))+Math.abs(clean.width*Math.sin(rad)));
    const rc=rotated.getContext('2d');rc.fillStyle='white';rc.fillRect(0,0,rotated.width,rotated.height);rc.translate(rotated.width/2,rotated.height/2);rc.rotate(rad);rc.drawImage(clean,-clean.width/2,-clean.height/2);
    const bands=monitorLineBands(redPixels(rotated),rotated.width,rotated.height);
    return {canvas:rotated,bands,angle};
  } finally {bitmap.close();}
}
export function monitorLineCanvas(canvas,band,ratio) {
  const out=document.createElement('canvas');out.width=Math.round(canvas.width*ratio);out.height=band.bottom-band.top+16;
  const ctx=out.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,out.width,out.height);ctx.imageSmoothingQuality='high';ctx.drawImage(canvas,0,band.top,canvas.width,band.bottom-band.top,0,8,out.width,band.bottom-band.top);return out;
}
