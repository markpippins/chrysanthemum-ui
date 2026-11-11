import React, { useState } from 'react';
import { UMLElement, UMLRelationship, UMLProject } from '../../types/uml';
import { 
  Sparkles, 
  X, 
  Layers, 
  Wand2, 
  Check, 
  Loader2, 
  AlertCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface RoseAiModalProps {
  isOpen: boolean;
  project: UMLProject;
  onClose: () => void;
  onApplyAiModel: (elements: UMLElement[], relationships: UMLRelationship[], description?: string) => void;
}

const PRESET_ARCHITECTURES = [
  {
    title: 'Multi-Channel Notification Gateway',
    prompt: 'Enterprise notification dispatcher supporting Email (SendGrid), SMS (Twilio), and Push Notifications (FCM) using Strategy and Factory patterns, with priority queue, rate limiter, and template renderer.'
  },
  {
    title: 'Fintech Wallet & Ledger System',
    prompt: 'Double-entry bookkeeping domain model with Wallet, Account, Transaction aggregate root, Currency conversion strategy, and Idempotency key validator.'
  },
  {
    title: 'SaaS Multi-Tenant Billing & Subscriptions',
    prompt: 'Subscription billing system with Plans, Invoices, UsageMeter, StripeWebhookHandler, ProrationCalculator, and FeatureFlag evaluator.'
  }
];

const GOF_PATTERNS = [
  'Factory Method Pattern',
  'Strategy Pattern',
  'Observer Pattern',
  'Decorator Pattern',
  'Adapter Pattern',
  'Repository Pattern (DDD)',
  'Unit of Work Pattern'
];

export const RoseAiModal: React.FC<RoseAiModalProps> = ({
  isOpen,
  project,
  onClose,
  onApplyAiModel
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'architect' | 'refactor'>('architect');
  const [prompt, setPrompt] = useState('');
  const [selectedPattern, setSelectedPattern] = useState(GOF_PATTERNS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateArchitecture = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          existingElements: project.elements.map(e => e.name)
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to generate UML model');
      }

      const data = json.data;
      const elements: UMLElement[] = [];
      const relationships: UMLRelationship[] = [];

      // Map generated elements to UMLElements with positions
      const colWidth = 300;
      const rowHeight = 280;
      const cols = 3;

      (data.elements || []).forEach((el: any, idx: number) => {
        const elemId = `elem_ai_${Date.now()}_${idx}`;
        elements.push({
          id: elemId,
          name: el.name,
          type: el.type || 'class',
          stereotype: el.stereotype,
          isAbstract: el.isAbstract,
          typeParameters: el.typeParameters,
          typeDefinition: el.typeDefinition,
          docComment: el.docComment,
          decorators: el.decorators,
          attributes: (el.attributes || []).map((attr: any, aIdx: number) => ({
            id: `attr_${elemId}_${aIdx}`,
            name: attr.name,
            type: attr.type || 'string',
            visibility: attr.visibility || 'public',
            defaultValue: attr.defaultValue,
            isReadonly: attr.isReadonly,
            isStatic: attr.isStatic,
            isOptional: attr.isOptional,
            docComment: attr.docComment
          })),
          operations: (el.operations || []).map((op: any, oIdx: number) => ({
            id: `op_${elemId}_${oIdx}`,
            name: op.name,
            returnType: op.returnType || 'void',
            visibility: op.visibility || 'public',
            isAbstract: op.isAbstract,
            isStatic: op.isStatic,
            isAsync: op.isAsync,
            docComment: op.docComment,
            parameters: (op.parameters || []).map((p: any, pIdx: number) => ({
              id: `p_${elemId}_${oIdx}_${pIdx}`,
              name: p.name,
              type: p.type || 'any',
              isOptional: p.isOptional,
              defaultValue: p.defaultValue
            }))
          })),
          enumLiterals: (el.enumLiterals || []).map((lit: any, lIdx: number) => ({
            id: `lit_${elemId}_${lIdx}`,
            name: lit.name,
            value: lit.value
          })),
          x: 80 + (idx % cols) * colWidth,
          y: 80 + Math.floor(idx / cols) * rowHeight,
          width: 250,
          height: 220
        });
      });

      // Map relationships
      (data.relationships || []).forEach((rel: any, idx: number) => {
        const src = elements.find(e => e.name === rel.sourceElementName);
        const tgt = elements.find(e => e.name === rel.targetElementName);
        if (src && tgt) {
          relationships.push({
            id: `rel_ai_${Date.now()}_${idx}`,
            type: rel.type || 'association',
            sourceId: src.id,
            targetId: tgt.id,
            name: rel.name,
            stereotype: rel.stereotype,
            sourceMultiplicity: rel.sourceMultiplicity,
            targetMultiplicity: rel.targetMultiplicity,
            sourceRole: rel.sourceRole,
            targetRole: rel.targetRole,
            docComment: rel.docComment
          });
        }
      });

      onApplyAiModel(elements, relationships, data.description || prompt);
      onClose();
    } catch (err: any) {
      setError(err.message || 'AI architect request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefactorPattern = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternName: selectedPattern,
          currentModel: {
            elements: project.elements,
            relationships: project.relationships
          }
        })
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to refactor model');
      }

      const data = json.data;
      // Merge refactored elements
      const newElements: UMLElement[] = [...project.elements];
      const newRelationships: UMLRelationship[] = [...project.relationships];

      (data.refactoredElements || []).forEach((el: any, idx: number) => {
        const existing = newElements.find(e => e.name === el.name);
        if (!existing) {
          const elemId = `elem_refactor_${Date.now()}_${idx}`;
          newElements.push({
            id: elemId,
            name: el.name,
            type: el.type || 'class',
            stereotype: el.stereotype,
            isAbstract: el.isAbstract,
            docComment: el.docComment,
            attributes: (el.attributes || []).map((a: any, ai: number) => ({
              id: `attr_${elemId}_${ai}`,
              name: a.name,
              type: a.type || 'string',
              visibility: a.visibility || 'public'
            })),
            operations: (el.operations || []).map((o: any, oi: number) => ({
              id: `op_${elemId}_${oi}`,
              name: o.name,
              returnType: o.returnType || 'void',
              visibility: o.visibility || 'public',
              parameters: (o.parameters || []).map((p: any, pi: number) => ({
                id: `p_${elemId}_${oi}_${pi}`,
                name: p.name,
                type: p.type || 'any'
              }))
            })),
            x: 100 + (newElements.length % 3) * 300,
            y: 100 + Math.floor(newElements.length / 3) * 280,
            width: 250,
            height: 220
          });
        }
      });

      (data.newRelationships || []).forEach((rel: any, idx: number) => {
        const src = newElements.find(e => e.name === rel.sourceElementName);
        const tgt = newElements.find(e => e.name === rel.targetElementName);
        if (src && tgt) {
          newRelationships.push({
            id: `rel_refactor_${Date.now()}_${idx}`,
            type: rel.type || 'association',
            sourceId: src.id,
            targetId: tgt.id,
            targetRole: rel.targetRole,
            targetMultiplicity: rel.targetMultiplicity
          });
        }
      });

      onApplyAiModel(newElements, newRelationships, data.explanation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Pattern refactoring failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Rational Rose AI Architect & Copilot
              </h2>
              <p className="text-[11px] text-slate-400">
                AI-assisted UML 2.5 modeling, architecture synthesis, and GoF pattern refactoring
              </p>
            </div>
          </div>

          <button
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 text-xs font-medium">
          <button
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              mode === 'architect'
                ? 'border-sky-400 text-sky-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMode('architect')}
          >
            Architect from Requirements
          </button>
          <button
            className={`py-2.5 px-4 border-b-2 transition-colors ${
              mode === 'refactor'
                ? 'border-sky-400 text-sky-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => setMode('refactor')}
          >
            Apply Design Pattern
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {mode === 'architect' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  System Requirements & Architectural Prompt:
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your system architecture (e.g. Distributed Cache system with LRU/LFU eviction policies, key-value store, replication manager, and snapshot serializer)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 font-sans focus:border-sky-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Sample Architecture Prompts:
                </span>
                <div className="space-y-1.5">
                  {PRESET_ARCHITECTURES.map((preset, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 transition-colors"
                      onClick={() => setPrompt(preset.prompt)}
                    >
                      <div className="font-semibold text-sky-300">{preset.title}</div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Select Design Pattern to Apply to Current Model:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GOF_PATTERNS.map((pattern) => (
                    <button
                      key={pattern}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedPattern === pattern
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                      onClick={() => setSelectedPattern(pattern)}
                    >
                      <span>{pattern}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-indigo-300 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  Pattern Refactoring Details
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  The AI Architect will analyze your {project.elements.length} active classes and introduce the appropriate interfaces, strategy dispatchers, factories, or observer hooks following strict UML 2.5 and TypeScript standards.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            className="px-4 py-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs font-medium"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg transition-colors disabled:opacity-50"
            onClick={mode === 'architect' ? handleGenerateArchitecture : handleRefactorPattern}
            disabled={loading || (mode === 'architect' && !prompt.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Architecting Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === 'architect' ? 'Synthesize UML Model' : 'Apply Pattern'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
