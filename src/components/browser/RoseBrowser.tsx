import React, { useState } from 'react';
import { 
  UMLProject, 
  UMLElement, 
  UMLDiagram, 
  UMLPackage,
  UMLElementType 
} from '../../types/uml';
import { 
  Folder, 
  FolderPlus, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Layers, 
  Search, 
  Box, 
  ShieldCheck, 
  Tag, 
  Sparkles, 
  Trash2, 
  Settings,
  Grid,
  FileText
} from 'lucide-react';

interface RoseBrowserProps {
  project: UMLProject;
  activeDiagram: UMLDiagram;
  selectedElementIds: string[];
  onSelectElement: (id: string) => void;
  onSelectDiagram: (id: string) => void;
  onAddElement: (type: UMLElementType, name?: string) => void;
  onAddDiagram: (name: string) => void;
  onDeleteElement: (id: string) => void;
  onOpenSpecification: (element: UMLElement) => void;
}

export const RoseBrowser: React.FC<RoseBrowserProps> = ({
  project,
  activeDiagram,
  selectedElementIds,
  onSelectElement,
  onSelectDiagram,
  onAddElement,
  onAddDiagram,
  onDeleteElement,
  onOpenSpecification
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<{ [key: string]: boolean }>({
    'logical_view': true,
    'diagrams_view': true,
    'component_view': true,
    'usecase_view': false
  });

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const filteredElements = project.elements.filter(el => 
    el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (el.stereotype && el.stereotype.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#D4D4D4] select-none">
      {/* Header */}
      <div className="p-2.5 border-b border-[#3F3F3F] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Project Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Add Class"
            className="p-1 rounded hover:bg-[#37373D] text-gray-400 hover:text-white transition-colors"
            onClick={() => onAddElement('class')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-[#3F3F3F]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#858585]" />
          <input
            type="text"
            placeholder="Search model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-[#3F3F3F] rounded pl-8 pr-2 py-1 text-xs text-white placeholder-[#858585] focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>
      </div>

      {/* Model Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs font-sans">
        {/* Logical View Root Node */}
        <div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#37373D] cursor-pointer font-semibold text-white/90"
            onClick={() => toggleExpand('logical_view')}
          >
            {expandedNodes['logical_view'] ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Logical View</span>
            <span className="text-[10px] text-gray-400 ml-auto font-mono">({filteredElements.length})</span>
          </div>

          {expandedNodes['logical_view'] && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#3F3F3F] ml-3.5">
              {filteredElements.map((element) => {
                const isSelected = selectedElementIds.includes(element.id);
                return (
                  <div
                    key={element.id}
                    className={`flex items-center justify-between px-2 py-1 rounded group cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#37373D] text-white font-semibold' : 'hover:bg-[#37373D] text-[#D4D4D4]'
                    }`}
                    onClick={() => onSelectElement(element.id)}
                    onDoubleClick={() => onOpenSpecification(element)}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {getElementIcon(element)}
                      <span className="truncate font-mono text-[11px]">{element.name}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Edit Specification"
                        className="p-0.5 rounded hover:bg-[#48484f] text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSpecification(element);
                        }}
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        title="Delete Element"
                        className="p-0.5 rounded hover:bg-rose-900/50 text-gray-400 hover:text-rose-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(element.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredElements.length === 0 && (
                <div className="text-[11px] text-[#858585] italic px-2 py-1">No elements matching</div>
              )}
            </div>
          )}
        </div>

        {/* Diagrams View Root Node */}
        <div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#37373D] cursor-pointer font-semibold text-white/90"
            onClick={() => toggleExpand('diagrams_view')}
          >
            {expandedNodes['diagrams_view'] ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <Grid className="w-4 h-4 text-blue-400" />
            <span>Diagrams</span>
            <span className="text-[10px] text-gray-400 ml-auto font-mono">({project.diagrams.length})</span>
          </div>

          {expandedNodes['diagrams_view'] && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#3F3F3F] ml-3.5">
              {project.diagrams.map((diag) => {
                const isActive = diag.id === activeDiagram.id;
                return (
                  <div
                    key={diag.id}
                    className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer ${
                      isActive ? 'bg-[#37373D] text-blue-400 font-semibold' : 'hover:bg-[#37373D] text-[#858585]'
                    }`}
                    onClick={() => onSelectDiagram(diag.id)}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate text-[11px]">{diag.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Component View (TypeScript Source Artifacts) */}
        <div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#37373D] cursor-pointer font-semibold text-white/90"
            onClick={() => toggleExpand('component_view')}
          >
            {expandedNodes['component_view'] ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            <FileCode className="w-4 h-4 text-green-400" />
            <span>src/models</span>
          </div>

          {expandedNodes['component_view'] && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-[#3F3F3F] ml-3.5">
              {project.elements.map((el) => (
                <div key={el.id} className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-[#D4D4D4] font-mono">
                  <span className="text-blue-400">◆</span>
                  <span>{el.name}.ts</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-blue-400 font-mono">
                <span>◆ index.ts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UML Toolbox Docked at Bottom */}
      <div className="p-2 border-t border-[#3F3F3F] bg-[#1E1E1E]">
        <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">UML Toolbox</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            className="bg-[#2D2D2D] hover:bg-[#37373D] p-1.5 border border-[#3F3F3F] hover:border-blue-500 rounded text-[10px] text-center text-white cursor-pointer transition-colors"
            onClick={() => onAddElement('class')}
          >
            Class
          </button>
          <button
            className="bg-[#2D2D2D] hover:bg-[#37373D] p-1.5 border border-[#3F3F3F] hover:border-purple-500 rounded text-[10px] text-center text-purple-300 cursor-pointer transition-colors"
            onClick={() => onAddElement('interface')}
          >
            Interface
          </button>
          <button
            className="bg-[#2D2D2D] hover:bg-[#37373D] p-1.5 border border-[#3F3F3F] hover:border-amber-500 rounded text-[10px] text-center text-amber-300 cursor-pointer transition-colors"
            onClick={() => onAddElement('enum')}
          >
            Enum
          </button>
          <button
            className="bg-[#2D2D2D] hover:bg-[#37373D] p-1.5 border border-[#3F3F3F] hover:border-cyan-500 rounded text-[10px] text-center text-cyan-300 cursor-pointer transition-colors"
            onClick={() => onAddElement('typeAlias')}
          >
            TypeAlias
          </button>
        </div>
      </div>
    </div>
  );
};

function getElementIcon(el: UMLElement) {
  if (el.type === 'interface') {
    return <span className="w-3.5 h-3.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[9px] flex items-center justify-center font-bold">I</span>;
  }
  if (el.type === 'enum') {
    return <span className="w-3.5 h-3.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] flex items-center justify-center font-bold">E</span>;
  }
  if (el.type === 'typeAlias') {
    return <span className="w-3.5 h-3.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] flex items-center justify-center font-bold">T</span>;
  }
  if (el.isAbstract || el.stereotype === 'abstract') {
    return <span className="w-3.5 h-3.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-[9px] flex items-center justify-center font-bold italic">A</span>;
  }
  return <span className="w-3.5 h-3.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[9px] flex items-center justify-center font-bold">C</span>;
}
