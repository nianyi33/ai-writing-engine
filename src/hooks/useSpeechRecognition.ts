import { useState, useRef, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionResult {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  error: string | null;
}

/**
 * 语音识别 Hook — 基于 Web Speech API
 * 支持中文连续识别，带静默超时自动停止
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalBufferRef = useRef<string[]>([]);

  const isSupported = !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('当前浏览器不支持语音识别（请使用 Chrome 或 Edge）');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = options.lang || 'zh-CN';
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = 1;

    let didEmitFinal = false;
    finalBufferRef.current = [];

    recognition.onresult = (event: any) => {
      let interim = '';
      let latestFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalBufferRef.current.push(result[0].transcript);
          latestFinal += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const fullFinal = finalBufferRef.current.join('');
      setFinalTranscript(fullFinal);
      setInterimTranscript(interim);

      const displayText = fullFinal + interim;
      if (latestFinal) {
        didEmitFinal = true;
        options.onResult?.(latestFinal, true);
      } else if (interim) {
        options.onResult?.(displayText, false);
      }

      // 重置静音计时器 — 每次有结果就重置
      clearSilenceTimer();
      if (options.continuous) {
        silenceTimerRef.current = setTimeout(() => {
          // 静音2秒后自动停止
          recognition.stop();
        }, 2000);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return; // 不说话不报错
      if (event.error === 'aborted') return;   // 主动停止不报错
      const errMsg = event.error === 'not-allowed' ? '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问' :
        event.error === 'network' ? '网络错误，请检查网络连接' :
        `语音识别错误: ${event.error}`;
      setError(errMsg);
      options.onError?.(errMsg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // 只在没有通过 onresult 发出过 final 时才兜底提交
      // （例如：连续模式下静音超时，只有 interim 没有 final 的情况）
      if (!didEmitFinal) {
        const allText = finalBufferRef.current.join('') + interimTranscript;
        if (allText.trim()) {
          setFinalTranscript(allText);
          setInterimTranscript('');
          options.onResult?.(allText, true);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (e: any) {
      setError(`启动语音识别失败: ${e.message}`);
    }
  }, [isSupported, options.lang, options.continuous, options.interimResults]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // 清理
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [clearSilenceTimer]);

  return {
    transcript: finalTranscript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    toggle,
    error,
  };
}
