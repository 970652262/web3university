export interface CourseInfo {
  id: bigint;
  title: string;
  description: string;
  coverUrl: string;
  priceYDT: bigint;
  instructor: `0x${string}`;
  isActive: boolean;
  createdAt: bigint;
  totalStudents: bigint;
  categoryId: bigint;
  totalRating: bigint;
  ratingCount: bigint;
}

export interface Category {
  id: bigint;
  name: string;
  isActive: boolean;
}

export interface PurchaseRecord {
  courseId: bigint;
  purchaseTime: bigint;
  pricePaid: bigint;
  refunded: boolean;
  referrer: `0x${string}`;
}

export interface Rating {
  score: number;
  comment: string;
  timestamp: bigint;
}

export interface Subscription {
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
}
