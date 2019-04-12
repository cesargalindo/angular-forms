import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { EmployeeService } from './employee.service';
import { IEmployee } from './IEmployee';
import { ISkill } from './ISkill';

import { CustomValidators } from '../shared/custom.validators';

@Component({
  selector: 'app-create-employee',
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.scss']
})
export class CreateEmployeeComponent implements OnInit {
  // This FormGroup contains fullName and Email form controls
  employeeForm: FormGroup;
  employee: IEmployee;
  pageTitle: string;

  // Group properties on the formErrors object. The UI will bind to these properties
  // to display the respective validation messages
  formErrors = {
    // 'fullName': '',
    // 'email': '',
    // 'confirmEmail': '',
    // 'emailGroup': '',
    // 'phone': '',
    // 'skillName': '',
    // 'experienceInYears': '',
    // 'proficiency': ''
  };

  // This structure stoes all the validation messages for the form Include validation
  // messages for confirmEmail and emailGroup properties. Notice to store the
  // validation message for the emailGroup we are using emailGroup key. This is the
  // same key that the matchEmails() validation function below returns, if the email
  // and confirm email do not match.
  validationMessages = {
    fullName: {
      required: 'Full Name is required.',
      minlength: 'Full Name must be greater than 2 characters',
      maxlength: 'Full Name must be less than 10 characters.'
    },
    email: {
      required: 'Email is required.',
      emailDomain: 'Email domian should be dell.com'
    },
    confirmEmail: {
      required: 'Confirm Email is required.'
    },
    emailGroup: {
      emailMismatch: 'Email and Confirm Email do not match.'
    },
    phone: {
      required: 'Phone is required.'
    }
    // skillName: {
    //   required: 'Skill Name is required.'
    // },
    // experienceInYears: {
    //   required: 'Experience is required.'
    // },
    // proficiency: {
    //   required: 'Proficiency is required.'
    // }
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  // email and confirmEmail form controls are grouped using a nested form group
  // Notice, the validator is attached to the nested emailGroup using an object
  // with key validator. The value is our validator function matchEmails() which
  // is defined below. The important point to keep in mind is when the validation
  // fails, the validation key is attached the errors collection of the emailGroup
  // This is the reason we added emailGroup key both to formErrors object and
  // validationMessages object.
  ngOnInit() {
    this.employeeForm = this.fb.group({
      fullName: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(10)]
      ],
      contactPreference: ['email'],
      emailGroup: this.fb.group(
        {
          email: [
            '',
            [Validators.required, CustomValidators.emailDomain('dell.com')]
          ],
          confirmEmail: ['', [Validators.required]]
        },
        { validator: CustomValidators.matchEmails }
      ),
      phone: [''],
      // Create skills FormArray using the injected FormBuilder
      // class array() method. At the moment, in the created
      // FormArray we only have one FormGroup instance that is
      // returned by addSkillFormGroup() method
      skills: this.fb.array([this.addSkillFormGroup()])
    });

    this.employeeForm.valueChanges.subscribe(data => {
      this.logValidationErrors(this.employeeForm);
    });

    this.employeeForm
      .get('contactPreference')
      .valueChanges.subscribe((data: string) => {
        this.onContactPrefernceChange(data);
      });

    this.route.paramMap.subscribe(params => {
      // we are typecasting "params.get()" to a number with +      -  gg -
      const empId = +params.get('id');
      if (empId) {
        this.pageTitle = 'Edit Employee';
        this.getEmployee(empId);
      } else {
        this.pageTitle = 'Create Employee';
        this.employee = {
          id: null,
          fullName: '',
          contactPreference: '',
          email: '',
          phone: null,
          skills: []
        };
      }
    });
  }

  getEmployee(id: number) {
    this.employeeService.getEmployee(id).subscribe(
      (employee: IEmployee) => {
        // Store the employee object returned by the
        // REST API in the employee property
        this.employee = employee;
        this.editEmployee(employee);
      },
      (err: any) => console.log(err)
    );
  }

  editEmployee(employee: IEmployee) {
    this.employeeForm.patchValue({
      fullName: employee.fullName,
      contactPreference: employee.contactPreference,
      emailGroup: {
        email: employee.email,
        confirmEmail: employee.email
      },
      phone: employee.phone
    });

    this.employeeForm.setControl(
      'skills',
      this.setExistingSkills(employee.skills)
    );
  }

  setExistingSkills(skillSets: ISkill[]): FormArray {
    const formArray = new FormArray([]);
    skillSets.forEach(s => {
      formArray.push(
        this.fb.group({
          skillName: s.skillName,
          experienceInYears: s.experienceInYears,
          proficiency: s.proficiency
        })
      );
    });

    return formArray;
  }

  addSkillFormGroup(): FormGroup {
    return this.fb.group({
      skillName: ['', Validators.required],
      experienceInYears: ['', Validators.required],
      proficiency: ['', Validators.required]
    });
  }

  addSkillButtonClick(): void {
    (<FormArray>this.employeeForm.get('skills')).push(this.addSkillFormGroup());
  }

  removeSkillButtonClick(skillGroupIndex: number): void {
    const skillsFormArray = <FormArray>this.employeeForm.get('skills');
    skillsFormArray.removeAt(skillGroupIndex);
    skillsFormArray.markAsDirty();
    skillsFormArray.markAsTouched();
  }

  // If the Selected Radio Button value is 'phone', then add the
  // required validator function otherwise remove it
  onContactPrefernceChange(selectedValue: string) {
    const phoneFormControl = this.employeeForm.get('phone');
    if (selectedValue === 'phone') {
      phoneFormControl.setValidators(Validators.required);
    } else {
      phoneFormControl.clearValidators();
    }
    phoneFormControl.updateValueAndValidity();
  }

  logValidationErrors(group: FormGroup = this.employeeForm): void {
    Object.keys(group.controls).forEach((key: string) => {
      const abstractControl = group.get(key);

      this.formErrors[key] = '';
      // abstractControl.value !== '' (This condition ensures if there is a value in the
      // form control and it is not valid, then display the validation error)
      if (
        abstractControl &&
        !abstractControl.valid &&
        (abstractControl.touched ||
          abstractControl.dirty ||
          abstractControl.value !== '')
      ) {
        const messages = this.validationMessages[key];

        for (const errorKey in abstractControl.errors) {
          if (errorKey) {
            this.formErrors[key] += messages[errorKey] + ' ';
          }
        }
      }

      if (abstractControl instanceof FormGroup) {
        this.logValidationErrors(abstractControl);
      }
    });
  }

  onLoadDataClick(): void {
    // this.employeeForm.patchValue({
    //   fullName: 'Pragim Technologies',
    //   email: 'pragim@pragimtech.com'
    // });

    // const formArray = new FormArray([
    //   new FormControl('John', Validators.required),
    //   new FormGroup({
    //     country: new FormControl('', Validators.required)
    //   }),
    //   new FormArray([])
    // ]);

    // for (const control of formArray.controls) {
    //   if (control instanceof FormControl) {
    //     console.log('control is FormControl');
    //   }
    //   if (control instanceof FormGroup) {
    //     console.log('control is FormGroup');
    //   }
    //   if (control instanceof FormArray) {
    //     console.log('control is FormArray');
    //   }
    // }

    const formArray = new FormArray([
      new FormControl('John', Validators.required),
      new FormControl('IT', Validators.required)
    ]);

    const formGroup = this.fb.group([
      new FormControl('John', Validators.required),
      new FormControl('IT', Validators.required),
      new FormControl('', Validators.required)
    ]);

    console.log(formArray.value);
    console.log(formGroup.value);
  }

  onSubmit(): void {
    this.mapFormValuesToEmployeeModel();

    if (this.employee.id) {
      this.employeeService
        .updateEmployee(this.employee)
        .subscribe(
          () => this.router.navigate(['list']),
          (err: any) => console.log(err)
        );
    } else {
      this.employeeService
        .addEmployee(this.employee)
        .subscribe(
          () => this.router.navigate(['list']),
          (err: any) => console.log(err)
        );
    }
  }

  mapFormValuesToEmployeeModel() {
    this.employee.fullName = this.employeeForm.value.fullName;
    this.employee.contactPreference = this.employeeForm.value.contactPreference;
    this.employee.email = this.employeeForm.value.emailGroup.email;
    this.employee.phone = this.employeeForm.value.phone;
    this.employee.skills = this.employeeForm.value.skills;
  }
}
