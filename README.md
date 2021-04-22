# draw

　　这是一个超轻量的小程序Canvas海报绘制工具，尽量省去复杂的绘图方法，简简单单生成海报。

## 安装

```javascript
npm install miniprogram-draw
```

## APIs

### 工具

#### rpx转px `rpx2px(value: Number): Number`

根据当前屏幕像素比返回2倍大小的px数值

```javascript
draw.utils.rpx2px(20);
```

#### px转rpx `px2rpx(value: Number): Number`

根据当前屏幕像素比返回rpx数值

```javascript
draw.utils.px2rpx(20);
```

#### 载入网络图片 `loadImages(input: Array): Array`

```javascript
draw.utils.loadImages(['https://xx', 'https://xx'])
```

#### 设置css font属性 `font(canvas: Object, value: Number | String)`

```javascript
draw.utils.font(20)
draw.utils.font('bold 30rpx')
```

### 形状

#### 绘制图片 `image(canvas: Object, src: String, x: Number, y: Number, width: Number, height: Number)`

#### 绘制矩形 `rect(canvas: Object, x: Number, y: Number, width: Number, height: Number, color: String, border: String, shadow: String, padding: Number)`

#### 绘制圆角矩形 `roundRect(canvas: Object, x: Number, y: Number, width: Number, height: Number, radius: Number, color: String, border: String, shadow: String, padding: Number)`

#### 绘制圆形　`circle(canvas: Object, x: Number, y: Number, diameter: Number, color: String, border: String, shadow: String, padding: Number)`

#### 绘制椭圆 `ellipse(canvas: Object, x: Number, y: Number, width: Number, height: Number, color: String, border: String, shadow: String, padding: Number)`

#### 绘制填充图像的矩形 `rectImage(canvas: Object, src: String, x: Number, y: Number, width: Number, height: Number, border: String, shadow: String, padding: Number)`

#### 绘制填充图像的圆角矩形 `roundRectImage(canvas: Object, src: String, x: Number, y: Number, width: Number, height: Number, radius: Number, border: String, shadow: String, padding: Number)`

#### 绘制填充图像的圆形 `circleImage(canvas: Object, src: String, x: Number, y: Number, diameter: Number, border: String, shadow: String, padding: Number)`

#### 绘制填充图像的椭圆形 `ellipseImage(canvas: Object, src: String, x: Number, y: Number, width: Number, height: Number, border: String, shadow: String, padding: Number)`

#### 居中绘制一张图片 `centerImage(canvas: Object, src: String, x: Number, y: Number, width: Number, height: Number, cWidth: Number)`

#### 绘制单行文本 `text(canvas: Object, txt: String, x: Number, y: Number, font: String | Number, color: String, stroke: String | Number, maxWidth: Number)`

#### 居中绘制一行文本 `centerText(canvas: Object, txt: String, x: Number, y: Number, width: Number, font: String | Number, color: String, stroke: String | Number)`

#### 绘制多行文本　`paragraph(canvas: Object, txt: String, x: Number, y: Number, maxWidth: Number, lineHeigh: Number, maxLine: Number, font: String | Number, color: String)`

#### 绘制到画布上 `toCanvas(canvas: Object, reverse: Boolean)`
返回Promise

#### 输出为图片 `toImage(canvas: Object, canvasId: String, options: Object)`
返回Promise
