export const canAccessTaskContent = (status: string) =>
  status === "Ready to Publish" || status === "Published";
