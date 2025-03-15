export interface Quiz {
  id: string;
  title: string;
  description?: string;
  googleFormUrl: string;
  courseId?: string;
  scheduledDate: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score?: number;
  submittedAt?: string;
  status: 'assigned' | 'started' | 'completed';
}