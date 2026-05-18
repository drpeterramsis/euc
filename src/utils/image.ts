import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    onProgress: onProgress,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error('Compression failed', error);
    throw error;
  }
}
