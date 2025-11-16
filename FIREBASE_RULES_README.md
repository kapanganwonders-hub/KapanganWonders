# Firebase Security Rules

This file contains the security rules for the Firestore database used in the KapanganWonders application.

## Rules Overview

1. **Admin Access**:
   - Only the user with email `kapanganwonders@gmail.com` has full read/write access to all collections.
   - Admin can modify all content, including the contact page information.

2. **Contact Page Content**:
   - Path: `/content/contact`
   - Read access: Public (anyone can view the contact page content)
   - Write access: Admin only

3. **Default Rules**:
   - All other collections are restricted to admin access only by default.

## Deploying Rules

To deploy these rules to Firebase, run the following command from your project root:

```bash
firebase deploy --only firestore:rules
```

## Testing Rules

You can test these rules using the Firebase Emulator Suite before deploying to production.

## Important Notes

- Make sure to update the admin email in the `isAdmin()` function if the admin email changes.
- Always test rules in a staging environment before deploying to production.
- Keep this file in sync with your actual Firebase console rules.

## Rule Details

### isAdmin() Function
```
function isAdmin() {
  return request.auth != null && 
         request.auth.token.email == 'kapanganwonders@gmail.com';
}
```

### Contact Content Rule
```
match /content/contact {
  allow read: if true;
  allow write: if isAdmin();
}
```
