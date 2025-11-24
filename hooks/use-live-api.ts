import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Agent } from '../types';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audio-utils';

interface UseLiveApiProps {
  agent: Agent;
  onContextUpdate: (key: string, value: string) => void;
  onDisconnect: () => void;
  onTranscript: (text: string, role: 'user' | 'model', isFinal: boolean) => void;
}

export function useLiveApi({ agent, onContextUpdate, onDisconnect, onTranscript }: UseLiveApiProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Stream References
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const connect = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // Handle API Key Selection
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
          await aiStudio.openSelectKey();
        }
      }

      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });

      // Setup Audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      inputAudioContextRef.current = inputCtx;
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }
      outputAudioContextRef.current = outputCtx;

      // Define Tools
      const updateContextTool: FunctionDeclaration = {
        name: 'update_context',
        parameters: {
          type: Type.OBJECT,
          description: 'Save a piece of information captured from the user into the structured context.',
          properties: {
            key: { type: Type.STRING, description: `The field name. One of: ${agent.initialContextKeys.join(', ')}` },
            value: { type: Type.STRING, description: 'The value provided by the user.' },
          },
          required: ['key', 'value'],
        },
      };

      // Connect Session
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setIsConnected(true);
            setIsLoading(false);
            
            // Start Audio Input Processing
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for visualizer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Transcript
            if (msg.serverContent?.inputTranscription) {
               onTranscript(msg.serverContent.inputTranscription.text, 'user', false);
            }
            if (msg.serverContent?.outputTranscription) {
               onTranscript(msg.serverContent.outputTranscription.text, 'model', false);
            }
            if (msg.serverContent?.turnComplete) {
               onTranscript('', 'model', true); // Signal turn completion
            }

            // Handle Tool Calls
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'update_context') {
                  const { key, value } = fc.args as any;
                  onContextUpdate(key, value);
                  
                  // Send success response
                  sessionPromiseRef.current?.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'success' }
                      }
                    });
                  });
                }
              }
            }

            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              // Scheduler
              const now = ctx.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            
            // Handle Interruption
            if (msg.serverContent?.interrupted) {
               sourcesRef.current.forEach(s => s.stop());
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Session closed');
            setIsConnected(false);
            setIsLoading(false);
            cleanup();
            onDisconnect();
          },
          onerror: (e: any) => {
            console.error('Session error', e);
            const message = e.message || "Unknown error";
            if (message.includes("Requested entity was not found")) {
                const aiStudio = (window as any).aistudio;
                if (aiStudio) {
                    aiStudio.openSelectKey().catch(console.error);
                    setError("API Key expired or invalid. Please re-select your key.");
                } else {
                    setError("API Key invalid.");
                }
            } else {
                setError(message);
            }
            setIsConnected(false);
            setIsLoading(false);
            cleanup();
            onDisconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: agent.voiceName } }
          },
          systemInstruction: agent.systemInstruction,
          tools: [{ functionDeclarations: [updateContextTool] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
          const aiStudio = (window as any).aistudio;
          if (aiStudio) {
             aiStudio.openSelectKey().catch(console.error);
          }
          setError("API Key issue. Please try again.");
      } else {
          setError(err.message || "Failed to connect");
      }
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [agent, onContextUpdate, onDisconnect, onTranscript, isLoading]);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const disconnect = useCallback(async () => {
    cleanup();
    setIsConnected(false);
    setIsLoading(false);
    onDisconnect();
  }, [cleanup, onDisconnect]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isConnected, isLoading, error, volume, connect, disconnect };
}