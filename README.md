# draw

　　这是一个超轻量的小程序Canvas海报绘制工具，尽量省去复杂的绘图方法，简简单单生成海报。

## 安装

```bash
npm install miniprogram-draw
```

## 使用

创建绘图实例

```javascript
// 获取canvas上下文，如果在组件中使用，instance需传入this
const draw = new Draw(canvasId: String, canvasWidth: Number, canvasHeight: Number, ratio?: Number, instance?: Object);
```

其中，`ratio`可省略，默认为当前机型的devicePixelRatio

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

#### 设置css font属性 `font(value: Number | String)`

```javascript
draw.utils.font(20)
draw.utils.font('bold 30rpx')
```

#### 载入网络图片 `loadImages(input: Array): Array`

```javascript
Draw.loadImages(['https://xx', 'https://xx'])
```

### 图像

#### 绘制图片 `image(src: String, x: Number, y: Number, width: Number, height: Number)`

```javascript
draw.image('https://xx', 10, 20, 120, 100);
```

调用示例下同

#### 居中绘制一张图片 `centerImage(src: String, x: Number, y: Number, width: Number, height: Number, cWidth?: Number)`

### 图形

#### 绘制矩形 `rect(x: Number, y: Number, width: Number, height: Number, color?: String, border?: String, shadow?: String, padding?: Number)`

#### 绘制圆角矩形 `roundRect(x: Number, y: Number, width: Number, height: Number, radius: Number, color?: String, border?: String, shadow?: String, padding?: Number)`

#### 绘制圆形　`circle(x: Number, y: Number, diameter: Number, color?: String, border?: String, shadow?: String, padding?: Number)`

#### 绘制椭圆 `ellipse(x: Number, y: Number, width: Number, height: Number, color?: String, border?: String, shadow?: String, padding?: Number)`

#### 绘制填充图像的矩形 `rectImage(src: String, x: Number, y: Number, width: Number, height: Number, border?: String, shadow?: String, padding?: Number, color?: String)`

#### 绘制填充图像的圆角矩形 `roundRectImage(src: String, x: Number, y: Number, width: Number, height: Number, radius: Number, border?: String, shadow?: String, padding?: Number, color?: String)`

#### 绘制填充图像的圆形 `circleImage(src: String, x: Number, y: Number, diameter: Number, border?: String, shadow?: String, padding?: Number, color?: String)`

#### 绘制填充图像的椭圆形 `ellipseImage(src: String, x: Number, y: Number, width: Number, height: Number, border?: String, shadow?: String, padding?: Number, color?: String)`

### 文本

#### 绘制单行文本 `text(txt: String, x: Number, y: Number, font: String | Number, color?: String, stroke?: String | Number, maxWidth?: Number)`

#### 居中绘制一行文本 `centerText(txt: String, x: Number, y: Number, width: Number, font: String | Number, color?: String, stroke?: String | Number)`

#### 绘制多行文本　`paragraph(txt: String, x: Number, y: Number, maxWidth: Number, lineHeigh: Number, maxLine: Number, font: String | Number, color?: String, stroke?: String | Number)`

### 生成

#### 绘制到画布上 `toCanvas(reverse?: Boolean)`
返回Promise

#### 输出为图片 `toImage(options: Object)`
返回Promise

options 参数同`canvasToTempFilePath`参数
