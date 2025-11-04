import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {SkinShard} from '../models/SkinShard';


@Injectable({providedIn: 'root'})
export class SkinShardService {
  private baseUrl = 'http://localhost:8080/skins';

  constructor(private http: HttpClient) {
  }

  getSkins(): Observable<SkinShard[]> {
    return this.http.get<SkinShard[]>(this.baseUrl);
  }
  setWanted(id: number, value: boolean): Observable<SkinShard> {
    return this.http.patch<SkinShard>(`${this.baseUrl}/${id}/wanted?value=${value}`, {});
  }

  setReroll(id: number, value: boolean): Observable<SkinShard> {
    return this.http.patch<SkinShard>(`${this.baseUrl}/${id}/reroll?value=${value}`, {});
  }

  setSell(id: number, value: boolean): Observable<SkinShard> {
    return this.http.patch<SkinShard>(`${this.baseUrl}/${id}/sell?value=${value}`, {});
  }

}
