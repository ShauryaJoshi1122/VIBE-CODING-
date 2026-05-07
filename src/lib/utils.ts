import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadProject(files: Record<string, { code: string }>) {
  try {
    const zip = new JSZip();
    
    Object.entries(files).forEach(([path, file]) => {
      // Remove leading slash for ZIP compatibility
      const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
      zip.file(normalizedPath, file.code);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibestudio-${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Project download failed:", error);
    alert("Download failed. See console for details.");
  }
}
