
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
      if (token?.trim()) {
        headers['Authorization'] = `token ${token.trim()}`;
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      
      if (repoResponse.status === 403) {
        const rateLimitReset = repoResponse.headers.get('x-ratelimit-reset');
        const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString() : 'later';
        throw new Error(`GitHub API rate limit exceeded. Limit resets at ${resetDate}. Use a Personal Access Token in 'Advanced' to bypass.`);
      }
      
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

  async fetchFullProjectContent(owner: string, repo: string, branch: string = 'main', token?: string): Promise<ProjectFile[]> {
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (token?.trim()) {
        headers['Authorization'] = `token ${token.trim()}`;
      }

      // 1. Get recursive tree (API Call - 1 request)
      const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeResponse.ok) {
        if (treeResponse.status === 403) throw new Error('GitHub API Rate Limit Exceeded during tree fetch.');
        throw new Error(`Failed to fetch repo tree (Status: ${treeResponse.status})`);
      }
      
      const treeData = await treeResponse.json();
      if (!treeData.tree) return [];

      // 2. Filter for source files only
      const sourceFiles = treeData.tree
        .filter((node: any) => node.type === 'blob')
        .filter((node: any) => {
           const path = node.path.toLowerCase();
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
      
      // 3. Fetch file contents (Using raw.githubusercontent.com - 0 API requests)
      // This bypasses the API rate limit for content reading.
      for (const node of sourceFiles) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${node.path}`;
          const fileResponse = await fetch(rawUrl);
          
          if (!fileResponse.ok) {
            console.warn(`Failed to fetch raw file: ${node.path} via raw URL, skipping.`);
            continue;
          }
          
          const content = await fileResponse.text();
          
          projectFiles.push({
            path: node.path,
            content: content,
            size: node.size
          });
        } catch (e) {
          console.warn(`Error processing file: ${node.path}`, e);
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
