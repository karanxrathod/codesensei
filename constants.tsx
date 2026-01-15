
import React from 'react';
import { Project, Task, Screen } from './types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Smart-Inventory-API',
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Redis'],
    lastAnalyzed: '2 hours ago',
    progress: 85,
    description: 'A high-performance inventory management system with real-time updates.',
    sourceType: 'local'
  },
  {
    id: 'p2',
    name: 'react',
    stack: ['TypeScript', 'React', 'Rollup'],
    lastAnalyzed: 'Yesterday',
    progress: 100,
    description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
    sourceType: 'github',
    githubData: {
      url: 'https://github.com/facebook/react',
      owner: 'facebook',
      repoName: 'react',
      branch: 'main',
      stars: 221000,
      isPrivate: false
    }
  },
  {
    id: 'p3',
    name: 'LLM-Wrapper-Python',
    stack: ['Python', 'FastAPI', 'PyTorch', 'Docker'],
    lastAnalyzed: 'Yesterday',
    progress: 40,
    description: 'A lightweight wrapper for interacting with various LLM providers.',
    sourceType: 'local'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Understand this project',
    description: 'Get a high-level overview of the entry point and core logic.',
    type: 'understand',
    steps: ['Locate main entry file', 'Identify core middleware', 'Trace request lifecycle']
  },
  {
    id: 't2',
    title: 'Add a feature',
    description: 'Implement a new caching layer for the Product endpoints.',
    type: 'feature',
    steps: ['Select caching strategy', 'Implement Redis helper', 'Inject into controllers']
  },
  {
    id: 't3',
    title: 'Fix a bug',
    description: 'Resolve the memory leak in the WebSocket connection handler.',
    type: 'bug',
    steps: ['Debug heap snapshots', 'Locate unclosed listeners', 'Implement cleanup logic']
  }
];

export const NAV_ITEMS = [
  { id: Screen.Dashboard, label: 'Home', icon: '🏠' },
  { id: Screen.Projects, label: 'Projects', icon: '📂' },
  { id: Screen.Learn, label: 'Learn', icon: '🧠' },
  { id: Screen.Chat, label: 'Ask', icon: '💬' },
  { id: Screen.Profile, label: 'Profile', icon: '👤' }
];
