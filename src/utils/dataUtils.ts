
export const parseJsonField = (jsonString: string | null | undefined) => {
  if (!jsonString || jsonString.trim() === '') {
    return null;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON field:', error);
    return null;
  }
};

export const stringifyJsonField = (data: any) => {
  if (!data) {
    return '';
  }
  
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying JSON field:', error);
    return '';
  }
};

export const calculateAge = (dob: string | Date): number | null => {
  if (!dob) return null;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const timeAgo = (date: Date | string): string => {
  if (!date) return 'Unknown time';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

export const fieldNameToLabel = (fieldName: string): string => {
  // Convert camelCase to Title Case
  const result = fieldName.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not specified';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    // Try to parse JSON strings for display
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      if (typeof parsed === 'object') {
        return Object.values(parsed).join(', ');
      }
    } catch {
      // Not JSON, return as is
    }
    return value;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return Object.values(value).join(', ');
  return String(value);
};
