import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { ReactiveService } from '../shared/reactive.service';
import { Distribution, Person } from '../shared/interfaces';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  students: Person[] = [];
  teachers: Person[] = [];
  distribution: Distribution[] = [];
  max: number = 0;
  tree: Node[] = [];

  constructor(private service: ReactiveService) {
  }

  ngOnInit(): void {
    this.service
      .getFileData()
      .subscribe((data) => {
        this.distribution = data["distribution"];
        this.teachers = data["teachers"];
        this.students = data["students"];
      });
  }

  // actions ---
  onFileChange(args: any) {
    const file = args.srcElement && args.srcElement.files && args.srcElement.files[0];
    this.service.fillDatafromFile(file);
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
}
