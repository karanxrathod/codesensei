
import { ProjectFile } from '../types';

class RagService {
  private projectStores: Map<string, ProjectFile[]> = new Map();

  /**
   * Stores the indexed files for a project
   */
  indexProject(projectId: string, files: ProjectFile[]) {
    // Filter out binaries and non-text files to save memory
    const textFiles = files.filter(f => {
      const ext = f.path.split('.').pop()?.toLowerCase() || '';
      const validExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'md', 'html', 'css', 'go', 'rs', 'java', 'c', 'cpp', 'h'];
      return validExts.includes(ext);
    });
    this.projectStores.set(projectId, textFiles);
  }

  /**
   * Retrieves the codebase context for a project formatted for an LLM
   */
  getContextForPrompt(projectId: string): string {
    const files = this.projectStores.get(projectId);
    if (!files || files.length === 0) return "No file content indexed.";

    let context = "CODEBASE KNOWLEDGE BASE:\n\n";
    // Sort by path for consistency
    files.sort((a, b) => a.path.localeCompare(b.path));

    // For the prompt, we prioritize small but high-value files like package.json, main, etc.
    // We cap the context if it's too huge, though Gemini 3 handles a lot.
    files.forEach(file => {
      context += `--- FILE: ${file.path} ---\n${file.content}\n\n`;
    });

    return context;
  }

  getProjectFileCount(projectId: string): number {
    return this.projectStores.get(projectId)?.length || 0;
  }
}

export const ragService = new RagService();
