/**
 * Geometric Image Generator - Creates lu.ma style abstract geometric compositions
 * Uses frontend color palette to generate random SVG images with circles, triangles, squares, and rectangles
 */

// Frontend color palette
const COLORS = [
  '#3ec6c6', // Primary teal
  '#f0efeb', // Light beige  
  '#FF6B6B', // Coral red
  '#4ECDC4', // Light teal
  '#45B7D1', // Blue
  '#96CEB4', // Mint green
  '#FFEAA7', // Light yellow
  '#DDA0DD', // Plum
  '#FFB74D', // Orange
  '#F06292', // Pink
  '#BA68C8', // Purple
  '#4DB6AC', // Teal green
];

interface Point {
  x: number;
  y: number;
}

interface Shape {
  type: 'circle' | 'triangle' | 'rectangle' | 'square';
  color: string;
  position: Point;
  size: number;
  rotation?: number;
}

/**
 * Generate a random color from the palette
 */
function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

/**
 * Generate a random point within bounds
 */
function getRandomPoint(width: number, height: number, margin: number = 20): Point {
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin)
  };
}

/**
 * Generate a random size within bounds
 */
function getRandomSize(min: number = 30, max: number = 100): number {
  return min + Math.random() * (max - min);
}

/**
 * Check if two shapes overlap (basic collision detection)
 */
function shapesOverlap(shape1: Shape, shape2: Shape): boolean {
  const distance = Math.sqrt(
    Math.pow(shape1.position.x - shape2.position.x, 2) + 
    Math.pow(shape1.position.y - shape2.position.y, 2)
  );
  const minDistance = (shape1.size + shape2.size) / 2;
  return distance < minDistance * 0.8; // Allow slight overlap for artistic effect
}

/**
 * Generate a circle SVG element
 */
function generateCircle(shape: Shape): string {
  const radius = shape.size / 2;
  return `<circle cx="${shape.position.x}" cy="${shape.position.y}" r="${radius}" fill="${shape.color}" />`;
}

/**
 * Generate a triangle SVG element
 */
function generateTriangle(shape: Shape): string {
  const height = shape.size;
  const width = shape.size * 0.866; // Equilateral triangle ratio
  const x = shape.position.x;
  const y = shape.position.y;
  
  // Triangle points (pointing up)
  const points = [
    `${x},${y - height/2}`, // Top
    `${x - width/2},${y + height/2}`, // Bottom left
    `${x + width/2},${y + height/2}`  // Bottom right
  ].join(' ');
  
  const rotation = shape.rotation || 0;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${x} ${y})"` : '';
  
  return `<polygon points="${points}" fill="${shape.color}" ${transform} />`;
}

/**
 * Generate a rectangle SVG element
 */
function generateRectangle(shape: Shape): string {
  const width = shape.size;
  const height = shape.size * (0.5 + Math.random() * 0.8); // Random aspect ratio
  const x = shape.position.x - width/2;
  const y = shape.position.y - height/2;
  
  const rotation = shape.rotation || 0;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${shape.position.x} ${shape.position.y})"` : '';
  
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${shape.color}" ${transform} />`;
}

/**
 * Generate a square SVG element
 */
function generateSquare(shape: Shape): string {
  const size = shape.size;
  const x = shape.position.x - size/2;
  const y = shape.position.y - size/2;
  
  const rotation = shape.rotation || 0;
  const transform = rotation !== 0 ? `transform="rotate(${rotation} ${shape.position.x} ${shape.position.y})"` : '';
  
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${shape.color}" ${transform} />`;
}

/**
 * Generate a shape SVG element
 */
function generateShapeElement(shape: Shape): string {
  switch (shape.type) {
    case 'circle':
      return generateCircle(shape);
    case 'triangle':
      return generateTriangle(shape);
    case 'rectangle':
      return generateRectangle(shape);
    case 'square':
      return generateSquare(shape);
    default:
      return '';
  }
}

/**
 * Generate a complete geometric abstract image
 */
export function generateGeometricImage(
  width: number = 400, 
  height: number = 400,
  shapeCount: number = 8
): string {
  const shapes: Shape[] = [];
  const shapeTypes: Shape['type'][] = ['circle', 'triangle', 'rectangle', 'square'];
  const backgroundColors = ['#f8f9fa', '#fff5f5', '#f0f8ff', '#f5f5f0'];
  const backgroundColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
  
  // Generate shapes with collision avoidance
  let attempts = 0;
  const maxAttempts = shapeCount * 10;
  
  while (shapes.length < shapeCount && attempts < maxAttempts) {
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const size = getRandomSize(40, 120);
    const position = getRandomPoint(width, height, size/2);
    const rotation = Math.random() > 0.7 ? Math.random() * 360 : 0; // 30% chance of rotation
    
    const newShape: Shape = {
      type: shapeType,
      color: getRandomColor(),
      position,
      size,
      rotation
    };
    
    // Check for overlaps
    const hasOverlap = shapes.some(existingShape => shapesOverlap(newShape, existingShape));
    
    if (!hasOverlap || attempts > maxAttempts * 0.8) {
      shapes.push(newShape);
    }
    
    attempts++;
  }
  
  // Generate SVG elements
  const shapeElements = shapes.map(generateShapeElement).join('\n    ');
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}" />
      ${shapeElements}
    </svg>
  `.trim();
}

/**
 * Generate a geometric image as a data URL
 */
export function generateGeometricImageDataUrl(
  width: number = 400, 
  height: number = 400,
  shapeCount: number = 8
): string {
  const svg = generateGeometricImage(width, height, shapeCount);
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate multiple variations and return the best one
 */
export function generateBestGeometricImage(
  width: number = 400, 
  height: number = 400,
  variations: number = 3
): string {
  const images = [];
  
  for (let i = 0; i < variations; i++) {
    images.push(generateGeometricImageDataUrl(width, height, 6 + Math.floor(Math.random() * 4)));
  }
  
  // For now, return a random variation
  // In the future, could implement aesthetic scoring
  return images[Math.floor(Math.random() * images.length)];
}