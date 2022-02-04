import { Crop, Ords } from './types'

export const defaultCrop: Crop = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  unit: 'px',
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

export function isCropValid(crop: Partial<Crop>) {
  return crop && crop.width && !isNaN(crop.width) && crop.height && !isNaN(crop.height)
}

export function areCropsEqual(cropA: Partial<Crop>, cropB: Partial<Crop>) {
  return (
    cropA.width === cropB.width &&
    cropA.height === cropB.height &&
    cropA.x === cropB.x &&
    cropA.y === cropB.y &&
    cropA.aspect === cropB.aspect &&
    cropA.unit === cropB.unit
  )
}

export function makeAspectCrop(crop: Crop, imageWidth: number, imageHeight: number) {
  if (!crop.aspect || isNaN(crop.aspect)) {
    console.error('`crop.aspect` should be a number.', crop)
    return { ...defaultCrop, ...crop }
  }

  const completeCrop: Crop = {
    unit: 'px',
    x: crop.x || 0,
    y: crop.y || 0,
    width: crop.width || 0,
    height: crop.height || 0,
    aspect: crop.aspect,
  }

  if (crop.width) {
    completeCrop.height = completeCrop.width / crop.aspect
  }

  if (crop.height) {
    completeCrop.width = completeCrop.height * crop.aspect
  }

  if (completeCrop.y + completeCrop.height > imageHeight) {
    completeCrop.height = imageHeight - completeCrop.y
    completeCrop.width = completeCrop.height * crop.aspect
  }

  if (completeCrop.x + completeCrop.width > imageWidth) {
    completeCrop.width = imageWidth - completeCrop.x
    completeCrop.height = completeCrop.width / crop.aspect
  }

  return completeCrop
}

export function convertToPercentCrop(crop: Partial<Crop>, imageWidth: number, imageHeight: number): Crop {
  if (crop.unit === '%') {
    return { ...defaultCrop, ...crop }
  }

  return {
    unit: '%',
    aspect: crop.aspect,
    x: crop.x ? (crop.x / imageWidth) * 100 : 0,
    y: crop.y ? (crop.y / imageHeight) * 100 : 0,
    width: crop.width ? (crop.width / imageWidth) * 100 : 0,
    height: crop.height ? (crop.height / imageHeight) * 100 : 0,
  }
}

export function convertToPixelCrop(crop: Partial<Crop>, imageWidth: number, imageHeight: number): Crop {
  if (!crop.unit) {
    return { ...defaultCrop, ...crop, unit: 'px' }
  }

  if (crop.unit === 'px') {
    return { ...defaultCrop, ...crop }
  }

  return {
    unit: 'px',
    aspect: crop.aspect,
    x: crop.x ? (crop.x * imageWidth) / 100 : 0,
    y: crop.y ? (crop.y * imageHeight) / 100 : 0,
    width: crop.width ? (crop.width * imageWidth) / 100 : 0,
    height: crop.height ? (crop.height * imageHeight) / 100 : 0,
  }
}

export function resolveCrop(pixelCrop: Crop, imageWidth: number, imageHeight: number) {
  if (pixelCrop.aspect && (!pixelCrop.width || !pixelCrop.height)) {
    return makeAspectCrop(pixelCrop, imageWidth, imageHeight)
  }

  return pixelCrop
}

export function containCrop(prevCrop: Partial<Crop>, crop: Partial<Crop>, imageWidth: number, imageHeight: number) {
  const pixelCrop = convertToPixelCrop(crop, imageWidth, imageHeight)
  const prevPixelCrop = convertToPixelCrop(prevCrop, imageWidth, imageHeight)

  // Non-aspects are simple
  if (!pixelCrop.aspect) {
    if (pixelCrop.x < 0) {
      pixelCrop.width += pixelCrop.x
      pixelCrop.x = 0
    } else if (pixelCrop.x + pixelCrop.width > imageWidth) {
      pixelCrop.width = imageWidth - pixelCrop.x
    }

    if (pixelCrop.y + pixelCrop.height > imageHeight) {
      pixelCrop.height = imageHeight - pixelCrop.y
    }

    return pixelCrop
  }

  // Contain crop if overflowing on X.
  if (pixelCrop.x < 0) {
    pixelCrop.width = pixelCrop.x + pixelCrop.width
    pixelCrop.x = 0
    pixelCrop.height = pixelCrop.width / pixelCrop.aspect
  } else if (pixelCrop.x + pixelCrop.width > imageWidth) {
    pixelCrop.width = imageWidth - pixelCrop.x
    pixelCrop.height = pixelCrop.width / pixelCrop.aspect
  }

  // If sizing in up direction...
  if (prevPixelCrop.y > pixelCrop.y) {
    if (pixelCrop.x + pixelCrop.width >= imageWidth) {
      // ...and we've hit the right border, don't adjust Y.
      // Adjust height so crop selection doesn't move if Y is adjusted.
      pixelCrop.height += prevPixelCrop.height - pixelCrop.height
      pixelCrop.y = prevPixelCrop.y
    } else if (pixelCrop.x <= 0) {
      // ...and we've hit the left border, don't adjust Y.
      // Adjust height so crop selection doesn't move if Y is adjusted.
      pixelCrop.height += prevPixelCrop.height - pixelCrop.height
      pixelCrop.y = prevPixelCrop.y
    }
  }

  // Contain crop if overflowing on Y.
  if (pixelCrop.y < 0) {
    pixelCrop.height = pixelCrop.y + pixelCrop.height
    pixelCrop.y = 0
    pixelCrop.width = pixelCrop.height * pixelCrop.aspect
  } else if (pixelCrop.y + pixelCrop.height > imageHeight) {
    pixelCrop.height = imageHeight - pixelCrop.y
    pixelCrop.width = pixelCrop.height * pixelCrop.aspect
  }

  // If sizing in left direction and we've hit the bottom border, don't adjust X.
  if (pixelCrop.x < prevPixelCrop.x && pixelCrop.y + pixelCrop.height >= imageHeight) {
    // Adjust width so crop selection doesn't move if X is adjusted.
    pixelCrop.width += prevPixelCrop.width - pixelCrop.width
    pixelCrop.x = prevPixelCrop.x
  }

  return pixelCrop
}

// TODO: Add maxWidth, maxHeight
export function getMaxCrop(pixelCrop: Crop, ord: Ords, containerWidth: number, containerHeight: number) {
  const maxCrop = { ...pixelCrop }

  if (!maxCrop.aspect) {
    if (ord === 'n') {
      maxCrop.height = maxCrop.y + maxCrop.height
      maxCrop.y = 0
    } else if (ord === 'ne') {
      maxCrop.height = maxCrop.y + maxCrop.height
      maxCrop.width = containerWidth - maxCrop.x
      maxCrop.y = 0
    } else if (ord === 'e') {
      maxCrop.width = containerWidth - maxCrop.x
    } else if (ord === 'se') {
      maxCrop.width = containerWidth - maxCrop.x
      maxCrop.height = containerHeight - maxCrop.y
    } else if (ord === 's') {
      maxCrop.height = containerHeight - maxCrop.y
    } else if (ord === 'sw') {
      maxCrop.width = maxCrop.x + maxCrop.width
      maxCrop.height = maxCrop.y + maxCrop.height
      maxCrop.x = 0
    } else if (ord === 'w') {
      maxCrop.width = maxCrop.x + maxCrop.width
      maxCrop.x = 0
    } else if (ord === 'nw') {
      maxCrop.width = maxCrop.x + maxCrop.width
      maxCrop.height = maxCrop.y + maxCrop.height
      maxCrop.x = 0
      maxCrop.y = 0
    }
  } else {
    let longestWidth = 0
    let longestHeight = 0

    if (ord === 'ne') {
      // Furthest corner is SW.
      longestWidth = containerWidth - maxCrop.x
      longestHeight = maxCrop.y + maxCrop.height
    } else if (ord === 'se') {
      // Furthest corner is NW.
      longestWidth = containerWidth - maxCrop.x
      longestHeight = containerHeight - maxCrop.y
    } else if (ord === 'sw') {
      // Furthest corner is NE.
      longestWidth = maxCrop.x + maxCrop.width
      longestHeight = containerHeight - maxCrop.y
    } else if (ord === 'nw') {
      // Furthest corner is SE.
      longestWidth = maxCrop.x + maxCrop.width
      longestHeight = maxCrop.y + maxCrop.height
    }

    const ratioX = longestWidth / maxCrop.width
    const ratioY = longestHeight / maxCrop.height
    const ratio = Math.min(ratioX, ratioY)
    const width = maxCrop.width * ratio
    const height = width / maxCrop.aspect

    if (ord === 'ne') {
      maxCrop.y = maxCrop.y + (pixelCrop.height - height)
    } else if (ord === 'sw') {
      maxCrop.x = maxCrop.x + (pixelCrop.width - width)
    } else if (ord === 'nw') {
      maxCrop.x = maxCrop.x + (pixelCrop.width - width)
      maxCrop.y = maxCrop.y + (pixelCrop.height - height)
    }

    maxCrop.width = width
    maxCrop.height = height
  }

  return maxCrop
}
