export type UserRole = 'student' | 'admin';

export interface User {
  role: UserRole;
  name: string;
  uid: string;
  phone: string;
  email?: string;
  profile?: string;
  address?: {
    district: string;
    tehsil: string;
    village: string;
    street?: string;
  };
  secondaryPhone?: string;
  coursesEnrolled: string[];
  payments: Payment[];
  performance: TestResult[];
  branch?: 'wardha' | 'nagpur' | 'butibori';
}

export interface Payment {
  amount: number;
  date: string;
  type: 'initial' | 'installment';
  status: 'success' | 'pending' | 'failed';
  orderId?: string;
}

export interface TestResult {
  test: string;
  score: number;
  date: string;
}

export interface Course {
  id: string;
  title: string;
  price: number;
  installments: {
    initial: number;
    monthly: number;
  };
  description?: string;
}

export interface Activity {
  id: string;
  type: 'new_student' | 'payment' | 'class_scheduled';
  message: string;
  timestamp: string;
  userId?: string;
}

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  duration: number; // in minutes
  status: 'scheduled' | 'ongoing' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  courseId: string;
  fileUrl: string;
  uploadDate: string;
  type: 'pdf' | 'link';
  publicId?: string;
  fileName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  type: 'text' | 'reminder';
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  profilePic?: string;
  timestamp: string;
}