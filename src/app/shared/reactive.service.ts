import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { RootObject } from '../ejemplo-modulo/ejemplo/model';

@Injectable({
  providedIn: 'root',
})
export class ReactiveService {
  private infoPokemon: Subject<RootObject> = new Subject<RootObject>();
  // infoPokemon: BehaviorSubject<RootObject | null> = new BehaviorSubject<RootObject | null>(null);

  constructor() {}
  getInfoPokemon() {
    return this.infoPokemon.asObservable();
  }
  setInfoPokemon(obj: RootObject) {
    this.infoPokemon.next(obj);
  }
}
