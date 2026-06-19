export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

export interface MockAttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  record_date: string; // 'YYYY-MM-DD'
  status: AttendanceStatus;
}

export interface MockStudentRoster {
  id: string;
  name: string;
  email: string;
}

// Roster of mock students enrolled in our system
const defaultRoster: MockStudentRoster[] = [
  { id: 'student-id-123', name: 'Alex Mercer', email: 'alex@student.lms.com' },
  { id: 'student-id-abc', name: 'Sarah Connor', email: 'sarah.c@student.lms.com' },
  { id: 'student-id-xyz', name: 'John Doe', email: 'johndoe@student.lms.com' },
  { id: 'student-id-temp', name: 'Demo Student', email: 'demo.student@lms.com' }
];

// Seed default history for Alex Mercer (student-id-123) in Intro to Deep Learning (course-dl-101)
const defaultAttendanceRecords: MockAttendanceRecord[] = [
  { id: 'att-1', course_id: 'course-dl-101', student_id: 'student-id-123', student_name: 'Alex Mercer', record_date: '2026-06-15', status: 'PRESENT' },
  { id: 'att-2', course_id: 'course-dl-101', student_id: 'student-id-123', student_name: 'Alex Mercer', record_date: '2026-06-16', status: 'PRESENT' },
  { id: 'att-3', course_id: 'course-dl-101', student_id: 'student-id-123', student_name: 'Alex Mercer', record_date: '2026-06-17', status: 'EXCUSED' },
  { id: 'att-4', course_id: 'course-dl-101', student_id: 'student-id-123', student_name: 'Alex Mercer', record_date: '2026-06-18', status: 'ABSENT' },
  
  // Other students seeds to show in faculty roster
  { id: 'att-5', course_id: 'course-dl-101', student_id: 'student-id-abc', student_name: 'Sarah Connor', record_date: '2026-06-18', status: 'PRESENT' },
  { id: 'att-6', course_id: 'course-dl-101', student_id: 'student-id-xyz', student_name: 'John Doe', record_date: '2026-06-18', status: 'PRESENT' },
  
  // Database Systems seeds
  { id: 'att-7', course_id: 'course-db-202', student_id: 'student-id-123', student_name: 'Alex Mercer', record_date: '2026-06-17', status: 'PRESENT' },
  { id: 'att-8', course_id: 'course-db-202', student_id: 'student-id-abc', student_name: 'Sarah Connor', record_date: '2026-06-17', status: 'ABSENT' }
];

// Initialize localStorage
if (!localStorage.getItem('aegis_mock_attendance')) {
  localStorage.setItem('aegis_mock_attendance', JSON.stringify(defaultAttendanceRecords));
}

const getAttendanceState = (): MockAttendanceRecord[] => {
  return JSON.parse(localStorage.getItem('aegis_mock_attendance') || '[]');
};

const saveAttendanceState = (state: MockAttendanceRecord[]) => {
  localStorage.setItem('aegis_mock_attendance', JSON.stringify(state));
};

export const attendanceService = {
  // Get roster for a course
  async getRoster(): Promise<MockStudentRoster[]> {
    return defaultRoster;
  },

  // Get attendance sheet records for a course on a specific date
  async getAttendanceForCourse(courseId: string, date: string): Promise<MockAttendanceRecord[]> {
    const list = getAttendanceState();
    return list.filter(r => r.course_id === courseId && r.record_date === date);
  },

  // Get all attendance logs for a course (for history view)
  async getCourseLogs(courseId: string): Promise<MockAttendanceRecord[]> {
    const list = getAttendanceState();
    return list.filter(r => r.course_id === courseId);
  },

  // Bulk record/update student attendance logs
  async recordAttendanceBulk(
    courseId: string,
    date: string,
    records: Array<{ student_id: string; student_name: string; status: AttendanceStatus }>
  ): Promise<MockAttendanceRecord[]> {
    const list = getAttendanceState();
    
    // Filter out existing logs for this course and date to avoid duplicates
    let updatedList = list.filter(r => !(r.course_id === courseId && r.record_date === date));
    
    const newRecords: MockAttendanceRecord[] = records.map(rec => ({
      id: `att-${Math.random().toString(36).substring(2, 9)}`,
      course_id: courseId,
      student_id: rec.student_id,
      student_name: rec.student_name,
      record_date: date,
      status: rec.status
    }));

    updatedList = [...updatedList, ...newRecords];
    saveAttendanceState(updatedList);
    return newRecords;
  },

  // Student specific: Retrieve summary metrics and timeline history
  async getStudentAttendanceSummary(courseId: string, studentId: string) {
    const list = getAttendanceState();
    const studentRecords = list
      .filter(r => r.course_id === courseId && r.student_id === studentId)
      .sort((a, b) => b.record_date.localeCompare(a.record_date)); // Newest first

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    studentRecords.forEach(r => {
      if (r.status === 'PRESENT') presentCount++;
      else if (r.status === 'ABSENT') absentCount++;
      else if (r.status === 'EXCUSED') excusedCount++;
    });

    const totalCount = studentRecords.length;
    // Treating PRESENT + EXCUSED as attended or PRESENT / (totalCount - excused)?
    // Let's compute rate standard: (PRESENT / totalCount) * 100, or count EXCUSED as neutral/positive.
    // Let's treat PRESENT + EXCUSED as positive for rate:
    const attendanceRate = totalCount > 0 
      ? Math.round(((presentCount + excusedCount) / totalCount) * 100) 
      : 100;

    return {
      records: studentRecords,
      presentCount,
      absentCount,
      excusedCount,
      totalCount,
      attendanceRate
    };
  }
};
