export type Language = 'sv' | 'en'

export const translations = {
  sv: {
    // Header
    settings: 'Inställningar',
    userMenu: 'Användarmeny',
    user: 'Användare',
    logout: 'Logga ut',
    login: 'Logga in',

    // Input
    inputPlaceholder: 'Skriv din fråga här...',
    stopGenerating: 'Stoppa generering',

    // Message
    copyCode: 'Kopiera kod',
    copied: 'Kopierat!',
    copyText: 'Kopiera text',
    you: 'Du',
    magisterTWriting: 'Magister T skriver',

    // Sidebar
    justNow: 'Just nu',
    minutesAgo: (n: number) => `${n} min sedan`,
    hoursAgo: (n: number) => `${n} tim sedan`,
    daysAgo: (n: number) => `${n} dagar sedan`,
    rename: 'Byt namn',
    delete: 'Ta bort',
    newChat: 'Ny chatt',
    previousChats: 'Tidigare Chattar',
    noSavedChats: 'Inga sparade chattar än',
    admin: 'Admin',
    versionInfo: 'v1.0 • Jan 2026',
    personification: 'Personifiering av Markus Tångring',

    // Settings
    settingsTitle: 'Inställningar',
    dataManagement: 'Datahantering',
    mustBeLoggedIn: 'Du måste vara inloggad för att hantera din data.',
    deleteAllChats: 'Radera alla chattar',
    deleteConfirm: 'Är du säker? Detta kommer radera all din chatthistorik permanent.',
    yesDeleteAll: 'Ja, radera allt',
    cancel: 'Avbryt',
    deleteAccount: 'Radera konto och all data',
    areYouSure: 'Är du helt säker?',
    deleteAccountWarning: 'Detta raderar ditt konto och ALL data permanent. Detta kan inte ångras.',
    deleting: 'Raderar...',
    aboutMagisterT: 'Om Magister T',
    aboutDescription: 'Magister T är din AI-drivna lärare som hjälper dig förstå programmering och AI.',
    version: 'Version 1.0.0',

    // Login
    loggingIn: 'Loggar in...',
    loginWithGoogle: 'Logga in med Google',
    loginFailed: 'Inloggningen misslyckades. Försök igen.',
    googleLoginError: 'Något gick fel med Google-inloggningen.',
    loginToContinue: 'Logga in för att fortsätta',
    googleOAuthNotConfigured: 'Google OAuth ej konfigurerat',
    chatHistorySaved: 'Din chatthistorik sparas på ditt konto',

    // Chat
    welcomeMessage: 'Hej! Jag är Magister T',
    suggestionText: 'Ställ en fråga så lär vi oss tillsammans!',
    suggestion1: 'Hur fungerar en for-loop?',
    suggestion2: 'Vad är let och const?',
    suggestion2Alt: 'Vad är skillnaden mellan let och const?',
    suggestion3: 'Förklara vad en API är',
    magisterTThinking: 'Magister T funderar',

    // Admin
    anonymous: 'Anonym',
    today: 'Idag',
    todayShort: 'idag',
    total: 'Totalt',
    chats: 'chattar',
    messages: 'meddelanden',
    msg: 'msg',
    msgPerChat: 'msg/chatt',
    users: 'användare',
    chatsTab: 'Chattar',
    aiPromptsTab: 'AI-Prompts',
    latestChats: 'Senaste chattar',
    noChatsYet: 'Inga chattar än',
    noPromptsFound: 'Inga prompts hittades. Starta om servern för att skapa standardprompts.',
    saved: 'Sparat!',
    saving: 'Sparar...',
    saveChanges: 'Spara ändringar',
    writePromptHere: 'Skriv prompt här...',
    lastUpdated: 'Senast uppdaterad',
    noMessages: 'Inga meddelanden',

    // Errors
    somethingWentWrong: 'Något gick fel med anropet',
    errorTryAgain: 'Oj, något gick fel! Försök igen om en stund.',

    // Misc
    newConversation: 'Ny konversation',
    magisterT: 'Magister T',
    language: 'Språk',
  },

  en: {
    // Header
    settings: 'Settings',
    userMenu: 'User menu',
    user: 'User',
    logout: 'Log out',
    login: 'Log in',

    // Input
    inputPlaceholder: 'Type your question here...',
    stopGenerating: 'Stop generating',

    // Message
    copyCode: 'Copy code',
    copied: 'Copied!',
    copyText: 'Copy text',
    you: 'You',
    magisterTWriting: 'Magister T is writing',

    // Sidebar
    justNow: 'Just now',
    minutesAgo: (n: number) => `${n} min ago`,
    hoursAgo: (n: number) => `${n} hours ago`,
    daysAgo: (n: number) => `${n} days ago`,
    rename: 'Rename',
    delete: 'Delete',
    newChat: 'New chat',
    previousChats: 'Previous Chats',
    noSavedChats: 'No saved chats yet',
    admin: 'Admin',
    versionInfo: 'v1.0 • Jan 2026',
    personification: 'Personification of Markus Tångring',

    // Settings
    settingsTitle: 'Settings',
    dataManagement: 'Data Management',
    mustBeLoggedIn: 'You must be logged in to manage your data.',
    deleteAllChats: 'Delete all chats',
    deleteConfirm: 'Are you sure? This will permanently delete all your chat history.',
    yesDeleteAll: 'Yes, delete all',
    cancel: 'Cancel',
    deleteAccount: 'Delete account and all data',
    areYouSure: 'Are you completely sure?',
    deleteAccountWarning: 'This will permanently delete your account and ALL data. This cannot be undone.',
    deleting: 'Deleting...',
    aboutMagisterT: 'About Magister T',
    aboutDescription: 'Magister T is your AI-powered teacher that helps you understand programming and AI.',
    version: 'Version 1.0.0',

    // Login
    loggingIn: 'Logging in...',
    loginWithGoogle: 'Log in with Google',
    loginFailed: 'Login failed. Please try again.',
    googleLoginError: 'Something went wrong with the Google login.',
    loginToContinue: 'Log in to continue',
    googleOAuthNotConfigured: 'Google OAuth not configured',
    chatHistorySaved: 'Your chat history is saved to your account',

    // Chat
    welcomeMessage: "Hi! I'm Magister T",
    suggestionText: 'Ask a question and we learn together!',
    suggestion1: 'How does a for-loop work?',
    suggestion2: 'What are let and const?',
    suggestion2Alt: 'What is the difference between let and const?',
    suggestion3: 'Explain what an API is',
    magisterTThinking: 'Magister T is thinking',

    // Admin
    anonymous: 'Anonymous',
    today: 'Today',
    todayShort: 'today',
    total: 'Total',
    chats: 'chats',
    messages: 'messages',
    msg: 'msg',
    msgPerChat: 'msg/chat',
    users: 'users',
    chatsTab: 'Chats',
    aiPromptsTab: 'AI Prompts',
    latestChats: 'Latest chats',
    noChatsYet: 'No chats yet',
    noPromptsFound: 'No prompts found. Restart the server to create default prompts.',
    saved: 'Saved!',
    saving: 'Saving...',
    saveChanges: 'Save changes',
    writePromptHere: 'Write prompt here...',
    lastUpdated: 'Last updated',
    noMessages: 'No messages',

    // Errors
    somethingWentWrong: 'Something went wrong with the request',
    errorTryAgain: 'Oops, something went wrong! Try again in a moment.',

    // Misc
    newConversation: 'New conversation',
    magisterT: 'Magister T',
    language: 'Language',
  },
} as const

export type TranslationKey = keyof typeof translations.sv
