export type Stamp = {
  id: string;
  userId: string;
  imageUrl: string;
  cloudinaryPublicId: string | null;
  title?: string;
  caption: string;
  capturedAt: string;
  createdAt: string;
  dayKey: string;
};