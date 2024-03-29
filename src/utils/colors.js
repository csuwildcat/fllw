
function alphanumericToHex(str) {
  return str.split('')
            .map(char => char.charCodeAt(0).toString(16))
            .join('')
            .substring(0, 64);
}

// Converts HSL to RGB, then to Hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0'); // Convert to Hex
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Maps a portion of the hash to an HSL range, ensuring vibrant or pastel colors
function mapHashToHSL(hashPart, offset = 0) {
  // Use the hash part to determine the hue, ensuring full spectrum coverage
  const hue = (parseInt(hashPart.substr(0, 2), 16) + offset) % 360; // Hue: 0-359
  const saturation = 70 + parseInt(hashPart.substr(2, 2), 16) % 31; // Saturation: 70-100%
  const lightness = 40 + parseInt(hashPart.substr(4, 2), 16) % 21; // Lightness: 40-60%
  return { hue, saturation, lightness };
}

export function hashToGradient(hash) {
  const hexHash = alphanumericToHex(hash).substring(0, 64);

  // Generate first color with a base hue
  const hsl1 = mapHashToHSL(hexHash.substring(0, 6));
  let color1Hex = hslToHex(hsl1.hue, hsl1.saturation, hsl1.lightness);

  // Generate second color, ensuring a significant hue shift for variety
  // Calculate an offset to ensure the second color is significantly different
  const offset = 150; // This ensures we jump to a different segment of the color wheel
  let hsl2 = mapHashToHSL(hexHash.substring(6, 12), offset);
  let color2Hex = hslToHex(hsl2.hue, hsl2.saturation, hsl2.lightness);

  // Determine the gradient angle
  const angle = parseInt(hexHash.substring(12, 16), 16) % 360;

  return `linear-gradient(${angle}deg, ${color1Hex}, ${color2Hex})`;
}