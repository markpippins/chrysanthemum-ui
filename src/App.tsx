import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UMLProject, 
  UMLElement, 
  UMLRelationship, 
  UMLDiagram, 
  CodeGenConfig,
  UMLElementType
} from './types/uml';
import { SAMPLE_MODELS } from './engine/sampleModels';
import { RoseMenuBar } from './components/menubar/RoseMenuBar';
import { RoseToolbox } from './components/toolbox/RoseToolbox';
import { RoseBrowser } from './components/browser/RoseBrowser';
import { RoseCanvas } from './components/canvas/RoseCanvas';
import { CodeGenPanel } from './components/codegen/CodeGenPanel';
import { SpecificationModal } from './components/inspector/SpecificationModal';
import { ReverseEngineerModal } from './components/dialogs/ReverseEngineerModal';
import { RoseAiModal } from './components/dialogs/RoseAiModal';
import { ModelValidatorModal } from './components/dialogs/ModelValidatorModal';
import { ExportDiagramModal } from './components/dialogs/ExportDiagramModal';

export default function App() {
  // Main Project State with History for Undo/Redo
  const [project, setProject] = useState<UMLProject>(SAMPLE_MODELS[0]);
  const [history, setHistory] = useState<{ past: UMLProject[]; future: UMLProject[] }>({
    past: [],
    future: []
  });

  // UI Panels & Layout State
  const [showBrowser, setShowBrowser] = useState(true);
  const [showCodeGen, setShowCodeGen] = useState(true);
  const [activeTool, setActiveTool] = useState<string>('select');

  // Selection State
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | undefined>(undefined);

  // Modals
  const [specElement, setSpecElement] = useState<UMLElement | null>(null);
  const [showReverseEngineer, setShowReverseEngineer] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showValidator, setShowValidator] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Active Diagram
  const activeDiagram: UMLDiagram = useMemo(() => {
    return project.diagrams[0] || {
      id: 'diag_main',
      name: 'Main Class Diagram',
      type: 'class',
      elementIds: project.elements.map(e => e.id),
      relationshipIds: project.relationships.map(r => r.id),
      zoom: 1,
      panX: 60,
      panY: 40
    };
  }, [project]);

  // Helper to commit state changes with undo history
  const updateProjectWithHistory = useCallback((newProject: UMLProject) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-25), project],
      future: []
    }));
    setProject({
      ...newProject,
      updatedAt: new Date().toISOString()
    });
  }, [project]);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    setHistory({
      past: newPast,
      future: [project, ...history.future]
    });
    setProject(previous);
  }, [history, project]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    setHistory({
      past: [...history.past, project],
      future: newFuture
    });
    setProject(next);
  }, [history, project]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when inside inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          handleDeleteElements(selectedElementIds);
        } else if (selectedRelationshipId) {
          e.preventDefault();
          handleDeleteRelationship(selectedRelationshipId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedElementIds(project.elements.map(el => el.id));
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, selectedRelationshipId, project, handleUndo, handleRedo]);

  // Update Elements on Canvas Drag / Edit
  const handleUpdateElements = (updatedElements: UMLElement[]) => {
    setProject(prev => ({
      ...prev,
      elements: updatedElements
    }));
  };

  // Add Relationship
  const handleAddRelationship = (newRel: UMLRelationship) => {
    updateProjectWithHistory({
      ...project,
      relationships: [...project.relationships, newRel]
    });
  };

  // Delete Elements
  const handleDeleteElements = (ids: string[]) => {
    const remainingElements = project.elements.filter(e => !ids.includes(e.id));
    const remainingRels = project.relationships.filter(
      r => !ids.includes(r.sourceId) && !ids.includes(r.targetId)
    );

    updateProjectWithHistory({
      ...project,
      elements: remainingElements,
      relationships: remainingRels
    });
    setSelectedElementIds([]);
  };

  // Delete Relationship
  const handleDeleteRelationship = (relId: string) => {
    updateProjectWithHistory({
      ...project,
      relationships: project.relationships.filter(r => r.id !== relId)
    });
    setSelectedRelationshipId(undefined);
  };

  // Quick Add Element from Toolbox / Browser
  const handleQuickAddElement = (type: UMLElementType, isAbstract = false) => {
    const count = project.elements.filter(e => e.type === type).length + 1;
    const prefix = type === 'interface' ? 'I' : '';
    const baseName = type === 'typeAlias' ? `CustomType${count}` : `${prefix}${capitalize(type)}${count}`;

    const newElement: UMLElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: baseName,
      type,
      isAbstract,
      stereotype: isAbstract ? 'abstract' : undefined,
      attributes: type === 'enum' || type === 'typeAlias' ? [] : [
        {
          id: `attr_${Date.now()}_1`,
          name: 'id',
          type: 'string',
          visibility: 'public'
        }
      ],
      operations: type === 'enum' || type === 'typeAlias' ? [] : [
        {
          id: `op_${Date.now()}_1`,
          name: 'execute',
          returnType: 'void',
          visibility: 'public',
          parameters: []
        }
      ],
      enumLiterals: type === 'enum' ? [
        { id: `lit_${Date.now()}_1`, name: 'FIRST', value: 'FIRST' },
        { id: `lit_${Date.now()}_2`, name: 'SECOND', value: 'SECOND' }
      ] : undefined,
      typeDefinition: type === 'typeAlias' ? 'string | number' : undefined,
      x: 100 + (project.elements.length % 4) * 60,
      y: 100 + (project.elements.length % 4) * 60,
      width: 240,
      height: 200
    };

    updateProjectWithHistory({
      ...project,
      elements: [...project.elements, newElement]
    });
    setSelectedElementIds([newElement.id]);
  };

  // Quick Add Attribute to Element
  const handleQuickAddAttribute = (element: UMLElement) => {
    const updated = project.elements.map(el => {
      if (el.id === element.id) {
        const newAttr = {
          id: `attr_${Date.now()}_${el.attributes.length + 1}`,
          name: `field${el.attributes.length + 1}`,
          type: 'string',
          visibility: 'public' as const
        };
        return {
          ...el,
          attributes: [...el.attributes, newAttr]
        };
      }
      return el;
    });
    updateProjectWithHistory({ ...project, elements: updated });
  };

  // Quick Add Operation to Element
  const handleQuickAddOperation = (element: UMLElement) => {
    const updated = project.elements.map(el => {
      if (el.id === element.id) {
        const newOp = {
          id: `op_${Date.now()}_${el.operations.length + 1}`,
          name: `action${el.operations.length + 1}`,
          returnType: 'void',
          visibility: 'public' as const,
          parameters: []
        };
        return {
          ...el,
          operations: [...el.operations, newOp]
        };
      }
      return el;
    });
    updateProjectWithHistory({ ...project, elements: updated });
  };

  // Update Element from Specification Dialog
  const handleSaveSpecification = (updatedElement: UMLElement) => {
    const updated = project.elements.map(el => el.id === updatedElement.id ? updatedElement : el);
    updateProjectWithHistory({ ...project, elements: updated });
  };

  // Import from Reverse Engineer
  const handleImportReverseEngineer = (elements: UMLElement[], relationships: UMLRelationship[]) => {
    updateProjectWithHistory({
      ...project,
      elements: [...project.elements, ...elements],
      relationships: [...project.relationships, ...relationships]
    });
  };

  // Import from AI Architect
  const handleApplyAiModel = (elements: UMLElement[], relationships: UMLRelationship[], desc?: string) => {
    updateProjectWithHistory({
      ...project,
      name: project.name === 'Untitled Model' ? 'AI Synthesized System' : project.name,
      description: desc || project.description,
      elements,
      relationships
    });
  };

  // Auto-Layout Trigger from Menu
  const handleAutoLayout = () => {
    const colWidth = 300;
    const rowHeight = 280;
    const cols = Math.max(2, Math.ceil(Math.sqrt(project.elements.length)));

    const updated = project.elements.map((el, i) => ({
      ...el,
      x: 80 + (i % cols) * colWidth,
      y: 80 + Math.floor(i / cols) * rowHeight
    }));

    updateProjectWithHistory({ ...project, elements: updated });
  };

  // Preset Load
  const handleLoadPreset = (key: string) => {
    const preset = SAMPLE_MODELS[key];
    if (preset) {
      updateProjectWithHistory(preset);
      setSelectedElementIds([]);
      setSelectedRelationshipId(undefined);
    }
  };

  // Save JSON
  const handleSaveJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_Model.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load JSON
  const handleLoadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string);
        if (loaded && loaded.elements && loaded.relationships) {
          updateProjectWithHistory(loaded);
        }
      } catch (err) {
        console.error('Invalid JSON model file:', err);
      }
    };
    reader.readAsText(file);
  };

  // Update CodeGen Config
  const handleUpdateCodeGenConfig = (config: CodeGenConfig) => {
    updateProjectWithHistory({
      ...project,
      codeGenConfig: config
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1E1E1E] text-[#D4D4D4] overflow-hidden font-sans">
      {/* Rational Rose Top IDE Header */}
      <RoseMenuBar
        project={project}
        showBrowser={showBrowser}
        showCodeGen={showCodeGen}
        onToggleBrowser={() => setShowBrowser(!showBrowser)}
        onToggleCodeGen={() => setShowCodeGen(!showCodeGen)}
        onLoadPreset={handleLoadPreset}
        onNewProject={() => updateProjectWithHistory({
          id: `proj_${Date.now()}`,
          name: 'Untitled Model',
          version: '1.0.0',
          packages: [],
          elements: [],
          relationships: [],
          diagrams: [
            {
              id: 'diag_1',
              name: 'Main Class Diagram',
              type: 'class',
              elementIds: [],
              relationshipIds: []
            }
          ],
          codeGenConfig: {
            language: 'typescript',
            target: 'ES2022',
            moduleSystem: 'ESM',
            indentation: '  ',
            generateGettersSetters: false,
            generateJSDoc: true,
            strictNullChecks: true,
            useDecorators: true
          }
        })}
        onOpenAiArchitect={() => setShowAiModal(true)}
        onOpenReverseEngineer={() => setShowReverseEngineer(true)}
        onOpenValidator={() => setShowValidator(true)}
        onOpenExport={() => setShowExport(true)}
        onAutoLayout={handleAutoLayout}
        onSaveJson={handleSaveJson}
        onLoadJson={handleLoadJson}
      />

      {/* Main IDE Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Tool Palette */}
        <RoseToolbox
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          onQuickAddElement={handleQuickAddElement}
        />

        {/* Left Rational Rose Model Browser Sidebar */}
        {showBrowser && (
          <div className="w-60 h-full shrink-0 border-r border-[#3F3F3F] bg-[#252526]">
            <RoseBrowser
              project={project}
              activeDiagram={activeDiagram}
              selectedElementIds={selectedElementIds}
              onSelectElement={(id) => {
                setSelectedElementIds([id]);
                setSelectedRelationshipId(undefined);
              }}
              onSelectDiagram={(id) => {}}
              onAddElement={(type) => handleQuickAddElement(type)}
              onAddDiagram={(name) => {}}
              onDeleteElement={(id) => handleDeleteElements([id])}
              onOpenSpecification={(element) => setSpecElement(element)}
            />
          </div>
        )}

        {/* Center Visual Diagram Modeling Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-[#181818]">
          <RoseCanvas
            diagram={activeDiagram}
            elements={project.elements}
            relationships={project.relationships}
            selectedElementIds={selectedElementIds}
            selectedRelationshipId={selectedRelationshipId}
            activeTool={activeTool}
            onSelectElements={(ids) => setSelectedElementIds(ids)}
            onSelectRelationship={(id) => setSelectedRelationshipId(id)}
            onUpdateElements={handleUpdateElements}
            onAddRelationship={handleAddRelationship}
            onDeleteElements={handleDeleteElements}
            onDeleteRelationship={handleDeleteRelationship}
            onOpenSpecification={(element) => setSpecElement(element)}
            onQuickAddAttribute={handleQuickAddAttribute}
            onQuickAddOperation={handleQuickAddOperation}
          />
        </div>

        {/* Right Docked TypeScript Code Generation Studio */}
        {showCodeGen && (
          <div className="w-[420px] lg:w-[480px] h-full shrink-0 border-l border-[#3F3F3F] bg-[#252526] shadow-2xl">
            <CodeGenPanel
              project={project}
              onUpdateConfig={handleUpdateCodeGenConfig}
            />
          </div>
        )}
      </div>

      {/* Sleek IDE Status Bar */}
      <footer className="h-6 bg-[#007ACC] flex items-center px-3 justify-between text-white text-[11px] font-sans shrink-0 select-none z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="mr-1.5 font-bold">↵</span> TypeScript Engine: Ready
          </div>
          <div className="flex items-center">
            <span className="mr-1 text-yellow-200">⚠</span> 0 Warnings
          </div>
          <div className="hidden sm:flex items-center text-blue-100 font-medium">
            UML 2.5 Active
          </div>
        </div>
        <div className="flex items-center space-x-3 text-white/90 text-[10px]">
          <span>Diagram: {activeDiagram.name}</span>
          <span className="hidden sm:inline">|</span>
          <span>{project.elements.length} Elements</span>
          <span className="hidden sm:inline">|</span>
          <span>UTF-8</span>
          <span className="hidden sm:inline">Spaces: 2</span>
        </div>
      </footer>

      {/* Modals */}
      {specElement && (
        <SpecificationModal
          element={specElement}
          isOpen={!!specElement}
          onClose={() => setSpecElement(null)}
          onSave={handleSaveSpecification}
        />
      )}

      {showReverseEngineer && (
        <ReverseEngineerModal
          isOpen={showReverseEngineer}
          onClose={() => setShowReverseEngineer(false)}
          onImport={handleImportReverseEngineer}
        />
      )}

      {showAiModal && (
        <RoseAiModal
          isOpen={showAiModal}
          project={project}
          onClose={() => setShowAiModal(false)}
          onApplyAiModel={handleApplyAiModel}
        />
      )}

      {showValidator && (
        <ModelValidatorModal
          isOpen={showValidator}
          project={project}
          onClose={() => setShowValidator(false)}
          onAutoFix={(fixed) => updateProjectWithHistory(fixed)}
        />
      )}

      {showExport && (
        <ExportDiagramModal
          isOpen={showExport}
          project={project}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
