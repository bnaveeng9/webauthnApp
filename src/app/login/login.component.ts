import { Component } from '@angular/core';
import { WebauthnService } from '../webauthn.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Replace with a real username input in your template
  username = 'testuser';
  status = '';

  constructor(private webauthn: WebauthnService) {}

  async loginUser() {
    try {
      this.status = 'Requesting authentication...';
      const result = await this.webauthn.authenticate(this.username);
      if (result && result.verified) {
        this.status = 'Authentication successful';
        console.log('Authentication successful!');
      } else {
        this.status = 'Authentication failed: ' + (result && result.error ? result.error : 'unknown');
        console.error('Authentication failed:', result && result.error);
      }
    } catch (error) {
      this.status = 'WebAuthn authentication error: ' + ((error as any) && (error as any).message ? (error as any).message : String(error));
      console.error('WebAuthn authentication error:', error);
    }
  }
}