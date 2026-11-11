import React from 'react';
import { UMLProject, ValidationIssue } from '../../types/uml';
import { UMLModelValidator } from '../../engine/validator';
import { 
  ShieldCheck, 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Wrench,
  Sparkles
} from 'lucide-react';

interface ModelValidatorModalProps {
  isOpen: boolean;
  project: UMLProject;
  onClose: () => void;
  onAutoFix?: (fixedProject: UMLProject) => void;
}

export const ModelValidatorModal: React.FC<ModelValidatorModalProps> = ({
  isOpen,
  project,
  onClose,
  onAutoFix
}) => {
  if (!isOpen) return null;

  const issues = UMLModelValidator.validate(project);
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const suggestions = issues.filter(i => i.severity === 'info');
  const isValid = errors.length === 0;

  const handleApplyFixes = () => {
    // Basic auto-fixes (e.g. PascalCase names)
    const updatedElements = project.elements.map(el => {
      const pascalName = el.name.charAt(0).toUpperCase() + el.name.slice(1);
      return {
        ...el,
        name: pascalName
      };
    });

    onAutoFix?.({
      ...project,
      elements: updatedElements
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#D4D4D4]">
        {/* Header */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-b border-[#3F3F3F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                UML 2.5 Model Consistency Checker
              </h2>
              <p className="text-[11px] text-[#858585]">
                Static analysis for circular dependencies, interface compliance, and TypeScript typing errors
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs bg-[#252526]">
          {/* Summary Status Bar */}
          <div className={`p-4 rounded border flex items-center justify-between ${
            isValid
              ? 'bg-green-950/30 border-green-800/60 text-green-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-center gap-3">
              {isValid ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400" />
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {isValid ? 'Model is Semantically Valid' : 'Model Consistency Issues Detected'}
                </h3>
                <p className="text-[11px] text-[#D4D4D4]">
                  {errors.length} error(s), {warnings.length} warning(s), {suggestions.length} suggestion(s)
                </p>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-2">
            {issues.map((issue, idx) => {
              const targetElement = issue.elementId ? project.elements.find(e => e.id === issue.elementId) : null;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded border flex items-start gap-2.5 ${
                    issue.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                      : issue.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-800/50 text-amber-200'
                      : 'bg-blue-950/20 border-blue-800/50 text-blue-200'
                  }`}
                >
                  {issue.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{issue.message}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[#D4D4D4]">
                        {issue.severity}
                      </span>
                    </div>
                    {targetElement && (
                      <p className="text-[11px] text-[#858585] mt-0.5 font-mono">
                        Target Element: {targetElement.name} ({targetElement.type})
                      </p>
                    )}
                    {issue.fixLabel && (
                      <p className="text-[11px] text-[#D4D4D4] mt-1 italic">
                        💡 Fix: {issue.fixLabel}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {issues.length === 0 && (
              <div className="text-center py-8 text-[#858585]">
                No model issues detected. All relationships and classes conform to UML 2.5 standards.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-t border-[#3F3F3F] flex items-center justify-between">
          <span className="text-[11px] text-[#858585] font-mono">
            {project.elements.length} elements • {project.relationships.length} relationships
          </span>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1.5 rounded hover:bg-[#37373D] text-[#D4D4D4] text-xs font-medium"
              onClick={onClose}
            >
              Close
            </button>
            {warnings.length > 0 && onAutoFix && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
                onClick={handleApplyFixes}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Auto-Fix Formatting</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
