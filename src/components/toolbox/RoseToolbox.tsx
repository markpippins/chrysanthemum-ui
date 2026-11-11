import React from 'react';
import { 
  MousePointer, 
  Hand, 
  Box, 
  Layers, 
  FileCode, 
  Link, 
  Share2, 
  GitBranch, 
  ArrowRight, 
  HelpCircle,
  Tag,
  Plus
} from 'lucide-react';
import { UMLElementType, UMLRelationshipType } from '../../types/uml';

interface RoseToolboxProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onQuickAddElement: (type: UMLElementType, isAbstract?: boolean) => void;
}

export const RoseToolbox: React.FC<RoseToolboxProps> = ({
  activeTool,
  onSelectTool,
  onQuickAddElement
}) => {
  return (
    <div className="flex flex-col bg-[#252526] border-r border-[#3F3F3F] text-[#D4D4D4] w-12 py-2 items-center space-y-1 select-none z-10">
      {/* Selection & Navigation */}
      <button
        title="Select / Pointer (V)"
        className={`p-2 rounded transition-colors ${
          activeTool === 'select'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'hover:bg-[#37373D] text-[#858585] hover:text-white'
        }`}
        onClick={() => onSelectTool('select')}
      >
        <MousePointer className="w-4 h-4" />
      </button>

      <button
        title="Pan Canvas (Space + Drag)"
        className={`p-2 rounded transition-colors ${
          activeTool === 'pan'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'hover:bg-[#37373D] text-[#858585] hover:text-white'
        }`}
        onClick={() => onSelectTool('pan')}
      >
        <Hand className="w-4 h-4" />
      </button>

      <div className="w-6 h-[1px] bg-[#3F3F3F] my-1" />

      {/* UML Entity Creators */}
      <button
        title="Add UML Class (C)"
        className="p-2 rounded hover:bg-[#37373D] text-blue-400 hover:text-blue-300 transition-colors relative group"
        onClick={() => onQuickAddElement('class', false)}
      >
        <div className="w-5 h-5 rounded border border-blue-400/80 bg-blue-500/10 flex items-center justify-center font-mono font-bold text-[10px]">
          C
        </div>
      </button>

      <button
        title="Add UML Interface (I)"
        className="p-2 rounded hover:bg-[#37373D] text-purple-400 hover:text-purple-300 transition-colors relative group"
        onClick={() => onQuickAddElement('interface')}
      >
        <div className="w-5 h-5 rounded border border-purple-400/80 bg-purple-500/10 flex items-center justify-center font-mono font-bold text-[10px]">
          I
        </div>
      </button>

      <button
        title="Add Abstract Class (A)"
        className="p-2 rounded hover:bg-[#37373D] text-indigo-400 hover:text-indigo-300 transition-colors relative group"
        onClick={() => onQuickAddElement('class', true)}
      >
        <div className="w-5 h-5 rounded border border-indigo-400/80 bg-indigo-500/10 flex items-center justify-center font-mono font-bold text-[10px] italic">
          A
        </div>
      </button>

      <button
        title="Add UML Enum (E)"
        className="p-2 rounded hover:bg-[#37373D] text-amber-400 hover:text-amber-300 transition-colors relative group"
        onClick={() => onQuickAddElement('enum')}
      >
        <div className="w-5 h-5 rounded border border-amber-400/80 bg-amber-500/10 flex items-center justify-center font-mono font-bold text-[10px]">
          E
        </div>
      </button>

      <button
        title="Add Type Alias (T)"
        className="p-2 rounded hover:bg-[#37373D] text-cyan-400 hover:text-cyan-300 transition-colors relative group"
        onClick={() => onQuickAddElement('typeAlias')}
      >
        <div className="w-5 h-5 rounded border border-cyan-400/80 bg-cyan-500/10 flex items-center justify-center font-mono font-bold text-[10px]">
          T
        </div>
      </button>
    </div>
  );
};
