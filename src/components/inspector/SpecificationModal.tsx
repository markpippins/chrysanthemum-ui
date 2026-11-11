import React, { useState } from 'react';
import { 
  UMLElement, 
  UMLAttribute, 
  UMLOperation, 
  UMLParameter, 
  UMLEnumLiteral, 
  UMLVisibility,
  UMLStereotype 
} from '../../types/uml';
import { 
  Settings, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Code2, 
  FileText, 
  Sparkles,
  MoveUp,
  MoveDown
} from 'lucide-react';

interface SpecificationModalProps {
  element: UMLElement;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UMLElement) => void;
}

export const SpecificationModal: React.FC<SpecificationModalProps> = ({
  element,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'general' | 'attributes' | 'operations' | 'enums' | 'doc'>('general');
  const [model, setModel] = useState<UMLElement>({ ...element });

  // Selected attribute/operation for detail sub-editing
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(
    element.attributes[0]?.id || null
  );
  const [selectedOpId, setSelectedOpId] = useState<string | null>(
    element.operations[0]?.id || null
  );

  // Handle Add Attribute
  const handleAddAttribute = () => {
    const newAttr: UMLAttribute = {
      id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `field${model.attributes.length + 1}`,
      type: 'string',
      visibility: 'public'
    };
    setModel({
      ...model,
      attributes: [...model.attributes, newAttr]
    });
    setSelectedAttrId(newAttr.id);
  };

  // Handle Remove Attribute
  const handleRemoveAttribute = (id: string) => {
    const updated = model.attributes.filter(a => a.id !== id);
    setModel({ ...model, attributes: updated });
    if (selectedAttrId === id) {
      setSelectedAttrId(updated[0]?.id || null);
    }
  };

  // Handle Update Attribute
  const handleUpdateAttribute = (id: string, updates: Partial<UMLAttribute>) => {
    setModel({
      ...model,
      attributes: model.attributes.map(a => a.id === id ? { ...a, ...updates } : a)
    });
  };

  // Handle Add Operation
  const handleAddOperation = () => {
    const newOp: UMLOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `method${model.operations.length + 1}`,
      returnType: 'void',
      visibility: 'public',
      parameters: []
    };
    setModel({
      ...model,
      operations: [...model.operations, newOp]
    });
    setSelectedOpId(newOp.id);
  };

  // Handle Remove Operation
  const handleRemoveOperation = (id: string) => {
    const updated = model.operations.filter(o => o.id !== id);
    setModel({ ...model, operations: updated });
    if (selectedOpId === id) {
      setSelectedOpId(updated[0]?.id || null);
    }
  };

  // Handle Update Operation
  const handleUpdateOperation = (id: string, updates: Partial<UMLOperation>) => {
    setModel({
      ...model,
      operations: model.operations.map(o => o.id === id ? { ...o, ...updates } : o)
    });
  };

  // Handle Add Parameter to Operation
  const handleAddParameter = (opId: string) => {
    const op = model.operations.find(o => o.id === opId);
    if (!op) return;

    const newParam: UMLParameter = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `param${op.parameters.length + 1}`,
      type: 'any'
    };

    handleUpdateOperation(opId, {
      parameters: [...op.parameters, newParam]
    });
  };

  // Handle Remove Parameter from Operation
  const handleRemoveParameter = (opId: string, paramId: string) => {
    const op = model.operations.find(o => o.id === opId);
    if (!op) return;

    handleUpdateOperation(opId, {
      parameters: op.parameters.filter(p => p.id !== paramId)
    });
  };

  // Handle Add Enum Literal
  const handleAddEnumLiteral = () => {
    const newLit: UMLEnumLiteral = {
      id: `lit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: `VALUE_${(model.enumLiterals?.length || 0) + 1}`,
      value: `VALUE_${(model.enumLiterals?.length || 0) + 1}`
    };
    setModel({
      ...model,
      enumLiterals: [...(model.enumLiterals || []), newLit]
    });
  };

  // Handle Save & Close
  const handleSave = () => {
    onSave(model);
    onClose();
  };

  const currentAttr = model.attributes.find(a => a.id === selectedAttrId);
  const currentOp = model.operations.find(o => o.id === selectedOpId);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden text-[#D4D4D4]">
        {/* Header */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-b border-[#3F3F3F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Specification: <span className="text-blue-400 font-mono">{element.name}</span>
              </h2>
              <p className="text-[11px] text-[#858585] capitalize">
                UML 2.5 {element.type} Metamodel Element
              </p>
            </div>
          </div>

          <button
            className="p-1 rounded hover:bg-[#37373D] text-[#858585] hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-[#1E1E1E] border-b border-[#3F3F3F] text-xs font-medium">
          <button
            className={`px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          
          {model.type !== 'enum' && model.type !== 'typeAlias' && (
            <>
              <button
                className={`px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'attributes'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
                }`}
                onClick={() => setActiveTab('attributes')}
              >
                Attributes ({model.attributes.length})
              </button>
              <button
                className={`px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === 'operations'
                    ? 'border-blue-500 text-white font-semibold'
                    : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
                }`}
                onClick={() => setActiveTab('operations')}
              >
                Operations ({model.operations.length})
              </button>
            </>
          )}

          {model.type === 'enum' && (
            <button
              className={`px-4 py-2.5 border-b-2 transition-colors ${
                activeTab === 'enums'
                  ? 'border-blue-500 text-white font-semibold'
                  : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
              }`}
              onClick={() => setActiveTab('enums')}
            >
              Enum Literals ({model.enumLiterals?.length || 0})
            </button>
          )}

          <button
            className={`px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === 'doc'
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
            }`}
            onClick={() => setActiveTab('doc')}
          >
            Documentation & JSDoc
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs bg-[#252526]">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Element Name</label>
                <input
                  type="text"
                  value={model.name}
                  onChange={(e) => setModel({ ...model, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Element Type</label>
                  <select
                    value={model.type}
                    onChange={(e) => setModel({ ...model, type: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono focus:border-sky-400 focus:outline-none"
                  >
                    <option value="class">Class</option>
                    <option value="interface">Interface</option>
                    <option value="enum">Enum</option>
                    <option value="typeAlias">Type Alias</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Stereotype</label>
                  <input
                    type="text"
                    value={model.stereotype || ''}
                    placeholder="e.g. entity, service, dto, repository"
                    onChange={(e) => setModel({ ...model, stereotype: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Type Parameters / Generics (optional)
                </label>
                <input
                  type="text"
                  value={model.typeParameters || ''}
                  placeholder="e.g. T extends Entity, K = string"
                  onChange={(e) => setModel({ ...model, typeParameters: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-100 font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>

              {model.type === 'typeAlias' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Type Definition</label>
                  <textarea
                    rows={3}
                    value={model.typeDefinition || ''}
                    placeholder="e.g. string | number | { id: string }"
                    onChange={(e) => setModel({ ...model, typeDefinition: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 font-mono focus:border-sky-400 focus:outline-none"
                  />
                </div>
              )}

              {model.type === 'class' && (
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={model.isAbstract || false}
                      onChange={(e) => setModel({ ...model, isAbstract: e.target.checked })}
                      className="rounded border-slate-700 text-sky-500 focus:ring-0"
                    />
                    <span className="text-slate-300 font-medium">Abstract Class</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* ATTRIBUTES TAB */}
          {activeTab === 'attributes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px]">
              {/* Attribute List */}
              <div className="border border-slate-800 rounded-lg p-2 flex flex-col bg-slate-950/60">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="font-semibold text-slate-300 text-xs">Attributes</span>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
                    onClick={handleAddAttribute}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {model.attributes.map((attr) => {
                    const isSelected = selectedAttrId === attr.id;
                    return (
                      <div
                        key={attr.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40' : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                        onClick={() => setSelectedAttrId(attr.id)}
                      >
                        <div className="flex items-center gap-2 truncate font-mono text-[11px]">
                          <span className="font-bold text-slate-400">
                            {attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#'}
                          </span>
                          <span className="font-semibold text-slate-100">{attr.name}</span>
                          <span className="text-slate-400">: {attr.type}</span>
                        </div>
                        <button
                          className="p-1 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAttribute(attr.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {model.attributes.length === 0 && (
                    <div className="text-slate-500 italic text-center py-8">No attributes defined</div>
                  )}
                </div>
              </div>

              {/* Attribute Properties Editor */}
              {currentAttr ? (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40 space-y-3">
                  <h4 className="font-semibold text-slate-200 text-xs border-b border-slate-800 pb-2">
                    Attribute Details
                  </h4>

                  <div>
                    <label className="block text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={currentAttr.name}
                      onChange={(e) => handleUpdateAttribute(currentAttr.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Type</label>
                      <input
                        type="text"
                        value={currentAttr.type}
                        onChange={(e) => handleUpdateAttribute(currentAttr.id, { type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Visibility</label>
                      <select
                        value={currentAttr.visibility}
                        onChange={(e) => handleUpdateAttribute(currentAttr.id, { visibility: e.target.value as UMLVisibility })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                      >
                        <option value="public">+ Public</option>
                        <option value="private">- Private</option>
                        <option value="protected"># Protected</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Default Initializer</label>
                    <input
                      type="text"
                      value={currentAttr.defaultValue || ''}
                      placeholder='e.g. "USD", 0, []'
                      onChange={(e) => handleUpdateAttribute(currentAttr.id, { defaultValue: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentAttr.isOptional || false}
                        onChange={(e) => handleUpdateAttribute(currentAttr.id, { isOptional: e.target.checked })}
                      />
                      <span>Optional (?)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentAttr.isReadonly || false}
                        onChange={(e) => handleUpdateAttribute(currentAttr.id, { isReadonly: e.target.checked })}
                      />
                      <span>Readonly</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentAttr.isStatic || false}
                        onChange={(e) => handleUpdateAttribute(currentAttr.id, { isStatic: e.target.checked })}
                      />
                      <span>Static</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border border-slate-800 rounded-lg text-slate-500">
                  Select or add an attribute to edit details
                </div>
              )}
            </div>
          )}

          {/* OPERATIONS TAB */}
          {activeTab === 'operations' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px]">
              {/* Operations List */}
              <div className="border border-slate-800 rounded-lg p-2 flex flex-col bg-slate-950/60">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="font-semibold text-slate-300 text-xs">Operations</span>
                  <button
                    className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-medium"
                    onClick={handleAddOperation}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {model.operations.map((op) => {
                    const isSelected = selectedOpId === op.id;
                    return (
                      <div
                        key={op.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40' : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                        onClick={() => setSelectedOpId(op.id)}
                      >
                        <div className="flex items-center gap-2 truncate font-mono text-[11px]">
                          <span className="font-bold text-slate-400">
                            {op.visibility === 'public' ? '+' : op.visibility === 'private' ? '-' : '#'}
                          </span>
                          <span className="font-semibold text-slate-100">{op.name}()</span>
                          <span className="text-emerald-400">: {op.returnType}</span>
                        </div>
                        <button
                          className="p-1 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOperation(op.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {model.operations.length === 0 && (
                    <div className="text-slate-500 italic text-center py-8">No operations defined</div>
                  )}
                </div>
              </div>

              {/* Operation Details Editor */}
              {currentOp ? (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/40 space-y-3 overflow-y-auto">
                  <h4 className="font-semibold text-slate-200 text-xs border-b border-slate-800 pb-2">
                    Operation Signature & Parameters
                  </h4>

                  <div>
                    <label className="block text-slate-400 mb-1">Method Name</label>
                    <input
                      type="text"
                      value={currentOp.name}
                      onChange={(e) => handleUpdateOperation(currentOp.id, { name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Return Type</label>
                      <input
                        type="text"
                        value={currentOp.returnType}
                        onChange={(e) => handleUpdateOperation(currentOp.id, { returnType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Visibility</label>
                      <select
                        value={currentOp.visibility}
                        onChange={(e) => handleUpdateOperation(currentOp.id, { visibility: e.target.value as UMLVisibility })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono"
                      >
                        <option value="public">+ Public</option>
                        <option value="private">- Private</option>
                        <option value="protected"># Protected</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentOp.isAsync || false}
                        onChange={(e) => handleUpdateOperation(currentOp.id, { isAsync: e.target.checked })}
                      />
                      <span>Async</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentOp.isAbstract || false}
                        onChange={(e) => handleUpdateOperation(currentOp.id, { isAbstract: e.target.checked })}
                      />
                      <span>Abstract</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentOp.isStatic || false}
                        onChange={(e) => handleUpdateOperation(currentOp.id, { isStatic: e.target.checked })}
                      />
                      <span>Static</span>
                    </label>
                  </div>

                  {/* Parameters Section */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-300">Parameters ({currentOp.parameters.length})</span>
                      <button
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-medium"
                        onClick={() => handleAddParameter(currentOp.id)}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Param</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {currentOp.parameters.map((param, pIdx) => (
                        <div key={param.id} className="flex items-center gap-2 p-1.5 rounded bg-slate-900 border border-slate-800">
                          <input
                            type="text"
                            placeholder="paramName"
                            value={param.name}
                            onChange={(e) => {
                              const updated = [...currentOp.parameters];
                              updated[pIdx] = { ...param, name: e.target.value };
                              handleUpdateOperation(currentOp.id, { parameters: updated });
                            }}
                            className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono"
                          />
                          <span className="text-slate-500">:</span>
                          <input
                            type="text"
                            placeholder="type"
                            value={param.type}
                            onChange={(e) => {
                              const updated = [...currentOp.parameters];
                              updated[pIdx] = { ...param, type: e.target.value };
                              handleUpdateOperation(currentOp.id, { parameters: updated });
                            }}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono"
                          />
                          <button
                            className="p-1 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                            onClick={() => handleRemoveParameter(currentOp.id, param.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center border border-slate-800 rounded-lg text-slate-500">
                  Select or add an operation to edit signature
                </div>
              )}
            </div>
          )}

          {/* ENUMS TAB */}
          {activeTab === 'enums' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Enum Literals</span>
                <button
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs"
                  onClick={handleAddEnumLiteral}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Literal</span>
                </button>
              </div>

              <div className="space-y-2">
                {(model.enumLiterals || []).map((lit, idx) => (
                  <div key={lit.id} className="flex items-center gap-3 p-2 rounded bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      value={lit.name}
                      onChange={(e) => {
                        const updated = [...(model.enumLiterals || [])];
                        updated[idx] = { ...lit, name: e.target.value };
                        setModel({ ...model, enumLiterals: updated });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300"
                      placeholder="NAME"
                    />
                    <span className="text-slate-500">=</span>
                    <input
                      type="text"
                      value={lit.value !== undefined ? String(lit.value) : ''}
                      onChange={(e) => {
                        const updated = [...(model.enumLiterals || [])];
                        updated[idx] = { ...lit, value: e.target.value };
                        setModel({ ...model, enumLiterals: updated });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-300"
                      placeholder="Value"
                    />
                    <button
                      className="p-1 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                      onClick={() => {
                        const updated = (model.enumLiterals || []).filter(l => l.id !== lit.id);
                        setModel({ ...model, enumLiterals: updated });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENTATION TAB */}
          {activeTab === 'doc' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Element JSDoc Documentation Comment
                </label>
                <textarea
                  rows={6}
                  value={model.docComment || ''}
                  placeholder="Detailed architectural description, responsibilities, invariants..."
                  onChange={(e) => setModel({ ...model, docComment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-slate-100 font-sans focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-t border-[#3F3F3F] flex items-center justify-end gap-2">
          <button
            className="px-4 py-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] text-xs font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
            onClick={handleSave}
          >
            <Check className="w-4 h-4" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
