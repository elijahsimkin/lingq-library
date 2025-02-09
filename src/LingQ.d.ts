// LingQ.d.ts
// Collection type for the "collection" field
interface Collection {
	id: number;
	url: string;
	title: string;
	description: string;
	audio: string | null;
	imageUrl: string;
	originalImageUrl: string;
	completedRatio: number;
	completedTimes: number | null;
	lessonsCount: number;
	newWordsCount: number;
	difficulty: number;
	level: string; // e.g., "Beginner 1"
	price: number;
	providerImageUrl: string;
	sharedById: number;
	sharedByName: string;
	sharedByImageUrl: string;
	sourceURLEnabled: boolean | null;
	sourceURL: string | null;
	tags: string[]; // e.g., ["tag1", "tag2"]
	external_type: string | null;
	rosesCount: number;
	roseGiven: boolean;
	type: "collection";
	scheduledForDeletion: boolean;
  }
  
  // Paragraph and Sentence types for the "paragraphs" field
  interface Sentence {
	index: number;
	text: string;
	cleanText: string;
	translations: Array<{
	  language: string; // Language code, e.g., "en"
	  text: string;
	  type: string; // e.g., "chatgpt"
	}>;
	timestamp: [number | null, number | null];
  }
  
  interface Paragraph {
	index: number;
	style: string; // e.g., "p" for paragraph, "h1" for header
	sentences: Sentence[];
  }
  
  // Main Lesson type
  interface Lesson {
	id: number;
	title: string;
	status: "private" | "public";
	level: number;
	collection: Collection;
	provider: string | null;
	image: string;
	audio: string | null;
	duration: number; // Duration in seconds
	description: string;
	accent: string | null;
	shelves: string[]; // e.g., ["other"]
	originalUrl: string;
	external_audio: string;
	tags: string[]; // e.g., ["video"]
	video: string;
	price: number;
	originalImageUrl: string;
	imageUrl: string;
	isProtected: boolean | null;
	isFeatured: boolean | null;
	isHidden: boolean;
	language: string; // e.g., "Hebrew"
	paragraphs: Paragraph[];
  }
  
  // Export the main Lesson type
  export type { Lesson, Collection, Paragraph, Sentence };
  