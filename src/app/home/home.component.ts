import { Component, OnInit } from '@angular/core';
import * as Excel from '@grapecity/spread-excelio';
import * as GC from '@grapecity/spread-sheets';

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
  distribution: {teacherCode: string, students: Set<string>}[] = [];
  mean: number = 0;

  constructor() {
    this.spread = new GC.Spread.Sheets.Workbook();
    this.excelIO = new Excel.IO();
  }

  ngOnInit(): void {

  }

  onFileChange(args: any) {
    const self = this, file = args.srcElement && args.srcElement.files && args.srcElement.files[0];
    if (self.spread && file) {
      self.excelIO.open(file, (json: any) => {
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
    this.mean = Math.round(this.students.length/this.teachers.length);
    console.log(this.mean)

  }
  fillListas(){
    let stAdded: Set<string> = new Set<string>();
    this.enrollments.map(enrollment => {
      if(!stAdded.has(enrollment.studentCode)){
        let added = false;
        let disIndex = this.distribution.findIndex(dis => dis.teacherCode === enrollment.teacherCode);

        if(disIndex < 0){
          this.distribution = [...this.distribution,
            {teacherCode: enrollment.teacherCode, students: new Set<string>(enrollment.studentCode)}];
          added = true;
        }
        else if(this.distribution[disIndex].students.size < this.mean){
          this.distribution[disIndex].students.add(enrollment.studentCode);
          added = true;
        }

        if(added) stAdded.add(enrollment.studentCode);
      }
    })
    const sum = this.distribution.reduce(((acc, nxt)=>acc+nxt.students.size),0)
    console.log(this.students.length)
    console.log(sum)
    console.log(this.distribution)
  }
}
