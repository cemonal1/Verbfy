// Simple toast implementation - can be replaced with a proper toast library later
export const toastError = (message: string) => {
  console.error('Toast Error:', message);
  // For now, just use alert - replace with proper toast library
  if (typeof window !== 'undefined') {
    alert(`❌ ${message}`);
  }
};

export const toastSuccess = (message: string) => {
  // In a real app, you'd use a toast library like react-hot-toast or react-toastify
  alert(`✅ ${message}`);
};

export const toastWarning = (message: string) => {
  console.warn('Toast Warning:', message);
  // For now, just use alert - replace with proper toast library
  if (typeof window !== 'undefined') {
    alert(`Warning: ${message}`);
  }
}; 