import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Lazy initialize Gemini AI client
  let aiClient: GoogleGenAI | null = null;
  function getAI(): GoogleGenAI {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', tool: 'Rational Rose TypeScript UML 2.5' });
  });

  // AI Architecture Designer - Natural Language to UML 2.5 Architecture
  app.post('/api/ai/architect', async (req, res) => {
    try {
      const { prompt, existingElements } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const ai = getAI();
      const systemInstruction = `You are Rational Rose AI Architect, an expert enterprise software architect specializing in UML 2.5 and modern TypeScript object-oriented and domain-driven design.
Generate a structured UML 2.5 model in JSON format with clean classes, interfaces, enums, type aliases, attributes (with visibility, type, optionality), methods (with typed parameters and return types), and relationships (generalization, realization, association, composition, aggregation, dependency).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Design a comprehensive UML 2.5 model for the following system requirement in TypeScript:
"${prompt}"

Ensure realistic TypeScript types (string, number, boolean, Date, interfaces, generic types, Promise<T>).
Include relevant GoF design patterns, DDD entities/value objects/repositories/services where appropriate.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              description: { type: Type.STRING },
              elements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'class, interface, enum, or typeAlias' },
                    stereotype: { type: Type.STRING },
                    isAbstract: { type: Type.BOOLEAN },
                    typeParameters: { type: Type.STRING },
                    typeDefinition: { type: Type.STRING },
                    docComment: { type: Type.STRING },
                    decorators: { type: Type.ARRAY, items: { type: Type.STRING } },
                    attributes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          visibility: { type: Type.STRING, description: 'public, private, or protected' },
                          defaultValue: { type: Type.STRING },
                          isReadonly: { type: Type.BOOLEAN },
                          isStatic: { type: Type.BOOLEAN },
                          isOptional: { type: Type.BOOLEAN },
                          docComment: { type: Type.STRING },
                        },
                        required: ['name', 'type', 'visibility']
                      }
                    },
                    operations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          returnType: { type: Type.STRING },
                          visibility: { type: Type.STRING, description: 'public, private, or protected' },
                          isAbstract: { type: Type.BOOLEAN },
                          isStatic: { type: Type.BOOLEAN },
                          isAsync: { type: Type.BOOLEAN },
                          docComment: { type: Type.STRING },
                          parameters: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING },
                                isOptional: { type: Type.BOOLEAN },
                                defaultValue: { type: Type.STRING }
                              },
                              required: ['name', 'type']
                            }
                          }
                        },
                        required: ['name', 'returnType', 'visibility']
                      }
                    },
                    enumLiterals: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          value: { type: Type.STRING },
                          docComment: { type: Type.STRING }
                        },
                        required: ['name']
                      }
                    }
                  },
                  required: ['name', 'type']
                }
              },
              relationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: 'generalization, realization, association, composition, aggregation, or dependency' },
                    sourceElementName: { type: Type.STRING },
                    targetElementName: { type: Type.STRING },
                    name: { type: Type.STRING },
                    stereotype: { type: Type.STRING },
                    sourceMultiplicity: { type: Type.STRING },
                    targetMultiplicity: { type: Type.STRING },
                    sourceRole: { type: Type.STRING },
                    targetRole: { type: Type.STRING },
                    docComment: { type: Type.STRING }
                  },
                  required: ['type', 'sourceElementName', 'targetElementName']
                }
              }
            },
            required: ['projectName', 'description', 'elements', 'relationships']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/ai/architect:', error);
      res.status(500).json({ error: error.message || 'Failed to generate UML model' });
    }
  });

  // AI Design Pattern Refactorer
  app.post('/api/ai/refactor', async (req, res) => {
    try {
      const { patternName, currentModel } = req.body;
      if (!patternName || !currentModel) {
        return res.status(400).json({ error: 'patternName and currentModel are required' });
      }

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `You are Rational Rose Design Pattern Refactoring Assistant.
Apply the "${patternName}" pattern to the following TypeScript UML 2.5 model:
${JSON.stringify(currentModel, null, 2)}

Return the refactored or updated UML elements and relationships adhering to strict Gang of Four principles.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              refactoredElements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    stereotype: { type: Type.STRING },
                    isAbstract: { type: Type.BOOLEAN },
                    docComment: { type: Type.STRING },
                    attributes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          visibility: { type: Type.STRING }
                        },
                        required: ['name', 'type', 'visibility']
                      }
                    },
                    operations: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          returnType: { type: Type.STRING },
                          visibility: { type: Type.STRING },
                          parameters: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING }
                              },
                              required: ['name', 'type']
                            }
                          }
                        },
                        required: ['name', 'returnType', 'visibility']
                      }
                    }
                  },
                  required: ['name', 'type']
                }
              },
              newRelationships: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    sourceElementName: { type: Type.STRING },
                    targetElementName: { type: Type.STRING },
                    targetRole: { type: Type.STRING },
                    targetMultiplicity: { type: Type.STRING }
                  },
                  required: ['type', 'sourceElementName', 'targetElementName']
                }
              }
            },
            required: ['explanation', 'refactoredElements', 'newRelationships']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error('Error in /api/ai/refactor:', error);
      res.status(500).json({ error: error.message || 'Failed to refactor UML model' });
    }
  });

  // AI Architecture Documentation Generator
  app.post('/api/ai/doc-gen', async (req, res) => {
    try {
      const { project } = req.body;
      const ai = getAI();

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Generate an enterprise software architecture document (Software Architecture Document - SAD) in Markdown format for the following Rational Rose UML 2.5 TypeScript model:
${JSON.stringify(project, null, 2)}

Include:
1. Executive Summary & System Overview
2. UML 2.5 Architectural Views (Logical, Component, Domain)
3. Design Patterns Applied & Key Abstractions
4. Data Flow & Subsystem Responsibilities
5. TypeScript Implementation & Type-Safety Guidelines`,
      });

      res.json({ success: true, markdown: response.text });
    } catch (error: any) {
      console.error('Error in /api/ai/doc-gen:', error);
      res.status(500).json({ error: error.message || 'Failed to generate documentation' });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rational Rose TypeScript Server running on http://localhost:${PORT}`);
  });
}

startServer();
