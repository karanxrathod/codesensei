
export enum Screen {
  Splash = 'splash',
  Onboarding = 'onboarding',
  Auth = 'auth',
  Dashboard = 'dashboard',
  Projects = 'projects',
  Learn = 'learn',
  Chat = 'chat',
  Profile = 'profile',
  ProjectDetail = 'project_detail',
  Architecture = 'architecture',
  LearnByTask = 'learn_by_task',
  Diagram = 'diagram',
  Settings = 'settings'
}

export interface ProjectFile {
  path: string;
  content: string;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  stack: string[];
  lastAnalyzed: string;
  progress: number;
  description: string;
  sourceType: 'local' | 'github';
  githubData?: {
    url: string;
    owner: string;
    repoName: string;
    branch: string;
    stars: number;
    lastCommitHash?: string;
    lastUpdated?: string;
    isPrivate: boolean;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'understand' | 'feature' | 'bug' | 'ml';
  steps: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: string[];
  timestamp: Date;
}
