import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

@Injectable({ providedIn: 'root' })
export class WebauthnService {
  private base = 'http://dev.ngb.com:4201';

  constructor(private http: HttpClient) {}

  async register(username: string) {
    // 1) Get registration options from backend
    const options = await firstValueFrom(this.http.post<any>(`${this.base}/register/options`, { username }));

    // 2) Call browser API to create credentials
    const attestation = await startRegistration(options);

    // 3) Send attestation to backend to verify and persist
    const verification = await firstValueFrom(this.http.post<any>(`${this.base}/register/verify`, { username, attestation }));
    return verification;
  }

  async authenticate(username: string) {
    // 1) Get authentication options from backend
    const options = await firstValueFrom(this.http.post<any>(`${this.base}/auth/options`, { username }));

    // 2) Call browser API to get assertion
    const assertion = await startAuthentication(options);

    // 3) Send assertion to backend for verification
    const verification = await firstValueFrom(this.http.post<any>(`${this.base}/auth/verify`, { username, assertion }));
    return verification;
  }
}
