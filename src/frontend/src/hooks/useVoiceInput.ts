import { useCallback, useRef, useState } from "react";

// Browser SpeechRecognition types
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultItem {
  [index: number]: { transcript: string } | undefined;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

interface UseVoiceInputOptions {
  language?: "gu-IN" | "en-IN";
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceInput({
  language = "gu-IN",
  onResult,
  onError,
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const w = typeof window !== "undefined" ? (window as BrowserWindow) : null;
  const SpeechRecognitionAPI =
    w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognitionAPI;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("not_supported");
      onError?.("not_supported");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setTranscript("");
    setError(null);
    setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const result = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(result);
      onResult?.(result);
    };

    recognition.onerror = (event: { error: string }) => {
      const errMsg = event.error || "unknown_error";
      setError(errMsg);
      setIsListening(false);
      onError?.(errMsg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setError("start_failed");
      setIsListening(false);
    }
  }, [SpeechRecognitionAPI, language, onResult, onError]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    error,
  };
}
