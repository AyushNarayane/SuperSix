import { DocumentPickerAsset } from 'expo-document-picker';

const CLOUDINARY_CLOUD_NAME = 'dco0rowal';
const CLOUDINARY_UPLOAD_PRESET = 'material';
const CLOUDINARY_API_KEY = '767357158367185';

export const uploadPDF = async (file: DocumentPickerAsset): Promise<string> => {
  try {
    const formData = new FormData();
    const fileUri = file.uri;
    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append('file', blob, file.name);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || 'Unknown error'}`); 
    }

    const data = await uploadResponse.json();
    if (!data.secure_url) {
      throw new Error('Cloudinary response missing secure_url');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
};