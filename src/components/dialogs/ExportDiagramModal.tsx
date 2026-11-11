import React, { useState } from 'react';
import { UMLProject } from '../../types/uml';
import { 
  Download, 
  X, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Layers,
  Settings2,
  Eye,
  Code2,
  BookOpen
} from 'lucide-react';

interface ExportDiagramModalProps {
  isOpen: boolean;
  project: UMLProject;
  onClose: () => void;
}

export type ExportFormat = 'mermaid_doc' | 'mermaid' | 'plantuml' | 'json';

export interface MermaidExportOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  includeNotes: boolean;
  includeMembers: boolean;
  includeMultiplicities: boolean;
  includeStereotypes: boolean;
  includeDictionaryTables: boolean;
}

export const ExportDiagramModal: React.FC<ExportDiagramModalProps> = ({
  isOpen,
  project,
  onClose
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<ExportFormat>('mermaid_doc');
  const [viewMode, setViewMode] = useState<'source' | 'preview'>('source');
  const [copied, setCopied] = useState(false);
  const [copiedDiagramOnly, setCopiedDiagramOnly] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

  // Mermaid Generation Configuration Options
  const [mermaidOptions, setMermaidOptions] = useState<MermaidExportOptions>({
    direction: 'TB',
    includeNotes: true,
    includeMembers: true,
    includeMultiplicities: true,
    includeStereotypes: true,
    includeDictionaryTables: true
  });

  // Generated contents
  const rawMermaidDiagram = generateMermaid(project, mermaidOptions);
  const mermaidDocContent = generateMermaidDocumentation(project, mermaidOptions, rawMermaidDiagram);
  const plantUMLContent = generatePlantUML(project);
  const jsonContent = JSON.stringify(project, null, 2);

  const activeContent = 
    format === 'mermaid_doc' ? mermaidDocContent :
    format === 'mermaid' ? rawMermaidDiagram :
    format === 'plantuml' ? plantUMLContent :
    jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDiagramOnly = () => {
    const snippet = `\`\`\`mermaid\n${rawMermaidDiagram}\n\`\`\``;
    navigator.clipboard.writeText(snippet);
    setCopiedDiagramOnly(true);
    setTimeout(() => setCopiedDiagramOnly(false), 2000);
  };

  const handleDownload = () => {
    let ext = 'md';
    let mimeType = 'text/markdown';
    if (format === 'mermaid') {
      ext = 'mmd';
      mimeType = 'text/vnd.mermaid';
    } else if (format === 'plantuml') {
      ext = 'puml';
      mimeType = 'text/plain';
    } else if (format === 'json') {
      ext = 'json';
      mimeType = 'application/json';
    }

    const blob = new Blob([activeContent], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${format}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isMermaid = format === 'mermaid' || format === 'mermaid_doc';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252526] border border-[#3F3F3F] rounded shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden text-[#D4D4D4]">
        {/* Header */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-b border-[#3F3F3F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Export UML Diagram & Documentation
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  UML 2.5
                </span>
              </h2>
              <p className="text-[11px] text-[#858585]">
                Convert current model to Mermaid.js diagram format, Markdown documentation, PlantUML, and JSON
              </p>
            </div>
          </div>

          <button
            className="p-1 rounded hover:bg-[#37373D] text-[#858585] hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between border-b border-[#3F3F3F] bg-[#1E1E1E] px-4 text-xs font-medium">
          <div className="flex overflow-x-auto">
            <button
              className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                format === 'mermaid_doc'
                  ? 'border-blue-500 text-white font-semibold bg-[#252526]'
                  : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
              }`}
              onClick={() => {
                setFormat('mermaid_doc');
              }}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Mermaid Documentation (.md)</span>
              <span className="text-[9px] px-1 py-0.2 bg-blue-500/30 text-blue-200 rounded font-mono">New</span>
            </button>

            <button
              className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                format === 'mermaid'
                  ? 'border-blue-500 text-white font-semibold bg-[#252526]'
                  : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
              }`}
              onClick={() => {
                setFormat('mermaid');
              }}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Mermaid Diagram (.mmd)</span>
            </button>

            <button
              className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                format === 'plantuml'
                  ? 'border-blue-500 text-white font-semibold bg-[#252526]'
                  : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
              }`}
              onClick={() => {
                setFormat('plantuml');
                setViewMode('source');
              }}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>PlantUML (.puml)</span>
            </button>

            <button
              className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                format === 'json'
                  ? 'border-blue-500 text-white font-semibold bg-[#252526]'
                  : 'border-transparent text-[#858585] hover:text-[#D4D4D4]'
              }`}
              onClick={() => {
                setFormat('json');
                setViewMode('source');
              }}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Project JSON (.json)</span>
            </button>
          </div>

          {/* Right toggle controls */}
          <div className="flex items-center gap-1.5 py-1.5">
            {format === 'mermaid_doc' && (
              <div className="flex items-center bg-[#252526] border border-[#3F3F3F] rounded p-0.5 mr-1">
                <button
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
                    viewMode === 'source' ? 'bg-[#37373D] text-white font-medium' : 'text-[#858585] hover:text-[#D4D4D4]'
                  }`}
                  onClick={() => setViewMode('source')}
                  title="View Raw Markdown / Code"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Source</span>
                </button>
                <button
                  className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors ${
                    viewMode === 'preview' ? 'bg-blue-600 text-white font-medium' : 'text-[#858585] hover:text-[#D4D4D4]'
                  }`}
                  onClick={() => setViewMode('preview')}
                  title="View Formatted Documentation Preview"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            )}

            {isMermaid && (
              <button
                className={`p-1.5 rounded transition-colors text-xs flex items-center gap-1 ${
                  showOptions ? 'bg-[#37373D] text-white' : 'hover:bg-[#37373D] text-[#858585] hover:text-white'
                }`}
                onClick={() => setShowOptions(!showOptions)}
                title="Mermaid Export Options"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </button>
            )}
          </div>
        </div>

        {/* Mermaid Customization Options Bar */}
        {isMermaid && showOptions && (
          <div className="p-3 bg-[#1E1E1E] border-b border-[#3F3F3F] text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">
                Diagram Direction
              </label>
              <select
                value={mermaidOptions.direction}
                onChange={(e) => setMermaidOptions({ ...mermaidOptions, direction: e.target.value as any })}
                className="w-full bg-[#252526] border border-[#3F3F3F] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="TB">Top to Bottom (TB)</option>
                <option value="LR">Left to Right (LR)</option>
                <option value="BT">Bottom to Top (BT)</option>
                <option value="RL">Right to Left (RL)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">
                Model Annotations
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mermaidOptions.includeNotes}
                    onChange={(e) => setMermaidOptions({ ...mermaidOptions, includeNotes: e.target.checked })}
                    className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#252526]"
                  />
                  <span className="text-[11px] text-[#D4D4D4]">Doc Comments as Notes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mermaidOptions.includeStereotypes}
                    onChange={(e) => setMermaidOptions({ ...mermaidOptions, includeStereotypes: e.target.checked })}
                    className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#252526]"
                  />
                  <span className="text-[11px] text-[#D4D4D4]">Stereotypes & Interfaces</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">
                Class Members
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mermaidOptions.includeMembers}
                    onChange={(e) => setMermaidOptions({ ...mermaidOptions, includeMembers: e.target.checked })}
                    className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#252526]"
                  />
                  <span className="text-[11px] text-[#D4D4D4]">Attributes & Operations</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mermaidOptions.includeMultiplicities}
                    onChange={(e) => setMermaidOptions({ ...mermaidOptions, includeMultiplicities: e.target.checked })}
                    className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#252526]"
                  />
                  <span className="text-[11px] text-[#D4D4D4]">Multiplicities & Labels</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">
                Documentation Details
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mermaidOptions.includeDictionaryTables}
                    onChange={(e) => setMermaidOptions({ ...mermaidOptions, includeDictionaryTables: e.target.checked })}
                    className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#252526]"
                  />
                  <span className="text-[11px] text-[#D4D4D4]">Data Dictionary Tables</span>
                </label>
                <span className="text-[10px] text-[#858585] block">
                  Optimized for GitHub & Obsidian
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 flex-1 overflow-auto bg-[#1E1E1E]">
          {viewMode === 'source' ? (
            <pre className="text-[#D4D4D4] font-mono text-xs whitespace-pre leading-relaxed select-text">
              {activeContent}
            </pre>
          ) : (
            <DocumentationPreview 
              project={project} 
              rawMermaid={rawMermaidDiagram} 
              options={mermaidOptions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#1E1E1E] border-t border-[#3F3F3F] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-[#858585] font-mono">
            <span>{activeContent.split('\n').length} lines</span>
            <span>•</span>
            <span>{project.elements.length} Elements</span>
            <span>•</span>
            <span>{project.relationships.length} Relationships</span>
          </div>

          <div className="flex items-center gap-2">
            {isMermaid && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#37373D] hover:bg-[#45454c] text-white text-xs font-medium transition-colors border border-[#3F3F3F]"
                onClick={handleCopyDiagramOnly}
                title="Copy only the ```mermaid ... ``` code snippet for README/Markdown"
              >
                {copiedDiagramOnly ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                <span>{copiedDiagramOnly ? 'Copied Snippet!' : 'Copy Mermaid Block'}</span>
              </button>
            )}

            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#37373D] hover:bg-[#45454c] text-white text-xs font-medium transition-colors border border-[#3F3F3F]"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#858585]" />}
              <span>{copied ? 'Copied All!' : 'Copy File Content'}</span>
            </button>

            <button
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                Download {format === 'mermaid_doc' ? '.md' : format === 'mermaid' ? '.mmd' : format === 'plantuml' ? '.puml' : '.json'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Formats TypeScript/generic types to conform to Mermaid's tilde syntax for generics (e.g. Promise~string~)
function formatTypeForMermaid(typeStr: string): string {
  if (!typeStr) return 'void';
  return typeStr
    .replace(/</g, '~')
    .replace(/>/g, '~')
    .replace(/\s+/g, ' ');
}

// Generate pure Mermaid classDiagram syntax
export function generateMermaid(project: UMLProject, options: MermaidExportOptions): string {
  const lines: string[] = ['classDiagram'];
  
  if (options.direction) {
    lines.push(`  direction ${options.direction}`);
  }
  lines.push('');

  for (const el of project.elements) {
    const sanitizedName = el.name.replace(/\s+/g, '_');
    lines.push(`  class ${sanitizedName} {`);

    if (options.includeStereotypes) {
      if (el.type === 'interface') {
        lines.push('    <<interface>>');
      } else if (el.type === 'enum') {
        lines.push('    <<enumeration>>');
      } else if (el.type === 'typeAlias') {
        lines.push('    <<typeAlias>>');
      } else if (el.isAbstract) {
        lines.push('    <<abstract>>');
      } else if (el.stereotype) {
        lines.push(`    <<${el.stereotype}>>`);
      }
    }

    if (options.includeMembers) {
      if (el.type === 'enum' && el.enumLiterals && el.enumLiterals.length > 0) {
        for (const lit of el.enumLiterals) {
          const val = lit.value !== undefined ? ` = ${lit.value}` : '';
          lines.push(`    ${lit.name}${val}`);
        }
      } else if (el.type === 'typeAlias' && el.typeDefinition) {
        lines.push(`    ${formatTypeForMermaid(el.typeDefinition)}`);
      } else {
        // Attributes
        for (const attr of el.attributes || []) {
          const vis = attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '~';
          const staticFlag = attr.isStatic ? '$' : '';
          const cleanType = formatTypeForMermaid(attr.type);
          lines.push(`    ${vis}${cleanType} ${attr.name}${staticFlag}`);
        }

        // Operations
        for (const op of el.operations || []) {
          const vis = op.visibility === 'public' ? '+' : op.visibility === 'private' ? '-' : op.visibility === 'protected' ? '#' : '~';
          const staticFlag = op.isStatic ? '$' : '';
          const abstractFlag = op.isAbstract ? '*' : '';
          const params = (op.parameters || []).map(p => `${p.name}: ${formatTypeForMermaid(p.type)}`).join(', ');
          const returnType = formatTypeForMermaid(op.returnType || 'void');
          lines.push(`    ${vis}${op.name}(${params})${abstractFlag}${staticFlag} ${returnType}`);
        }
      }
    }

    lines.push('  }');

    // Optional doc note for class
    if (options.includeNotes && el.docComment) {
      const cleanComment = el.docComment.replace(/"/g, "'").replace(/\n/g, ' ');
      lines.push(`  note for ${sanitizedName} "${cleanComment}"`);
    }

    lines.push('');
  }

  // Connectors / Relationships
  for (const rel of project.relationships) {
    const src = project.elements.find(e => e.id === rel.sourceId);
    const tgt = project.elements.find(e => e.id === rel.targetId);
    if (!src || !tgt) continue;

    const srcName = src.name.replace(/\s+/g, '_');
    const tgtName = tgt.name.replace(/\s+/g, '_');

    const srcMult = (options.includeMultiplicities && rel.sourceMultiplicity) ? `"${rel.sourceMultiplicity}" ` : '';
    const tgtMult = (options.includeMultiplicities && rel.targetMultiplicity) ? ` "${rel.targetMultiplicity}"` : '';

    let label = '';
    if (rel.name) {
      label = ` : ${rel.name}`;
    } else if (rel.stereotype) {
      label = ` : <<${rel.stereotype}>>`;
    }

    switch (rel.type) {
      case 'generalization':
        // Child extends Parent: Parent <|-- Child
        lines.push(`  ${tgtName} <|-- ${srcName}${label || ' : extends'}`);
        break;
      case 'realization':
        // Class implements Interface: Interface <|.. Class
        lines.push(`  ${tgtName} <|.. ${srcName}${label || ' : implements'}`);
        break;
      case 'composition':
        lines.push(`  ${srcName} ${srcMult}*--${tgtMult} ${tgtName}${label}`);
        break;
      case 'aggregation':
        lines.push(`  ${srcName} ${srcMult}o--${tgtMult} ${tgtName}${label}`);
        break;
      case 'dependency':
        lines.push(`  ${srcName} ..> ${tgtName}${label || ' : «use»'}`);
        break;
      case 'directed_association':
        lines.push(`  ${srcName} ${srcMult}-->${tgtMult} ${tgtName}${label}`);
        break;
      case 'association':
      default:
        lines.push(`  ${srcName} ${srcMult}--${tgtMult} ${tgtName}${label}`);
        break;
    }
  }

  return lines.join('\n');
}

// Generate comprehensive Markdown documentation with embedded Mermaid diagram & data dictionary
export function generateMermaidDocumentation(
  project: UMLProject, 
  options: MermaidExportOptions,
  mermaidCode: string
): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const classes = project.elements.filter(e => e.type === 'class');
  const interfaces = project.elements.filter(e => e.type === 'interface');
  const enums = project.elements.filter(e => e.type === 'enum');
  const typeAliases = project.elements.filter(e => e.type === 'typeAlias');

  const lines: string[] = [];

  lines.push(`# Architecture & Domain Model: ${project.name}`);
  lines.push('');
  lines.push(`> **Version**: ${project.version || '1.0.0'} | **Generated**: ${dateStr} | **Target**: TypeScript / Node.js`);
  if (project.description) {
    lines.push(`> ${project.description}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // 1. Architecture Diagram
  lines.push('## 1. Class Diagram');
  lines.push('');
  lines.push('Below is the visual UML class diagram rendered using Mermaid.js:');
  lines.push('');
  lines.push('```mermaid');
  lines.push(mermaidCode);
  lines.push('```');
  lines.push('');

  // 2. Metamodel Overview Summary
  lines.push('## 2. Metamodel Overview');
  lines.push('');
  lines.push('| Metric | Count | Details |');
  lines.push('| :--- | :---: | :--- |');
  lines.push(`| **Classes** | \`${classes.length}\` | Concrete and abstract class entities |`);
  lines.push(`| **Interfaces** | \`${interfaces.length}\` | Contract boundaries and service interfaces |`);
  lines.push(`| **Enumerations** | \`${enums.length}\` | Finite domain value sets |`);
  lines.push(`| **Type Aliases** | \`${typeAliases.length}\` | Structural types and union aliases |`);
  lines.push(`| **Relationships** | \`${project.relationships.length}\` | Associations, composition, and inheritance links |`);
  lines.push('');

  // 3. Data Dictionary
  if (options.includeDictionaryTables && project.elements.length > 0) {
    lines.push('## 3. Element Specifications & Data Dictionary');
    lines.push('');

    for (const el of project.elements) {
      lines.push(`### \`${el.name}\``);
      lines.push(`- **Type**: \`${el.type}\``);
      if (el.stereotype) lines.push(`- **Stereotype**: \`<<${el.stereotype}>>\``);
      if (el.isAbstract) lines.push(`- **Abstract**: \`true\``);
      if (el.docComment) lines.push(`- **Description**: ${el.docComment}`);
      lines.push('');

      // Attributes Table
      if (el.attributes && el.attributes.length > 0) {
        lines.push('#### Attributes');
        lines.push('');
        lines.push('| Visibility | Name | Type | Modifiers | Description |');
        lines.push('| :--- | :--- | :--- | :--- | :--- |');
        for (const attr of el.attributes) {
          const vis = attr.visibility === 'public' ? '`+` public' : attr.visibility === 'private' ? '`-` private' : attr.visibility === 'protected' ? '`#` protected' : '`~` package';
          const mods = [attr.isReadonly ? 'readonly' : '', attr.isStatic ? 'static' : '', attr.isOptional ? 'optional' : ''].filter(Boolean).join(', ') || '-';
          lines.push(`| ${vis} | \`${attr.name}\` | \`${attr.type}\` | ${mods} | ${attr.docComment || '-'} |`);
        }
        lines.push('');
      }

      // Operations Table
      if (el.operations && el.operations.length > 0) {
        lines.push('#### Operations');
        lines.push('');
        lines.push('| Visibility | Method Signature | Return Type | Modifiers | Description |');
        lines.push('| :--- | :--- | :--- | :--- | :--- |');
        for (const op of el.operations) {
          const vis = op.visibility === 'public' ? '`+` public' : op.visibility === 'private' ? '`-` private' : op.visibility === 'protected' ? '`#` protected' : '`~` package';
          const params = (op.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ');
          const mods = [op.isAsync ? 'async' : '', op.isStatic ? 'static' : '', op.isAbstract ? 'abstract' : ''].filter(Boolean).join(', ') || '-';
          lines.push(`| ${vis} | \`${op.name}(${params})\` | \`${op.returnType}\` | ${mods} | ${op.docComment || '-'} |`);
        }
        lines.push('');
      }

      // Enum Literals
      if (el.type === 'enum' && el.enumLiterals && el.enumLiterals.length > 0) {
        lines.push('#### Enumeration Literals');
        lines.push('');
        lines.push('| Literal Name | Value | Description |');
        lines.push('| :--- | :--- | :--- |');
        for (const lit of el.enumLiterals) {
          lines.push(`| \`${lit.name}\` | \`${lit.value ?? lit.name}\` | ${lit.docComment || '-'} |`);
        }
        lines.push('');
      }

      // Type alias definition
      if (el.type === 'typeAlias' && el.typeDefinition) {
        lines.push('#### Type Definition');
        lines.push('```typescript');
        lines.push(`type ${el.name} = ${el.typeDefinition};`);
        lines.push('```');
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  // 4. Relationships Matrix
  if (project.relationships.length > 0) {
    lines.push('## 4. Relationship Matrix');
    lines.push('');
    lines.push('| Source Element | Target Element | Relationship Type | Multiplicity | Name / Stereotype |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    for (const rel of project.relationships) {
      const src = project.elements.find(e => e.id === rel.sourceId);
      const tgt = project.elements.find(e => e.id === rel.targetId);
      if (!src || !tgt) continue;

      const mult = `${rel.sourceMultiplicity || '1'} : ${rel.targetMultiplicity || '1'}`;
      const name = rel.name || rel.stereotype || '-';
      lines.push(`| \`${src.name}\` | \`${tgt.name}\` | \`${rel.type}\` | ${mult} | ${name} |`);
    }
    lines.push('');
  }

  lines.push('## 5. Documentation Usage');
  lines.push('');
  lines.push('- **GitHub / GitLab**: This markdown file will automatically render the interactive Mermaid diagram on your repository pages.');
  lines.push('- **Obsidian / Notion**: Paste this markdown into any Mermaid-compatible knowledge base.');
  lines.push('- **VS Code**: Use Markdown Preview Mermaid Support extension for live desktop rendering.');

  return lines.join('\n');
}

// Visual rendered preview of the documentation for interactive verification
const DocumentationPreview: React.FC<{
  project: UMLProject;
  rawMermaid: string;
  options: MermaidExportOptions;
}> = ({ project, rawMermaid, options }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 text-xs text-[#D4D4D4] py-2">
      <div className="border-b border-[#3F3F3F] pb-4">
        <h1 className="text-xl font-bold text-white mb-1">
          Architecture & Domain Model: {project.name}
        </h1>
        <p className="text-sm text-[#858585]">
          Version {project.version || '1.0.0'} • Generated from UML 2.5 Metamodel
        </p>
        {project.description && (
          <p className="text-xs text-blue-300 mt-2 bg-blue-950/20 border border-blue-900/40 p-2.5 rounded">
            {project.description}
          </p>
        )}
      </div>

      {/* Embedded Diagram Block */}
      <div className="bg-[#252526] border border-[#3F3F3F] rounded p-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#3F3F3F] mb-3">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
            <Code2 className="w-4 h-4" />
            <span>Mermaid.js Diagram Block</span>
          </div>
          <span className="text-[10px] font-mono text-[#858585]">
            Direction: {options.direction}
          </span>
        </div>
        <pre className="bg-[#1E1E1E] p-3 rounded text-[11px] font-mono text-blue-200 overflow-x-auto border border-[#3F3F3F]/60">
          {rawMermaid}
        </pre>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#252526] border border-[#3F3F3F] rounded">
          <div className="text-[10px] uppercase text-[#858585] font-semibold">Classes</div>
          <div className="text-lg font-bold text-white mt-0.5">
            {project.elements.filter(e => e.type === 'class').length}
          </div>
        </div>
        <div className="p-3 bg-[#252526] border border-[#3F3F3F] rounded">
          <div className="text-[10px] uppercase text-[#858585] font-semibold">Interfaces</div>
          <div className="text-lg font-bold text-purple-400 mt-0.5">
            {project.elements.filter(e => e.type === 'interface').length}
          </div>
        </div>
        <div className="p-3 bg-[#252526] border border-[#3F3F3F] rounded">
          <div className="text-[10px] uppercase text-[#858585] font-semibold">Enums</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">
            {project.elements.filter(e => e.type === 'enum').length}
          </div>
        </div>
        <div className="p-3 bg-[#252526] border border-[#3F3F3F] rounded">
          <div className="text-[10px] uppercase text-[#858585] font-semibold">Relationships</div>
          <div className="text-lg font-bold text-green-400 mt-0.5">
            {project.relationships.length}
          </div>
        </div>
      </div>

      {/* Element Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white border-b border-[#3F3F3F] pb-2">
          Element Specifications & Data Dictionary
        </h2>

        {project.elements.map((el) => (
          <div key={el.id} className="bg-[#252526] border border-[#3F3F3F] rounded p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs font-mono">{el.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#37373D] text-blue-300 font-mono">
                  {el.type}
                </span>
                {el.stereotype && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/60 text-purple-300 font-mono">
                    «{el.stereotype}»
                  </span>
                )}
              </div>
            </div>

            {el.docComment && (
              <p className="text-[11px] text-[#858585] italic">
                {el.docComment}
              </p>
            )}

            {el.attributes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-[#858585] mb-1">Attributes</div>
                <div className="space-y-1">
                  {el.attributes.map((attr) => (
                    <div key={attr.id} className="text-[11px] font-mono flex items-center justify-between bg-[#1E1E1E] px-2 py-1 rounded">
                      <span className="text-white">
                        <span className="text-[#858585] mr-1.5">{attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#'}</span>
                        {attr.name}
                      </span>
                      <span className="text-blue-300">{attr.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {el.operations.length > 0 && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-[#858585] mb-1">Operations</div>
                <div className="space-y-1">
                  {el.operations.map((op) => (
                    <div key={op.id} className="text-[11px] font-mono flex items-center justify-between bg-[#1E1E1E] px-2 py-1 rounded">
                      <span className="text-white">
                        <span className="text-[#858585] mr-1.5">{op.visibility === 'public' ? '+' : op.visibility === 'private' ? '-' : '#'}</span>
                        {op.name}({op.parameters.map(p => `${p.name}: ${p.type}`).join(', ')})
                      </span>
                      <span className="text-green-300">{op.returnType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// PlantUML Generator
function generatePlantUML(project: UMLProject): string {
  const lines: string[] = ['@startuml', `' ${project.name}`, 'skinparam classAttributeIconSize 0', ''];

  for (const el of project.elements) {
    if (el.type === 'interface') {
      lines.push(`interface ${el.name} {`);
    } else if (el.type === 'enum') {
      lines.push(`enum ${el.name} {`);
      for (const lit of el.enumLiterals || []) {
        lines.push(`  ${lit.name}`);
      }
    } else {
      lines.push(`${el.isAbstract ? 'abstract ' : ''}class ${el.name} ${el.stereotype ? `<<${el.stereotype}>>` : ''} {`);
    }

    if (el.type !== 'enum') {
      for (const attr of el.attributes) {
        const vis = attr.visibility === 'public' ? '+' : attr.visibility === 'private' ? '-' : '#';
        lines.push(`  ${vis}${attr.name}: ${attr.type}`);
      }
      for (const op of el.operations) {
        const vis = op.visibility === 'public' ? '+' : op.visibility === 'private' ? '-' : '#';
        const params = op.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
        lines.push(`  ${vis}${op.name}(${params}): ${op.returnType}`);
      }
    }

    lines.push('}');
    lines.push('');
  }

  for (const rel of project.relationships) {
    const src = project.elements.find(e => e.id === rel.sourceId);
    const tgt = project.elements.find(e => e.id === rel.targetId);
    if (!src || !tgt) continue;

    let arrow = '--';
    if (rel.type === 'generalization') arrow = '<|--';
    if (rel.type === 'realization') arrow = '<|..';
    if (rel.type === 'composition') arrow = '*--';
    if (rel.type === 'aggregation') arrow = 'o--';
    if (rel.type === 'directed_association') arrow = '-->';
    if (rel.type === 'dependency') arrow = '..>';

    lines.push(`${src.name} ${arrow} ${tgt.name} ${rel.stereotype ? `: <<${rel.stereotype}>>` : ''}`);
  }

  lines.push('@enduml');
  return lines.join('\n');
}
