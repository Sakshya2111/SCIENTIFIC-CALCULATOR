// QuantumCalc Pro - Web Audio Synthesizer for Tactile & Sci-Fi SFX
class SoundController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.15;
        this.soundProfile = 'mechanical'; // 'mechanical', 'scifi', 'soft', 'matrix'
        this.init();
    }

    init() {
        const savedMute = localStorage.getItem('quantum_calc_sound_enabled');
        if (savedMute !== null) {
            this.enabled = savedMute === 'true';
        }
        const savedProfile = localStorage.getItem('quantum_calc_sound_profile');
        if (savedProfile) {
            this.soundProfile = savedProfile;
        }
    }

    getContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    toggleSound() {
        this.enabled = !this.enabled;
        localStorage.setItem('quantum_calc_sound_enabled', this.enabled);
        if (this.enabled) {
            this.playKeySound('func');
        }
        return this.enabled;
    }

    setProfile(profile) {
        this.soundProfile = profile;
        localStorage.setItem('quantum_calc_sound_profile', profile);
        this.playKeySound('operator');
    }

    playKeySound(type = 'number') {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            let freq = 440;
            let duration = 0.05;

            switch (this.soundProfile) {
                case 'scifi':
                    if (type === 'number') {
                        freq = 520;
                        osc.type = 'sine';
                        duration = 0.04;
                    } else if (type === 'operator') {
                        freq = 780;
                        osc.type = 'triangle';
                        duration = 0.06;
                    } else if (type === 'func') {
                        freq = 920;
                        osc.type = 'sawtooth';
                        duration = 0.07;
                    } else if (type === 'equals') {
                        this.playSuccessChord();
                        return;
                    } else if (type === 'clear') {
                        freq = 240;
                        osc.type = 'sawtooth';
                        duration = 0.09;
                    }
                    break;

                case 'soft':
                    osc.type = 'sine';
                    duration = 0.035;
                    if (type === 'number') freq = 360;
                    else if (type === 'operator') freq = 480;
                    else if (type === 'func') freq = 560;
                    else if (type === 'equals') freq = 640;
                    else freq = 300;
                    break;

                case 'matrix':
                    osc.type = 'square';
                    duration = 0.03;
                    if (type === 'number') freq = 800;
                    else if (type === 'operator') freq = 1200;
                    else if (type === 'func') freq = 1500;
                    else if (type === 'equals') {
                        this.playSuccessChord();
                        return;
                    } else freq = 400;
                    break;

                case 'mechanical':
                default:
                    osc.type = 'triangle';
                    if (type === 'number') freq = 400 + Math.random() * 40;
                    else if (type === 'operator') freq = 520;
                    else if (type === 'func') freq = 620;
                    else if (type === 'equals') {
                        this.playSuccessChord();
                        return;
                    } else if (type === 'clear') freq = 280;
                    duration = 0.03;
                    break;
            }

            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + duration);

            gain.gain.setValueAtTime(this.volume * (type === 'func' ? 0.8 : 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            // gracefully ignored
        }
    }

    playSuccessChord() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major chord
            freqs.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.03);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + idx * 0.03 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3 + idx * 0.03);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + idx * 0.03);
                osc.stop(now + 0.35 + idx * 0.03);
            });
        } catch (e) {}
    }

    playErrorBeep() {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(180, now + 0.08);

            gain.gain.setValueAtTime(this.volume * 0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }
}

window.soundCtrl = new SoundController();
