import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },   // default route
  { path: 'register', component: RegisterComponent },    // register page
  { path: 'login', component: LoginComponent },          // login page
  { path: 'home', component: HomeComponent },            // home page
  { path: '**', redirectTo: 'home' }                     // wildcard fallback
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
