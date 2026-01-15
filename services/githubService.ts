
import { ProjectFile } from '../types';

export interface RepoMetadata {
  name: string;
  owner: string;
  description: string;
  stars: number;
  defaultBranch: string;
  updatedAt: string;
  lastCommitHash?: string;
}

export class GitHubService {
  validateGitHubUrl(url: string): { owner: string; repo: string } | null {
    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);
    if (match && match[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2].replace('.git', '')
      };
    }
    return null;
  }

  async fetchRepoMetadata(owner: string, repo: string, token?: string): Promise<RepoMetadata | null> {
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoResponse.status === 403) throw new Error('GitHub API rate limit exceeded. Please try again later.');
      if (!repoResponse.ok) throw new Error('Repository not found or private');
      
      const repoData = await repoResponse.json();
      
      let lastCommitHash = 'unknown';
      try {
        const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${repoData.default_branch}`, { headers });
        if (commitResponse.ok) {
          const commitData = await commitResponse.json();
          lastCommitHash = commitData.sha.substring(0, 7);
        }
      } catch (e) {
        console.warn('Could not fetch commit hash', e);
      }

      return {
        name: repoData.name,
        owner: repoData.owner.login,
        description: repoData.description || 'No description provided.',
        stars: repoData.stargazers_count,
        defaultBranch: repoData.default_branch,
        updatedAt: repoData.updated_at,
        lastCommitHash
      };
    } catch (error: any) {
      console.error('Error fetching GitHub metadata:', error);
      throw error;
    }
  }

  async fetchFullProjectContent(owner: string, repo: string, branch: string = 'main'): Promise<ProjectFile[]> {
    try {
      // 1. Get recursive tree
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      if (!treeResponse.ok) {
        if (treeResponse.status === 403) throw new Error('GitHub API Rate Limit Exceeded');
        throw new Error(`Failed to fetch repo tree (Status: ${treeResponse.status})`);
      }
      
      const treeData = await treeResponse.json();
      
      if (!treeData.tree) return [];

      // 2. Filter for source files only
      const sourceFiles = treeData.tree
        .filter((node: any) => node.type === 'blob')
        .filter((node: any) => {
           const path = node.path.toLowerCase();
           // Filter for valuable text files only
           return path.endsWith('.ts') || 
                  path.endsWith('.tsx') || 
                  path.endsWith('.js') || 
                  path.endsWith('.jsx') || 
                  path.endsWith('.json') || 
                  path.endsWith('.md') || 
                  path.endsWith('.py') ||
                  path.endsWith('.css') ||
                  path.endsWith('.html');
        })
        .slice(0, 50); // Hard limit for MVP speed

      const projectFiles: ProjectFile[] = [];
      
      for (const node of sourceFiles) {
        try {
          const fileResponse = await fetch(node.url);
          if (!fileResponse.ok) continue;
          
          const fileData = await fileResponse.json();
          // GitHub content is base64 encoded
          const content = atob(fileData.content.replace(/\s/g, ''));
          
          projectFiles.push({
            path: node.path,
            content: content,
            size: node.size
          });
        } catch (e) {
          console.warn(`Failed to fetch file: ${node.path}`, e);
        }
      }

      return projectFiles;
    } catch (e: any) {
      console.error("Error fetching repo content:", e);
      throw e;
    }
  }
}

export const githubService = new GitHubService();
