export const uploadMockImage = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const id = Date.now().toString() + Math.random().toString(36).substring(7);
      // Generate a fake https URL to pass Java backend regex validation
      const fakeUrl = `https://local.storage/img_${id}`;
      // Store actual image in localStorage
      localStorage.setItem(`mock_img_${id}`, base64);
      resolve(fakeUrl);
    };
    reader.readAsDataURL(file);
  });
};

export const getMockImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("https://local.storage/img_")) {
    const id = url.split("img_")[1];
    const base64 = localStorage.getItem(`mock_img_${id}`);
    return base64 || "https://via.placeholder.com/150?text=Image+Lost";
  }
  return url;
};
