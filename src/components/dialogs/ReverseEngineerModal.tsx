import React, { useState } from 'react';
import { TypeScriptReverseEngineer } from '../../engine/reverseEngineer';
import { UMLElement, UMLRelationship } from '../../types/uml';
import { 
  RotateCcw, 
  X, 
  Code2, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle,
  FileCode
} from 'lucide-react';

interface ReverseEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (elements: UMLElement[], relationships: UMLRelationship[]) => void;
}

const SAMPLE_TS_SNIPPET = `// User Authentication & RBAC Domain
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  DEVELOPER = "DEVELOPER",
  GUEST = "GUEST"
}

export interface IAuthenticatable {
  readonly id: string;
  email: string;
  verifyPassword(attempt: string): Promise<boolean>;
  getRoles(): UserRole[];
}

export abstract class BaseAccount implements IAuthenticatable {
  public readonly id: string;
  public email: string;
  protected passwordHash: string;
  public isActive: boolean = true;
  public createdAt: Date;

  abstract verifyPassword(attempt: string): Promise<boolean>;
  abstract getRoles(): UserRole[];
}

export class User extends BaseAccount {
  public firstName: string;
  public lastName: string;
  private roles: UserRole[] = [];
  public lastLoginAt?: Date;

  public async verifyPassword(attempt: string): Promise<boolean> {
    return true;
  }

  public getRoles(): UserRole[] {
    return this.roles;
  }

  public addRole(role: UserRole): void {
    this.roles.push(role);
  }
}

export interface ITokenService {
  generateToken(user: User): string;
  validateToken(token: string): boolean;
}
`;

export const ReverseEngineerModal: React.FC<ReverseEngineerModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState(SAMPLE_TS_SNIPPET);
  const [parseResult, setParseResult] = useState<{
    elementCount: number;
    relCount: number;
    errors: string[];
  } | null>(null);

  const handleReverseEngineer = () => {
    const parser = new TypeScriptReverseEngineer();
    const result = parser.parseTypeScript(code);

    if (result.elements.length > 0) {
      onImport(result.elements, result.relationships);
      onClose();
    } else {
      setParseResult({
        elementCount: 0,
        relCount: 0,
        errors: result.errors.length > 0 ? result.errors : ['No valid classes, interfaces, or enums detected in code.']
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setCode(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Reverse Engineer TypeScript to UML 2.5
              </h2>
              <p className="text-[11px] text-slate-400">
                Extract UML classes, interfaces, inheritance, and relationships from source code
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

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Paste TypeScript Source Code:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer border border-slate-700 text-[11px]">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .ts File</span>
                <input
                  type="file"
                  accept=".ts,.tsx,.js"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                className="text-sky-400 hover:underline text-[11px]"
                onClick={() => setCode(SAMPLE_TS_SNIPPET)}
              >
                Reset Example
              </button>
            </div>
          </div>

          <textarea
            rows={12}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste TypeScript code containing classes, interfaces, enums, types..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono-code text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
          />

          {parseResult && parseResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reverse Engineering Warning:</p>
                <ul className="list-disc list-inside text-[11px] mt-1 space-y-0.5">
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            className="px-4 py-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-colors"
            onClick={handleReverseEngineer}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Generate UML Model</span>
          </button>
        </div>
      </div>
    </div>
  );
};
