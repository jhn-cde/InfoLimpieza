import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as XLSX from 'xlsx';

export interface Node{
  name: string,
  children?: Node[]
}

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

@Injectable({
  providedIn: 'root',
})
export class ReactiveService {
  private distribution: Distribution[] = [];
  private teachers: Person[] = [];
  private students: Person[] = [];

  private dataSubject: BehaviorSubject<Data> = new BehaviorSubject<Data>({
    distribution: this.distribution, 
    teachers: this.teachers, 
    students: this.students
  });
  private tree: Node[] = [];
  private treeSubject: BehaviorSubject<Node[]> = new BehaviorSubject<Node[]>(this.tree);

  private maxPerGroup: number = 0;
  private enrollments: Enrollment[] = [];

  constructor() {}

  getFileData() {
    return this.dataSubject.asObservable();
  }
  fillDatafromFile(filename: Blob) {
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const register:any[] = XLSX.utils.sheet_to_json(ws, {header: 1})

      this.fillStudentsTeachers(register);
      this.getDistribution();

      this.dataSubject.next({
        distribution: this.distribution,
        teachers: this.teachers,
        students: this.students
      });
    };
    reader.readAsBinaryString(filename);
  }

  private fillStudentsTeachers(rows: any[]){
    for(let ri = 0; ri < rows.length; ri++) {
      if(ri > 0){
        let register: string[] = rows[ri];

        // Students ---
        const stIndex = this.students.findIndex(st => st.code === register[0]);
        if(stIndex < 0){
          this.students = [...this.students,
          {code: register[0], name: register[1]}]
        }

        // Teachers ----
        // remove other career teachers
        const teacherCareer = register[2].substring(0,2)
        if(teacherCareer !== 'IF') register[4] = "NULL";

        const tcIndex = this.teachers.findIndex(tc => tc.code === register[4]);
        if(tcIndex < 0 && register[4] !== "NULL"){
          this.teachers = [...this.teachers,
          {code: register[4], name: register[5]}]
        }

        // enrollments
        this.enrollments = [
          ...this.enrollments,
          {
            studentCode: register[0], studentName: register[1],
            teacherCode: register[4], teacherName: register[5],
            courseCode: register[2], courseName: register[3]
          }
        ]
      }
    }
    const tmp = Math.round(this.students.length/this.teachers.length);
    this.maxPerGroup = tmp > 18? 20 : tmp+2;
  }

  private getDistribution(){
    let stAdded: string[] = [];
    let remainingEnrollments = [...this.enrollments];
    this.enrollments.map(enrollment => {
      if (stAdded.findIndex(st => enrollment.studentCode===st) < 0 && enrollment.teacherCode != "NULL"){
        let added = false;
        let disIndex = this.distribution.findIndex(dis => dis.teacherCode === enrollment.teacherCode);

        if(disIndex < 0){
          this.distribution = [...this.distribution,
            {
              teacherCode: enrollment.teacherCode, teacherName: enrollment.teacherName,
              students: [
                {
                  studentCode:enrollment.studentCode, studentName: enrollment.studentName,
                  course: enrollment.courseName
                }
              ]
            }
          ];
          added = true;
        }
        else if(this.distribution[disIndex].students.length < this.maxPerGroup){
          this.distribution[disIndex].students = [...this.distribution[disIndex].students,
          {
            studentCode:enrollment.studentCode, studentName: enrollment.studentName,
            course: enrollment.courseName
          }];
          added = true;
        }

        if(added) {
          stAdded = [...stAdded, enrollment.studentCode];
          remainingEnrollments = remainingEnrollments.filter(enroll => enroll.studentCode !== enrollment.studentCode);
        }
      }
    })

    // get ramaining students
    while(remainingEnrollments.length > 0) {
      const remain = remainingEnrollments[0];
      // order by number of students
      this.distribution.sort((a,b)=> a.students.length>b.students.length?1:-1);
      this.distribution[0].students = [...this.distribution[0].students,
        {
          studentCode:remain.studentCode, studentName: remain.studentName,
          course: ''
        }
      ];

      remainingEnrollments = remainingEnrollments.filter(enroll => enroll.studentCode !== remain.studentCode);
    }

    // sort distribution by teacher
    this.distribution.sort((a,b) => a.teacherName > b.teacherName?1:-1);

    console.log(`${this.teachers.length} profesores de Informatica`)
    console.log(`${this.students.length} estudiantes`)
    console.log(`${this.distribution.length} listas`)

    // fill tree
    const tree = this.distribution.map(dis => {
      return{
        name: `${dis.teacherName} (${dis.students.length})`,
        children: dis.students.map(st => {return {name: `${st.studentCode} - ${st.studentName}`}})
      }
    });
    
    this.setTree(tree);
  }

  getTree() {
    return this.treeSubject.asObservable();

  }
  setTree(tree: Node[]) {
    this.tree = tree;
    this.treeSubject.next(this.tree);
  }
}
