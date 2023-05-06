import { Component, OnInit } from '@angular/core';
import * as Excel from '@grapecity/spread-excelio';
import * as GC from '@grapecity/spread-sheets';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private spread;
  private excelIO;
  students: {code: string, name: string}[] = [];
  teachers: {code: string, name: string}[] = [];
  enrollments: {studentCode: string, teacherCode: string, courseCode: string, courseName: string}[] = [];
  distribution: {teacherCode: string, students: {code: string, course: string}[]}[] = [];
  max: number = 0;

  constructor() {
    this.spread = new GC.Spread.Sheets.Workbook();
    this.excelIO = new Excel.IO();
  }

  ngOnInit(): void {

  }

  // actions ---
  onFileChange(args: any) {
    const file = args.srcElement && args.srcElement.files && args.srcElement.files[0];
    if (this.spread && file) {
      this.excelIO.open(file, (json: any) => {
        const rows = json.sheets.Hoja1.data.dataTable;
        this.fillStudentsTeachers(rows);
        this.fillListas();
        setTimeout(() => {
          alert('Se cargo correctamente');
        }, 0);
      }, (error: any) => {
        alert('Error al abrir archivo');
      });
    }
  }

  onDownloadDistribution(){
    const filename = 'exportExcel.csv';
    /*const json = JSON.stringify(JSON.stringify(this.distribution));
    console.log(json);


    this.excelIO.save(json, function (blob: any) {
      saveAs(blob, filename);
    }, function (error: any) {
      console.log(error);
    });*/
  }

  // functions ---

  fillStudentsTeachers(rows: any){
    Object.keys(rows).map((rKey) => {
    if(rKey !== '0'){
      const register = rows[rKey];

      // Students ---
      const stIndex = this.students.findIndex(st => st.code === register[0].value);
      if(stIndex < 0){
        this.students = [...this.students,
        {code: register[0].value, name: register[1].value}]
      }

      // Teachers ----
      const tcIndex = this.teachers.findIndex(tc => tc.code === register[4].value);
      if(tcIndex < 0 && register[4].value !== 'NULL'){
        this.teachers = [...this.teachers,
        {code: register[4].value, name: register[5].value}]
      }

      // enrollments
      this.enrollments = [
        ...this.enrollments,
        {studentCode: register[0].value, teacherCode: register[4].value,
        courseCode: register[2].value, courseName: register[3].value}
      ]
    }})
    this.max = Math.round(this.students.length/this.teachers.length)+2;
  }
  fillListas(){
    let stAdded: string[] = [];
    let remainingEnrollments = [...this.enrollments];
    this.enrollments.map(enrollment => {
      if (stAdded.findIndex(st => enrollment.studentCode===st) < 0){
        let added = false;
        let disIndex = this.distribution.findIndex(dis => dis.teacherCode === enrollment.teacherCode);

        if(disIndex < 0){
          this.distribution = [...this.distribution,
            {teacherCode: enrollment.teacherCode, students: [{code:enrollment.studentCode, course: enrollment.courseName}]}];
          added = true;
        }
        else if(this.distribution[disIndex].students.length < this.max){
          this.distribution[disIndex].students = [...this.distribution[disIndex].students,
          {code:enrollment.studentCode, course: enrollment.courseName}];
          added = true;
        }

        if(added) {
          stAdded = [...stAdded, enrollment.studentCode];
          remainingEnrollments = remainingEnrollments.filter(enroll => enroll.studentCode !== enrollment.studentCode);
        }
      }
    })

    // distribute remaining students
    let i = 0;
    while(remainingEnrollments.length > i){
      const remain = remainingEnrollments[i];
      const disIndex = this.distribution.findIndex(enr => enr.teacherCode === remain.teacherCode);
      if(disIndex >= 0 && this.distribution[disIndex].students.length<this.max+2){
        this.distribution[disIndex].students = [...this.distribution[disIndex].students,
          {code: remain.studentCode, course: remain.courseName}
        ];

        remainingEnrollments = remainingEnrollments.filter(enroll => enroll.studentCode !== remain.studentCode);
      } else {
        i++;
      }
    }

    // get ramaining students
    while(remainingEnrollments.length > 0) {
      const remain = remainingEnrollments[0];
      // order by number of students
      this.distribution.sort((a,b)=> a.students.length>b.students.length?1:-1);
      this.distribution[0].students = [...this.distribution[0].students,
        {code: remain.studentCode, course: remain.courseName}
      ];

      remainingEnrollments = remainingEnrollments.filter(enroll => enroll.studentCode !== remain.studentCode);
    }
  }
}
