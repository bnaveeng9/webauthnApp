import { Component } from '@angular/core';
import { WebauthnService } from '../webauthn.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  // Replace with a real username input in your template
  username = 'testuser';
  status = '';

  constructor(private webauthn: WebauthnService) {}

  async registerUser() {
    try {
      this.status = 'Requesting registration...';
      const result = await this.webauthn.register(this.username);
      if (result && result.verified) {
        this.status = 'Registration successful';
        console.log('Registration successful!');
      } else {
        this.status = 'Registration failed: ' + (result && result.error ? result.error : 'unknown');
        console.error('Registration failed:', result && result.error);
      }
    } catch (error) {
      this.status = 'WebAuthn registration error: ' + ((error as any) && (error as any).message ? (error as any).message : String(error));
      console.error('WebAuthn registration error:', error);
    }
  }
}