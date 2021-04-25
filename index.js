/*
 * 利用rpx单位进行绘制海报的工具
 * 最终生成2倍图大小
 * 需要页面及样式配合，canvas设成2倍大小，否则可能造成图片模糊
 */
/* eslint-disable no-param-reassign */
import { mp, getSystemInfo } from 'miniprogram-tools/weapp';

mp.add(['getImageInfo', 'canvasToTempFilePath']);

// 从网络地址获取图片信息
// pics: 图片地址列表
// 使用getImageInfo逐个下载图像，并把网络地址替换为本地路径
const loadImages = (pics = []) => Promise.all(pics.map(src => (src ? mp.getImageInfo({ src }) : '')))
  .then(res => res.map((item, i) => (String(pics[i]).match(/^https?:/) ? item.path : pics[i])))
  .catch(e => e);

const { pxRatio = 0.5, devicePixelRatio = 2 } = getSystemInfo();

// 为了图片清晰，这里设定ratio为放大倍数
const rpx2px = (value, ratio = devicePixelRatio) => (Number(value) ? value * pxRatio * ratio : value);

const px2rpx = (value, ratio = devicePixelRatio) => value / pxRatio / ratio;

/*
 * 以下传参时全用rpx单位，并内部转换为px
 */

// 转换传入字体为标准的css格式，字号只能用rpx单位
const font = (value = '', ratio = devicePixelRatio) => {
  if (typeof value === 'number') return `${rpx2px(value, ratio).toFixed(0)}px sans-serif`;
  let fontFamily = '';
  if (!String(value).match(/ +((\b|'|")[a-z][\w- ]+\1);?$/gi)) fontFamily = ' sans-serif';
  return String(value)
    .replace(/;$/, '')
    .replace(/\b(\d+)rpx\b/gi, ($0, $1) => `${rpx2px($1, ratio).toFixed(0)}px`)
    + fontFamily;
};

/* ======== 内部方法 ========== */
const isColor = v => /^(?:#|rgba?|transparent)/i.test(v);
const unitless = v => Number.parseInt(v, 10);
const isNumber = v => !Number.isNaN(+v);
const isString = v => typeof v === 'string';
const isStyle = v => /^solid|dashed$/.test(v);

// 把边框解析为数组[0, 'solid', '#000']，style目前只支持solid和dashed
const border = (that, value) => {
  const bd = [0, 'solid', '#000'];

  if (isNumber(value)) return [value].concat(bd.slice(1, 3));
  if (isString(value)) {
    const val = value.split(' ');
    return val.reduce((acc, v) => {
      if (isStyle(v)) acc[1] = v;
      else if (isColor(v)) acc[2] = v;
      else {
        v = unitless(v);
        if (isNumber(v)) acc[0] = that.utils.rpx2px(v);
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
 * src:[图像网络地址]
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
  ctx.save();
  ctx.clip();
  ctx.drawImage(src, x, y, w, h);
  ctx.restore();
};

/*
 * 把形状绘制到画布上
 * c:  [形状填充色]
 * bd: [形状边框样式]
 * shd:[形状阴影样式]
 * x:  [形状起始x坐标]
 * y:  [形状起始y坐标]
 * w:  [形状宽度]
 * h:  [形状高度]
 * src:[填充图像的地址]
 * p:  [填充图像的内边距]
 */
const shape = (that, c, bd, shd, x, y, w, h, src, p) => {
  const { ctx } = that;
  // 设定shadow参数
  ctx.save();

  if (shd) {
    const [sx, sy, sb, sc] = shadow(shd);
    ctx.shadowOffsetX = sx;
    ctx.shadowOffsetY = sy;
    ctx.shadowBlur = sb;
    ctx.shadowColor = sc;
  }

  if (bd) {
    // 设定边框线参数
    const [bw, bs, bc] = border(that, bd);
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

  if (c) {
    // 设定填充色
    ctx.fillStyle = c;
    ctx.fill();
  }

  // 绘制图像
  if (src) fillImage(ctx, src, x, y, w, h, p);
  ctx.restore();
};

const bcr = (that, ...args) => args.map(that.utils.rpx2px);

/* /==================== */

class Draw {
  constructor(canvasId, w, h, ratio = devicePixelRatio) {
    this.init(canvasId, w, h, ratio);
  }

  init(canvasId, w, h, ratio) {
    this.ctx = wx.createCanvasContext(canvasId);
    this.canvasId = canvasId;
    this.width = w;
    this.height = h;
    this.ratio = ratio;
  }

  utils = {
    rpx2px: value => rpx2px(value, this.ratio),
    px2rpx: value => px2rpx(value, this.ratio),
    font: value => {
      this.ctx.font = font(value, this.ratio);
    },
  }

  /**
   * 绘制一张图片
   *
   * src: [要绘制的图片地址]
   * x:   [起始x坐标]
   * y:   [起始y坐标]
   * w:   [图片宽度]
   * h:   [图片高度]
   */
  image(src, x, y, w, h) {
    this.ctx.drawImage(src, ...bcr(this, x, y, w, h));
  }

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
  rect(x, y, w, h, c, bd, shd, src, p) {
    [x, y, w, h, p] = bcr(this, x, y, w, h, p);

    // 创建一个矩形路径
    this.ctx.rect(x, y, w, h);

    // 根据填充色、边框、阴影画出此路径
    shape(this, c, bd, shd, x, y, w, h, src, p);
  }

  /**
   * 绘制圆角矩形
   *
   * x:  [起始x坐标]
   * y:  [起始y坐标]
   * w:  [宽度]
   * h:  [高度]
   * r:  [圆角半径，可传入数组，以支持单个圆角定义]
   * c:  [填充色]
   * bd: [边框样式]
   * shd:[阴影样式]
   * src:[填充图片的地址]
   */
  roundRect(x, y, w, h, r, c, bd, shd, src, p) {
    [x, y, w, h, p] = bcr(this, x, y, w, h, p);

    const { ctx } = this;
    let drawing = true;

    if (drawing) {
      // 开始绘制
      ctx.beginPath();
      // 分别从左上，右上，右下，左下绘制四个圆角
      // r的单位转换放到此处一起处理，少一次判断
      if (!Array.isArray(r)) r = [r, r, r, r];
      const [rTL = 0, rTR = 0, rBR = 0, rBL = 0] = Array.from(r, this.utils.rpx2px);
      ctx.arc(x + rTL, y + rTL, rTL, Math.PI, Math.PI * 1.5);
      ctx.arc(x + w - rTR, y + rTR, rTR, Math.PI * 1.5, Math.PI * 2);
      ctx.arc(x + w - rBR, y + h - rBR, rBR, 0, Math.PI * 0.5);
      ctx.arc(x + rBL, y + h - rBL, rBL, Math.PI * 0.5, Math.PI);
      ctx.closePath();

      shape(this, c, bd, shd, x, y, w, h, src, p);
    }
    drawing = false;
  }

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
  circle(x, y, d, c, bd, shd, src, p) {
    this.roundRect(x, y, d, d, d / 2, c, bd, shd, src, p);
  }

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
  ellipse(x, y, w, h, c, bd, shd, src, p) {
    [x, y, w, h, p] = bcr(this, x, y, w, h, p);
    const { ctx } = this;
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
    shape(this, c, bd, shd, x, y, w, h, src, p);
  }

  /**
   * 绘制填充图像的矩形
   */
  rectImage(src, x, y, w, h, bd, shd, p, c) {
    this.rect(x, y, w, h, c, bd, shd, src, p);
  }

  /**
   * 绘制填充图像的圆角矩形
   */
  roundRectImage(src, x, y, w, h, r, bd, shd, p, c) {
    this.roundRect(x, y, w, h, r, c, bd, shd, src, p);
  }

  /**
   * 绘制填充图像的圆形
   */
  circleImage(src, x, y, d, bd, shd, p, c) {
    this.circle(x, y, d, c, bd, shd, src, p);
  }

  /**
   * 绘制填充图像的椭圆形
   */
  ellipseImage(src, x, y, w, h, bd, shd, p, c) {
    this.ellipse(x, y, w, h, c, bd, shd, src, p);
  }

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
  centerImage(src, x, y, w, h, cw) {
    [x, y, w, h, cw] = bcr(this, x, y, w, h, cw || this.width);
    x += (cw - w) / 2;

    this.ctx.drawImage(src, x, y, w, h);
  }

  centerImageToCanvas(src, y, w, h) {
    this.centerImage(src, 0, y, w, h);
  }

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
  text(txt, x, y, fs, c, sk, w) {
    [x, y, w] = bcr(this, x, y, w || this.width);

    const { ctx } = this;

    ctx.save();
    if (fs) this.utils.font(fs);
    if (c) ctx.fillStyle = c;
    ctx.setTextBaseline('top');
    if (sk) {
      const [skw, , skc] = border(this, sk);
      ctx.lineWidth = skw;
      ctx.strokeStyle = skc;
      ctx.strokeText(txt, x, y, w);
    }
    ctx.fillText(txt, x, y, w);
    ctx.restore();
  }

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
  centerText(txt, x, y, w, fs, c, sk) {
    [x, y, w] = bcr(this, x, y, w || this.width);
    x += w / 2;

    const { ctx } = this;

    ctx.save();
    if (fs) this.utils.font(fs);
    if (c) ctx.fillStyle = c;

    ctx.setTextBaseline('top');
    ctx.setTextAlign('center');
    if (sk) {
      const [skw, , skc] = border(this, sk);
      ctx.lineWidth = skw;
      ctx.strokeStyle = skc;
      ctx.strokeText(txt, x, y, w);
    }
    ctx.fillText(txt, x, y, w);
    ctx.restore();
  }

  // 居中于画布绘制文本
  centerTextToCanvas(txt, y, fs, c, sk) {
    this.centerText(txt, 0, y, null, fs, c, sk);
  }

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
   * sk:  [字体描边]
   */
  paragraph(txt, x, y, w, lh, ln, fs, c, sk) {
    [x, y, w, lh] = bcr(this, x, y, w, lh);
    const { ctx } = this;

    ctx.save();
    if (fs) this.utils.font(fs);
    if (c) ctx.fillStyle = c;
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

    ctx.setTextBaseline('top');
    if (sk) {
      const [skw, , skc] = border(this, sk);
      ctx.lineWidth = skw;
      ctx.strokeStyle = skc;
    }
    textLines.forEach((line, j) => {
      if (j === ln - 1 && i > ln) line = `${line.slice(0, line.length - 1)}...`;
      if (j < ln) {
        ctx.strokeText(line, x, y + lh * (j + 1));
        ctx.fillText(line, x, y + lh * (j + 1));
      }
    });
    ctx.restore();
  }

  /*
   * 绘制到画布上
   */
  toCanvas(reverse) {
    return new Promise(resolve => this.ctx.draw(reverse, resolve));
  }

  /* 输入画布内容为指定大小的图片，得到文件的临时本地路径
   * options:  [传入canvasToTempFilePath的其它参数]
   * @return path: 文件的临时路径
   */
  toImage(options) {
    return this.toCanvas()
      .then(() => mp.canvasToTempFilePath({ canvasId: this.canvasId, ...options }))
      .then(res => ({ path: res.tempFilePath }))
      .catch(e => e);
  }
}

Draw.loadImages = loadImages;

export default Draw;
