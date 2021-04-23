/*
 * 利用rpx单位进行绘制海报的工具
 * 最终生成2倍图大小
 * 需要页面及样式配合，canvas设成2倍大小，否则可能造成图片模糊
 */
/* eslint-disable no-param-reassign */
import { mp, getSystemInfo } from 'miniprogram-tools/weapp';

mp.add(['getImageInfo', 'canvasToTempFilePath']);

const { pxRatio } = getSystemInfo();

// 为了图片清晰及计算方便，这里统一为2倍大小
const rpx2px = value => (Number(value) ? value * pxRatio * 2 : value);

const px2rpx = value => value / pxRatio / 2;

/*
 * 以下传参时全用rpx单位，并内部转换为px
 */

// 转换传入字体为标准的css格式，字号只能用rpx单位
const font = (value = '') => {
  if (typeof value === 'number') return `${rpx2px(value).toFixed(0)}px sans-serif`;
  let fontFamily = '';
  if (!String(value).match(/ +((\b|'|")[a-z][\w- ]+\1);?$/gi)) fontFamily = ' sans-serif';
  return String(value)
    .replace(/;$/, '')
    .replace(/\b(\d+)rpx\b/gi, ($0, $1) => `${rpx2px($1).toFixed(0)}px`)
    + fontFamily;
};

// 从网络地址获取图片信息
// pics: 图片地址列表
// 使用getImageInfo逐个下载图像，并把网络地址替换为本地路径
const loadImages = (pics = []) => Promise.all(pics.map(src => (src ? mp.getImageInfo({ src }) : '')))
  .then(res => res.map((item, i) => (String(pics[i]).match(/^https?:/) ? item.path : pics[i])))
  .catch(e => e);

/* ======== 内部方法 ========== */
const isColor = v => /^(?:#|rgba?|transparent)/i.test(v);
const unitless = v => Number.parseInt(v, 10);
const isNumber = v => !Number.isNaN(+v);
const isString = v => typeof v === 'string';
const isStyle = v => /^solid|dashed$/.test(v);

// 把边框解析为数组[1, 'solid', '#000']
const border = value => {
  const bd = [1, 'solid', '#000'];

  if (isNumber(value)) return [value].concat(bd.slice(1, 3));
  if (isString(value)) {
    const val = value.split(' ');
    return val.reduce((acc, v) => {
      if (isStyle(v)) acc[1] = v;
      else if (isColor(v)) acc[2] = v;
      else {
        v = unitless(v);
        if (isNumber(v)) acc[0] = rpx2px(v);
      }
      return acc;
    }, bd);
  }
};

// 把阴影解析为[0, 0, 0, '#000']形式
const shadow = value => {
  const shd = [0, 0, 0, '#000'];

  if (isString(value)) {
    const val = value.split(' ');
    return val.reduce((acc, v, i) => {
      const uv = unitless(v);
      if (isNumber(uv)) acc[i] = uv;
      else if (isColor(v)) acc[3] = v;
      return acc;
    }, shd);
  }
};

/*
 * 设置虚线
 * w: [虚线宽度]
 */
const dashed = (ctx, w) => {
  ctx.setLineDash([w * 2, w * 4]);
};

/*
 * 在图形中填充图像
 *
 * src: [图像网络地址]
 * x:  [要填充的起始x坐标]
 * y:  [要填充的起始y坐标]
 * w:  [要填充的宽度]
 * h:  [要填充的高度]
 * p:  [要填充的内边距]
 */
const fillImage = (ctx, src, x, y, w, h, p) => {
  if (p) {
    x += p;
    y += p;
    w -= p * 2;
    h -= p * 2;
  }
  ctx.clip();
  ctx.drawImage(src, x, y, w, h);
};

/*
 * 把路径绘制到画布上
 * c:   [矩形填充色]
 * bd:  [矩形边框样式]
 * shd: [矩形阴影样式]
 * x:  [矩形起始x坐标]
 * y:  [矩形起始y坐标]
 * w:  [矩形宽度]
 * h:  [矩形高度]
 * src: [图像网络地址]
 * p:  [要填充图像的内边距]
 */
const shape = (ctx, c, bd, shd, x, y, w, h, src, p) => {
  // 设定shadow参数
  ctx.save();
  if (shd) {
    const [sx, sy, sb, sc] = shadow(shd);
    ctx.shadowOffsetX = sx;
    ctx.shadowOffsetY = sy;
    ctx.shadowBlur = sb;
    ctx.shadowColor = sc;
  }

  if (c) {
    // 设定填充色
    ctx.fillStyle = c;
    ctx.fill();
  }

  if (bd) {
    // 设定边框线参数
    const [bw, bs, bc] = border(bd);
    ctx.lineWidth = bw;
    ctx.strokeStyle = bc;
    if (bs === 'dashed') dashed(ctx, bw);
    ctx.stroke();

    if (src) {
      const scaleX = w / (w + bw);
      const scaleY = h / (h + bw);
      const transX = bw / 2 + x * (1 - scaleX);
      const transY = bw / 2 + y * (1 - scaleY);
      ctx.translate(transX, transY);
      ctx.scale(scaleX, scaleY);
    }
  }

  // 还原设置，避免传给图像
  if (shd) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.shadowColor = '#000';
  }

  // 绘制图像
  if (src) fillImage(ctx, src, x, y, w, h, p);
  ctx.restore();
};

// 依次用rpx2px转换
const bcr = (...args) => args.map(rpx2px);

/* /==================== */

/**
 * 绘制一张图片
 *
 * src: [要绘制的图片地址]
 * x:   [起始x坐标]
 * y:   [起始y坐标]
 * w:   [图片宽度]
 * h:   [图片高度]
 */
const image = (ctx, src, x, y, w, h) => {
  ctx.drawImage(src, ...bcr(x, y, w, h));
};

/*
 * 绘制矩形
 *
 * x:   [矩形起始x坐标]
 * y:   [矩形起始y坐标]
 * w:   [矩形宽度]
 * h:   [矩形高度]
 * c:   [矩形填充色]
 * bd:  [矩形边框样式]
 * shd: [矩形阴影样式]
 * src: [填充图像的地址]
 */
const rect = (ctx, x, y, w, h, c, bd, shd, src, p) => {
  [x, y, w, h, p] = bcr(x, y, w, h, p);
  // 创建一个矩形路径
  ctx.rect(x, y, w, h);

  // 根据填充色、边框、阴影画出此路径
  shape(ctx, c, bd, shd, x, y, w, h, src, p);
};

/**
 * 绘制圆角矩形
 *
 * x: [起始x坐标]
 * y: [起始y坐标]
 * w: [宽度]
 * h: [高度]
 * r: [圆角半径，可传入数组，以支持单个圆角定义]
 * c: [填充色]
 * bd: [边框样式]
 * shd: [阴影样式]
 * src: [填充图片的地址]
 */
const roundRect = (ctx, x, y, w, h, r, c, bd, shd, src, p) => {
  [x, y, w, h, p] = bcr(x, y, w, h, p);

  let drawing = true;

  // 先保存状态
  ctx.save();

  if (drawing) {
    // 开始绘制
    ctx.beginPath();
    // 分别从左上，右上，右下，左下绘制四个圆角
    // r的单位转换放到此处一起处理，少一次判断
    if (!Array.isArray(r)) r = [r, r, r, r];
    const [rTL = 0, rTR = 0, rBR = 0, rBL = 0] = Array.from(r, rpx2px);
    ctx.arc(x + rTL, y + rTL, rTL, Math.PI, Math.PI * 1.5);
    ctx.arc(x + w - rTR, y + rTR, rTR, Math.PI * 1.5, Math.PI * 2);
    ctx.arc(x + w - rBR, y + h - rBR, rBR, 0, Math.PI * 0.5);
    ctx.arc(x + rBL, y + h - rBL, rBL, Math.PI * 0.5, Math.PI);
    ctx.closePath();

    shape(ctx, c, bd, shd, x, y, w, h, src, p);
  }
  ctx.restore();
  drawing = false;
};

/**
 * 绘制圆形
 *
 * x: [圆形x坐标]
 * y: [圆形y坐标]
 * d: [圆形直径]
 * c: [圆形填充色]
 * bd: [圆形边框样式]
 * shd: [圆形阴影样式]
 * src: [填充图片的地址]
 */
const circle = (ctx, x, y, d, c, bd, shd, src, p) => {
  roundRect(ctx, x, y, d, d, d / 2, c, bd, shd, src, p);
};

/**
 * 绘制椭圆
 *
 * x: [椭圆x坐标]
 * y: [椭圆y坐标]
 * w: [椭圆轴1]
 * h: [椭圆轴2]
 * c: [椭圆填充色]
 * bd: [椭圆边框样式]
 * shd: [椭圆阴影样式]
 * src: [填充图片的地址]
 */
const ellipse = (ctx, x, y, w, h, c, bd, shd, src, p) => {
  [x, y, w, h, p] = bcr(x, y, w, h, p);

  // 以圆心为中点画椭圆
  // 椭圆的参数方程：x=acosθ | y=bsinθ，这里x,y为左上角图标，所以相对圆心需要再加上a,b。
  const a = w / 2;
  const b = h / 2;
  const step = (a > b) ? 1 / a : 1 / b;
  ctx.beginPath();
  ctx.moveTo(x + 2 * a, y + b);
  for (let i = 0; i < 2 * Math.PI; i += step) {
    ctx.lineTo(x + a * (1 + Math.cos(i)), y + b * (1 + Math.sin(i)));
  }
  ctx.closePath();

  // 绘制到画布上
  shape(ctx, c, bd, shd, x, y, w, h, src, p);
};

/**
 * 绘制填充图像的矩形
 */
const rectImage = (ctx, src, x, y, w, h, bd, shd, p) => {
  rect(ctx, x, y, w, h, null, bd, shd, src, p);
};

/**
 * 绘制填充图像的圆角矩形
 */
const roundRectImage = (ctx, src, x, y, w, h, r, bd, shd, p) => {
  roundRect(ctx, x, y, w, h, r, null, bd, shd, src, p);
};

/**
 * 绘制填充图像的圆形
 */
const circleImage = (ctx, src, x, y, d, bd, shd, p) => {
  circle(ctx, x, y, d, null, bd, shd, src, p);
};

/**
 * 绘制填充图像的椭圆形
 */
const ellipseImage = (ctx, src, x, y, w, h, bd, shd, p) => {
  ellipse(ctx, x, y, w, h, null, bd, shd, src, p);
};

/**
 * 居中绘制一张图片
 *
 * src: [要绘制的图片地址]
 * x:   [起始x坐标]
 * y:   [起始y坐标]
 * w:   [图片宽度]
 * h:   [图片高度]
 * cw:  [要居中区域的宽度]
 */
const centerImage = (ctx, src, x, y, w, h, cw) => {
  [x, y, w, h, cw] = bcr(x, y, w, h, cw);

  x += (cw - w) / 2;

  ctx.drawImage(src, x, y, w, h);
};

/**
 * 绘制单行文本
 *
 * txt: [要绘制的一行文本]
 * x:   [x坐标]
 * y:   [y坐标]
 * fs:  [字体]
 * c:   [字体颜色]
 * sk:  [字体描边]
 * w:   [需要绘制的最大宽度]
 */

const text = (ctx, txt, x, y, fs, c, sk, w) => {
  [x, y, w] = bcr(x, y, w);
  ctx.font = font(fs);

  if (c) ctx.fillStyle = c;
  ctx.save();
  ctx.setTextBaseline('top');
  if (sk) {
    const [skw, , skc] = border(sk);
    ctx.lineWidth = skw;
    ctx.strokeStyle = skc;
    ctx.strokeText(txt, x, y, w);
  }
  ctx.fillText(txt, x, y, w);
  ctx.restore();
};

/**
 * 居中绘制一行文本
 *
 * txt: [要绘制的一行文本]
 * x:   [起始x坐标]
 * y:   [起始y坐标]
 * w:   [整体宽度]
 * fs:  [字体]
 * c:   [字体颜色]
 * sk:  [字体描边]
 */

const centerText = (ctx, txt, x, y, w, fs, c, sk) => {
  [x, y, w] = bcr(x, y, w);
  ctx.font = font(fs);

  if (c) ctx.fillStyle = c;
  x += w / 2;

  ctx.save();
  ctx.setTextBaseline('top');
  ctx.setTextAlign('center');
  if (sk) {
    const [skw, , skc] = border(sk);
    ctx.lineWidth = skw;
    ctx.strokeStyle = skc;
    ctx.strokeText(txt, x, y, w);
  }
  ctx.fillText(txt, x, y, w);
  ctx.restore();
};

/**
 * 绘制多行文本
 *
 * txt: [要绘制的大段文本]
 * x:   [起始x坐标]
 * y:   [起始y坐标]
 * w:   [一行宽度]
 * lh:  [行高]
 * ln:  [最大行数]
 * fs:  [字体]
 * c:   [字体颜色]
 */
const paragraph = (ctx, txt, x, y, w, lh, ln, fs, c) => {
  [x, y, w, lh] = bcr(x, y, w, lh);
  ctx.font = font(fs);

  // 文本宽度
  const tw = ctx.measureText(txt).width;
  const textLines = [''];
  let i = 0;
  if (tw > w) {
    // 最大行宽
    let lw = 0;
    txt.split('').forEach(t => {
      textLines[i] += t;
      lw = ctx.measureText(textLines[i]).width;
      if (lw >= w) {
        // 本行退回一个字符
        textLines[i] = textLines[i].slice(0, -1);
        i += 1;
        // 并丢到下一行开始
        textLines[i] = t;
      }
    });
  } else {
    textLines[0] = txt;
  }

  if (c) ctx.fillStyle = c;
  ctx.save();
  ctx.setTextBaseline('top');
  textLines.forEach((line, j) => {
    if (j === ln - 1 && i > ln) line = `${line.slice(0, line.length - 1)}...`;
    if (j < ln) ctx.fillText(line, x, y + lh * (j + 1));
  });
  ctx.restore();
};

/*
 * 绘制到画布上
 */
const toCanvas = (ctx, reverse) => new Promise(resolve => ctx.draw(reverse, resolve));

/* 输入画布内容为指定大小的图片，得到文件的临时本地路径
 * canvasId: [画布标识，传入 canvas 组件的 canvas-id]
 * options:  [传入canvasToTempFilePath的其它参数]
 * @return path: 文件的临时路径
 */
const toImage = (ctx, canvasId, options) => toCanvas(ctx)
  .then(() => mp.canvasToTempFilePath({ canvasId, ...options }))
  .then(res => ({ path: res.tempFilePath }))
  .catch(e => e);

export default {
  utils: {
    rpx2px,
    px2rpx,
    font,
    loadImages,
  },
  image,
  rect,
  rectImage,
  roundRect,
  roundRectImage,
  circle,
  circleImage,
  ellipse,
  ellipseImage,
  text,
  paragraph,
  centerText,
  centerImage,
  toCanvas,
  toImage,
};
