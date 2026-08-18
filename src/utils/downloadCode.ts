/**
 * Triggers full source code zip download
 */
export async function downloadProjectSourceZip(projectName: string = 'reeltype-studio') {
  try {
    // Try server-side zip endpoint first
    const res = await fetch('/api/download-source-zip');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
    throw new Error('Server zip failed');
  } catch (err) {
    console.error('Error downloading zip from server:', err);
    // Fallback: direct browser navigation
    window.location.href = '/api/download-source-zip';
    return false;
  }
}
