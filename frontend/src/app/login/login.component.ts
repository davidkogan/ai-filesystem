import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login(): Promise<void> {
    try {
      await this.authService.login(this.username, this.password);
      this.router.navigate(['/']);
    } catch (error) {
      alert('Invalid credentials');
    }
  }
}
