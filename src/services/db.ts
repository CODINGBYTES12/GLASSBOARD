import { 
  isFirebaseConfigured, 
  auth, 
  firestore, 
  database, 
  storage 
} from './firebase';
import { 
  SEED_USERS, 
  SEED_MODULES, 
  SEED_CHECKLISTS, 
  SEED_FILES, 
  SEED_HANDSHAKES, 
  SEED_AUDIT_LOGS,
  User, 
  Module, 
  ChecklistItem, 
  Handshake, 
  SharedFile, 
  AuditLog 
} from './mockData';

// Safe cross-platform Storage Engine (fallback to in-memory if no localStorage)
const storageEngine = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Storage not available', e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }
};

// --- Offline In-Memory & LocalStorage DB State ---
let dbUsers: User[] = [];
let dbModules: Module[] = [];
let dbChecklists: ChecklistItem[] = [];
let dbHandshakes: Handshake[] = [];
let dbFiles: SharedFile[] = [];
let dbLogs: AuditLog[] = [];
let dbCurrentUser: User | null = null;

// Pub/Sub listeners for real-time updates
const listeners: { [key: string]: ((data: any) => void)[] } = {
  users: [],
  modules: [],
  checklists: [],
  handshakes: [],
  files: [],
  auditLogs: [],
  currentUser: [],
};

const notify = (key: string, data: any) => {
  if (listeners[key]) {
    listeners[key].forEach(cb => cb(data));
  }
};

// Initialize Offline Database
const initOfflineDb = () => {
  const getOrSeed = <T>(key: string, seed: T[]): T[] => {
    const data = storageEngine.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return seed;
      }
    } else {
      storageEngine.setItem(key, JSON.stringify(seed));
      return seed;
    }
  };

  dbUsers = getOrSeed('gb_users', SEED_USERS);
  dbModules = getOrSeed('gb_modules', SEED_MODULES);
  dbChecklists = getOrSeed('gb_checklists', SEED_CHECKLISTS);
  dbFiles = getOrSeed('gb_files', SEED_FILES);
  dbHandshakes = getOrSeed('gb_handshakes', SEED_HANDSHAKES);
  dbLogs = getOrSeed('gb_logs', SEED_AUDIT_LOGS);

  // Set default current user for quick login/testing
  const savedUser = storageEngine.getItem('gb_current_user');
  if (savedUser) {
    try {
      dbCurrentUser = JSON.parse(savedUser);
    } catch {
      dbCurrentUser = null;
    }
  }
};

initOfflineDb();

const saveToStorage = (key: string, data: any) => {
  storageEngine.setItem(key, JSON.stringify(data));
};

// Helper to calculate progress percentage for a module based on its checklists
const computeProgress = (moduleId: string): number => {
  const items = dbChecklists.filter(i => i.moduleId === moduleId);
  if (items.length === 0) return 0;
  const completed = items.filter(i => i.completed).length;
  return Math.round((completed / items.length) * 100);
};

export const DatabaseService = {
  // --- Auth Services ---
  login: async (email: string, passwordSecret: string): Promise<User> => {
    if (isFirebaseConfigured && auth) {
      // In real Firebase, call signInWithEmailAndPassword
      // We will simulate it and hook into Firestore user document
      throw new Error('Real Firebase auth not implemented yet in this code layout. Use credentials.');
    } else {
      // Mock Login
      const user = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        dbCurrentUser = user;
        saveToStorage('gb_current_user', user);
        notify('currentUser', user);
        return user;
      }
      throw new Error('User not found. Use bob@glassboard.com or alice@glassboard.com');
    }
  },

  logout: async (): Promise<void> => {
    dbCurrentUser = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('gb_current_user');
    }
    notify('currentUser', null);
  },

  getCurrentUser: (): User | null => {
    return dbCurrentUser;
  },

  subscribeCurrentUser: (callback: (user: User | null) => void) => {
    listeners.currentUser.push(callback);
    callback(dbCurrentUser);
    return () => {
      listeners.currentUser = listeners.currentUser.filter(cb => cb !== callback);
    };
  },

  // --- Module Services ---
  getModules: async (): Promise<Module[]> => {
    return dbModules;
  },

  subscribeModules: (callback: (modules: Module[]) => void) => {
    listeners.modules.push(callback);
    callback(dbModules);
    return () => {
      listeners.modules = listeners.modules.filter(cb => cb !== callback);
    };
  },

  updateModuleStatus: async (moduleId: string, status: 'on_track' | 'delayed' | 'blocked'): Promise<void> => {
    const mod = dbModules.find(m => m.id === moduleId);
    if (mod) {
      const oldStatus = mod.status;
      mod.status = status;
      saveToStorage('gb_modules', dbModules);
      notify('modules', [...dbModules]);

      // Add to audit log
      const actorName = dbCurrentUser?.name || 'System';
      const logText = `${mod.name} status updated from ${oldStatus.replace('_', ' ')} to ${status.replace('_', ' ')}.`;
      await DatabaseService.addAuditLog('progress_change', logText, moduleId);
    }
  },

  // --- Checklist Services ---
  subscribeChecklist: (moduleId: string, callback: (items: ChecklistItem[]) => void) => {
    const filterAndNotify = () => {
      callback(dbChecklists.filter(item => item.moduleId === moduleId));
    };

    listeners.checklists.push(filterAndNotify);
    filterAndNotify();

    return () => {
      listeners.checklists = listeners.checklists.filter(cb => cb !== filterAndNotify);
    };
  },

  toggleChecklistItem: async (itemId: string): Promise<void> => {
    const item = dbChecklists.find(i => i.id === itemId);
    if (item) {
      item.completed = !item.completed;
      item.updatedAt = new Date().toISOString();
      item.updatedBy = dbCurrentUser?.name || 'Unknown';
      saveToStorage('gb_checklists', dbChecklists);
      notify('checklists', [...dbChecklists]);

      // Dynamic calculation of module progress
      const moduleId = item.moduleId;
      const mod = dbModules.find(m => m.id === moduleId);
      if (mod) {
        const oldProgress = mod.progress;
        const newProgress = computeProgress(moduleId);
        mod.progress = newProgress;
        
        // Auto resolve status blocking
        if (newProgress === 100 && mod.status === 'blocked') {
          mod.status = 'on_track';
        }
        
        saveToStorage('gb_modules', dbModules);
        notify('modules', [...dbModules]);

        // Add to audit log
        const actorName = dbCurrentUser?.name || 'System';
        const logText = `${actorName} marked "${item.text}" as ${item.completed ? 'completed' : 'incomplete'} in ${mod.name}. Progress: ${newProgress}%.`;
        await DatabaseService.addAuditLog('checklist_toggle', logText, moduleId);
      }
    }
  },

  addChecklistItem: async (moduleId: string, text: string): Promise<void> => {
    const newItem: ChecklistItem = {
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      moduleId,
      text,
      completed: false,
      updatedAt: new Date().toISOString(),
      updatedBy: dbCurrentUser?.name || 'Unknown',
    };
    dbChecklists.push(newItem);
    saveToStorage('gb_checklists', dbChecklists);
    notify('checklists', [...dbChecklists]);

    // Recalculate module progress
    const mod = dbModules.find(m => m.id === moduleId);
    if (mod) {
      mod.progress = computeProgress(moduleId);
      saveToStorage('gb_modules', dbModules);
      notify('modules', [...dbModules]);
    }

    const actorName = dbCurrentUser?.name || 'System';
    await DatabaseService.addAuditLog('checklist_toggle', `Added checklist item: "${text}" in ${mod?.name || moduleId}`, moduleId);
  },

  deleteChecklistItem: async (itemId: string): Promise<void> => {
    const item = dbChecklists.find(i => i.id === itemId);
    if (item) {
      const moduleId = item.moduleId;
      dbChecklists = dbChecklists.filter(i => i.id !== itemId);
      saveToStorage('gb_checklists', dbChecklists);
      notify('checklists', [...dbChecklists]);

      // Recalculate module progress
      const mod = dbModules.find(m => m.id === moduleId);
      if (mod) {
        mod.progress = computeProgress(moduleId);
        saveToStorage('gb_modules', dbModules);
        notify('modules', [...dbModules]);
      }
    }
  },

  // --- Handshake Services ---
  subscribeHandshakes: (callback: (handshakes: Handshake[]) => void) => {
    listeners.handshakes.push(callback);
    callback(dbHandshakes);
    return () => {
      listeners.handshakes = listeners.handshakes.filter(cb => cb !== callback);
    };
  },

  sendHandshake: async (
    fromModule: string, 
    toModule: string, 
    comments: string, 
    proofName: string, 
    proofUrl: string
  ): Promise<void> => {
    // Basic verification: Check checklist is 100% completed
    const progress = computeProgress(fromModule);
    if (progress < 100) {
      // Allow it anyway for demo purposes but warning
      console.warn('Initiating handshake before checklist completion!');
    }

    const newHandshake: Handshake = {
      id: 'h_' + Math.random().toString(36).substr(2, 9),
      fromModule,
      toModule,
      status: 'pending',
      proofUrl: proofUrl || 'https://picsum.photos/400/300', // Mock fallback url
      proofName: proofName || 'delivery_proof.pdf',
      timestamp: new Date().toISOString(),
      comments,
    };

    dbHandshakes.unshift(newHandshake);
    saveToStorage('gb_handshakes', dbHandshakes);
    notify('handshakes', [...dbHandshakes]);

    // Update fromModule status to 'on_track' and toModule to 'blocked' (simulating dependencies)
    // Wait, let's look at dependencies. When Module A handovers to Module B, B is no longer blocked by A
    const fromModName = dbModules.find(m => m.id === fromModule)?.name || fromModule;
    const toModName = dbModules.find(m => m.id === toModule)?.name || toModule;

    const actorName = dbCurrentUser?.name || 'System';
    const logText = `${actorName} initiated Handshake Request from ${fromModName} to ${toModName} (Proof: ${proofName}).`;
    await DatabaseService.addAuditLog('handshake_request', logText, fromModule);
  },

  respondToHandshake: async (
    handshakeId: string, 
    status: 'accepted' | 'rejected', 
    rejectionReason?: string
  ): Promise<void> => {
    const hs = dbHandshakes.find(h => h.id === handshakeId);
    if (hs) {
      hs.status = status;
      hs.handledAt = new Date().toISOString();
      hs.handledBy = dbCurrentUser?.name || 'Unknown';
      if (status === 'rejected') {
        hs.rejectionReason = rejectionReason;
      }
      
      saveToStorage('gb_handshakes', dbHandshakes);
      notify('handshakes', [...dbHandshakes]);

      const fromMod = dbModules.find(m => m.id === hs.fromModule);
      const toMod = dbModules.find(m => m.id === hs.toModule);

      // Cascading logic: If Handshake accepted, resolve blocks!
      if (status === 'accepted') {
        if (toMod && toMod.status === 'blocked') {
          toMod.status = 'on_track';
        }
        if (fromMod) {
          fromMod.progress = 100; // Force 100 on acceptance
        }
      } else if (status === 'rejected') {
        // If rejected, set both statuses to highlight delay/block
        if (fromMod) {
          fromMod.status = 'delayed';
        }
      }

      saveToStorage('gb_modules', dbModules);
      notify('modules', [...dbModules]);

      // Log audit
      const actorName = dbCurrentUser?.name || 'System';
      const logType = status === 'accepted' ? 'handshake_accepted' : 'handshake_rejected';
      const reasonStr = status === 'rejected' ? ` Reason: "${rejectionReason}"` : '';
      const logText = `${actorName} (${toMod?.name || hs.toModule}) ${status} Handshake from ${fromMod?.name || hs.fromModule}.${reasonStr}`;
      
      await DatabaseService.addAuditLog(logType, logText, hs.toModule);
    }
  },

  // --- Shared File Workspace & Version Control ---
  subscribeFiles: (callback: (files: SharedFile[]) => void) => {
    listeners.files.push(callback);
    callback(dbFiles);
    return () => {
      listeners.files = listeners.files.filter(cb => cb !== callback);
    };
  },

  uploadSharedFile: async (
    name: string, 
    urlOrBase64: string, 
    moduleId: string, 
    description: string
  ): Promise<void> => {
    // Check if file with same name exists in this shared workspace
    const existingFile = dbFiles.find(f => f.name.toLowerCase() === name.toLowerCase());
    const actorName = dbCurrentUser?.name || 'Unknown';
    const timestamp = new Date().toISOString();

    if (existingFile) {
      // Version Control Update
      const nextVersion = existingFile.version + 1;
      existingFile.version = nextVersion;
      existingFile.url = urlOrBase64;
      existingFile.uploadedBy = actorName;
      existingFile.uploadedAt = timestamp;
      
      // Append to version history audit trail
      existingFile.history.unshift({
        version: nextVersion,
        url: urlOrBase64,
        updatedBy: actorName,
        updatedAt: timestamp,
        description: description || `Updated to version ${nextVersion}.`,
      });

      saveToStorage('gb_files', dbFiles);
      notify('files', [...dbFiles]);

      const logText = `${actorName} updated shared file "${name}" to version ${nextVersion}. Description: ${description}`;
      await DatabaseService.addAuditLog('file_version_update', logText, moduleId);
    } else {
      // New File upload
      const newFile: SharedFile = {
        id: 'f_' + Math.random().toString(36).substr(2, 9),
        name,
        url: urlOrBase64,
        moduleId,
        version: 1,
        uploadedBy: actorName,
        uploadedAt: timestamp,
        history: [
          {
            version: 1,
            url: urlOrBase64,
            updatedBy: actorName,
            updatedAt: timestamp,
            description: description || 'Initial blueprint upload.',
          }
        ]
      };

      dbFiles.unshift(newFile);
      saveToStorage('gb_files', dbFiles);
      notify('files', [...dbFiles]);

      const logText = `${actorName} uploaded new shared asset: "${name}".`;
      await DatabaseService.addAuditLog('file_upload', logText, moduleId);
    }
  },

  // --- Audit Logging Services ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return dbLogs;
  },

  subscribeAuditLogs: (callback: (logs: AuditLog[]) => void) => {
    listeners.auditLogs.push(callback);
    callback(dbLogs);
    return () => {
      listeners.auditLogs = listeners.auditLogs.filter(cb => cb !== callback);
    };
  },

  addAuditLog: async (
    type: AuditLog['type'], 
    description: string, 
    moduleId: string
  ): Promise<void> => {
    const newLog: AuditLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      description,
      actor: dbCurrentUser?.name || 'System',
      moduleId,
    };
    dbLogs.unshift(newLog);
    saveToStorage('gb_logs', dbLogs);
    notify('auditLogs', [...dbLogs]);
  }
};
