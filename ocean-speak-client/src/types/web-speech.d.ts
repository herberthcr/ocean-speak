// Minimal Web Speech API typings — TypeScript's lib.dom ships SpeechRecognitionResult(List) and
// SpeechRecognitionAlternative, but not the SpeechRecognition interface itself or its result
// event. These declarations merge with the `declare var` entries in src/global.d.ts.

interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
}
