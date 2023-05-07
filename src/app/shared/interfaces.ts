export interface Person{code: string, name: string}
export interface Enrollment{
  studentCode: string, studentName: string,
  teacherCode: string, teacherName: string,
  courseCode: string, courseName: string
}
export interface Distribution{
  teacherCode: string, teacherName: string,
  students: {studentCode: string, studentName: string, course: string}[]
}

export interface Data{
  distribution: Distribution[],
  teachers: Person[],
  students: Person[]
}
  