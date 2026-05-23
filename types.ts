export enum AppState {
  LAUNCH = 'LAUNCH',
  ONBOARDING_WELCOME = 'ONBOARDING_WELCOME',
  ONBOARDING_LANGUAGE = 'ONBOARDING_LANGUAGE',
  ONBOARDING_PERMISSION = 'ONBOARDING_PERMISSION',
  ONBOARDING_COMPLETE = 'ONBOARDING_COMPLETE',
  IDLE_LISTENING = 'IDLE_LISTENING',
  ACTIVE_LISTENING = 'ACTIVE_LISTENING',
  PROCESSING = 'PROCESSING',
  NAVIGATION_SCAN = 'NAVIGATION_SCAN', // The act of analyzing
  NAVIGATION_RESULT = 'NAVIGATION_RESULT',
  NAVIGATION_MODE = 'NAVIGATION_MODE', // Continuous mode
  DESTINATION_INPUT = 'DESTINATION_INPUT', // Manual address entry
  NEWS_PREVIEW = 'NEWS_PREVIEW',
  NEWS_FULL = 'NEWS_FULL',
  RADIO_PLAYING = 'RADIO_PLAYING',
  HEALTH_HOME = 'HEALTH_HOME', // New Health Interface
  DOCUMENT_READER = 'DOCUMENT_READER', // New Document Reader Interface
  SETTINGS = 'SETTINGS', // Main Settings Menu
  SETTINGS_PROFILE = 'SETTINGS_PROFILE', // User Profile & Name
  SETTINGS_LANGUAGE = 'SETTINGS_LANGUAGE',
  SETTINGS_SUBSCRIPTION = 'SETTINGS_SUBSCRIPTION',
  SETTINGS_BLUETOOTH = 'SETTINGS_BLUETOOTH',
  PAYWALL = 'PAYWALL',
  SUBSCRIPTION_CONFIRM = 'SUBSCRIPTION_CONFIRM',
  HELP = 'HELP',
  ERROR = 'ERROR'
}

export enum Language {
  ENGLISH = 'en-US',
  HAUSA = 'ha-NG',
  IGBO = 'ig-NG',
  YORUBA = 'yo-NG'
}

export interface Reminder {
  id: string;
  text: string;
  time: string; // Stored as "HH:MM" 24h format for simplicity or display string
  type: 'medication' | 'appointment' | 'general';
  completed: boolean;
}

export interface UserSettings {
  name: string;
  language: Language;
  isSubscribed: boolean;
  sensorConnected: boolean;
  volume: number;
  destination?: string;
  useEsp32Cam: boolean;
  esp32CamUrl: string;
  bluetoothDeviceName?: string;
  bluetoothDeviceAddress?: string;
  bluetoothGattService?: string;
  bluetoothGattCharacteristic?: string;
}