import { AbstractControl } from '@angular/forms';

export class CustomValidators {
  static emailDomain(domainName: string) {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const email: string = control.value;
      const domain = email.substring(email.lastIndexOf('@') + 1);
      if (email === '' || domain.toLowerCase() === domainName.toLowerCase()) {
        return null;
      } else {
        return { emailDomain: true };
      }
    };
  }

  // Nested form group (emailGroup) is passed as a parameter. Retrieve email and
  // confirmEmail form controls. If the values are equal return null to indicate
  // validation passed otherwise an object with emailMismatch key. Please note we
  // used this same key in the validationMessages object against emailGroup
  // property to store the corresponding validation error message
  static matchEmails(group: AbstractControl): { [key: string]: any } | null {
    const emailControl = group.get('email');
    const confirmEmailControl = group.get('confirmEmail');
    // If confirm email control value is not an empty string, and if the value
    // does not match with email control value, then the validation fails
    if (
      emailControl.value === confirmEmailControl.value ||
      (confirmEmailControl.pristine && confirmEmailControl.value === '')
    ) {
      return null;
    } else {
      return { emailMismatch: true };
    }
  }
}
