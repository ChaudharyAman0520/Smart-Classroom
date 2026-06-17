export interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
}

export interface Classroom {
  id: string;
  name: string;
  code?: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  students: string[]; // List of student IDs
  studentDetails?: {
    id: string;
    name: string;
    email: string;
  }[];
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent";
}

export interface AttendanceSession {
  id: string;
  classroomId: string;
  date: string;
  records: AttendanceRecord[];
}

export interface DailyAttendanceMetric {
  date: string;
  present: number;
  absent: number;
  rate: number;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  rate: number;
}

export interface ClassroomAnalytics {
  classroomId: string;
  classroomName: string;
  teacherId: string;
  teacherName: string;
  totalClassesHeld: number;
  averageAttendance: number;
  summary: {
    present: number;
    absent: number;
  };
  dailyHistory: DailyAttendanceMetric[];
  studentPerformance: StudentPerformance[];
}

export interface TeacherSummary {
  totalClassrooms: number;
  totalStudentsSum: number;
  totalSessionsRecorded: number;
  classroomAnalytics: {
    classroomId: string;
    classroomName: string;
    subject: string;
    studentsCount: number;
    classesHeld: number;
    attendanceRate: number;
  }[];
}

export interface StudentSummary {
  studentId: string;
  classesCount: number;
  averageAttendancePercent: number;
  presentCount: number;
  absentCount: number;
  history: {
    sessionId: string;
    classroomId: string;
    classroomName: string;
    subject: string;
    date: string;
    status: "present" | "absent";
  }[];
}

export interface AIClassroomSummary {
  summary: string;
  issues: string[];
  recommendations: string[];
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  maxPoints: number;
  dueDate: string;
}

export interface GradeRecord {
  id: string;
  assignmentId: string;
  classroomId: string;
  studentId: string;
  score: number;
  remarks?: string;
}

export interface ClassroomGrades {
  assignments: Assignment[];
  grades: GradeRecord[];
}

