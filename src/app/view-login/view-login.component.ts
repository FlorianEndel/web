import { MediaMatcher } from '@angular/cdk/layout';
import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { UsersService } from '../users/users.service';
import { AlertService } from '../partial-alert/alert.service';

@Component({
  selector: 'view-login',
  templateUrl: './view-login.component.html',
  styleUrls: ['./view-login.component.scss']
})
export class ViewLoginComponent implements OnInit, OnDestroy {
  mobileQuery: MediaQueryList;
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;
  currentRoute: string;

  private _mobileQueryListener: () => void;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private alertService: AlertService
  ) {
    this.currentRoute = this.router.url.replace('/', '');

    if(this.currentRoute !== 'logout' && this.usersService.isLoggedIn) {
      this.router.navigate(['/']);
    }

    this.mobileQuery = media.matchMedia('(max-width: 980px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit() {
    let commonUsername = ['', [Validators.required, Validators.email]];
    let commonPassword = ['', [Validators.required, Validators.minLength(8)]];
    let commonName = ['', [Validators.required]];

    this.loginForm = this.formBuilder.group({
      username: commonUsername,
      password: commonPassword,
    });

    this.registerForm = this.formBuilder.group({
      username: commonUsername,
      password: commonPassword,
      passwordConfirm: commonPassword,
      name: this.formBuilder.group({
        first_name: commonName,
        last_name: commonName
      })
    }, {
      validator: this.MustMatch('password', 'passwordConfirm')
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  get fLogin() {
    return this.loginForm.controls;
  }

  get fRegister() {
    return this.registerForm.controls;
  }

  get f() {
    switch(this.currentRoute) {
    case 'login':
      return this.loginForm.controls;
    case 'register':
      return this.registerForm.controls;
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
        return;
    }

    this.loading = true;
    this.usersService.login(this.f.username.value, this.f.password.value)
      .pipe(first())
      .subscribe(data => {
        this.router.navigate([this.returnUrl]);
      }, error => {
        this.alertService.error(error.error.content.error);
        this.loading = false;
      });
    }

  MustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors.mustMatch) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }
}
