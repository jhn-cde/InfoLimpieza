import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';
import {FlatTreeControl} from '@angular/cdk/tree';

interface Person{code: string, name: string}
interface Enrollment{
  studentCode: string, studentName: string,
  teacherCode: string, teacherName: string,
  courseCode: string, courseName: string
}
interface Distribution{
  teacherCode: string, teacherName: string,
  students: {studentCode: string, studentName: string, course: string}[]
}
interface Node{
  name: string,
  children?: Node[]
}
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent {
  private _transformer = (node: Node, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable,
  );
  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  students: Person[] = [];
  teachers: Person[] = [];
  enrollments: Enrollment[] = [];
  distribution: Distribution[] = [];
  max: number = 0;

  constructor() {
  }
  hasChild = (_: number, node: FlatNode) => node.expandable;

  // actions ---
  onFileChange(args: any) {
    const file = args.srcElement && args.srcElement.files && args.srcElement.files[0];
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const register:any[] = XLSX.utils.sheet_to_json(ws, {header: 1})

      this.fillStudentsTeachers(register);
      this.getDistribution();
    };
    reader.readAsBinaryString(file);
  }

  onDownloadDistribution(){
    // sheet 1 - distribution
    const worksheet1 = XLSX.utils.json_to_sheet(this.distribution.flat().map(({ teacherCode, teacherName, students }) => {
      return students.map(({ studentCode, studentName, course }) => ({
        Codigo_Docente: teacherCode,
        Nombre_Docente: teacherName,
        Codigo_Estudiante: studentCode,
        Nombre_Estudiante: studentName,
        Curso: course,
      }));
    }).flat());

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Distribucion');

    // sheet 2 - teachers
    const worksheet2 = XLSX.utils.json_to_sheet(this.teachers.flat().map(({ code, name }) => {
      return {
        Codigo: code,
        Docente: name,
      };
    }).flat());

    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Docentes');


    // sheet 3 - Students
    const worksheet3 = XLSX.utils.json_to_sheet(this.students.flat().map(({ code, name }) => {
      return {
        Codigo: code,
        Alumno: name,
      };
    }).flat());

    XLSX.utils.book_append_sheet(workbook, worksheet3, 'Alumnos');


    XLSX.writeFile(workbook, 'INFOLIMPIEZA_DISTRIBUCION.xlsx');
  }

  // functions ---

  fillStudentsTeachers(rows: any[]){
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
    this.max = tmp > 18? 20 : tmp+2;
  }

  getDistribution(){
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
        else if(this.distribution[disIndex].students.length < this.max){
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
    this.dataSource.data = this.distribution.map(dis => {
      return{
        name: `${dis.teacherName} (${dis.students.length})`,
        children: dis.students.map(st => {return {name: `${st.studentCode} - ${st.studentName}`}})
      }
    })
  }
}
