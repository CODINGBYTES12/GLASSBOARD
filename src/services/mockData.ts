export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'member' | 'head';
  module: 'module_a' | 'module_b' | 'module_c' | 'None';
}

export interface Module {
  id: string;
  name: string;
  description: string;
  progress: number; // 0 to 100
  status: 'on_track' | 'delayed' | 'blocked';
  dependencies: string[]; // dependent on these module IDs
  owner: string; // owner name
}

export interface ChecklistItem {
  id: string;
  moduleId: string;
  text: string;
  completed: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface Handshake {
  id: string;
  fromModule: string;
  toModule: string;
  status: 'pending' | 'accepted' | 'rejected';
  proofUrl: string; // URL or Base64
  proofName: string;
  timestamp: string;
  comments: string;
  handledAt?: string;
  handledBy?: string;
  rejectionReason?: string;
}

export interface SharedFile {
  id: string;
  name: string;
  url: string; // URL or Base64
  moduleId: string; // Owning module
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  history: FileHistory[];
}

export interface FileHistory {
  version: number;
  url: string;
  updatedBy: string;
  updatedAt: string;
  description: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: 'handshake_request' | 'handshake_accepted' | 'handshake_rejected' | 'file_upload' | 'file_version_update' | 'progress_change' | 'checklist_toggle';
  description: string;
  actor: string;
  moduleId: string;
}

export const SEED_USERS: User[] = [
  { uid: 'u1', email: 'alice@glassboard.com', name: 'Alice Smith', role: 'member', module: 'module_a' },
  { uid: 'u2', email: 'bob@glassboard.com', name: 'Bob Johnson', role: 'member', module: 'module_b' },
  { uid: 'u3', email: 'charlie@glassboard.com', name: 'Charlie Davis', role: 'member', module: 'module_c' },
  { uid: 'u4', email: 'director@glassboard.com', name: 'Dr. Jane Miller', role: 'head', module: 'None' },
];

export const SEED_MODULES: Module[] = [
  {
    id: 'module_a',
    name: 'Frontend Core',
    description: 'Builds user interface elements, application layouts, and responsive layouts.',
    progress: 75,
    status: 'on_track',
    dependencies: [],
    owner: 'Alice Smith',
  },
  {
    id: 'module_b',
    name: 'API Gateway & Auth',
    description: 'Enforces request routing, API validation, session management, and authorization rules.',
    progress: 45,
    status: 'delayed',
    dependencies: ['module_a'],
    owner: 'Bob Johnson',
  },
  {
    id: 'module_c',
    name: 'Analytics Engine',
    description: 'Aggregates multi-department work data and visualizes performance benchmarks.',
    progress: 15,
    status: 'blocked',
    dependencies: ['module_b'],
    owner: 'Charlie Davis',
  },
];

export const SEED_CHECKLISTS: ChecklistItem[] = [
  // Module A
  { id: 'ca1', moduleId: 'module_a', text: 'Design responsive screen layouts', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Alice Smith' },
  { id: 'ca2', moduleId: 'module_a', text: 'Integrate state containers & navigation routing', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Alice Smith' },
  { id: 'ca3', moduleId: 'module_a', text: 'Implement visual components library', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Alice Smith' },
  { id: 'ca4', moduleId: 'module_a', text: 'Compile production-ready web bundle', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Alice Smith' },
  { id: 'ca5', moduleId: 'module_a', text: 'Upload handbook spec and blueprint', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Alice Smith' },

  // Module B
  { id: 'cb1', moduleId: 'module_b', text: 'Establish token encryption schemes', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Bob Johnson' },
  { id: 'cb2', moduleId: 'module_b', text: 'Set up reverse proxies for key services', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Bob Johnson' },
  { id: 'cb3', moduleId: 'module_b', text: 'Implement rate limiter and logging system', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Bob Johnson' },
  { id: 'cb4', moduleId: 'module_b', text: 'Verify handshake transition from Frontend Core', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Bob Johnson' },

  // Module C
  { id: 'cc1', moduleId: 'module_c', text: 'Map out data models and aggregate queries', completed: true, updatedAt: new Date().toISOString(), updatedBy: 'Charlie Davis' },
  { id: 'cc2', moduleId: 'module_c', text: 'Set up real-time socket connections for alerts', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Charlie Davis' },
  { id: 'cc3', moduleId: 'module_c', text: 'Configure report generator export system', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Charlie Davis' },
  { id: 'cc4', moduleId: 'module_c', text: 'Verify handshake transition from API Gateway team', completed: false, updatedAt: new Date().toISOString(), updatedBy: 'Charlie Davis' },
];

export const SEED_FILES: SharedFile[] = [
  {
    id: 'f1',
    name: 'frontend_api_specification.json',
    url: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json',
    moduleId: 'module_a',
    version: 1,
    uploadedBy: 'Alice Smith',
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    history: [
      {
        version: 1,
        url: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json',
        updatedBy: 'Alice Smith',
        updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        description: 'Initial API specification for frontend integrations.',
      }
    ]
  }
];

export const SEED_HANDSHAKES: Handshake[] = [
  {
    id: 'h0',
    fromModule: 'module_a',
    toModule: 'module_b',
    status: 'accepted',
    proofUrl: 'https://picsum.photos/400/300',
    proofName: 'schema_handshake_proof.png',
    timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    comments: 'Completed the core schema definitions and verified with mock tests.',
    handledAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    handledBy: 'Bob Johnson',
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    type: 'handshake_request',
    description: 'Frontend Core team initiated a Handshake Request to API Gateway & Auth.',
    actor: 'Alice Smith',
    moduleId: 'module_a',
  },
  {
    id: 'l2',
    timestamp: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    type: 'handshake_accepted',
    description: 'API Gateway & Auth team accepted the Handshake Request from Frontend Core.',
    actor: 'Bob Johnson',
    moduleId: 'module_b',
  },
  {
    id: 'l3',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    type: 'file_upload',
    description: 'Shared file frontend_api_specification.json v1 uploaded.',
    actor: 'Alice Smith',
    moduleId: 'module_a',
  },
  {
    id: 'l4',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    type: 'progress_change',
    description: 'API Gateway & Auth updated progress status to 45% (delayed).',
    actor: 'System',
    moduleId: 'module_b',
  }
];
