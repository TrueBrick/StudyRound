// Serviço de áudio autônomo baseado na Web Audio API nativa
// Funciona 100% offline e sem arquivos externos

class AudioService {
  private ctx: AudioContext | null = null;
  private ambientNoiseNode: AudioNode | null = null;
  private isAmbientPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Sino acolhedor de término de Pomodoro (Ting / Tibetan bowl sound)
  playChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const fundamental = 528; // Frequência harmônica relaxante (528 Hz)

      // Harmônicos
      [1, 2, 2.76, 5.4].forEach((multiplier, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(fundamental * multiplier, now);

        const decay = 2.5 / (i + 1);
        gain.gain.setValueAtTime(0.15 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch (e) {
      console.warn('Erro ao reproduzir sino:', e);
    }
  }

  // Som suave de tarefa concluída (recompensa / plink)
  playTaskSuccess(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Acorde Maior)

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Som suave de clique / botão
  playClick(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Ignorar erros de áudio em navegadores com restrições
    }
  }

  // Ruído de fundo aconchegante (Chuva / Brown Noise relaxante)
  toggleAmbientCozyNoise(enable?: boolean): boolean {
    const ctx = this.getContext();
    if (!ctx) return false;

    if (this.isAmbientPlaying || enable === false) {
      if (this.ambientNoiseNode) {
        try {
          (this.ambientNoiseNode as AudioBufferSourceNode).stop();
          this.ambientNoiseNode.disconnect();
        } catch (e) {
          // ignore
        }
        this.ambientNoiseNode = null;
      }
      this.isAmbientPlaying = false;
      return false;
    }

    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Brown noise (som suave como chuva distante ou cafeteria)
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 1.8;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filtro passa-baixa para deixar o som bem abafado e aconchegante
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      this.ambientNoiseNode = whiteNoise;
      this.isAmbientPlaying = true;
      return true;
    } catch (e) {
      console.warn('Erro ao iniciar ruído ambiente:', e);
      this.isAmbientPlaying = false;
      return false;
    }
  }

  isAmbientActive(): boolean {
    return this.isAmbientPlaying;
  }
}

export const audioService = new AudioService();
