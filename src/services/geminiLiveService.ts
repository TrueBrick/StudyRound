// Serviço do cliente para conexão com Gemini Live API via WebSocket

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextPlayTime: number = 0;
  private isConnected: boolean = false;
  private onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening') => void;
  private onError?: (err: string) => void;

  constructor(
    onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening') => void,
    onError?: (err: string) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onError = onError;
  }

  // Iniciar conexão de voz em tempo real
  async connect(): Promise<void> {
    if (this.isConnected) return;
    this.onStatusChange?.('connecting');

    try {
      // 1. Pedir permissão e capturar microfone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // 2. Criar AudioContexts: 16kHz para captura, 24kHz para reprodução do Gemini Live
      this.inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      this.outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      this.nextPlayTime = this.outputAudioCtx.currentTime;

      // 3. Conectar WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onStatusChange?.('connected');
        this.startMicrophoneCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            this.onError?.(msg.error);
            return;
          }

          if (msg.interrupted) {
            // Se o usuário interrompeu o modelo
            this.stopAudioPlayback();
            this.onStatusChange?.('listening');
          }

          if (msg.audio) {
            this.onStatusChange?.('speaking');
            this.playAudioChunk(msg.audio);
          }
        } catch (e) {
          console.warn('Erro ao decodificar mensagem do Gemini Live:', e);
        }
      };

      this.ws.onclose = () => {
        this.disconnect();
      };

      this.ws.onerror = (e) => {
        console.error('Erro no WebSocket do Gemini Live:', e);
        this.onError?.('Não foi possível conectar ao servidor de voz.');
        this.disconnect();
      };

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      this.onError?.(err.message || 'Permissão de microfone negada.');
      this.disconnect();
    }
  }

  // Captura do microfone e envio em PCM 16-bit 16kHz
  private startMicrophoneCapture(): void {
    if (!this.inputAudioCtx || !this.mediaStream) return;

    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    // Buffer size 2048 para baixa latência
    this.processor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Checar se há volume detectável (atividade de voz)
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += Math.abs(inputData[i]);
      }
      const avg = sum / inputData.length;
      if (avg > 0.02) {
        this.onStatusChange?.('listening');
      }

      // Converter Float32 (-1.0 a 1.0) para Int16 PCM little-endian
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Converter para Base64
      let binary = '';
      const bytes = new Uint8Array(pcm16.buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      this.ws.send(JSON.stringify({ audio: base64Audio }));
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);
  }

  // Reproduzir chunks de áudio recebidos a 24kHz de forma contínua
  private playAudioChunk(base64Audio: string): void {
    if (!this.outputAudioCtx) return;

    try {
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      sourceNode.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      sourceNode.onended = () => {
        if (this.outputAudioCtx && this.outputAudioCtx.currentTime >= this.nextPlayTime) {
          this.onStatusChange?.('connected');
        }
      };
    } catch (e) {
      console.warn('Erro ao reproduzir áudio do Gemini Live:', e);
    }
  }

  private stopAudioPlayback(): void {
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
  }

  // Desconectar tudo e liberar microfone
  disconnect(): void {
    this.isConnected = false;

    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch (e) {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch (e) {}
      this.outputAudioCtx = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.onStatusChange?.('disconnected');
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}
