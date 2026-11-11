import React from 'react';
import { UMLRelationship, UMLElement } from '../../types/uml';

interface UMLRelationshipLineProps {
  relationship: UMLRelationship;
  sourceElement: UMLElement;
  targetElement: UMLElement;
  isSelected?: boolean;
  onSelect?: (rel: UMLRelationship) => void;
  onDelete?: (relId: string) => void;
}

export const UMLRelationshipLine: React.FC<UMLRelationshipLineProps> = ({
  relationship,
  sourceElement,
  targetElement,
  isSelected,
  onSelect
}) => {
  // Calculate bounding centers and intersection points
  const srcCenter = {
    x: sourceElement.x + sourceElement.width / 2,
    y: sourceElement.y + sourceElement.height / 2
  };
  const tgtCenter = {
    x: targetElement.x + targetElement.width / 2,
    y: targetElement.y + targetElement.height / 2
  };

  // Find border intersections
  const srcPoint = calculateBorderIntersection(sourceElement, tgtCenter);
  const tgtPoint = calculateBorderIntersection(targetElement, srcCenter);

  // Line path with optional middle waypoints
  let pathD = '';
  let midX = (srcPoint.x + tgtPoint.x) / 2;
  let midY = (srcPoint.y + tgtPoint.y) / 2;

  if (relationship.waypoints && relationship.waypoints.length > 0) {
    pathD = `M ${srcPoint.x} ${srcPoint.y}`;
    for (const wp of relationship.waypoints) {
      pathD += ` L ${wp.x} ${wp.y}`;
    }
    pathD += ` L ${tgtPoint.x} ${tgtPoint.y}`;
    const wpMid = relationship.waypoints[Math.floor(relationship.waypoints.length / 2)];
    midX = wpMid.x;
    midY = wpMid.y;
  } else {
    // Orthogonal or straight path
    pathD = `M ${srcPoint.x} ${srcPoint.y} L ${tgtPoint.x} ${tgtPoint.y}`;
  }

  // Calculate angle for labels
  const angle = Math.atan2(tgtPoint.y - srcPoint.y, tgtPoint.x - srcPoint.x);
  const isDashed = relationship.type === 'realization' || relationship.type === 'dependency' || relationship.type === 'include' || relationship.type === 'extend';

  // Multiplicity label offsets
  const srcMultPos = {
    x: srcPoint.x + Math.cos(angle) * 28 + Math.sin(angle) * 16,
    y: srcPoint.y + Math.sin(angle) * 28 - Math.cos(angle) * 16
  };
  const tgtMultPos = {
    x: tgtPoint.x - Math.cos(angle) * 36 - Math.sin(angle) * 16,
    y: tgtPoint.y - Math.sin(angle) * 36 + Math.cos(angle) * 16
  };

  // Marker ID based on relationship type
  const markerEndId = getMarkerEndId(relationship.type);
  const markerStartId = getMarkerStartId(relationship.type);

  return (
    <g 
      className={`cursor-pointer transition-opacity group ${isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(relationship);
      }}
    >
      {/* Invisible thick stroke for easier click targeting */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="14"
      />

      {/* Main Visible Stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={isSelected ? '#38bdf8' : '#94a3b8'}
        strokeWidth={isSelected ? '2.5' : '1.8'}
        strokeDasharray={isDashed ? '6 4' : undefined}
        markerEnd={markerEndId ? `url(#${markerEndId})` : undefined}
        markerStart={markerStartId ? `url(#${markerStartId})` : undefined}
        className="transition-colors duration-150"
      />

      {/* Relationship Stereotype / Name Label */}
      {(relationship.name || relationship.stereotype) && (
        <g transform={`translate(${midX}, ${midY - 14})`}>
          <rect
            x="-40"
            y="-10"
            width="80"
            height="20"
            rx="4"
            fill="#0f172a"
            fillOpacity="0.85"
            stroke={isSelected ? '#38bdf8' : '#334155'}
            strokeWidth="1"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            className="text-[11px] font-mono fill-sky-300 font-medium select-none pointer-events-none"
          >
            {relationship.stereotype ? `«${relationship.stereotype.replace(/[«»]/g, '')}»` : relationship.name}
          </text>
        </g>
      )}

      {/* Source Multiplicity / Role */}
      {(relationship.sourceMultiplicity || relationship.sourceRole) && (
        <text
          x={srcMultPos.x}
          y={srcMultPos.y}
          textAnchor="middle"
          className="text-[10px] font-mono fill-slate-300 select-none bg-slate-900 px-1 font-semibold"
        >
          {relationship.sourceRole ? `${relationship.sourceRole} ` : ''}
          {relationship.sourceMultiplicity || ''}
        </text>
      )}

      {/* Target Multiplicity / Role */}
      {(relationship.targetMultiplicity || relationship.targetRole) && (
        <text
          x={tgtMultPos.x}
          y={tgtMultPos.y}
          textAnchor="middle"
          className="text-[10px] font-mono fill-slate-300 select-none bg-slate-900 px-1 font-semibold"
        >
          {relationship.targetRole ? `${relationship.targetRole} ` : ''}
          {relationship.targetMultiplicity || ''}
        </text>
      )}
    </g>
  );
};

// Helper to calculate exact border intersection point on a rectangle
function calculateBorderIntersection(elem: UMLElement, targetCenter: { x: number; y: number }) {
  const cx = elem.x + elem.width / 2;
  const cy = elem.y + elem.height / 2;
  const dx = targetCenter.x - cx;
  const dy = targetCenter.y - cy;

  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const halfW = elem.width / 2;
  const halfH = elem.height / 2;

  const tanTheta = Math.abs(dy / (dx || 0.0001));
  const tanRect = halfH / halfW;

  let ix = 0;
  let iy = 0;

  if (tanTheta <= tanRect) {
    // Intersects left or right side
    ix = dx > 0 ? cx + halfW : cx - halfW;
    iy = cy + (dx > 0 ? halfW : -halfW) * (dy / (dx || 0.0001));
  } else {
    // Intersects top or bottom side
    iy = dy > 0 ? cy + halfH : cy - halfH;
    ix = cx + (dy > 0 ? halfH : -halfH) * (dx / (dy || 0.0001));
  }

  return { x: ix, y: iy };
}

function getMarkerEndId(type: string): string | null {
  switch (type) {
    case 'generalization': return 'marker-generalization';
    case 'realization': return 'marker-realization';
    case 'directed_association': return 'marker-directed';
    case 'dependency': return 'marker-dependency';
    case 'include':
    case 'extend': return 'marker-dependency';
    default: return null;
  }
}

function getMarkerStartId(type: string): string | null {
  switch (type) {
    case 'composition': return 'marker-composition';
    case 'aggregation': return 'marker-aggregation';
    default: return null;
  }
}
