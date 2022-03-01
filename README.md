# React Image Crop

An image cropping tool for React with no dependencies.

[![React Image Crop on NPM](https://img.shields.io/npm/v/react-image-crop.svg)](https://www.npmjs.com/package/react-image-crop)

[Demo using class](https://codesandbox.io/s/72py4jlll6) |
[Demo using hook](https://codesandbox.io/s/react-image-crop-demo-with-react-hooks-y831o)

![ReactCrop Demo](https://raw.githubusercontent.com/DominicTobias/react-image-crop/master/crop-demo.gif)

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Example](#example)
5. [CDN](#cdn)
6. [Props](#props)
7. [FAQ](#faq)
   1. [What about showing the crop on the client?](#what-about-showing-the-crop-on-the-client)
   2. [How to correct image EXIF orientation/rotation](#how-to-correct-image-exif-orientationrotation)
   3. [How to filter, rotate and annotate](#how-to-filter-rotate-and-annotate)
   4. [How can I center the crop?](#how-can-i-center-the-crop)
8. [Contributing / Developing](#contributing--developing)

## Features

- Responsive (you can use pixels or percentages).
- Touch enabled.
- Free-form or fixed aspect crops.
- Fully keyboard accessible (a11y).
- No dependencies/small footprint (5KB gzip).
- Min/max crop size.
- Crop anything, not just images.

If React Crop doesn't cover your requirements then take a look at [Pintura](https://gumroad.com/a/611955827). It features cropping, rotating, filtering, annotation, and lots more.

[Learn more about Pintura here](https://gumroad.com/a/611955827)

## Installation

```
npm i react-image-crop --save
yarn add react-image-crop
```

This library works with all modern browsers. It does not work with IE.

## Usage

Include the main js module:

```js
import ReactCrop from 'react-image-crop'
```

Include either `dist/ReactCrop.css` or `ReactCrop.scss`.

```js
import 'react-image-crop/dist/ReactCrop.css'
// or scss:
import 'react-image-crop/src/ReactCrop.scss'
```

## Example

```tsx
function CropDemo({ src }) {
  const [crop, setCrop] = useState<Crop>()
  return (
    <ReactCrop crop={crop} onChange={c => setCrop(c)}>
      <img src={src} />
    </ReactCrop>
  )
}
```

See the [sandbox demo](https://codesandbox.io/s/72py4jlll6) for a more complete example.

## CDN

```html
<script src="https://unpkg.com/react-image-crop/dist/ReactCrop.min.js"></script>
```

Note when importing the script globally using a `<script>` tag access the component with `ReactCrop.Component`.

## Props

#### onChange(crop, percentCrop) (required)

A callback which happens for every change of the crop (i.e. many times as you are dragging/resizing). Passes the current crop state object.

Note you _must_ implement this callback and update your crop state, otherwise nothing will change!

```js
onChange = (crop, percentCrop) => {
  this.setState({ crop })
  // or this.setState({ crop: percentCrop })
}
```

`crop` and `percentCrop` are interchangeable. `crop` uses pixels and `percentCrop` uses percentages to position and size itself. Percent crops are resistant to image/media resizing.

#### aspect

The aspect ratio of the crop, e.g. `1` for a square or `16 / 9` for landscape.

#### crop

\* _While you can initially omit the crop object, any subsequent change will need to be saved to state in the `onChange` and passed into the component._

```tsx
const [crop, setCrop] = useState<Crop>({
  unit: 'px', // default, can be 'px' or '%'
  x: 130,
  y: 50,
  width: 200,
  height: 200
})

<ReactCrop crop={crop} onChange={c => setCrop(c)} />
```

Crops that you set are not corrected so you must ensure that they are in bounds (easy with percentage crops) and adhere to your aspect ratio if set (harder with percentage crops).

Since percentage crops with fixed aspect ratios are tricky you can use the helper method `makeAspectCrop`. See [How can I center the crop?](#how-can-i-center-the-crop) for an example.

#### minWidth (optional)

A minimum crop width, in pixels.

#### minHeight (optional)

A minimum crop height, in pixels.

#### maxWidth (optional)

A maximum crop width, in pixels.

#### maxHeight (optional)

A maximum crop height, in pixels.

#### keepSelection (optional)

If true is passed then selection can't be disabled if the user clicks outside the selection area.

#### disabled (optional)

If true then the user cannot resize or draw a new crop. A class of `ReactCrop--disabled` is also added to the container for user styling.

#### locked (optional)

If true then the user cannot create or resize a crop, but can still drag the existing crop around. A class of `ReactCrop--locked` is also added to the container for user styling.

#### className (optional)

A string of classes to add to the main `ReactCrop` element.

#### style (optional)

Inline styles object to be passed to the image wrapper element.

#### onComplete(crop, percentCrop) (optional)

A callback which happens after a resize, drag, or nudge. Passes the current crop state object.

`percentCrop` is the crop as a percentage. A typical use case for it would be to save it so that the user's crop can be restored regardless of the size of the image (for example saving it on desktop, and then using it on a mobile where the image is smaller).

#### onDragStart(event) (optional)

A callback which happens when a user starts dragging or resizing. It is convenient to manipulate elements outside this component.

#### onDragEnd(event) (optional)

A callback which happens when a user releases the cursor or touch after dragging or resizing.

#### renderSelectionAddon(state) (optional)

Render a custom element in crop selection.

#### ruleOfThirds (optional)

Show [rule of thirds](https://en.wikipedia.org/wiki/Rule_of_thirds) lines in the cropped area. Defaults to `false`.

#### circularCrop (optional)

Show the crop area as a circle. If your aspect is not 1 (a square) then the circle will be warped into an oval shape. Defaults to `false`.

## FAQ

### What about showing the crop on the client?

I wanted to keep this component focused so I didn't provide this. Normally a cropped image will be rendered and cached by a backend.

However here's a function that returns a image URL for the cropped part after providing some parameters you already have when using this package:

```js
/**
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 */
export function getCroppedImg(image, crop) {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const ctx = canvas.getContext("2d");

  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise(resolve => {
    canvas.toBlob(blob => {
        // fileUrlRef.current or whatever variable you use.
        // The point is to release previous memory.
        window.URL.revokeObjectURL(fileUrlRef.current)
        fileUrlRef.current = window.URL.createObjectURL(blob)

        resolve(fileUrlRef.current);
      },
      "image/jpeg",
      1
    );
  });
}

async test() {
  const croppedImg = await getCroppedImg(image, crop, fileName);
}
```

For a more advanced example check out the [react hook demo](https://codesandbox.io/s/react-image-crop-demo-with-react-hooks-y831o).

Some things to consider:

- Cropping from an off-screen image if your image is sized down

- Scaling down during conversion to reduce upload size (e.g. from a phone camera)

### How to correct image EXIF orientation/rotation

You might find that some images are rotated incorrectly. Unfortunately this is a browser wide issue not related to this library. You need to fix your image before passing it in.

You can use the following library to load images, which will correct the rotation for you: https://github.com/blueimp/JavaScript-Load-Image/

You can read an issue on this subject here: https://github.com/DominicTobias/react-image-crop/issues/181

If you're looking for a complete out of the box image editor which already handles EXIF rotation then consider using [Pintura](https://gumroad.com/a/611955827).

<h3>How to filter, rotate and annotate</h3>

This library is deliberately lightweight and minimal for you to build features on top of. If you wish to perform more advanced image editing out of the box then consider using [Pintura](https://gumroad.com/a/611955827).

![Pintura Demo](https://raw.githubusercontent.com/DominicTobias/react-image-crop/master/doka-demo.gif)

### How can I center the crop?

The easiest way is to use the percentage unit:

```js
crop: {
  unit: '%',
  width: 50,
  height: 50,
  x: 25,
  y: 25
}
```

Centering an aspect ratio crop is trickier especially when dealing with `%`. However two helper functions are provided:

1. Listen to the load event of your media to get its size:

```jsx
<ReactCrop crop={crop} aspect={16 / 9}>
  <img src={src} onLoad={onImageLoaded} />
</ReactCrop>
```

2. Use `makeAspectCrop` to create your desired aspect and then `centerCrop` to center it:

```js
function onImageLoaded(e) {
  const { width, height } = e.currentTarget

  const crop = centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 100,
      },
      16 / 9,
      width,
      height
    ),
    width,
    height
  )

  this.setState({ crop })
}
```

Also remember to set your crop using the percentCrop on changes:

```js
const onCropChange = (crop, percentCrop) => this.setState({ crop: percentCrop })
```

## Contributing / Developing

To develop run `yarn start`, this will recompile your JS and SCSS on changes.

You can test your changes by opening `test/index.html` in a browser (you don't need to be running a server).
