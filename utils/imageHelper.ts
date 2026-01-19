/// <reference types="vite/client" />
/**
 * @description 压缩图片
 */
export const compressImage = (file: File, quality = 0.6, maxWidth = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * @description 上传图片到 ImgBB
 * 请将 API_KEY 替换为你从 https://api.imgbb.com/ 获取的密钥
 */
export const uploadToImgBB = async (base64Image: string): Promise<string> => {
  // 移除 base64 头部（data:image/jpeg;base64,）
  const base64Data = base64Image.split(',')[1];

  const formData = new FormData();
  formData.append('image', base64Data);

  // 使用 Vite 环境变量 (需以 VITE_ 开头)
  const API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

  if (!API_KEY) {
    throw new Error('未配置图片上传密钥 (VITE_IMGBB_API_KEY)');
  }

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || '图片上传失败');
  }

  const result = await response.json();
  return result.data.url; // 返回图片的永久 URL
};