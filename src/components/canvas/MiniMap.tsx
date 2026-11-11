import React from 'react';
import { UMLElement } from '../../types/uml';

interface MiniMapProps {
  elements: UMLElement[];
  zoom: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate?: (x: number, y: number) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  elements,
  zoom,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  onNavigate
}) => {
  const mapWidth = 180;
  const mapHeight = 120;

  // Calculate bounding box of all elements
  let minX = 0;
  let minY = 0;
  let maxX = 1200;
  let maxY = 800;

  if (elements.length > 0) {
    minX = Math.min(0, ...elements.map(e => e.x)) - 100;
    minY = Math.min(0, ...elements.map(e => e.y)) - 100;
    maxX = Math.max(1200, ...elements.map(e => e.x + e.width)) + 100;
    maxY = Math.max(800, ...elements.map(e => e.y + e.height)) + 100;
  }

  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Viewport box in minimap coordinates
  const vpX = ((-panX / zoom) - minX) * scale;
  const vpY = ((-panY / zoom) - minY) * scale;
  const vpW = (viewportWidth / zoom) * scale;
  const vpH = (viewportHeight / zoom) * scale;

  return (
    <div 
      className="absolute bottom-4 right-4 w-[180px] h-[120px] bg-[#252526]/95 border border-[#3F3F3F] rounded shadow-2xl overflow-hidden backdrop-blur select-none cursor-crosshair z-20 group"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const targetWorldX = minX + clickX / scale;
        const targetWorldY = minY + clickY / scale;

        const newPanX = -(targetWorldX * zoom - viewportWidth / 2);
        const newPanY = -(targetWorldY * zoom - viewportHeight / 2);
        onNavigate?.(newPanX, newPanY);
      }}
    >
      <div className="absolute top-1 left-2 text-[9px] font-mono text-gray-400 font-semibold tracking-wider uppercase opacity-80">
        Minimap
      </div>

      <svg width={mapWidth} height={mapHeight} className="w-full h-full">
        {/* Render elements */}
        {elements.map((el) => {
          const elX = (el.x - minX) * scale;
          const elY = (el.y - minY) * scale;
          const elW = el.width * scale;
          const elH = el.height * scale;

          let color = '#3b82f6';
          if (el.type === 'interface') color = '#a855f7';
          if (el.type === 'enum') color = '#f59e0b';
          if (el.type === 'typeAlias') color = '#06b6d4';

          return (
            <rect
              key={el.id}
              x={elX}
              y={elY}
              width={Math.max(4, elW)}
              height={Math.max(4, elH)}
              fill={color}
              opacity="0.85"
              rx="1"
            />
          );
        })}

        {/* Viewport Indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={Math.max(10, vpW)}
          height={Math.max(10, vpH)}
          fill="none"
          stroke="#007ACC"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
