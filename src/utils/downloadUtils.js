/**
 * Download utilities for creating ZIP files and handling file downloads
 */

// Function to create and download a ZIP file (browser-compatible)
export const createAndDownloadZip = async (files, filename = 'generated-app.zip') => {
  try {
    // Dynamic import of JSZip for browser compatibility
    const JSZip = (await import('https://cdn.skypack.dev/jszip')).default;
    
    const zip = new JSZip();
    
    // Add all files to the zip
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });
    
    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    return false;
  }
};

// Alternative: Create a downloadable text file with file structure
export const createProjectStructureFile = (files, filename = 'project-structure.txt') => {
  let content = `# Generated Project Files\n\n`;
  content += `## Instructions\n`;
  content += `1. Create a new folder for your project\n`;
  content += `2. Create the following file structure\n`;
  content += `3. Copy the content for each file\n`;
  content += `4. Run 'npm install' and 'npm run dev'\n\n`;
  
  content += `## File Structure\n\n`;
  
  Object.entries(files).forEach(([path, fileContent]) => {
    content += `### ${path}\n`;
    content += `\`\`\`${getFileExtension(path)}\n`;
    content += fileContent;
    content += `\n\`\`\`\n\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Helper function to get file extension for syntax highlighting
const getFileExtension = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const extensionMap = {
    'jsx': 'jsx',
    'js': 'javascript',
    'css': 'css',
    'json': 'json',
    'html': 'html',
    'md': 'markdown'
  };
  return extensionMap[ext] || 'text';
};

// Create individual file download
export const downloadSingleFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Create multiple files as separate downloads
export const downloadMultipleFiles = (files) => {
  Object.entries(files).forEach(([path, content], index) => {
    setTimeout(() => {
      const filename = path.split('/').pop();
      downloadSingleFile(content, filename);
    }, index * 100); // Small delay between downloads
  });
};
