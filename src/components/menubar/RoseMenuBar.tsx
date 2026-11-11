import React, { useState, useRef } from 'react';
import { 
  UMLProject 
} from '../../types/uml';
import { 
  FileCode, 
  Layers, 
  Download, 
  Upload, 
  RotateCcw, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  FolderOpen, 
  Save, 
  Settings, 
  ChevronDown, 
  Code2, 
  LayoutGrid, 
  HelpCircle,
  BookOpen,
  Plus,
  Trash2
} from 'lucide-react';
import { SAMPLE_MODELS } from '../../engine/sampleModels';

interface RoseMenuBarProps {
  project: UMLProject;
  showBrowser: boolean;
  showCodeGen: boolean;
  onToggleBrowser: () => void;
  onToggleCodeGen: () => void;
  onLoadPreset: (presetKey: string) => void;
  onNewProject: () => void;
  onOpenAiArchitect: () => void;
  onOpenReverseEngineer: () => void;
  onOpenValidator: () => void;
  onOpenExport: () => void;
  onAutoLayout: () => void;
  onSaveJson: () => void;
  onLoadJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RoseMenuBar: React.FC<RoseMenuBarProps> = ({
  project,
  showBrowser,
  showCodeGen,
  onToggleBrowser,
  onToggleCodeGen,
  onLoadPreset,
  onNewProject,
  onOpenAiArchitect,
  onOpenReverseEngineer,
  onOpenValidator,
  onOpenExport,
  onAutoLayout,
  onSaveJson,
  onLoadJson
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (name: string) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  const closeMenus = () => setOpenMenu(null);

  return (
    <div 
      className="bg-[#2D2D2D] border-b border-[#3F3F3F] text-[#D4D4D4] select-none flex flex-col z-30 relative shadow-md"
      onClick={() => {
        if (openMenu) closeMenus();
      }}
    >
      {/* Top Application Header / Brand & Window Controls */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-[#3F3F3F] bg-[#2D2D2D]">
        <div className="flex items-center space-x-4">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
              R
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              RationalTS <span className="text-blue-400 font-normal text-xs">Pro</span>
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#3F3F3F]" />

          {/* Model Title & Stats */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-white/90 font-mono">{project.name}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E1E1E] text-[#858585] text-[10px] font-mono border border-[#3F3F3F]">
              {project.elements.length} elements • {project.relationships.length} rels
            </span>
          </div>
        </div>

        {/* Status badges & window controls */}
        <div className="flex items-center space-x-3">
          <div className="bg-green-900/30 text-green-400 border border-green-800/80 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
            UML 2.5 Active
          </div>

          {/* Window dots */}
          <div className="flex space-x-1.5 pl-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] opacity-85 hover:opacity-100 transition-opacity cursor-pointer"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-85 hover:opacity-100 transition-opacity cursor-pointer"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] opacity-85 hover:opacity-100 transition-opacity cursor-pointer"></div>
          </div>
        </div>
      </div>

      {/* Second Toolbar: Sleek Menu Items + Quick Action Buttons */}
      <div className="flex items-center justify-between h-9 bg-[#252526] px-2 text-xs">
        {/* Sleek Menu Dropdowns */}
        <div className="flex items-center space-x-1">
          {/* FILE MENU */}
          <div className="relative">
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${openMenu === 'file' ? 'bg-[#37373D] text-white' : 'text-[#D4D4D4] hover:bg-[#37373D]'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('file');
              }}
            >
              File
            </button>

            {openMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl py-1 z-50 text-xs">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onNewProject();
                    closeMenus();
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>New Project</span>
                </button>

                <div className="h-[1px] bg-[#3F3F3F] my-1" />

                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onSaveJson();
                    closeMenus();
                  }}
                >
                  <Save className="w-3.5 h-3.5 text-green-400" />
                  <span>Save Project (.json)</span>
                </button>

                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    fileInputRef.current?.click();
                    closeMenus();
                  }}
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Load Project (.json)</span>
                </button>

                <div className="h-[1px] bg-[#3F3F3F] my-1" />

                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onOpenExport();
                    closeMenus();
                  }}
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export Diagram & Docs (Mermaid / PlantUML)</span>
                </button>
              </div>
            )}
          </div>

          {/* PRESETS MENU */}
          <div className="relative">
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 ${openMenu === 'presets' ? 'bg-[#37373D] text-white' : 'text-[#D4D4D4] hover:bg-[#37373D]'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('presets');
              }}
            >
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {openMenu === 'presets' && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Architecture Templates
                </div>
                {Object.keys(SAMPLE_MODELS).map((key) => {
                  const sample = SAMPLE_MODELS[key];
                  return (
                    <button
                      key={key}
                      className="w-full text-left px-3 py-2 hover:bg-[#37373D] text-white flex flex-col"
                      onClick={() => {
                        onLoadPreset(key);
                        closeMenus();
                      }}
                    >
                      <span className="font-semibold text-blue-400">{sample.name}</span>
                      <span className="text-[11px] text-gray-400 truncate">{sample.description}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${openMenu === 'view' ? 'bg-[#37373D] text-white' : 'text-[#D4D4D4] hover:bg-[#37373D]'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('view');
              }}
            >
              View
            </button>

            {openMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl py-1 z-50 text-xs">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center justify-between text-white"
                  onClick={() => {
                    onToggleBrowser();
                    closeMenus();
                  }}
                >
                  <span>Model Browser</span>
                  <span className="text-[10px] text-gray-400">{showBrowser ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center justify-between text-white"
                  onClick={() => {
                    onToggleCodeGen();
                    closeMenus();
                  }}
                >
                  <span>TypeScript Studio</span>
                  <span className="text-[10px] text-gray-400">{showCodeGen ? 'Hide' : 'Show'}</span>
                </button>
                <div className="h-[1px] bg-[#3F3F3F] my-1" />
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] text-white flex items-center gap-2"
                  onClick={() => {
                    onAutoLayout();
                    closeMenus();
                  }}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
                  <span>Auto-Layout Diagram</span>
                </button>
              </div>
            )}
          </div>

          {/* TOOLS MENU */}
          <div className="relative">
            <button
              className={`px-2.5 py-1 rounded text-xs transition-colors ${openMenu === 'tools' ? 'bg-[#37373D] text-white' : 'text-[#D4D4D4] hover:bg-[#37373D]'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu('tools');
              }}
            >
              Tools
            </button>

            {openMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl py-1 z-50 text-xs">
                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onOpenReverseEngineer();
                    closeMenus();
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-green-400" />
                  <span>Reverse Engineer TS</span>
                </button>

                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onOpenValidator();
                    closeMenus();
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Model Consistency</span>
                </button>

                <button
                  className="w-full text-left px-3 py-1.5 hover:bg-[#37373D] flex items-center gap-2 text-white"
                  onClick={() => {
                    onOpenExport();
                    closeMenus();
                  }}
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export Diagram & Docs (Mermaid)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Ribbon Pills */}
        <div className="flex items-center space-x-2">
          {/* AI Architect */}
          <button
            className="flex items-center space-x-1.5 bg-[#37373D] hover:bg-[#45454c] border border-[#3F3F3F] text-blue-400 hover:text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
            onClick={onOpenAiArchitect}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Architect</span>
          </button>

          {/* Reverse Engineer */}
          <button
            className="flex items-center space-x-1.5 bg-[#37373D] hover:bg-[#45454c] border border-[#3F3F3F] text-emerald-400 hover:text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
            onClick={onOpenReverseEngineer}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reverse Engineer</span>
          </button>

          {/* Validator */}
          <button
            className="flex items-center space-x-1.5 bg-[#37373D] hover:bg-[#45454c] border border-[#3F3F3F] text-white px-2.5 py-1 rounded text-xs font-medium transition-colors"
            onClick={onOpenValidator}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Validate</span>
          </button>

          {/* CodeGen Studio Button */}
          <button
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
              showCodeGen
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-[#37373D] hover:bg-[#45454c] border border-[#3F3F3F] text-white'
            }`}
            onClick={onToggleCodeGen}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Generate Code</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={onLoadJson}
      />
    </div>
  );
};

