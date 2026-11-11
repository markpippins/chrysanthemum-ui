import React, { useState, useMemo } from 'react';
import { UMLProject, GeneratedFile, CodeGenConfig } from '../../types/uml';
import { TypeScriptCodeGenerator } from '../../engine/codeGenerator';
import JSZip from 'jszip';
import { 
  Code2, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Settings2, 
  RefreshCw, 
  FolderTree, 
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface CodeGenPanelProps {
  project: UMLProject;
  onUpdateConfig: (config: CodeGenConfig) => void;
}

export const CodeGenPanel: React.FC<CodeGenPanelProps> = ({
  project,
  onUpdateConfig
}) => {
  const [selectedFilepath, setSelectedFilepath] = useState<string>('src/index.ts');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Generate code files dynamically based on current project state and config
  const generatedFiles: GeneratedFile[] = useMemo(() => {
    const generator = new TypeScriptCodeGenerator(project);
    return generator.generateAll();
  }, [project]);

  // Set active file default if selected is missing
  const activeFile = useMemo(() => {
    return generatedFiles.find(f => f.filepath === selectedFilepath) || generatedFiles[0];
  }, [generatedFiles, selectedFilepath]);

  // Handle Copy to Clipboard
  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Download Project ZIP Archive
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add tsconfig.json
      const tsconfigContent = JSON.stringify({
        compilerOptions: {
          target: project.codeGenConfig.target || 'ES2022',
          module: project.codeGenConfig.moduleSystem === 'CommonJS' ? 'CommonJS' : 'ESNext',
          moduleResolution: 'bundler',
          strict: project.codeGenConfig.strictNullChecks,
          experimentalDecorators: project.codeGenConfig.useDecorators,
          emitDecoratorMetadata: project.codeGenConfig.useDecorators,
          declaration: true,
          outDir: './dist'
        },
        include: ['src/**/*']
      }, null, 2);

      zip.file('tsconfig.json', tsconfigContent);

      // Add package.json
      const packageJsonContent = JSON.stringify({
        name: project.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        version: project.version || '1.0.0',
        description: project.description || 'Generated from Rational Rose UML 2.5',
        type: project.codeGenConfig.moduleSystem === 'CommonJS' ? 'commonjs' : 'module',
        scripts: {
          build: 'tsc'
        },
        devDependencies: {
          typescript: '^5.8.2'
        }
      }, null, 2);

      zip.file('package.json', packageJsonContent);

      // Add all generated TypeScript source files in /src
      const srcFolder = zip.folder('src');
      for (const file of generatedFiles) {
        const cleanName = file.filename;
        srcFolder?.file(cleanName, file.content);
      }

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_TypeScript.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#D4D4D4] border-l border-[#3F3F3F]">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-[#252526] border-b border-[#3F3F3F] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Code Generator</span>
          <span className="px-1.5 py-0.5 rounded bg-[#37373D] text-blue-300 text-[10px] font-mono font-medium border border-[#3F3F3F]">
            {generatedFiles.length} files
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            title="CodeGen Settings"
            className={`p-1.5 rounded transition-colors ${
              showSettings ? 'bg-blue-600 text-white' : 'hover:bg-[#37373D] text-[#858585] hover:text-white'
            }`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            title="Copy Current File Code"
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#37373D] hover:bg-[#45454c] text-white border border-[#3F3F3F] transition-colors font-medium"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#858585]" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            title="Download Complete TypeScript Project as ZIP"
            className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow transition-colors"
            onClick={handleDownloadZip}
            disabled={isZipping}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Zipping...' : 'Export ZIP'}</span>
          </button>
        </div>
      </div>

      {/* CodeGen Configuration Popdown Drawer */}
      {showSettings && (
        <div className="p-3 bg-[#252526] border-b border-[#3F3F3F] grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">Module Format</label>
            <select
              value={project.codeGenConfig.moduleSystem}
              onChange={(e) => onUpdateConfig({ ...project.codeGenConfig, moduleSystem: e.target.value as any })}
              className="w-full bg-[#1E1E1E] border border-[#3F3F3F] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ESM">ES Modules (import / export)</option>
              <option value="CommonJS">CommonJS (require / module.exports)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#858585] block mb-1">Target Language</label>
            <select
              value={project.codeGenConfig.target}
              onChange={(e) => onUpdateConfig({ ...project.codeGenConfig, target: e.target.value as any })}
              className="w-full bg-[#1E1E1E] border border-[#3F3F3F] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ES2022">ES2022 (Modern Node / Browser)</option>
              <option value="ESNext">ESNext</option>
              <option value="ES2015">ES2015 / ES6</option>
            </select>
          </div>

          <div className="flex flex-col justify-center space-y-1 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={project.codeGenConfig.generateGettersSetters}
                onChange={(e) => onUpdateConfig({ ...project.codeGenConfig, generateGettersSetters: e.target.checked })}
                className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#1E1E1E]"
              />
              <span className="text-[11px] text-[#D4D4D4]">Generate Getters / Setters</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={project.codeGenConfig.generateJSDoc}
                onChange={(e) => onUpdateConfig({ ...project.codeGenConfig, generateJSDoc: e.target.checked })}
                className="rounded border-[#3F3F3F] text-blue-500 focus:ring-0 bg-[#1E1E1E]"
              />
              <span className="text-[11px] text-[#D4D4D4]">Include JSDoc Annotations</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Code View Split: File Explorer tabs on top + Code Content */}
      <div className="flex items-center gap-1 px-2.5 py-1 bg-[#252526] border-b border-[#3F3F3F] overflow-x-auto">
        {generatedFiles.map((file) => {
          const isActive = activeFile?.filepath === file.filepath;
          return (
            <button
              key={file.filepath}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#1E1E1E] text-white border-b-2 border-b-blue-500 font-medium'
                  : 'text-[#858585] hover:bg-[#37373D] hover:text-white'
              }`}
              onClick={() => setSelectedFilepath(file.filepath)}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>{file.filename}</span>
            </button>
          );
        })}
      </div>

      {/* Code Editor / Syntax Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-[#1E1E1E] font-mono text-xs leading-relaxed selection:bg-blue-600/40">
        {activeFile ? (
          <pre className="text-[#D4D4D4] whitespace-pre">
            {activeFile.content}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#858585]">
            <Code2 className="w-8 h-8 mb-2 opacity-40" />
            <p>Select or create UML elements to generate code</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-1.5 bg-[#252526] border-t border-[#3F3F3F] flex items-center justify-between text-[11px] text-[#858585] font-mono">
        <span>Active File: {activeFile?.filepath || 'none'}</span>
        <span className="text-blue-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live Model Synchronized
        </span>
      </div>
    </div>
  );
};
