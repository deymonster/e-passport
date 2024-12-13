
export const getFileUrl = (filePath: string): string => {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'http://192.168.13.24:3000'
      : 'http://localhost:3000';
    
    // Убираем начальный слэш, если он есть
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    return `${baseUrl}/${cleanPath}`;
  };