import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Language, UserSettings, Reminder } from './types';
import { analyzeScene, chatWithElenii, extractTextFromImage, getWalkingDirections } from './services/geminiService';
import { Visualizer } from './components/Visualizer';
import { MobileSimulator } from './components/MobileSimulator';
import BluetoothService, { BleDevice } from './services/bluetoothService';

// --- Assets & Icons ---
const IconMic = () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const IconSettings = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconBluetooth = ({ connected }: { connected: boolean }) => (
  <svg className={`w-5 h-5 ${connected ? 'text-[#2D6A94] drop-shadow-[0_0_8px_rgba(45,106,148,0.5)]' : 'text-zinc-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l10 10-5 5V2l5 5L7 17" />
  </svg>
);
const IconNavigation = () => <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconArrowLeft = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const IconCheck = () => <svg className="w-5 h-5 text-[#2D6A94]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IconChevronRight = () => <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const IconRadio = () => <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>;
const IconNews = () => <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>;
const IconSearch = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const IconUser = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconCam = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const IconHealth = ({ className = "w-6 h-6" }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const IconPill = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const IconClinic = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const IconSend = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const IconDocument = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconPlay = () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconPause = () => <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconCopy = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>;
const IconTrash = () => <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconCalendar = () => <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

// --- Constants ---
const STATIONS = [
  { freq: "99.3", name: "Nigeria Info", type: "Talk • News • Sports" },
  { freq: "95.1", name: "Wazobia FM", type: "General • Pidgin" },
  { freq: "100.1", name: "Beat FM", type: "Music • Entertainment" },
  { freq: "98.1", name: "Smooth FM", type: "Soul • Jazz" }
];

const NEWS_ITEMS = [
  { category: "Technology", title: "AI transforms accessibility tools", summary: "New vision models help navigation apps become more accurate than ever before, enabling safer travel for everyone." },
  { category: "Local Traffic", title: "Lagos traffic updates", summary: "Third Mainland Bridge is experiencing heavy traffic due to maintenance work. Commuters are advised to use alternative routes." },
  { category: "World", title: "Global Climate Summit", summary: "Leaders gather to discuss new carbon emission targets for the next decade, focusing on renewable energy adoption." },
  { category: "Business", title: "Market Rally", summary: "Local markets are seeing a surge in activity as new tech startups begin public trading." }
];

export default function App() {
  // --- State ---
  const [appState, setAppState] = useState<AppState>(AppState.LAUNCH);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    language: Language.ENGLISH,
    isSubscribed: false, // Default to false
    sensorConnected: false,
    volume: 1.0,
    destination: undefined,
    useEsp32Cam: false,
    esp32CamUrl: 'http://192.168.4.1/stream' // Default common ESP32 AP IP
  });
  const [displayText, setDisplayText] = useState<string>("Initializing...");
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0); // Used for Radio station index or News item index
  const [destinationInput, setDestinationInput] = useState("");
  
  // Navigation Directions State
  const [navSteps, setNavSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Bluetooth & Cane Telemetry States
  const [connectedBleDevice, setConnectedBleDevice] = useState<BleDevice | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [obstacleWarning, setObstacleWarning] = useState<boolean>(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDevice[]>([]);
  const [isBleScanning, setIsBleScanning] = useState<boolean>(false);
  const lastObstacleSpeakRef = useRef<number>(0);

  // Document Reader State
  const [readerText, setReaderText] = useState<string>("");
  const [isReading, setIsReading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  // Reminders State
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Malaria Prophylaxis', time: '14:00', type: 'medication', completed: false },
    { id: '2', text: 'General Hospital Visit', time: '16:00', type: 'appointment', completed: false },
  ]);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null); // Type check skipped for brevity (webkitSpeechRecognition)

  // --- Helpers ---
  const speak = useCallback((text: string, force: boolean = false) => {
    if (!window.speechSynthesis) {
        console.warn("speechSynthesis not supported on this platform: ", text);
        return;
    }
    try {
        if (window.speechSynthesis.speaking && !force) window.speechSynthesis.cancel();
        
        // Reset reading state if we were reading a document
        setIsReading(false);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = settings.volume;
        utterance.lang = settings.language;
        
        utterance.onend = () => {
            // Just in case we want to hook into end of speech
        };

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Speech synthesis failed", e);
    }
  }, [settings.language, settings.volume]);

  const readerSpeak = useCallback((text: string) => {
      if (!window.speechSynthesis) {
          console.warn("speechSynthesis not supported: ", text);
          return;
      }
      try {
          // Specialized speaker for Document Reader that tracks state
          if (window.speechSynthesis.speaking) {
              window.speechSynthesis.cancel();
              setIsReading(false);
              return;
          }
          
          if (!text) return;

          setIsReading(true);
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.volume = settings.volume;
          utterance.lang = settings.language;
          utterance.onend = () => setIsReading(false);
          utterance.onerror = () => setIsReading(false);
          window.speechSynthesis.speak(utterance);
      } catch (e) {
          console.error("Reader Speech synthesis failed", e);
          setIsReading(false);
      }
  }, [settings.volume, settings.language]);

  const transitionTo = useCallback((newState: AppState) => {
    // Cleanup states when leaving certain modes
    if (appState === AppState.DOCUMENT_READER && newState !== AppState.DOCUMENT_READER) {
        if (window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {
                console.error("Failed to cancel speech synthesis:", e);
            }
        }
        setIsReading(false);
    }
    // Cleanup Navigation state if leaving navigation
    if (appState === AppState.NAVIGATION_MODE && newState !== AppState.NAVIGATION_MODE && newState !== AppState.NAVIGATION_SCAN) {
        setNavSteps([]);
        setCurrentStepIndex(0);
    }
    setAppState(newState);
  }, [appState]);

  // --- Reminder Checker Logic ---
  useEffect(() => {
      const interval = setInterval(() => {
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); // "14:00"

          setReminders(prev => prev.map(reminder => {
              if (reminder.time === currentTime && !reminder.completed) {
                  // Trigger alert
                  speak(`Reminder: It is time for ${reminder.text}`);
                  return { ...reminder, completed: true }; // Mark as done to avoid repeating
              }
              return reminder;
          }));
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
  }, [speak]);


  // --- Sensor Simulation / ESP32 Logic ---
  useEffect(() => {
    if (connectedBleDevice) {
      setSettings(prev => ({ ...prev, sensorConnected: true }));
      return;
    }

    if (settings.useEsp32Cam) {
        // If ESP32 is active, we assume it's "Connecting..." or we let the image load event handle it
        // For simulation purposes, we set it to true immediately if a URL is present
        if (settings.esp32CamUrl) {
            setSettings(prev => ({ ...prev, sensorConnected: true }));
        } else {
            setSettings(prev => ({ ...prev, sensorConnected: false }));
        }
    } else {
        // Legacy simulation for internal sensor connection after 5 seconds
        const timer = setTimeout(() => {
          setSettings(prev => {
            if (connectedBleDevice) return prev;
            return { ...prev, sensorConnected: true };
          });
          // Only announce if we aren't in a blocking flow
          if (appState === AppState.IDLE_LISTENING && !connectedBleDevice) {
            speak("Internal Sensor connected");
          }
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [appState, speak, settings.useEsp32Cam, settings.esp32CamUrl, connectedBleDevice]);

  // --- Bluetooth Service Lifecycle & Telemetry ---
  useEffect(() => {
    const ble = BluetoothService.getInstance();
    ble.initialize().catch(err => console.error('[BLE App] Init error:', err));
  }, []);

  useEffect(() => {
    if (!connectedBleDevice) return;

    const ble = BluetoothService.getInstance();
    const serviceUuid = '19b10000-e8f2-537e-4f6c-d104768a1214';
    const charUuid = '19b10001-e8f2-537e-4f6c-d104768a1214';

    console.log('[BLE App] Subscribing to telemetry distance...');
    ble.startTelemetryNotifications(
      connectedBleDevice.deviceId,
      serviceUuid,
      charUuid,
      (distance) => {
        setCurrentDistance(distance);
        if (distance < 0.8) {
          setObstacleWarning(true);
          const now = Date.now();
          if (now - lastObstacleSpeakRef.current > 8000) {
            speak(`Warning: Obstacle detected within ${distance.toFixed(1)} meters!`);
            lastObstacleSpeakRef.current = now;
          }
        } else {
          setObstacleWarning(false);
        }
      }
    ).catch(err => {
      console.error('[BLE App] Subscription error:', err);
    });

    return () => {
      console.log('[BLE App] Cleaning up telemetry subscription...');
      ble.stopTelemetryNotifications(
        connectedBleDevice.deviceId,
        serviceUuid,
        charUuid
      ).catch(err => console.error('[BLE App] Unsubscription error:', err));
    };
  }, [connectedBleDevice, speak]);

  // --- Navigation & Location Logic ---
  const startNavigation = useCallback((destination: string) => {
    if (!navigator.geolocation) {
        speak("Geolocation is not supported by your browser.");
        return;
    }

    setIsProcessing(true);
    speak("Finding your location...");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            speak(`Location found. Calculating route to ${destination}.`);
            
            try {
                const steps = await getWalkingDirections(latitude, longitude, destination);
                if (steps.length > 0) {
                    setNavSteps(steps);
                    setCurrentStepIndex(0);
                    // Announce first step
                    const firstStep = steps[0];
                    speak(`Route found. ${steps.length} steps. Step 1: ${firstStep}`);
                } else {
                    speak("I couldn't find a clear route.");
                }
            } catch (error) {
                console.error(error);
                speak("I'm sorry, I couldn't get directions at this time.");
            } finally {
                setIsProcessing(false);
            }
        },
        (error) => {
            console.error("Geo error:", error);
            speak("I couldn't access your location. Please check permissions.");
            setIsProcessing(false);
            transitionTo(AppState.IDLE_LISTENING);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [speak, transitionTo]);

  // --- State Machine Logic (Side Effects) ---
  useEffect(() => {
    switch (appState) {
      case AppState.LAUNCH:
        const hasVisited = localStorage.getItem('elenii_visited');
        if (!hasVisited) {
          transitionTo(AppState.ONBOARDING_WELCOME);
        } else {
          transitionTo(AppState.IDLE_LISTENING);
        }
        break;

      case AppState.ONBOARDING_WELCOME:
        setDisplayText("Welcome to Elenii!\n\nPlease say your name, or type it below to get started.");
        speak("Welcome to Elenii. Say your name.");
        startListening(true);
        break;

      case AppState.ONBOARDING_LANGUAGE:
        setDisplayText("Select your preferred language:\n\nSay English, Hausa, Igbo, or Yoruba (or tap below).");
        speak("Choose your language: English, Hausa, Igbo, or Yoruba.");
        startListening(true);
        break;
      
      case AppState.ONBOARDING_PERMISSION:
        setDisplayText("Grant hardware permissions to enable full assistant features:\n\nSay 'Continue' or tap below to grant.");
        speak("I will use your microphone and camera to help you. Say Continue.");
        startListening(true);
        break;

      case AppState.ONBOARDING_COMPLETE:
        localStorage.setItem('elenii_visited', 'true');
        setDisplayText("Setup complete!\n\nYou're ready to use Elenii Shepherd.");
        speak("You can say: Go to [place], Scan ahead, News, Radio, Health, Reader, or Settings.");
        const t = setTimeout(() => transitionTo(AppState.IDLE_LISTENING), 6000);
        return () => clearTimeout(t);

      case AppState.IDLE_LISTENING:
        // Default state now shows camera
        if (!settings.destination) {
            setDisplayText("Listening...");
        } else {
            setDisplayText(`Going to ${settings.destination}`);
        }
        break;

      case AppState.NAVIGATION_SCAN:
        handleScan();
        break;

      case AppState.NAVIGATION_MODE:
         // If we have a destination but no steps yet, assume we just started
         // (Handled by handleCommand 'go to' or logic in 'startNavigation')
         // This state logic is mainly for re-entry or persistence
         if (settings.destination && navSteps.length === 0 && !isProcessing) {
             startNavigation(settings.destination);
         }
         break;
      
      case AppState.DESTINATION_INPUT:
         speak("Where to? Say the address or type it.");
         break;

      case AppState.NEWS_PREVIEW:
        speak("News. " + NEWS_ITEMS[0].title + ". " + NEWS_ITEMS[0].summary + " Subscribe to hear more.");
        break;

      case AppState.NEWS_FULL:
        // When entering news full or changing index
        const news = NEWS_ITEMS[activeFeatureIndex];
        speak(`${news.category}. ${news.title}. ${news.summary}`);
        break;
        
      case AppState.RADIO_PLAYING:
        const station = STATIONS[activeFeatureIndex];
        speak(`Tuning to ${station.freq} FM. ${station.name}.`);
        break;

      case AppState.HEALTH_HOME:
        speak("Health Assistant. Access symptom checks, medications, or appointments.");
        break;

      case AppState.DOCUMENT_READER:
        speak("Document Reader. Scan a page, dictate text, or listen to content.");
        break;
        
      case AppState.PAYWALL:
        speak("Elenii subscription required. Includes Navigation, News, Radio, Health Tools and Conversational AI. Say Subscribe or Back.");
        startListening(true);
        break;

      case AppState.SUBSCRIPTION_CONFIRM:
        setSettings(s => ({ ...s, isSubscribed: true }));
        speak("Subscription active. Thank you.");
        setTimeout(() => transitionTo(AppState.IDLE_LISTENING), 3000);
        break;

      case AppState.SETTINGS:
          speak("Settings menu.");
          break;
          
      case AppState.SETTINGS_LANGUAGE:
          speak("Select a language.");
          break;

      case AppState.SETTINGS_SUBSCRIPTION:
          speak(settings.isSubscribed ? "You are subscribed." : "You are on the free plan.");
          break;
          
      case AppState.SETTINGS_PROFILE:
          const nameText = settings.name ? `Your name is ${settings.name}.` : "You haven't set a name.";
          speak(`${nameText} Tap the microphone and say your name to change it.`);
          break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, activeFeatureIndex]);

  // --- Internal Camera Initialization ---
  const initCamera = useCallback(async () => {
    // Avoid double initialization if stream is already active and track is running
    if (streamRef.current && streamRef.current.getVideoTracks().some(track => track.readyState === 'live')) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(playErr => console.error("Video play failed:", playErr));
      }
      return;
    }

    let stream: MediaStream | null = null;
    try {
      // Try environment (rear) camera first
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
    } catch (e) {
      console.warn("Rear camera failed, trying default video source...", e);
      try {
        // Fallback 1: Any available video camera (default)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        console.error("All camera fallback options failed:", err);
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly trigger play to prevent freeze or black screen on WebViews
        videoRef.current.play().catch(playErr => {
          console.error("Video play failed on stream init:", playErr);
        });
      }
    }
  }, []);

  useEffect(() => {
    initCamera();

    return () => {
      // Cleanup tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  // Ensure stream is attached and playing whenever state shifts or camera is needed
  useEffect(() => {
    const isCameraState = 
        appState === AppState.IDLE_LISTENING || 
        appState === AppState.NAVIGATION_SCAN || 
        appState === AppState.NAVIGATION_MODE || 
        appState === AppState.NAVIGATION_RESULT;

    if (isCameraState) {
      if (!streamRef.current) {
        initCamera();
      } else if (videoRef.current) {
        if (videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
    }
  }, [appState, settings.useEsp32Cam, initCamera]);

  // --- Capture Helpers ---
  const captureImage = (): string | null => {
      try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (settings.useEsp32Cam && imgRef.current) {
             canvas.width = imgRef.current.naturalWidth || 640;
             canvas.height = imgRef.current.naturalHeight || 480;
             try {
                 ctx?.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
             } catch(e) {
                 throw new Error("Cannot capture from ESP32. Check CORS.");
             }
          } else if (videoRef.current) {
             canvas.width = videoRef.current.videoWidth;
             canvas.height = videoRef.current.videoHeight;
             ctx?.drawImage(videoRef.current, 0, 0);
          } else {
             return null;
          }
          return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      } catch (e) {
          console.error(e);
          return null;
      }
  };

  const handleScan = async () => {
    setIsProcessing(true);
    speak("Scanning ahead...");

    try {
      const base64 = captureImage();
      if (!base64) throw new Error("No video source");

      const result = await analyzeScene(base64);
      setAnalysisResult(result);
      speak(result);
      // We don't change state to result anymore if in nav mode, just speak it
      if (appState !== AppState.NAVIGATION_MODE) {
          transitionTo(AppState.NAVIGATION_RESULT);
      }
    } catch (error) {
      console.error(error);
      speak("I can't see right now. Please check the camera.");
      if (appState !== AppState.NAVIGATION_MODE) {
          transitionTo(AppState.IDLE_LISTENING);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleScanText = async () => {
      setIsProcessing(true);
      speak("Scanning document...");
      try {
          const base64 = captureImage();
          if (!base64) throw new Error("No video source");
          
          const text = await extractTextFromImage(base64);
          setReaderText(text);
          speak("Scan complete. " + (text.length > 50 ? "Text extracted." : text));
      } catch (error) {
          console.error(error);
          speak("Could not read text.");
      } finally {
          setIsProcessing(false);
      }
  };


  // --- Speech Recognition Logic ---
  const startListening = (continuous = false, forDictation = false) => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Browser does not support Speech Recognition");
        return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = settings.language;
    recognition.continuous = continuous;
    recognition.interimResults = true; // Use interim to show text building up if dictating

    recognition.onstart = () => {
      setIsListening(true);
      if (forDictation) setIsDictating(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsDictating(false);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase();
      
      if (result.isFinal) {
          if (forDictation) {
              // Append to reader text
              setReaderText(prev => prev + " " + transcript);
          } else {
              handleCommand(transcript);
          }
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
  };

  // --- Command Parser ---
  const handleCommand = async (text: string) => {
    console.log("Heard:", text);

    // 1. GLOBAL COMMANDS (Priority 1)
    if (text.includes('stop') || text.includes('cancel') || text.includes('back') || text.includes('arrived') || text.includes('end navigation') || text.includes('pause')) {
        // Special logic for Radio/News?
        if (text.includes('stop') && (appState === AppState.RADIO_PLAYING || appState === AppState.NEWS_FULL)) {
             speak("Stopping playback.");
             transitionTo(AppState.IDLE_LISTENING);
             return;
        }
        
        if (appState === AppState.SETTINGS_LANGUAGE || appState === AppState.SETTINGS_SUBSCRIPTION || appState === AppState.SETTINGS_PROFILE) {
            transitionTo(AppState.SETTINGS);
        } else if (appState === AppState.SETTINGS || appState === AppState.NEWS_FULL || appState === AppState.RADIO_PLAYING || appState === AppState.HEALTH_HOME || appState === AppState.NEWS_PREVIEW || appState === AppState.DESTINATION_INPUT || appState === AppState.DOCUMENT_READER) {
            transitionTo(AppState.IDLE_LISTENING);
        } else {
            // Default back/stop/arrived behavior
            const wasNavigating = !!settings.destination;
            setSettings(prev => ({...prev, destination: undefined}));
            setNavSteps([]);
            
            if (wasNavigating && (text.includes('arrived') || text.includes('stop') || text.includes('end') || text.includes('pause'))) {
                speak("Navigation ended.");
            }
            transitionTo(AppState.IDLE_LISTENING);
        }
        return;
    }

    // 2. CONTEXT-SPECIFIC COMMANDS (Priority 2)
    
    // Context: Navigation Mode Controls
    if (appState === AppState.NAVIGATION_MODE) {
        if (text.includes('next') || text.includes('skip')) {
            if (currentStepIndex < navSteps.length - 1) {
                const nextIndex = currentStepIndex + 1;
                setCurrentStepIndex(nextIndex);
                speak("Step " + (nextIndex + 1) + ". " + navSteps[nextIndex]);
            } else {
                speak("You have reached the final step.");
            }
            return;
        }
        if (text.includes('repeat') || text.includes('what') || text.includes('say again')) {
             if (navSteps[currentStepIndex]) {
                 speak(navSteps[currentStepIndex]);
             }
             return;
        }
        if (text.includes('previous') || text.includes('back')) {
            if (currentStepIndex > 0) {
                const prevIndex = currentStepIndex - 1;
                setCurrentStepIndex(prevIndex);
                speak("Previous step. " + navSteps[prevIndex]);
            }
            return;
        }
        // Allow scanning while navigating
        if (text.includes('scan') || text.includes('look') || text.includes('see')) {
             handleScan(); // Does not change state, just speaks result
             return;
        }
    }

    // Context: Radio / News Control
    if (appState === AppState.RADIO_PLAYING) {
        if (text.includes('next')) {
            setActiveFeatureIndex(prev => (prev + 1) % STATIONS.length);
            return;
        }
        if (text.includes('previous') || text.includes('back')) {
            setActiveFeatureIndex(prev => (prev - 1 + STATIONS.length) % STATIONS.length);
            return;
        }
    }

    if (appState === AppState.NEWS_FULL) {
        if (text.includes('next')) {
            setActiveFeatureIndex(prev => (prev + 1) % NEWS_ITEMS.length);
            return;
        }
        if (text.includes('previous')) {
            setActiveFeatureIndex(prev => (prev - 1 + NEWS_ITEMS.length) % NEWS_ITEMS.length);
            return;
        }
    }

    // Context: Document Reader
    if (appState === AppState.DOCUMENT_READER) {
        if (text.includes('scan') || text.includes('extract')) {
            handleScanText();
            return;
        }
        if (text.includes('read') || text.includes('play')) {
            readerSpeak(readerText);
            return;
        }
        if (text.includes('clear') || text.includes('delete')) {
            setReaderText("");
            speak("Document cleared.");
            return;
        }
    }
    
    // 3. SETTINGS & INPUTS (Priority 3)
    
    // Help & Sub
    if (text.includes('help')) {
        transitionTo(AppState.HELP);
        speak("You can say: Go to [place], Scan ahead, News, Radio, Reader, Settings. Or just ask me a question.");
        return;
    }
    if (text.includes('subscribe')) {
        transitionTo(AppState.SUBSCRIPTION_CONFIRM);
        return;
    }

    // Settings Specific Commands
    if (appState === AppState.SETTINGS) {
        if (text.includes('language')) transitionTo(AppState.SETTINGS_LANGUAGE);
        if (text.includes('subscription')) transitionTo(AppState.SETTINGS_SUBSCRIPTION);
        if (text.includes('profile') || text.includes('name')) transitionTo(AppState.SETTINGS_PROFILE);
    }
    
    if (appState === AppState.SETTINGS_LANGUAGE) {
        if (text.includes('hausa')) setSettings(s => ({ ...s, language: Language.HAUSA }));
        if (text.includes('igbo')) setSettings(s => ({ ...s, language: Language.IGBO }));
        if (text.includes('yoruba')) setSettings(s => ({ ...s, language: Language.YORUBA }));
        if (text.includes('english')) setSettings(s => ({ ...s, language: Language.ENGLISH }));
    }

    // Handle Profile Name Change
    if (appState === AppState.SETTINGS_PROFILE) {
        // Any text said here (that isn't back/stop) is treated as the new name
        if (text.length > 1) {
             setSettings(s => ({ ...s, name: text }));
             speak(`Okay, I'll call you ${text}.`);
             setTimeout(() => transitionTo(AppState.SETTINGS), 2000);
        }
        return;
    }

    // Destination handling (Go to...)
    const goToMatch = text.match(/(?:go to|navigate to)\s+(.+)/);
    if (goToMatch && goToMatch[1]) {
        const destination = goToMatch[1];
        setSettings(s => ({ ...s, destination }));
        // Note: We don't speak here immediately, transitionTo handles the side effect to startNavigation
        transitionTo(AppState.NAVIGATION_MODE);
        return;
    }
    
    // 4. REMINDER HANDLING
    // Robust Regex for "remind me to [Task] at [Time]" or "set a reminder to [Task] at [Time]"
    // Captures: 1=Task, 2=Time (optional)
    const reminderRegex = /(?:remind me|set a reminder)(?: to)? (.+?)(?: at (.+))?$/i;
    const reminderMatch = text.match(reminderRegex);

    if (reminderMatch) {
        const taskRaw = reminderMatch[1].trim();
        const timeRaw = reminderMatch[2] ? reminderMatch[2].trim() : "";
        
        // Only process if it looks like a valid task (more than 2 chars)
        if (taskRaw.length > 2) {
            let formattedTime = "09:00"; // Default fallback
            
            if (timeRaw) {
                 // Try to parse "5:30 pm", "2 pm", "14:00"
                 // Regex looks for: Hour (1-2 digits), optional :Minutes (2 digits), optional AM/PM
                 const timeParser = timeRaw.match(/(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i);
                 if (timeParser) {
                     let h = parseInt(timeParser[1]);
                     const m = timeParser[2] || "00";
                     const ampm = timeParser[3] ? timeParser[3].toLowerCase().replace(/\./g,'') : "";
                     
                     if (ampm === 'pm' && h < 12) h += 12;
                     if (ampm === 'am' && h === 12) h = 0;
                     
                     formattedTime = `${h.toString().padStart(2, '0')}:${m}`;
                 }
            } else {
                // If no time provided, just use next hour? Or random? For demo, use next hour
                const now = new Date();
                formattedTime = `${(now.getHours() + 1).toString().padStart(2,'0')}:00`;
            }

            const type = (taskRaw.includes('pill') || taskRaw.includes('medication') || taskRaw.includes('dose') || taskRaw.includes('medicine')) ? 'medication' : 'appointment';
            
            const newReminder: Reminder = {
                id: Date.now().toString(),
                text: taskRaw,
                time: formattedTime,
                type: type,
                completed: false
            };
            
            setReminders(prev => [...prev, newReminder]);
            speak(`I set a reminder for ${taskRaw} at ${formattedTime}`);
            
            // Go to health view to show it
            if (appState !== AppState.HEALTH_HOME) {
                 transitionTo(AppState.HEALTH_HOME);
            }
            return;
        }
    }

    // 5. FEATURE ACTIVATION (Priority 4 - from Home/Idle)
    if (appState === AppState.IDLE_LISTENING || appState === AppState.NAVIGATION_MODE || appState === AppState.NAVIGATION_RESULT || appState === AppState.NEWS_PREVIEW || appState === AppState.NEWS_FULL || appState === AppState.RADIO_PLAYING || appState === AppState.HEALTH_HOME || appState === AppState.DOCUMENT_READER) {
        if (text.includes('scan') || text.includes('ahead') || text.includes('look') || text.includes('see')) {
            // If in nav mode, allow scanning without leaving mode
            if (appState === AppState.NAVIGATION_MODE) {
                handleScan();
            } else {
                transitionTo(AppState.NAVIGATION_SCAN);
            }
            return;
        }
        else if (text.includes('nav')) {
            transitionTo(AppState.NAVIGATION_MODE);
            return;
        }
        else if (text.includes('news')) {
            setActiveFeatureIndex(0);
            transitionTo(settings.isSubscribed ? AppState.NEWS_FULL : AppState.NEWS_PREVIEW);
            return;
        }
        else if (text.includes('radio')) {
            if (settings.isSubscribed) {
                setActiveFeatureIndex(0);
                transitionTo(AppState.RADIO_PLAYING);
            } else {
                transitionTo(AppState.PAYWALL);
            }
            return;
        }
        else if (text.includes('health') || text.includes('doctor') || text.includes('medical') || text.includes('clinic')) {
            if (settings.isSubscribed) {
                transitionTo(AppState.HEALTH_HOME);
            } else {
                transitionTo(AppState.PAYWALL);
            }
            return;
        }
        else if (text.includes('reader') || text.includes('document') || (text.includes('read') && text.includes('text'))) {
            if (settings.isSubscribed) {
                transitionTo(AppState.DOCUMENT_READER);
            } else {
                transitionTo(AppState.PAYWALL);
            }
            return;
        }
        else if (text.includes('setting')) {
            transitionTo(AppState.SETTINGS);
            return;
        }
        else if (text.includes('bluetooth') || text.includes('sensor connection') || text.includes('cane settings')) {
            transitionTo(AppState.SETTINGS_BLUETOOTH);
            return;
        }
        else if (text.includes('connect to sensor') || text.includes('connect sensor')) {
            speak("Scanning and connecting to cane sensor.");
            const ble = BluetoothService.getInstance();
            transitionTo(AppState.SETTINGS_BLUETOOTH);
            setIsBleScanning(true);
            setDiscoveredDevices([]);
            ble.startScan((dev) => {
                setDiscoveredDevices(prev => {
                    if (prev.some(d => d.deviceId === dev.deviceId)) return prev;
                    return [...prev, dev];
                });
                
                if (dev.name.includes('Smart Cane') || dev.name.includes('Cane') || dev.name.includes('Sensor')) {
                    ble.stopScan().catch(() => {});
                    setIsBleScanning(false);
                    speak(`Connecting to ${dev.name}`);
                    ble.connect(dev.deviceId, () => {
                        setSettings(s => ({ ...s, sensorConnected: false }));
                        setConnectedBleDevice(null);
                        setCurrentDistance(null);
                        setObstacleWarning(false);
                    }).then((connectedDev) => {
                        setSettings(s => ({ ...s, sensorConnected: true, bluetoothDeviceName: connectedDev.name, bluetoothDeviceAddress: connectedDev.deviceId }));
                        setConnectedBleDevice(connectedDev);
                    }).catch(() => {
                        speak("Failed to connect.");
                    });
                }
            }).catch(() => {
                setIsBleScanning(false);
                speak("Could not start Bluetooth scan.");
            });
            return;
        }
        else if (text.includes('disconnect sensor') || text.includes('disconnect bluetooth')) {
            if (connectedBleDevice) {
                const ble = BluetoothService.getInstance();
                ble.disconnect(connectedBleDevice.deviceId).then(() => {
                    setSettings(s => ({ ...s, sensorConnected: false }));
                    setConnectedBleDevice(null);
                    setCurrentDistance(null);
                    setObstacleWarning(false);
                    speak("Sensor disconnected.");
                });
            } else {
                speak("No sensor is connected.");
            }
            return;
        }
    }

    // 6. ONBOARDING & INPUTS (Specific state traps)
    switch (appState) {
      case AppState.ONBOARDING_WELCOME:
        setSettings(s => ({ ...s, name: text }));
        transitionTo(AppState.ONBOARDING_LANGUAGE);
        return;
      
      case AppState.ONBOARDING_LANGUAGE:
        if (text.includes('hausa')) setSettings(s => ({ ...s, language: Language.HAUSA }));
        else if (text.includes('igbo')) setSettings(s => ({ ...s, language: Language.IGBO }));
        else if (text.includes('yoruba')) setSettings(s => ({ ...s, language: Language.YORUBA }));
        else setSettings(s => ({ ...s, language: Language.ENGLISH }));
        transitionTo(AppState.ONBOARDING_PERMISSION);
        return;

      case AppState.ONBOARDING_PERMISSION:
        if (text.includes('continue')) transitionTo(AppState.ONBOARDING_COMPLETE);
        return;
      
      case AppState.DESTINATION_INPUT:
        if (text.includes('start') || text.includes('go') || text.includes('begin')) {
            if (destinationInput.trim()) {
                setSettings(s => ({ ...s, destination: destinationInput }));
                speak(`Navigating to ${destinationInput}`);
                transitionTo(AppState.NAVIGATION_MODE);
            } else {
                speak("Please say a destination first.");
            }
        } else if (text.includes('clear') || text.includes('delete')) {
             setDestinationInput("");
             speak("Cleared.");
        } else {
            // Assume it's the address
            setDestinationInput(text);
            speak(text + ". Say Start to confirm.");
        }
        return;
        
       case AppState.PAYWALL:
          if(text.includes('subscribe')) transitionTo(AppState.SUBSCRIPTION_CONFIRM);
          return;
    }

    // 7. CONVERSATIONAL FALLBACK (Priority 6)
    // If we reached here, no command was matched. Send to Gemini Chat.
    if (text.length > 2) { // Minimal length check to avoid noise
        if (!settings.isSubscribed) {
            speak("Conversational AI is a premium feature. Please subscribe.");
            transitionTo(AppState.PAYWALL);
            return;
        }

        setIsProcessing(true);
        // Visualizer will show 'processing' animation based on state
        
        const response = await chatWithElenii(text, settings.name);
        speak(response);
        setIsProcessing(false);
    }
  };

  // --- Render Components ---

  const renderContent = () => {
    // 1. Onboarding
    if (appState.toString().startsWith('ONBOARDING')) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-8 bg-zinc-950/95 backdrop-blur-xl z-20 overflow-hidden relative">
            {/* Ambient Background Aura */}
            <div className="absolute w-48 h-48 rounded-full bg-[#2D6A94]/10 blur-2xl top-1/4 animate-pulse"></div>

            {/* Glowing Logo Halo */}
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-[#2D6A94]/10 blur-md animate-[ping_3s_infinite_1s]"></div>
              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white relative shadow-2xl">
                 <IconMic />
              </div>
            </div>
            
            <div className="space-y-4 w-full max-w-sm">
                <span className="font-title font-black text-xs uppercase tracking-[0.25em] text-[#2D6A94] drop-shadow-[0_0_8px_rgba(45,106,148,0.3)]">ELENII SETUP</span>
                
                {/* Glassmorphic Guidance Card */}
                <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl shadow-xl backdrop-blur-md">
                    <p className="text-xl font-bold leading-snug text-zinc-100 font-sans whitespace-pre-line">{displayText}</p>
                </div>

                {/* Tactile Manual Inputs and Buttons (Premium Fallback) */}
                <div className="pt-4 space-y-3 pointer-events-auto">
                    {appState === AppState.ONBOARDING_WELCOME && (
                        <div className="space-y-3">
                            <input 
                                type="text"
                                placeholder="Your name (optional)..."
                                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl p-3 text-center text-white outline-none focus:border-[#2D6A94] transition-colors"
                                value={settings.name}
                                onChange={(e) => setSettings(s => ({ ...s, name: e.target.value }))}
                            />
                            <button 
                                onClick={() => transitionTo(AppState.ONBOARDING_LANGUAGE)}
                                className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl hover:bg-zinc-200 active:scale-95 transition-all shadow-lg"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {appState === AppState.ONBOARDING_LANGUAGE && (
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(Language).map((lang) => (
                                <button 
                                    key={lang}
                                    onClick={() => {
                                        setSettings(s => ({ ...s, language: lang }));
                                        transitionTo(AppState.ONBOARDING_PERMISSION);
                                    }}
                                    className="bg-zinc-900/80 border border-white/5 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-800 hover:border-white/10 active:scale-95 transition-all text-white"
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    {appState === AppState.ONBOARDING_PERMISSION && (
                        <button 
                            onClick={() => transitionTo(AppState.ONBOARDING_COMPLETE)}
                            className="w-full bg-[#2D6A94] text-white font-bold py-3.5 rounded-xl hover:bg-[#235374] active:scale-95 transition-all shadow-lg shadow-[#2D6A94]/20 border border-white/10"
                        >
                            Grant and Continue
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Skip Button at the very bottom */}
            <button 
                onClick={() => {
                    localStorage.setItem('elenii_visited', 'true');
                    transitionTo(AppState.IDLE_LISTENING);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 pointer-events-auto transition-colors font-medium tracking-wider uppercase underline decoration-zinc-700 underline-offset-4"
            >
                Skip Onboarding
            </button>
        </div>
      );
    }

    // 2. Settings Pages
    if (appState.toString().startsWith('SETTINGS')) {
        return (
            <div className="absolute inset-0 bg-zinc-950 z-20">
                {renderSettings()}
            </div>
        );
    }

    // 3. Destination Input Screen
    if (appState === AppState.DESTINATION_INPUT) {
        return (
            <div className="absolute inset-0 h-full flex flex-col bg-zinc-900 p-6 z-20">
                 <div className="absolute top-4 left-4">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-zinc-800 rounded-full">
                        <IconArrowLeft />
                    </button>
                 </div>
                 
                 <div className="mt-20 flex-1 flex flex-col space-y-6">
                     <h2 className="text-3xl font-bold text-white">Where to?</h2>
                     
                     <div className="relative">
                         <input
                            autoFocus
                            type="text"
                            value={destinationInput}
                            onChange={(e) => setDestinationInput(e.target.value)}
                            placeholder="Enter address..."
                            className="w-full bg-zinc-800 border-none rounded-2xl p-6 pr-12 text-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-[#2D6A94] outline-none"
                         />
                         {destinationInput && (
                             <button 
                                onClick={() => setDestinationInput("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white"
                             >
                                 ✕
                             </button>
                         )}
                     </div>

                     {/* Voice Input Section */}
                     <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <button 
                            onClick={() => isListening ? stopListening() : startListening()}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${isListening ? 'bg-red-500 shadow-lg shadow-red-900/50 scale-110' : 'bg-[#2D6A94] text-white shadow-lg'}`}
                        >
                            <IconMic />
                        </button>
                        <p className={`text-sm uppercase tracking-widest font-medium ${isListening ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`}>
                            {isListening ? "Listening..." : "Tap to Speak Address"}
                        </p>
                     </div>

                     <div className="mt-auto">
                        <button 
                            disabled={!destinationInput.trim()}
                            onClick={() => {
                                setSettings(s => ({ ...s, destination: destinationInput }));
                                // Transition logic handled by effect when dest updates or manual transition
                                speak(`Navigating to ${destinationInput}`);
                                transitionTo(AppState.NAVIGATION_MODE);
                            }}
                            className={`w-full py-6 rounded-2xl text-2xl font-bold transition-all ${destinationInput.trim() ? 'bg-white text-black shadow-lg hover:bg-zinc-200' : 'bg-zinc-800 text-zinc-600'}`}
                        >
                            Start Navigation
                        </button>
                     </div>
                 </div>
            </div>
        );
    }
    
    // 4. Document Reader
    if (appState === AppState.DOCUMENT_READER) {
        return (
            <div className="absolute inset-0 h-full flex flex-col z-20">
                {/* Header with background gradient for visibility */}
                 <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent flex items-start pt-4 px-4 z-10">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-black/50 rounded-full backdrop-blur-md">
                        <IconArrowLeft />
                    </button>
                </div>
                
                {/* Main Scan Area - Transparent to show camera */}
                <div className="flex-1 relative flex items-center justify-center">
                    
                    {/* Viewfinder Border when no text */}
                    {!readerText && (
                        <div className="w-[80%] aspect-[3/4] border-2 border-white/50 rounded-3xl relative pointer-events-none">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#2D6A94] rounded-tl-xl -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#2D6A94] rounded-tr-xl -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#2D6A94] rounded-bl-xl -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#2D6A94] rounded-br-xl -mb-1 -mr-1"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/80 font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Align Document</p>
                            </div>
                        </div>
                    )}

                    {/* Text Area Overlay - Only visible if there is text or user is typing/editing */}
                    <div className={`absolute inset-0 pt-20 pb-4 px-6 transition-opacity duration-300 ${readerText ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <textarea 
                            className="w-full h-full bg-black/60 backdrop-blur-md text-white text-xl md:text-2xl p-6 rounded-2xl border border-white/10 focus:outline-none focus:border-[#2D6A94] resize-none leading-relaxed shadow-2xl"
                            placeholder="Scan a document or start dictating..."
                            value={readerText}
                            onChange={(e) => setReaderText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Bar */}
                {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
                        <div className="bg-zinc-800 p-6 rounded-2xl flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-[#2D6A94] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="font-bold">Analyzing Text...</p>
                        </div>
                    </div>
                )}
                
                {/* Controls with solid background */}
                <div className="h-32 bg-zinc-950 border-t border-zinc-800 flex items-center justify-evenly pb-4 z-20">
                     {/* Scan Button */}
                     <button 
                        onClick={handleScanText}
                        className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white"
                     >
                         <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                             <IconCam />
                         </div>
                         <span className="text-xs font-bold uppercase tracking-wider">Scan</span>
                     </button>

                     {/* Play / Pause TTS */}
                     <button 
                        onClick={() => readerSpeak(readerText)}
                        disabled={!readerText}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isReading ? 'bg-[#2D6A94] animate-pulse shadow-lg shadow-[#2D6A94]/50' : 'bg-white text-black disabled:opacity-50 disabled:bg-zinc-700'}`}
                     >
                         {isReading ? <IconPause /> : <IconPlay />}
                     </button>

                     {/* Dictate Button */}
                     <button 
                        onClick={() => isListening ? stopListening() : startListening(true, true)}
                        className={`flex flex-col items-center gap-1 ${isDictating ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
                     >
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors border border-zinc-700 ${isDictating ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
                             <IconMic />
                         </div>
                         <span className="text-xs font-bold uppercase tracking-wider">{isDictating ? "Rec" : "Dictate"}</span>
                     </button>
                </div>
            </div>
        );
    }

    // 5. News & Radio UI
    if (appState === AppState.NEWS_FULL || appState === AppState.NEWS_PREVIEW) {
        const news = NEWS_ITEMS[activeFeatureIndex];
        return (
            <div className="absolute inset-0 h-full flex flex-col bg-zinc-900 z-20">
                <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-black/50 rounded-full backdrop-blur-md">
                        <IconArrowLeft />
                    </button>
                </div>
                
                {/* News Image / Pattern Placeholder */}
                <div className="h-2/5 bg-gradient-to-br from-[#2D6A94] to-zinc-900 flex items-center justify-center p-8">
                     <IconNews />
                </div>
                
                <div className="flex-1 p-6 flex flex-col gap-4">
                    <span className="text-[#2D6A94] font-bold tracking-widest text-sm uppercase">{news.category}</span>
                    <h2 className="text-3xl font-bold leading-tight">{news.title}</h2>
                    <p className="text-zinc-400 text-lg leading-relaxed">{news.summary}</p>
                    
                    {appState === AppState.NEWS_PREVIEW && (
                        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-sm">
                            Free preview. Subscribe for full coverage.
                        </div>
                    )}

                    {appState === AppState.NEWS_FULL && (
                        <div className="mt-auto flex justify-between items-center text-zinc-500 text-sm">
                            <span>{activeFeatureIndex + 1} of {NEWS_ITEMS.length}</span>
                            <span>Say "Next"</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (appState === AppState.RADIO_PLAYING) {
        const station = STATIONS[activeFeatureIndex];
        return (
            <div className="absolute inset-0 h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-8 z-20">
                 <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-zinc-800 rounded-full">
                        <IconArrowLeft />
                    </button>
                </div>

                <div className="w-full max-w-sm aspect-square bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden mb-8">
                    {/* Background Visual Element */}
                    <div className="absolute inset-0 bg-[#2D6A94]/5 rounded-full blur-3xl transform scale-150 animate-pulse"></div>
                    
                    <div className="w-32 h-32 rounded-full border-4 border-[#2D6A94] flex items-center justify-center z-10 shadow-[0_0_30px_rgba(45,106,148,0.3)]">
                         <IconRadio />
                    </div>
                    
                    <div className="mt-6 text-center z-10">
                        <h2 className="text-5xl font-black text-white tracking-tighter">{station.freq}</h2>
                        <span className="text-zinc-500 font-medium uppercase tracking-widest">FM Radio</span>
                    </div>

                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
                        LIVE
                    </div>
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white">{station.name}</h3>
                    <p className="text-[#2D6A94] font-medium">{station.type}</p>
                </div>

                <div className="mt-12 flex items-center gap-8">
                    <button onClick={() => setActiveFeatureIndex(prev => (prev - 1 + STATIONS.length) % STATIONS.length)} className="p-4 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2D6A94] animate-[pulse_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                    </div>
                    <button onClick={() => setActiveFeatureIndex(prev => (prev + 1) % STATIONS.length)} className="p-4 rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                
                <p className="mt-8 text-zinc-600 text-sm">Say "Next Station"</p>
            </div>
        );
    }

    // 6. Health Home UI
    if (appState === AppState.HEALTH_HOME) {
        return (
            <div className="absolute inset-0 h-full flex flex-col bg-zinc-900 z-20 overflow-y-auto">
                {/* Header */}
                 <div className="absolute top-4 left-4 z-10">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-black/50 rounded-full backdrop-blur-md">
                        <IconArrowLeft />
                    </button>
                </div>
                
                {/* Hero Section */}
                <div className="relative h-64 bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-8 text-center shrink-0">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
                     <div className="z-10 flex flex-col items-center">
                         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                             <IconHealth className="w-8 h-8 text-white" />
                         </div>
                         <h1 className="text-3xl font-bold text-white">Health Assistant</h1>
                         <p className="text-red-100 mt-2">Connecting you to care.</p>
                     </div>
                </div>
                
                {/* Feature Grid */}
                <div className="flex-1 p-6 space-y-4">
                    {/* UPCOMING REMINDERS */}
                    <div className="bg-zinc-800 rounded-2xl p-6 shadow-lg border border-zinc-700">
                         <div className="flex items-center gap-4 mb-4">
                             <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
                                 <IconCalendar />
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">Daily Reminders</h3>
                                 <p className="text-sm text-zinc-400">Say "Remind me to..."</p>
                             </div>
                        </div>
                        
                        <div className="space-y-3">
                            {reminders.length === 0 ? (
                                <div className="text-center text-zinc-500 py-4 italic">No reminders set.</div>
                            ) : (
                                reminders.map((reminder) => (
                                    <div key={reminder.id} className="p-3 bg-zinc-900/50 rounded-xl flex items-center justify-between border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${reminder.type === 'medication' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {reminder.type === 'medication' ? <IconPill /> : <IconUser />}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${reminder.completed ? 'line-through text-zinc-500' : 'text-white'}`}>{reminder.text}</p>
                                                <p className="text-xs text-zinc-400">{reminder.time}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                                            className="p-2 text-zinc-600 hover:text-red-500"
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Symptom Checker (AI) */}
                    <div className="bg-zinc-800 rounded-2xl p-6 shadow-lg border border-zinc-700">
                        <div className="flex items-center gap-4 mb-3">
                             <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
                                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                             </div>
                             <div>
                                 <h3 className="font-bold text-lg">Symptom Checker</h3>
                                 <p className="text-sm text-zinc-400">Audio-based guidance</p>
                             </div>
                        </div>
                        <button 
                            onClick={() => {
                                speak("I'm listening. Please describe your symptoms.");
                                // Stay in Health Home but trigger listening? Or just handle command via voice
                                startListening();
                            }}
                            className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-bold transition-colors"
                        >
                            Speak to Assistant
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 7. Camera View Overlays (Shared for Idle, Navigation, and Scan)
    // NOTE: The video element is now rendered in the background of the main container,
    // so we only render the UI overlays here.
    const isCameraState = 
        appState === AppState.IDLE_LISTENING || 
        appState === AppState.NAVIGATION_SCAN || 
        appState === AppState.NAVIGATION_MODE || 
        appState === AppState.NAVIGATION_RESULT;

    if (isCameraState) {
      // Determine what to show in the overlay based on state
      let mainOverlayContent = null;
      
      if (appState === AppState.NAVIGATION_MODE) {
          if (navSteps.length > 0) {
              const currentStep = navSteps[currentStepIndex];
              mainOverlayContent = (
                  <div className="bg-[#2D6A94] text-white p-6 rounded-3xl shadow-2xl border-4 border-white/20 mx-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                      <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 font-bold text-2xl">
                              {currentStepIndex + 1}
                          </div>
                          <div>
                              <p className="text-2xl font-bold leading-snug">{currentStep.replace(/^\d+\.\s*/, '')}</p>
                              <div className="flex items-center gap-2 mt-4 text-white/70 text-sm font-medium uppercase tracking-widest">
                                  <span>{currentStepIndex + 1} of {navSteps.length}</span>
                                  <span>•</span>
                                  <span>Say "Next"</span>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          } else if (isProcessing) {
             // Already shown by standard processing text
          }
      } else if (appState === AppState.NAVIGATION_RESULT) {
          mainOverlayContent = (
              <h2 className="text-3xl font-bold text-white bg-black/60 backdrop-blur-md p-4 rounded-xl">{analysisResult}</h2>
          );
      }

      return (
        <div className="absolute inset-0 pointer-events-none flex flex-col z-10">
            {/* Status Overlay - HIDE IN NAVIGATION MODE */}
            {appState !== AppState.NAVIGATION_MODE && (
                <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-2 items-start">
                     <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${appState === AppState.NAVIGATION_SCAN ? 'bg-yellow-400 animate-pulse' : 'bg-[#2D6A94]'}`}></div>
                         <span className="font-medium">
                             {appState === AppState.NAVIGATION_SCAN ? "Scanning..." : (settings.useEsp32Cam ? "ESP32 Live" : "Camera Active")}
                         </span>
                     </div>
                     
                     {settings.destination && (
                         <div className="bg-[#2D6A94]/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white shadow-lg">
                            <IconNavigation />
                            <span className="font-medium max-w-[200px] truncate">{settings.destination}</span>
                         </div>
                     )}
                </div>
            )}

            {/* Manual Entry OR Stop Navigation Button */}
            <div className="absolute bottom-4 right-4 pointer-events-auto">
                 {settings.destination ? (
                    <button 
                        onClick={() => {
                            setSettings(s => ({ ...s, destination: undefined }));
                            setNavSteps([]);
                            speak("Navigation stopped.");
                            transitionTo(AppState.IDLE_LISTENING);
                        }}
                        className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg border border-red-500 active:scale-95 transition-transform"
                        aria-label="Stop Navigation"
                    >
                         <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 ) : (
                     <button 
                        onClick={() => {
                            setDestinationInput(settings.destination || "");
                            transitionTo(AppState.DESTINATION_INPUT);
                        }}
                        className="w-14 h-14 bg-zinc-800/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-zinc-700 active:scale-95 transition-transform"
                        aria-label="Enter Destination"
                     >
                         <IconSearch />
                     </button>
                 )}
            </div>
            
            {/* Camera Scan Trigger Button (Bottom Left) - HIDDEN IN NAV MODE */}
            {appState === AppState.NAVIGATION_MODE ? null : (
                 <div className="absolute bottom-4 left-4 pointer-events-auto">
                    <button 
                        onClick={handleScan}
                        className="w-14 h-14 bg-zinc-800/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-zinc-700 active:scale-95 transition-transform"
                        aria-label="Scan Environment"
                    >
                         <IconCam />
                    </button>
                </div>
            )}

            {/* Bottom Overlay / Result Area */}
            <div className="absolute bottom-20 w-full flex flex-col items-center justify-center text-center pointer-events-auto px-4 pb-4">
                {isProcessing ? (
                    <p className="text-xl font-bold animate-pulse text-yellow-400 bg-black/60 px-4 py-2 rounded-full">Thinking...</p>
                ) : (
                    mainOverlayContent
                )}
            </div>
            
            {appState === AppState.IDLE_LISTENING && !settings.destination && (
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent p-6 pt-12 text-center pointer-events-none">
                    <p className="text-zinc-300 text-lg opacity-80">Say "Go to..." or "Scan ahead"</p>
                </div>
            )}
        </div>
      );
    }

    // 8. Paywall
    if (appState === AppState.PAYWALL) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-6 bg-zinc-950 z-20">
                 <div className="absolute top-4 left-4">
                    <button onClick={() => transitionTo(AppState.IDLE_LISTENING)} className="p-2 bg-zinc-800 rounded-full">
                        <IconArrowLeft />
                    </button>
                 </div>
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-2xl">
                    $
                </div>
                <h2 className="text-3xl font-bold">Subscription Required</h2>
                <div className="text-left space-y-2 text-zinc-400">
                    <p>• Navigation</p>
                    <p>• News</p>
                    <p>• Radio</p>
                    <p>• Advanced Settings</p>
                    <p>• Conversational AI</p>
                    <p>• Health Assistant</p>
                </div>
                <button 
                    onClick={() => handleCommand('subscribe')}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl mt-4"
                >
                    Subscribe
                </button>
            </div>
        );
    }

    return null; // Fallback
  };

  const renderSettings = () => {
      const isSubMenu = appState !== AppState.SETTINGS;
      const title = appState === AppState.SETTINGS ? "Settings" :
                    appState === AppState.SETTINGS_LANGUAGE ? "Language" :
                    appState === AppState.SETTINGS_PROFILE ? "Profile" :
                    appState === AppState.SETTINGS_SUBSCRIPTION ? "Subscription" :
                    appState === AppState.SETTINGS_BLUETOOTH ? "Bluetooth Cane" : "Settings";

      const handleBack = () => {
          if (isSubMenu) transitionTo(AppState.SETTINGS);
          else transitionTo(AppState.IDLE_LISTENING);
      };

      return (
          <div className="flex flex-col h-full bg-zinc-950">
              {/* Settings Header */}
              <div className="h-16 flex items-center px-4 border-b border-zinc-800">
                  <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors">
                      <IconArrowLeft />
                  </button>
                  <h1 className="ml-2 text-xl font-bold">{title}</h1>
              </div>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto p-4">
                  {appState === AppState.SETTINGS && (
                      <div className="space-y-4">
                          {/* Profile Header Card */}
                          <button 
                            onClick={() => transitionTo(AppState.SETTINGS_PROFILE)}
                            className="w-full bg-[#2D6A94] rounded-2xl p-6 flex items-center gap-4 text-left shadow-lg"
                          >
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white">
                                  <IconUser />
                              </div>
                              <div className="flex-1">
                                  <h3 className="text-xl font-bold">Hello, {settings.name || "Guest"}</h3>
                                  <p className="text-blue-100 text-sm">Account Settings</p>
                              </div>
                              <IconChevronRight />
                          </button>

                          <div className="space-y-2">
                              {/* New Camera Source Setting */}
                              <div className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className="p-2 bg-zinc-800 rounded-lg"><IconCam /></div>
                                          <div>
                                              <span className="font-medium text-white block">Camera Source</span>
                                              <span className="text-sm text-zinc-500">
                                                  {settings.useEsp32Cam ? 'ESP32 Cam' : 'Internal Device'}
                                              </span>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => setSettings(s => ({ ...s, useEsp32Cam: !s.useEsp32Cam }))}
                                          className={`w-12 h-7 rounded-full transition-colors relative ${settings.useEsp32Cam ? 'bg-[#2D6A94]' : 'bg-zinc-700'}`}
                                      >
                                          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.useEsp32Cam ? 'translate-x-5' : ''}`} />
                                      </button>
                                  </div>
                                  
                                  {settings.useEsp32Cam && (
                                      <div className="space-y-2">
                                          <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Stream URL</label>
                                          <input 
                                              type="text" 
                                              value={settings.esp32CamUrl}
                                              onChange={(e) => setSettings(s => ({...s, esp32CamUrl: e.target.value}))}
                                              className="w-full bg-zinc-800 border-none rounded-lg p-3 text-white focus:ring-1 focus:ring-[#2D6A94] outline-none font-mono text-sm"
                                          />
                                      </div>
                                  )}
                              </div>

                              <SettingsItem label="Subscription Plan" value={settings.isSubscribed ? "Premium" : "Free"} onClick={() => transitionTo(AppState.SETTINGS_SUBSCRIPTION)} />
                              <SettingsItem label="Language" value={settings.language} onClick={() => transitionTo(AppState.SETTINGS_LANGUAGE)} />
                              <SettingsItem label="Bluetooth Cane Sensor" value={connectedBleDevice ? `Connected (${connectedBleDevice.name})` : "Not Paired"} onClick={() => transitionTo(AppState.SETTINGS_BLUETOOTH)} />
                          </div>
                          
                          <div className="mt-8 text-center">
                               <p className="text-xs text-zinc-600 uppercase tracking-widest">Version 1.0.0</p>
                          </div>
                      </div>
                  )}

                  {appState === AppState.SETTINGS_PROFILE && (
                      <div className="flex flex-col items-center space-y-8 pt-8 px-4">
                           <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500">
                               <IconUser />
                           </div>
                           
                           <div className="text-center space-y-2">
                               <h2 className="text-2xl font-bold">Your Name</h2>
                               <p className="text-[#2D6A94] text-xl font-medium">{settings.name || "Not Set"}</p>
                           </div>

                           <div className="w-full p-6 bg-zinc-900 rounded-2xl text-center space-y-4 border border-zinc-800">
                                <p className="text-zinc-400">To change your name, tap the microphone and say your new name clearly.</p>
                                
                                <div className="flex justify-center pt-2">
                                    <button 
                                        onClick={() => isListening ? stopListening() : startListening()}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-lg shadow-red-900/50 scale-110' : 'bg-[#2D6A94] text-white'}`}
                                    >
                                        <IconMic />
                                    </button>
                                </div>
                                <p className={`text-sm font-bold tracking-widest ${isListening ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                                    {isListening ? "LISTENING..." : "TAP TO SPEAK"}
                                </p>
                           </div>
                      </div>
                  )}

                  {appState === AppState.SETTINGS_LANGUAGE && (
                      <div className="space-y-2">
                          {Object.values(Language).map((lang) => (
                              <button 
                                key={lang}
                                onClick={() => setSettings(s => ({...s, language: lang}))}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border ${settings.language === lang ? 'border-[#2D6A94] bg-[#2D6A94]/10' : 'border-zinc-800 bg-zinc-900'}`}
                              >
                                  <span className="capitalize">{lang === 'en-US' ? 'English' : lang === 'ha-NG' ? 'Hausa' : lang === 'ig-NG' ? 'Igbo' : 'Yoruba'}</span>
                                  {settings.language === lang && <IconCheck />}
                              </button>
                          ))}
                      </div>
                  )}

                  {appState === AppState.SETTINGS_SUBSCRIPTION && (
                      <div className="space-y-6 flex flex-col items-center pt-8">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${settings.isSubscribed ? 'bg-gradient-to-br from-[#2D6A94] to-[#1c4e6e] text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                              {settings.isSubscribed ? 'Pro' : 'Free'}
                          </div>
                          
                          <div className="text-center space-y-2">
                              <h2 className="text-2xl font-bold">{settings.isSubscribed ? "Premium Plan Active" : "Free Plan"}</h2>
                              <p className="text-zinc-400 max-w-[250px] mx-auto">
                                  {settings.isSubscribed 
                                    ? "You have full access to navigation, news, and advanced AI features." 
                                    : "Upgrade to unlock advanced navigation, real-time news, and radio features."}
                              </p>
                          </div>

                          <button 
                            onClick={() => settings.isSubscribed ? setSettings(s => ({...s, isSubscribed: false})) : handleCommand('subscribe')}
                            className={`w-full max-w-sm py-4 rounded-full font-bold text-lg transition-all ${settings.isSubscribed ? 'bg-zinc-800 text-red-400' : 'bg-white text-black'}`}
                          >
                              {settings.isSubscribed ? "Cancel Subscription" : "Upgrade to Premium"}
                          </button>
                      </div>
                  )}

                  {appState === AppState.SETTINGS_BLUETOOTH && (
                      <div className="space-y-4">
                           {/* Scan Status & Telemetry Header */}
                           <div className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4 shadow-lg relative overflow-hidden">
                               <div className="flex items-center justify-between">
                                   <div>
                                       <span className="text-xs uppercase font-extrabold tracking-widest text-[#2D6A94] block">Bluetooth Status</span>
                                       <h2 className="text-xl font-bold text-white mt-0.5">
                                           {connectedBleDevice ? 'Connected' : (isBleScanning ? 'Scanning...' : 'Offline')}
                                       </h2>
                                   </div>
                                   <div className="flex gap-2">
                                       <button
                                           onClick={async () => {
                                               const ble = BluetoothService.getInstance();
                                               if (isBleScanning) {
                                                   await ble.stopScan();
                                                   setIsBleScanning(false);
                                               } else {
                                                   setIsBleScanning(true);
                                                   setDiscoveredDevices([]);
                                                   speak("Scanning for devices...");
                                                   try {
                                                       await ble.startScan((dev) => {
                                                           setDiscoveredDevices(prev => {
                                                               if (prev.some(d => d.deviceId === dev.deviceId)) return prev;
                                                               return [...prev, dev];
                                                           });
                                                       });
                                                   } catch (e) {
                                                       setIsBleScanning(false);
                                                       speak("Bluetooth scan failed.");
                                                   }
                                               }
                                           }}
                                           className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${isBleScanning ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-[#2D6A94] text-white'}`}
                                       >
                                           {isBleScanning ? 'Stop' : 'Scan'}
                                       </button>
                                   </div>
                               </div>

                               {/* Scanning animated pulsing circles */}
                               {isBleScanning && (
                                   <div className="flex items-center justify-center py-4 relative h-16">
                                       <div className="absolute w-12 h-12 rounded-full border border-cyan-500/40 animate-ping"></div>
                                       <div className="absolute w-8 h-8 rounded-full border border-[#2D6A94]/60 animate-pulse"></div>
                                       <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                   </div>
                               )}

                               {/* Active connected telemetry */}
                               {connectedBleDevice && (
                                   <div className="pt-3 border-t border-zinc-800 space-y-3">
                                       <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                                           <div className="flex flex-col">
                                               <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Device Telemetry</span>
                                               <span className="text-zinc-300 text-sm font-bold truncate max-w-[180px]">{connectedBleDevice.name}</span>
                                           </div>
                                           <div className="flex flex-col items-end">
                                               <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Distance</span>
                                               <span className={`text-base font-black ${obstacleWarning ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                                   {currentDistance !== null ? `${currentDistance.toFixed(2)}m` : 'Measuring...'}
                                               </span>
                                           </div>
                                       </div>
                                       
                                       {/* Signal RSSI Indicator */}
                                       <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                                           <div className="flex items-center gap-1.5">
                                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                               <span>GATT Telemetry Active</span>
                                           </div>
                                           <span>Signal: -58 dBm (Excellent)</span>
                                       </div>
                                   </div>
                               )}
                           </div>

                           {/* Device Discovery List */}
                           <div className="space-y-2">
                               <h3 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500 px-1">Discovered BLE Devices</h3>
                               
                               {discoveredDevices.length === 0 ? (
                                   <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/40">
                                       <span className="text-zinc-600 text-3xl block mb-2">📡</span>
                                       <p className="text-zinc-500 text-sm font-semibold">No devices visible</p>
                                       <p className="text-zinc-600 text-xs mt-1">Tap 'Scan' above to start searching.</p>
                                   </div>
                               ) : (
                                   <div className="space-y-2">
                                       {discoveredDevices.map((dev) => {
                                           const isConnected = connectedBleDevice?.deviceId === dev.deviceId;
                                           return (
                                               <div 
                                                   key={dev.deviceId}
                                                   className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isConnected ? 'bg-[#2D6A94]/10 border-[#2D6A94]/50' : 'bg-zinc-900 border-zinc-800'}`}
                                               >
                                                   <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                       <div className="p-2.5 bg-zinc-800 rounded-lg shrink-0">
                                                           <IconBluetooth connected={isConnected} />
                                                       </div>
                                                       <div className="min-w-0">
                                                           <span className="font-bold text-sm text-white block truncate">{dev.name}</span>
                                                           <span className="text-xs text-zinc-500 block font-mono">{dev.deviceId}</span>
                                                       </div>
                                                   </div>
                                                   
                                                   <button
                                                       onClick={async () => {
                                                           const ble = BluetoothService.getInstance();
                                                           if (isConnected) {
                                                               speak("Disconnecting.");
                                                               await ble.disconnect(dev.deviceId);
                                                               setSettings(s => ({ ...s, sensorConnected: false }));
                                                               setConnectedBleDevice(null);
                                                               setCurrentDistance(null);
                                                               setObstacleWarning(false);
                                                           } else {
                                                               speak("Connecting to cane sensor.");
                                                               try {
                                                                   const connectedDev = await ble.connect(dev.deviceId, () => {
                                                                       setSettings(s => ({ ...s, sensorConnected: false }));
                                                                       setConnectedBleDevice(null);
                                                                       setCurrentDistance(null);
                                                                       setObstacleWarning(false);
                                                                   });
                                                                   setSettings(s => ({ 
                                                                       ...s, 
                                                                       sensorConnected: true,
                                                                       bluetoothDeviceName: connectedDev.name,
                                                                       bluetoothDeviceAddress: connectedDev.deviceId
                                                                   }));
                                                                   setConnectedBleDevice(connectedDev);
                                                               } catch (e) {
                                                                   speak("Connection failed.");
                                                               }
                                                            }
                                                       }}
                                                       className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0 ${isConnected ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                                                   >
                                                       {isConnected ? 'Disconnect' : 'Connect'}
                                                   </button>
                                               </div>
                                           );
                                       })}
                                   </div>
                               )}
                           </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <MobileSimulator>
      <div className="h-full w-full bg-zinc-950 text-white overflow-hidden flex flex-col font-sans relative">
          
          {/* OBSTACLE WARNING OVERLAYS */}
          {obstacleWarning && (
            <div className="absolute inset-0 bg-red-500/15 pointer-events-none z-20 animate-pulse border-4 border-red-500/40 rounded-3xl" />
          )}

          {obstacleWarning && currentDistance !== null && (
            <div className="absolute top-16 left-4 right-4 bg-red-950/90 backdrop-blur-xl border border-red-500/40 p-4 rounded-2xl flex items-center justify-between shadow-2xl z-40 select-none">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-pulse">⚠️</span>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-red-400 block">Collision Risk</span>
                  <span className="font-bold text-white text-base">Obstacle {currentDistance.toFixed(2)}m Ahead</span>
                </div>
              </div>
              <div className="px-3 py-1 bg-red-500/25 border border-red-500/40 rounded-full text-xs font-bold text-red-300">
                Critical
              </div>
            </div>
          )}

          {/* BACKGROUND CAMERA LAYER - Conditionally render ESP32 Stream or Internal Video */}
          {settings.useEsp32Cam ? (
               <img 
                  ref={imgRef}
                  src={settings.esp32CamUrl}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  crossOrigin="anonymous"
                  alt="ESP32 Stream"
               />
          ) : (
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover z-0"
              />
          )}
  
          {/* HEADER */}
          {!appState.toString().startsWith('SETTINGS') && appState !== AppState.RADIO_PLAYING && !appState.toString().startsWith('NEWS') && appState !== AppState.HEALTH_HOME && appState !== AppState.DESTINATION_INPUT && appState !== AppState.DOCUMENT_READER && (
              <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 shrink-0 bg-zinc-950/80 backdrop-blur-md z-30 relative select-none">
                  <span className="font-title font-extrabold tracking-widest text-[#2D6A94] drop-shadow-[0_0_8px_rgba(45,106,148,0.3)]">ELENII</span>
                  <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 font-medium text-zinc-400">
                          <IconBluetooth connected={settings.sensorConnected} />
                          <span>{settings.sensorConnected ? (connectedBleDevice ? connectedBleDevice.name : 'Bluetooth') : 'Offline'}</span>
                      </div>
                      
                      {/* Reader Button */}
                      <button 
                          onClick={() => {
                              if (settings.isSubscribed) {
                                  transitionTo(AppState.DOCUMENT_READER);
                              } else {
                                  transitionTo(AppState.PAYWALL);
                              }
                          }}
                          className="p-2 bg-zinc-900/80 border border-white/5 text-zinc-300 rounded-full hover:bg-zinc-800 hover:text-white transition-all active:scale-90"
                          aria-label="Document Reader"
                      >
                          <IconDocument />
                      </button>
  
                      {/* Health Button moved to Header */}
                      <button 
                          onClick={() => {
                              if (settings.isSubscribed) {
                                  transitionTo(AppState.HEALTH_HOME);
                              } else {
                                  transitionTo(AppState.PAYWALL);
                              }
                          }}
                          className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full hover:bg-red-500/25 hover:text-red-300 transition-all active:scale-90"
                          aria-label="Health Assistant"
                      >
                          <IconHealth className="w-5 h-5" />
                      </button>
  
                      <button 
                        onClick={() => transitionTo(AppState.SETTINGS)} 
                        className="p-2 text-zinc-300 hover:text-white transition-colors active:rotate-45 duration-300"
                        aria-label="Settings"
                      >
                          <IconSettings />
                      </button>
                  </div>
              </div>
          )}
  
          {/* MAIN CONTENT AREA - Overlays the camera */}
          <main className="flex-1 overflow-hidden relative z-10">
              {renderContent()}
          </main>
  
          {/* FOOTER */}
          {appState !== AppState.DESTINATION_INPUT && appState !== AppState.DOCUMENT_READER && (
              <div className="h-32 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 shrink-0 flex flex-col items-center justify-center pb-5 z-30 relative select-none">
                  
                  <div className="flex items-center justify-evenly w-full px-4 mb-3">
                      {/* Radio Button */}
                      {!appState.toString().startsWith('ONBOARDING') && (
                          <button 
                              onClick={() => {
                                  if (settings.isSubscribed) {
                                      setActiveFeatureIndex(0);
                                      transitionTo(AppState.RADIO_PLAYING);
                                  } else {
                                      transitionTo(AppState.PAYWALL);
                                  }
                              }}
                              className={`p-3.5 rounded-full transition-all border ${appState === AppState.RADIO_PLAYING ? 'bg-[#2D6A94] border-[#387fae] text-white shadow-lg shadow-[#2D6A94]/25 scale-105' : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95'}`}
                              aria-label="Radio"
                          >
                              <IconRadio />
                          </button>
                      )}
  
                      {/* Dynamic Button (Press to Talk / Stop) */}
                      <div className="relative">
                          {isListening && (
                            <span className="absolute -inset-1 rounded-full bg-red-500/20 blur-md animate-pulse"></span>
                          )}
                          <button 
                              onClick={() => isListening ? stopListening() : startListening()}
                              className={`
                                  w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 z-10 relative border
                                  ${isListening ? 'bg-red-500 border-red-400 text-white shadow-red-500/20 shadow-xl' : 'bg-white border-zinc-200 text-black shadow-white/10 shadow-xl hover:bg-zinc-100'}
                              `}
                          >
                          {isListening ? <div className="w-5 h-5 bg-white rounded-xs animate-pulse" /> : <IconMic />}
                          </button>
                      </div>
  
                      {/* News Button */}
                      {!appState.toString().startsWith('ONBOARDING') && (
                          <button 
                              onClick={() => {
                                  setActiveFeatureIndex(0);
                                  transitionTo(settings.isSubscribed ? AppState.NEWS_FULL : AppState.NEWS_PREVIEW);
                              }}
                              className={`p-3.5 rounded-full transition-all border ${appState === AppState.NEWS_FULL || appState === AppState.NEWS_PREVIEW ? 'bg-[#2D6A94] border-[#387fae] text-white shadow-lg shadow-[#2D6A94]/25 scale-105' : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95'}`}
                              aria-label="News"
                          >
                              <IconNews />
                          </button>
                      )}
                  </div>
  
                  {/* Visualizer / Status Text */}
                  <div className="w-full px-8 h-8 flex items-center justify-center">
                      {isListening || isProcessing ? (
                          <Visualizer isActive={isListening} mode={isListening ? 'listening' : 'processing'} />
                      ) : (
                          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase animate-pulse select-none">
                              Tap mic to speak
                          </p>
                      )}
                  </div>
              </div>
          )}
      </div>
    </MobileSimulator>
  );
}

// --- Helper Components ---

const SettingsItem = ({ label, value, onClick }: { label: string, value: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 active:bg-zinc-800 transition-colors">
        <div className="flex flex-col items-start">
            <span className="font-medium text-white">{label}</span>
            <span className="text-sm text-zinc-500 capitalize">{value}</span>
        </div>
        <IconChevronRight />
    </button>
);