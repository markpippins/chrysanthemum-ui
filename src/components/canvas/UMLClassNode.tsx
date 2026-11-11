import React, { useState } from 'react';
import { UMLElement, UMLVisibility, UMLAttribute, UMLOperation } from '../../types/uml';
import { 
  Plus, 
  Trash2, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Code2, 
  Layers, 
  Sparkles,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface UMLClassNodeProps {
  element: UMLElement;
  isSelected?: boolean;
  onSelect?: (element: UMLElement, e: React.MouseEvent) => void;
  onDoubleClick?: (element: UMLElement) => void;
  onStartConnect?: (element: UMLElement, e: React.MouseEvent) => void;
  onQuickAddAttribute?: (element: UMLElement) => void;
  onQuickAddOperation?: (element: UMLElement) => void;
  onOpenSpecification?: (element: UMLElement) => void;
}

export const UMLClassNode: React.FC<UMLClassNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onDoubleClick,
  onStartConnect,
  onQuickAddAttribute,
  onQuickAddOperation,
  onOpenSpecification
}) => {
  const [collapsed, setCollapsed] = useState(element.collapsed || false);
  const [isHovered, setIsHovered] = useState(false);

  // Theme styling based on element type / stereotype
  const theme = getThemeColors(element);

  return (
    <div
      id={`uml-node-${element.id}`}
      style={{
        transform: `translate(${element.x}px, ${element.y}px)`,
        width: `${element.width}px`,
      }}
      className={`absolute select-none rounded shadow-lg border transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-blue-500 border-blue-400 shadow-blue-500/20'
          : 'border-[#3F3F3F] hover:border-[#555555] shadow-black/50'
      } ${theme.bg}`}
      onMouseDown={(e) => {
        onSelect?.(element, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(element);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header Compartment */}
      <div className={`px-3 py-2 rounded-t flex flex-col items-center justify-center relative ${theme.headerBg}`}>
        {/* Connect Handle (drag from here to create relationship) */}
        <button
          title="Drag or click to connect relationship"
          className={`absolute -top-3 -right-3 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-[#1E1E1E] transition-all ${
            isHovered || isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect?.(element, e);
          }}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        {/* Specification Inspector Quick Button */}
        <button
          title="Open UML Specification Dialog"
          className={`absolute top-2 right-2 p-1 rounded hover:bg-[#37373D] text-[#858585] hover:text-white transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenSpecification?.(element);
          }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Collapse toggle */}
        <button
          className="absolute top-2 left-2 p-0.5 rounded hover:bg-[#37373D] text-[#858585] hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* Stereotype Tag */}
        {element.stereotype && (
          <span className={`text-[10px] font-mono font-medium tracking-wide uppercase px-1.5 py-0.2 rounded ${theme.stereotypeTag}`}>
            «{element.stereotype}»
          </span>
        )}

        {/* Decorators */}
        {element.decorators && element.decorators.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center my-0.5">
            {element.decorators.map((dec, i) => (
              <span key={i} className="text-[10px] font-mono text-emerald-400 font-medium">
                {dec.startsWith('@') ? dec : `@${dec}`}
              </span>
            ))}
          </div>
        )}

        {/* Element Name */}
        <div className="flex items-center gap-1.5 max-w-full px-4 text-center">
          <span className={`text-sm font-semibold tracking-tight ${theme.nameColor} ${element.isAbstract ? 'italic font-serif' : 'font-mono'}`}>
            {element.name}
          </span>
          {element.typeParameters && (
            <span className="text-[11px] font-mono text-slate-400 font-normal">
              &lt;{element.typeParameters}&gt;
            </span>
          )}
        </div>

        {element.docComment && (
          <p className="text-[10px] text-slate-400 font-sans italic truncate max-w-[200px] mt-0.5 text-center" title={element.docComment}>
            {element.docComment}
          </p>
        )}
      </div>

      {!collapsed && (
        <>
          {/* Enum Literals Compartment (if Enum) */}
          {element.type === 'enum' && (
            <div className="p-2 border-b border-slate-700/60 font-mono text-xs text-amber-200/90 space-y-1 bg-amber-950/10">
              {element.enumLiterals && element.enumLiterals.length > 0 ? (
                element.enumLiterals.map((lit) => (
                  <div key={lit.id} className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-amber-500/10">
                    <span className="font-semibold text-amber-300">{lit.name}</span>
                    {lit.value !== undefined && (
                      <span className="text-slate-400 text-[10px]">= {lit.value}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic text-center py-1">No enum literals</div>
              )}
            </div>
          )}

          {/* Type Alias Compartment (if TypeAlias) */}
          {element.type === 'typeAlias' && (
            <div className="p-2.5 border-b border-slate-700/60 font-mono text-xs text-purple-200/90 bg-purple-950/10">
              <div className="text-[11px] text-slate-400 font-sans mb-1 font-medium">Type Definition:</div>
              <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-purple-300 font-mono break-all">
                {element.typeDefinition || 'any'}
              </div>
            </div>
          )}

          {/* Attributes Compartment (Classes & Interfaces) */}
          {element.type !== 'enum' && element.type !== 'typeAlias' && (
            <div className="p-2 border-b border-slate-700/60 font-mono text-xs space-y-0.5 bg-slate-950/30">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans uppercase tracking-wider px-1 mb-1 font-semibold">
                <span>Attributes</span>
                <button
                  title="Add Attribute"
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAddAttribute?.(element);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {element.attributes.length > 0 ? (
                element.attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-slate-800/60 group/item cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSpecification?.(element);
                    }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-[11px] font-bold ${getVisibilityColor(attr.visibility)}`}>
                        {getVisibilitySymbol(attr.visibility)}
                      </span>
                      <span className={`truncate ${attr.isStatic ? 'underline' : ''} text-slate-200`}>
                        {attr.name}
                        {attr.isOptional ? '?' : ''}
                      </span>
                      <span className="text-slate-400 text-[10px]">: {attr.type || 'any'}</span>
                    </div>
                    {attr.defaultValue && (
                      <span className="text-slate-500 text-[10px] font-mono ml-1 shrink-0">
                        = {attr.defaultValue}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic px-1 py-0.5">No attributes</div>
              )}
            </div>
          )}

          {/* Operations / Methods Compartment (Classes & Interfaces) */}
          {element.type !== 'enum' && element.type !== 'typeAlias' && (
            <div className="p-2 font-mono text-xs space-y-0.5 bg-slate-950/20 rounded-b-lg">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans uppercase tracking-wider px-1 mb-1 font-semibold">
                <span>Operations</span>
                <button
                  title="Add Operation"
                  className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAddOperation?.(element);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {element.operations.length > 0 ? (
                element.operations.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-slate-800/60 group/item cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSpecification?.(element);
                    }}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-[11px] font-bold ${getVisibilityColor(op.visibility)}`}>
                        {getVisibilitySymbol(op.visibility)}
                      </span>
                      <span className={`truncate ${op.isAbstract ? 'italic text-indigo-300' : 'text-slate-200'} ${op.isStatic ? 'underline' : ''}`}>
                        {op.name}({op.parameters.map(p => `${p.name}${p.isOptional ? '?' : ''}`).join(', ')})
                      </span>
                    </div>
                    <span className="text-emerald-400/90 text-[10px] font-mono ml-1 shrink-0 font-medium">
                      : {op.returnType || 'void'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic px-1 py-0.5">No operations</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function getVisibilitySymbol(vis: UMLVisibility): string {
  switch (vis) {
    case 'public': return '+';
    case 'private': return '-';
    case 'protected': return '#';
    case 'package': return '~';
    default: return '+';
  }
}

function getVisibilityColor(vis: UMLVisibility): string {
  switch (vis) {
    case 'public': return 'text-emerald-400';
    case 'private': return 'text-rose-400';
    case 'protected': return 'text-amber-400';
    case 'package': return 'text-sky-400';
    default: return 'text-emerald-400';
  }
}

function getThemeColors(element: UMLElement) {
  if (element.type === 'interface') {
    return {
      bg: 'bg-[#252526]',
      headerBg: 'bg-[#2D2D30] border-b border-[#3F3F3F]',
      nameColor: 'text-purple-400',
      stereotypeTag: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    };
  }

  if (element.type === 'enum') {
    return {
      bg: 'bg-[#252526]',
      headerBg: 'bg-[#2D2D30] border-b border-[#3F3F3F]',
      nameColor: 'text-amber-400',
      stereotypeTag: 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    };
  }

  if (element.type === 'typeAlias') {
    return {
      bg: 'bg-[#252526]',
      headerBg: 'bg-[#2D2D30] border-b border-[#3F3F3F]',
      nameColor: 'text-cyan-400',
      stereotypeTag: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
    };
  }

  if (element.isAbstract || element.stereotype === 'abstract') {
    return {
      bg: 'bg-[#252526]',
      headerBg: 'bg-[#2D2D30] border-b border-[#3F3F3F]',
      nameColor: 'text-indigo-300',
      stereotypeTag: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    };
  }

  // Standard Class
  return {
    bg: 'bg-[#252526]',
    headerBg: 'bg-[#2D2D30] border-b border-[#3F3F3F]',
    nameColor: 'text-[#D4D4D4]',
    stereotypeTag: 'bg-[#37373D] text-gray-300 border border-[#3F3F3F]'
  };
}
