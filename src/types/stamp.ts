export type Stamp = {
  id: string;
  userId: string;
  imageUrl: string;
  cloudinaryPublicId: string | null;
  caption: string;
  capturedAt: string;
  createdAt: string;
  dayKey: string;
};