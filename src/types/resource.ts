// src/types/resource.ts

export type ResourceType = 'ebook' | 'pdf' | 'template' | 'audio' | 'podcast';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  thumbnailUrl?: string; // absent pour les templates (icône générique à la place)
  meta: string;          // "1.2 MB", "45 MIN READ", "NOTION LINK", "27 MIN"...
  isFeatured?: boolean;  // true = carte large en tête de liste (comme "The Stoic Operating System")
  isSaved?: boolean;     // état du bookmark
  actionUrl?: string;    // lien de téléchargement / lecture / ouverture externe
}
