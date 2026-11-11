import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  UMLElement, 
  UMLRelationship, 
  UMLDiagram, 
  UMLRelationshipType, 
  UMLVisibility 
} from '../../types/uml';
import { UMLClassNode } from './UMLClassNode';
import { UMLRelationshipLine } from './UMLRelationshipLine';
import { MiniMap } from './MiniMap';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid, 
  Move, 
  MousePointer, 
  Plus, 
  Trash2, 
  LayoutGrid, 
  AlignLeft, 
  AlignVerticalJustifyStart, 
  RotateCcw,
  Sparkles,
  Link,
  Code
} from 'lucide-react';

interface RoseCanvasProps {
  diagram: UMLDiagram;
  elements: UMLElement[];
  relationships: UMLRelationship[];
  selectedElementIds: string[];
  selectedRelationshipId?: string;
  activeTool?: string;
  onSelectElements: (ids: string[]) => void;
  onSelectRelationship: (id: string | undefined) => void;
  onUpdateElements: (elements: UMLElement[]) => void;
  onAddRelationship: (rel: UMLRelationship) => void;
  onDeleteElements: (ids: string[]) => void;
  onDeleteRelationship: (id: string) => void;
  onOpenSpecification: (element: UMLElement) => void;
  onQuickAddAttribute: (element: UMLElement) => void;
  onQuickAddOperation: (element: UMLElement) => void;
}

export const RoseCanvas: React.FC<RoseCanvasProps> = ({
  diagram,
  elements,
  relationships,
  selectedElementIds,
  selectedRelationshipId,
  activeTool = 'select',
  onSelectElements,
  onSelectRelationship,
  onUpdateElements,
  onAddRelationship,
  onDeleteElements,
  onDeleteRelationship,
  onOpenSpecification,
  onQuickAddAttribute,
  onQuickAddOperation
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas Viewport Transformation
  const [zoom, setZoom] = useState(diagram.zoom || 1);
  const [pan, setPan] = useState({ x: diagram.panX || 60, y: diagram.panY || 40 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridStyle, setGridStyle] = useState<'dots' | 'lines' | 'none'>('dots');
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });

  // Dragging & Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingElements, setDraggingElements] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [initialElemPositions, setInitialElemPositions] = useState<{ [id: string]: { x: number; y: number } }>({});

  // Relationship creation connection wire
  const [connectingSource, setConnectingSource] = useState<UMLElement | null>(null);
  const [connectMousePos, setConnectMousePos] = useState<{ x: number; y: number } | null>(null);
  const [relationshipTypeModal, setRelationshipTypeModal] = useState<{
    source: UMLElement;
    target: UMLElement;
  } | null>(null);

  // Marquee Selection Box
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Snap coordinate helper
  const snap = useCallback((val: number, gridSize = 20) => {
    if (!snapToGrid) return Math.round(val);
    return Math.round(val / gridSize) * gridSize;
  }, [snapToGrid]);

  // Convert Screen Mouse to World Coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - pan.x) / zoom,
      y: (screenY - rect.top - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Handle Mouse Down on Canvas Background
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan' || e.spaceKey) {
      // Middle click or Pan mode
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      if (!e.shiftKey) {
        onSelectElements([]);
        onSelectRelationship(undefined);
      }

      // Start marquee selection
      const world = screenToWorld(e.clientX, e.clientY);
      setMarquee({
        startX: world.x,
        startY: world.y,
        currentX: world.x,
        currentY: world.y
      });
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (connectingSource) {
      const world = screenToWorld(e.clientX, e.clientY);
      setConnectMousePos(world);
      return;
    }

    if (draggingElements && selectedElementIds.length > 0) {
      const dx = (e.clientX - dragStartMouse.x) / zoom;
      const dy = (e.clientY - dragStartMouse.y) / zoom;

      const updated = elements.map((el) => {
        if (selectedElementIds.includes(el.id)) {
          const initPos = initialElemPositions[el.id] || { x: el.x, y: el.y };
          return {
            ...el,
            x: Math.max(0, snap(initPos.x + dx)),
            y: Math.max(0, snap(initPos.y + dy))
          };
        }
        return el;
      });

      onUpdateElements(updated);
      return;
    }

    if (marquee) {
      const world = screenToWorld(e.clientX, e.clientY);
      setMarquee(prev => prev ? { ...prev, currentX: world.x, currentY: world.y } : null);

      // Select elements intersecting with marquee box
      const minX = Math.min(marquee.startX, world.x);
      const maxX = Math.max(marquee.startX, world.x);
      const minY = Math.min(marquee.startY, world.y);
      const maxY = Math.max(marquee.startY, world.y);

      const enclosedIds = elements.filter(el => {
        const elRight = el.x + el.width;
        const elBottom = el.y + el.height;
        return el.x < maxX && elRight > minX && el.y < maxY && elBottom > minY;
      }).map(e => e.id);

      onSelectElements(enclosedIds);
    }
  };

  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingElements(false);
    setMarquee(null);

    if (connectingSource && !relationshipTypeModal) {
      setConnectingSource(null);
      setConnectMousePos(null);
    }
  };

  // Handle Mouse Wheel for Smooth Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom with wheel
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(2.5, Math.max(0.25, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom centered on cursor
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    } else {
      // Pan with trackpad/wheel
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  // Handle Element Selection & Drag Start
  const handleElementSelect = (element: UMLElement, e: React.MouseEvent) => {
    e.stopPropagation();

    if (connectingSource) {
      // Complete relationship to this target element
      if (connectingSource.id !== element.id) {
        setRelationshipTypeModal({
          source: connectingSource,
          target: element
        });
      }
      setConnectingSource(null);
      setConnectMousePos(null);
      return;
    }

    let newSelected: string[];
    if (e.shiftKey) {
      newSelected = selectedElementIds.includes(element.id)
        ? selectedElementIds.filter(id => id !== element.id)
        : [...selectedElementIds, element.id];
    } else {
      newSelected = selectedElementIds.includes(element.id)
        ? selectedElementIds
        : [element.id];
    }

    onSelectElements(newSelected);
    onSelectRelationship(undefined);

    // Setup initial positions for drag
    const posMap: { [id: string]: { x: number; y: number } } = {};
    for (const el of elements) {
      if (newSelected.includes(el.id)) {
        posMap[el.id] = { x: el.x, y: el.y };
      }
    }
    setInitialElemPositions(posMap);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDraggingElements(true);
  };

  // Start connecting relationship from node handle
  const handleStartConnect = (element: UMLElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingSource(element);
    const world = screenToWorld(e.clientX, e.clientY);
    setConnectMousePos(world);
  };

  // Complete relationship creation
  const handleCreateRelationship = (type: UMLRelationshipType, name?: string) => {
    if (!relationshipTypeModal) return;
    const { source, target } = relationshipTypeModal;

    const newRel: UMLRelationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      type,
      sourceId: source.id,
      targetId: target.id,
      name,
      stereotype: type === 'dependency' ? '<<use>>' : undefined,
      sourceMultiplicity: type === 'composition' || type === 'aggregation' ? '1' : undefined,
      targetMultiplicity: type === 'composition' || type === 'aggregation' ? '*' : undefined
    };

    onAddRelationship(newRel);
    setRelationshipTypeModal(null);
  };

  // Auto-Layout Algorithm (Hierarchical / Layered Layout)
  const handleAutoLayout = () => {
    if (elements.length === 0) return;

    // Find roots (elements that are extended or implemented by others)
    const extendsMap = new Map<string, string[]>(); // parentId -> childIds
    for (const rel of relationships) {
      if (rel.type === 'generalization' || rel.type === 'realization') {
        const list = extendsMap.get(rel.targetId) || [];
        list.push(rel.sourceId);
        extendsMap.set(rel.targetId, list);
      }
    }

    const colWidth = 320;
    const rowHeight = 320;
    const updated: UMLElement[] = [];
    const visited = new Set<string>();

    let currentY = 80;
    
    // Sort into levels
    for (const el of elements) {
      if (visited.has(el.id)) continue;
      
      const children = extendsMap.get(el.id) || [];
      updated.push({
        ...el,
        x: 80 + (updated.length % 3) * colWidth,
        y: currentY
      });
      visited.add(el.id);

      if (children.length > 0) {
        children.forEach((childId, idx) => {
          const childEl = elements.find(e => e.id === childId);
          if (childEl && !visited.has(childId)) {
            updated.push({
              ...childEl,
              x: 80 + idx * colWidth,
              y: currentY + rowHeight
            });
            visited.add(childId);
          }
        });
        currentY += rowHeight * 1.5;
      } else {
        if (updated.length % 3 === 0) {
          currentY += rowHeight;
        }
      }
    }

    onUpdateElements(updated);
  };

  // Align Left
  const handleAlignLeft = () => {
    if (selectedElementIds.length < 2) return;
    const selected = elements.filter(e => selectedElementIds.includes(e.id));
    const minX = Math.min(...selected.map(e => e.x));
    const updated = elements.map(e => selectedElementIds.includes(e.id) ? { ...e, x: minX } : e);
    onUpdateElements(updated);
  };

  // Align Top
  const handleAlignTop = () => {
    if (selectedElementIds.length < 2) return;
    const selected = elements.filter(e => selectedElementIds.includes(e.id));
    const minY = Math.min(...selected.map(e => e.y));
    const updated = elements.map(e => selectedElementIds.includes(e.id) ? { ...e, y: minY } : e);
    onUpdateElements(updated);
  };

  // Zoom to Fit
  const handleZoomToFit = () => {
    if (elements.length === 0) return;
    const minX = Math.min(...elements.map(e => e.x));
    const minY = Math.min(...elements.map(e => e.y));
    const maxX = Math.max(...elements.map(e => e.x + e.width));
    const maxY = Math.max(...elements.map(e => e.y + e.height));

    const contentW = maxX - minX + 160;
    const contentH = maxY - minY + 160;

    const fitZoom = Math.min(
      Math.min(dimensions.width / contentW, dimensions.height / contentH),
      1.5
    );

    const fitPanX = (dimensions.width - (maxX - minX) * fitZoom) / 2 - minX * fitZoom;
    const fitPanY = (dimensions.height - (maxY - minY) * fitZoom) / 2 - minY * fitZoom;

    setZoom(Math.max(0.4, fitZoom));
    setPan({ x: fitPanX, y: fitPanY });
  };

  return (
    <div
      ref={containerRef}
      id="rational-rose-canvas"
      className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${
        gridStyle === 'dots' ? 'canvas-grid-dots' : gridStyle === 'lines' ? 'canvas-grid-lines' : ''
      } ${activeTool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Floating Canvas Quick Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded bg-[#252526]/95 border border-[#3F3F3F] shadow-2xl backdrop-blur-md">
        {/* Zoom Controls */}
        <button
          title="Zoom In (Ctrl + Plus)"
          className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-white transition-colors"
          onClick={() => setZoom(prev => Math.min(2.5, prev + 0.15))}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-[#D4D4D4] px-1 font-semibold min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          title="Zoom Out (Ctrl + Minus)"
          className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-white transition-colors"
          onClick={() => setZoom(prev => Math.max(0.25, prev - 0.15))}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          title="Zoom to Fit Diagram"
          className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-white transition-colors"
          onClick={handleZoomToFit}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[#3F3F3F] mx-1" />

        {/* Grid & Snap */}
        <button
          title={`Grid style: ${gridStyle}`}
          className={`p-1.5 rounded transition-colors ${
            gridStyle !== 'none' ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-[#37373D] text-[#858585]'
          }`}
          onClick={() => setGridStyle(prev => prev === 'dots' ? 'lines' : prev === 'lines' ? 'none' : 'dots')}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          title={`Snap to Grid: ${snapToGrid ? 'ON (20px)' : 'OFF'}`}
          className={`px-2 py-1 text-[11px] font-mono rounded font-medium transition-colors ${
            snapToGrid ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-[#858585] hover:bg-[#37373D]'
          }`}
          onClick={() => setSnapToGrid(!snapToGrid)}
        >
          SNAP
        </button>

        <div className="w-[1px] h-4 bg-[#3F3F3F] mx-1" />

        {/* Alignment & Layout */}
        <button
          title="Auto-Layout UML Diagram"
          className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-blue-300 transition-colors flex items-center gap-1"
          onClick={handleAutoLayout}
        >
          <LayoutGrid className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-sans font-medium text-[#D4D4D4]">Layout</span>
        </button>

        {selectedElementIds.length >= 2 && (
          <>
            <button
              title="Align Selected Elements Left"
              className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-white transition-colors"
              onClick={handleAlignLeft}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              title="Align Selected Elements Top"
              className="p-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] hover:text-white transition-colors"
              onClick={handleAlignTop}
            >
              <AlignVerticalJustifyStart className="w-4 h-4" />
            </button>
          </>
        )}

        {selectedElementIds.length > 0 && (
          <button
            title="Delete Selected Elements"
            className="p-1.5 rounded hover:bg-rose-950 text-rose-400 hover:text-rose-200 transition-colors"
            onClick={() => onDeleteElements(selectedElementIds)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Scalable World Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* SVG Connector Layer */}
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 10 }}
        >
          <defs>
            {/* Generalization (Extends) - Closed hollow triangle */}
            <marker
              id="marker-generalization"
              markerWidth="14"
              markerHeight="14"
              refX="13"
              refY="7"
              orient="auto"
            >
              <polygon points="0 1, 13 7, 0 13" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.8" />
            </marker>

            {/* Realization (Implements) - Closed hollow triangle */}
            <marker
              id="marker-realization"
              markerWidth="14"
              markerHeight="14"
              refX="13"
              refY="7"
              orient="auto"
            >
              <polygon points="0 1, 13 7, 0 13" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.8" />
            </marker>

            {/* Directed Association - Open arrow */}
            <marker
              id="marker-directed"
              markerWidth="12"
              markerHeight="12"
              refX="11"
              refY="6"
              orient="auto"
            >
              <polyline points="1 1, 11 6, 1 11" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
            </marker>

            {/* Dependency - Open arrow */}
            <marker
              id="marker-dependency"
              markerWidth="12"
              markerHeight="12"
              refX="11"
              refY="6"
              orient="auto"
            >
              <polyline points="1 1, 11 6, 1 11" fill="none" stroke="#94a3b8" strokeWidth="1.8" />
            </marker>

            {/* Composition - Filled black/slate diamond */}
            <marker
              id="marker-composition"
              markerWidth="16"
              markerHeight="16"
              refX="1"
              refY="8"
              orient="auto"
            >
              <polygon points="1 8, 8 2, 15 8, 8 14" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1.5" />
            </marker>

            {/* Aggregation - Hollow white/slate diamond */}
            <marker
              id="marker-aggregation"
              markerWidth="16"
              markerHeight="16"
              refX="1"
              refY="8"
              orient="auto"
            >
              <polygon points="1 8, 8 2, 15 8, 8 14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
            </marker>
          </defs>

          {/* Render Active Diagram Relationships */}
          {relationships.map((rel) => {
            const source = elements.find(e => e.id === rel.sourceId);
            const target = elements.find(e => e.id === rel.targetId);
            if (!source || !target) return null;

            return (
              <g key={rel.id} className="pointer-events-auto">
                <UMLRelationshipLine
                  relationship={rel}
                  sourceElement={source}
                  targetElement={target}
                  isSelected={selectedRelationshipId === rel.id}
                  onSelect={() => {
                    onSelectRelationship(rel.id);
                    onSelectElements([]);
                  }}
                  onDelete={onDeleteRelationship}
                />
              </g>
            );
          })}

          {/* Live Connecting Wire during drag-to-connect */}
          {connectingSource && connectMousePos && (
            <line
              x1={connectingSource.x + connectingSource.width / 2}
              y1={connectingSource.y + connectingSource.height / 2}
              x2={connectMousePos.x}
              y2={connectMousePos.y}
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* UML Class & Interface Nodes Layer */}
        {elements.map((element) => (
          <UMLClassNode
            key={element.id}
            element={element}
            isSelected={selectedElementIds.includes(element.id)}
            onSelect={handleElementSelect}
            onDoubleClick={onOpenSpecification}
            onStartConnect={handleStartConnect}
            onQuickAddAttribute={onQuickAddAttribute}
            onQuickAddOperation={onQuickAddOperation}
            onOpenSpecification={onOpenSpecification}
          />
        ))}

        {/* Marquee Selection Rectangle */}
        {marquee && (
          <div
            className="absolute border border-sky-400 bg-sky-500/10 pointer-events-none rounded"
            style={{
              left: `${Math.min(marquee.startX, marquee.currentX)}px`,
              top: `${Math.min(marquee.startY, marquee.currentY)}px`,
              width: `${Math.abs(marquee.currentX - marquee.startX)}px`,
              height: `${Math.abs(marquee.currentY - marquee.startY)}px`
            }}
          />
        )}
      </div>

      {/* Minimap View */}
      <MiniMap
        elements={elements}
        zoom={zoom}
        panX={pan.x}
        panY={pan.y}
        viewportWidth={dimensions.width}
        viewportHeight={dimensions.height}
        onNavigate={(newPanX, newPanY) => setPan({ x: newPanX, y: newPanY })}
      />

      {/* Relationship Type Selection Modal on Connection */}
      {relationshipTypeModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#3F3F3F] rounded p-5 shadow-2xl max-w-md w-full space-y-4 text-[#D4D4D4]">
            <div className="flex items-center gap-2 border-b border-[#3F3F3F] pb-3">
              <Link className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Create UML Relationship</h3>
                <p className="text-xs text-[#858585]">
                  From <span className="text-blue-400 font-mono font-bold">{relationshipTypeModal.source.name}</span> to <span className="text-blue-400 font-mono font-bold">{relationshipTypeModal.target.name}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('generalization')}
              >
                <div>
                  <span className="font-semibold text-white">Generalization (Extends)</span>
                  <p className="text-[11px] text-[#858585]">Inherits parent class attributes and methods</p>
                </div>
                <span className="font-mono text-blue-400 text-xs">extends</span>
              </button>

              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('realization')}
              >
                <div>
                  <span className="font-semibold text-white">Realization (Implements)</span>
                  <p className="text-[11px] text-[#858585]">Implements contract of interface</p>
                </div>
                <span className="font-mono text-purple-400 text-xs">implements</span>
              </button>

              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('composition')}
              >
                <div>
                  <span className="font-semibold text-white">Composition (Filled Diamond)</span>
                  <p className="text-[11px] text-[#858585]">Exclusive whole-part ownership (e.g. Order owns OrderItems)</p>
                </div>
                <span className="font-mono text-green-400 text-xs">owns 1..*</span>
              </button>

              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('aggregation')}
              >
                <div>
                  <span className="font-semibold text-white">Aggregation (White Diamond)</span>
                  <p className="text-[11px] text-[#858585]">Shared collection reference</p>
                </div>
                <span className="font-mono text-amber-400 text-xs">has-many</span>
              </button>

              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('dependency', '«use»')}
              >
                <div>
                  <span className="font-semibold text-white">Dependency (Dashed Arrow)</span>
                  <p className="text-[11px] text-[#858585]">Client depends on service / type imports</p>
                </div>
                <span className="font-mono text-blue-400 text-xs">«use»</span>
              </button>

              <button
                className="p-2.5 rounded bg-[#1E1E1E] hover:bg-[#37373D] text-left border border-[#3F3F3F] hover:border-blue-500 transition-all flex items-center justify-between"
                onClick={() => handleCreateRelationship('directed_association')}
              >
                <div>
                  <span className="font-semibold text-white">Directed Association</span>
                  <p className="text-[11px] text-[#858585]">Navigable reference to target instance</p>
                </div>
                <span className="font-mono text-[#858585] text-xs">--&gt;</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                className="px-3 py-1.5 text-xs text-[#858585] hover:text-white rounded hover:bg-[#37373D]"
                onClick={() => setRelationshipTypeModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
